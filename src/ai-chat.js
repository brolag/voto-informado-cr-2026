/**
 * AI Chat - Asistente inteligente para investigación política
 * Usa LLMs para responder preguntas sobre candidatos
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { chat, loadConfig, saveConfig, checkProvider, getOllamaModels, PROVIDERS } from './llm-providers.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const DATA_DIR = join(PROJECT_ROOT, 'data');
const PROCESSED_DIR = join(DATA_DIR, 'processed');

// Load knowledge base
function loadKB() {
  const kbPath = join(DATA_DIR, 'knowledge-base.json');
  return JSON.parse(readFileSync(kbPath, 'utf-8'));
}

// Load transcript for a candidate
function loadTranscript(filename) {
  const filepath = join(PROCESSED_DIR, filename);
  if (existsSync(filepath)) {
    return readFileSync(filepath, 'utf-8');
  }
  return null;
}

// Get relevant transcripts for a query
function getRelevantContext(query, kb, maxDocs = 3) {
  const queryLower = query.toLowerCase();
  const relevantDocs = [];

  // Check if query mentions specific candidates
  for (const [siglas, info] of Object.entries(kb.candidatos)) {
    const nombre = info.nombre.toLowerCase();
    const nombreParts = nombre.split(' ');

    if (queryLower.includes(siglas.toLowerCase()) ||
        nombreParts.some(part => queryLower.includes(part.toLowerCase()))) {
      // Load this candidate's documents
      const docs = kb.indice_por_candidato[siglas] || [];
      for (const docId of docs.slice(0, 2)) {
        const doc = kb.documentos.find(d => d.id === docId);
        if (doc) {
          const content = loadTranscript(doc.archivo);
          if (content) {
            relevantDocs.push({
              candidato: info.nombre,
              siglas: siglas,
              fuente: doc.fuente,
              content: content.substring(0, 15000) // Limit context size
            });
          }
        }
      }
    }
  }

  // If no specific candidate, use general context
  if (relevantDocs.length === 0) {
    // Add top candidates' TSE interviews
    const topCandidatos = ['PLN', 'PUSC', 'CAC', 'FA', 'PLP'];
    for (const siglas of topCandidatos.slice(0, maxDocs)) {
      const docs = kb.indice_por_candidato[siglas] || [];
      const tseDoc = docs.find(d => d.startsWith('TSE-'));
      if (tseDoc) {
        const doc = kb.documentos.find(d => d.id === tseDoc);
        if (doc) {
          const content = loadTranscript(doc.archivo);
          if (content) {
            relevantDocs.push({
              candidato: kb.candidatos[siglas].nombre,
              siglas: siglas,
              fuente: doc.fuente,
              content: content.substring(0, 8000)
            });
          }
        }
      }
    }
  }

  return relevantDocs;
}

// Build system prompt
function buildSystemPrompt(kb) {
  const candidatosList = Object.entries(kb.candidatos)
    .map(([s, i]) => `- ${i.nombre} (${s}) - ${i.partido}`)
    .join('\n');

  return `Sos un asistente experto en las elecciones presidenciales de Costa Rica 2026. Tu trabajo es ayudar a los votantes a informarse sobre los candidatos de manera objetiva y basada en datos.

CANDIDATOS PRESIDENCIALES 2026:
${candidatosList}

REGLAS IMPORTANTES:
1. Sé objetivo y neutral - no favorezcas a ningún candidato
2. Basá tus respuestas en las transcripciones de entrevistas que te proporciono
3. Cuando cites algo, indicá la fuente (ej: "En la entrevista del TSE, X dijo...")
4. Si no tenés información sobre algo, decilo claramente
5. Respondé en español costarricense (vos, tico, mae, etc.)
6. Sé conciso pero informativo
7. Si te preguntan por quién votar, explicá que eso es decisión personal y ofrecé comparar opciones

TEMAS PRINCIPALES EN LA CAMPAÑA:
${Object.entries(kb.temas_globales).slice(0, 10).map(([t, c]) => `- ${t}: ${c} menciones`).join('\n')}

Cuando el usuario pregunte sobre un candidato o tema, usá el contexto de las transcripciones para dar respuestas precisas y citables.`;
}

// Configure provider
export async function configureProvider() {
  console.log(chalk.cyan.bold('\n⚙️  CONFIGURACIÓN DE LLM\n'));

  const config = loadConfig();

  // Check available providers
  const providerChoices = [];

  for (const [key, info] of Object.entries(PROVIDERS)) {
    const available = await checkProvider(key, config);
    let status = '';

    if (key === 'ollama') {
      status = available ? chalk.green(' ✓ Disponible') : chalk.yellow(' (Requiere: ollama serve)');
    } else {
      status = available ? chalk.green(' ✓ API Key configurada') : chalk.gray(' (Requiere API Key)');
    }

    providerChoices.push({
      name: `${info.name} - ${info.description}${status}`,
      value: key
    });
  }

  const { provider } = await inquirer.prompt([{
    type: 'list',
    name: 'provider',
    message: '¿Qué LLM querés usar?',
    choices: providerChoices
  }]);

  config.provider = provider;

  // If requires API key and not set, ask for it
  if (PROVIDERS[provider].requiresKey && !config[provider].apiKey) {
    const { apiKey } = await inquirer.prompt([{
      type: 'password',
      name: 'apiKey',
      message: `Ingresá tu API Key de ${PROVIDERS[provider].name}:`,
      mask: '*'
    }]);
    config[provider].apiKey = apiKey;
  }

  // For Ollama, let user choose model
  if (provider === 'ollama') {
    const models = await getOllamaModels(config);
    if (models.length > 0) {
      const { model } = await inquirer.prompt([{
        type: 'list',
        name: 'model',
        message: 'Elegí el modelo:',
        choices: models
      }]);
      config.ollama.model = model;
    } else {
      console.log(chalk.yellow('\n⚠️  No se encontraron modelos. Instalá uno con: ollama pull llama3.2\n'));
    }
  }

  saveConfig(config);
  console.log(chalk.green(`\n✓ Configuración guardada. Usando ${PROVIDERS[provider].name}\n`));

  return config;
}

// Main chat function
export async function startChat() {
  let config = loadConfig();

  // Check if provider is configured
  if (!config.provider) {
    console.log(chalk.yellow('\n⚠️  LLM no configurado. Vamos a configurarlo...\n'));
    config = await configureProvider();
  }

  // Verify provider is available
  const available = await checkProvider(config.provider, config);
  if (!available) {
    console.log(chalk.red(`\n❌ ${PROVIDERS[config.provider].name} no está disponible.`));
    if (config.provider === 'ollama') {
      console.log(chalk.yellow('   Ejecutá "ollama serve" en otra terminal.\n'));
    } else {
      console.log(chalk.yellow('   Verificá tu API key con "voto config".\n'));
    }
    return;
  }

  const kb = loadKB();
  const systemPrompt = buildSystemPrompt(kb);
  const conversationHistory = [{ role: 'system', content: systemPrompt }];

  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('     🗳️  ASISTENTE DE VOTO INFORMADO CR 2026'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════\n'));
  console.log(chalk.gray(`Usando: ${PROVIDERS[config.provider].name}`));
  console.log(chalk.white('\nPreguntame sobre los candidatos, sus propuestas, o pedime'));
  console.log(chalk.white('que te ayude a decidir basado en tus prioridades.\n'));
  console.log(chalk.gray('Ejemplos:'));
  console.log(chalk.gray('  • "¿Qué propone Claudia Dobles sobre educación?"'));
  console.log(chalk.gray('  • "Compará a Álvaro Ramos y Juan Carlos Hidalgo"'));
  console.log(chalk.gray('  • "¿Quién habla más de seguridad?"'));
  console.log(chalk.gray('  • "Ayudame a elegir, me importa la salud y el ambiente"'));
  console.log(chalk.gray('\nEscribí "salir" para terminar.\n'));

  while (true) {
    const { userInput } = await inquirer.prompt([{
      type: 'input',
      name: 'userInput',
      message: chalk.green('Vos:'),
      prefix: ''
    }]);

    if (!userInput.trim()) continue;
    if (userInput.toLowerCase() === 'salir' || userInput.toLowerCase() === 'exit') {
      console.log(chalk.cyan('\n¡Gracias por informarte! Tu voto hace la diferencia. 🇨🇷\n'));
      break;
    }

    // Get relevant context
    const spinner = ora('Pensando...').start();

    try {
      const relevantDocs = getRelevantContext(userInput, kb);

      // Build context message
      let contextMessage = userInput;
      if (relevantDocs.length > 0) {
        contextMessage = `CONTEXTO DE TRANSCRIPCIONES:\n\n`;
        for (const doc of relevantDocs) {
          contextMessage += `=== ${doc.candidato} (${doc.siglas}) - ${doc.fuente} ===\n`;
          contextMessage += doc.content + '\n\n';
        }
        contextMessage += `\n---\nPREGUNTA DEL USUARIO: ${userInput}`;
      }

      conversationHistory.push({ role: 'user', content: contextMessage });

      const response = await chat(conversationHistory, config);

      spinner.stop();

      // Add response to history (but keep history manageable)
      conversationHistory.push({ role: 'assistant', content: response });
      if (conversationHistory.length > 10) {
        // Keep system prompt and last 8 messages
        conversationHistory.splice(1, 2);
      }

      console.log(chalk.cyan('\n🤖 Asistente:\n'));
      console.log(response);
      console.log('');

    } catch (error) {
      spinner.stop();
      console.log(chalk.red(`\n❌ Error: ${error.message}\n`));

      if (error.message.includes('Ollama')) {
        console.log(chalk.yellow('💡 Tip: Asegurate de que Ollama esté corriendo (ollama serve)\n'));
      }
    }
  }
}

// Quick question (non-interactive)
export async function askQuestion(question) {
  const config = loadConfig();

  if (!config.provider) {
    console.log(chalk.red('❌ LLM no configurado. Ejecutá "voto config" primero.'));
    return;
  }

  const kb = loadKB();
  const systemPrompt = buildSystemPrompt(kb);
  const relevantDocs = getRelevantContext(question, kb);

  let contextMessage = question;
  if (relevantDocs.length > 0) {
    contextMessage = `CONTEXTO DE TRANSCRIPCIONES:\n\n`;
    for (const doc of relevantDocs) {
      contextMessage += `=== ${doc.candidato} (${doc.siglas}) - ${doc.fuente} ===\n`;
      contextMessage += doc.content + '\n\n';
    }
    contextMessage += `\n---\nPREGUNTA: ${question}`;
  }

  const spinner = ora('Consultando...').start();

  try {
    const response = await chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: contextMessage }
    ], config);

    spinner.stop();
    console.log(chalk.cyan('\n🤖 Respuesta:\n'));
    console.log(response);
    console.log('');
  } catch (error) {
    spinner.stop();
    console.log(chalk.red(`\n❌ Error: ${error.message}\n`));
  }
}
