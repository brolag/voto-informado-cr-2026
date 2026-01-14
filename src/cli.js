#!/usr/bin/env node
/**
 * Voto Informado CR 2026 - CLI para investigación política
 * Herramienta para aprender sobre candidatos presidenciales de Costa Rica
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { runQuiz } from './quiz.js';
import { startChat, configureProvider, askQuestion } from './ai-chat.js';
import { drawSpectrum, compareSpectrum } from './espectro.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const DATA_DIR = join(PROJECT_ROOT, 'data');
const PROCESSED_DIR = join(DATA_DIR, 'processed');

// Load knowledge base
let KB = null;
function loadKB() {
  if (!KB) {
    const kbPath = join(DATA_DIR, 'knowledge-base.json');
    if (existsSync(kbPath)) {
      KB = JSON.parse(readFileSync(kbPath, 'utf-8'));
    } else {
      console.error(chalk.red('Error: Knowledge base not found. Run: npm run build-kb'));
      process.exit(1);
    }
  }
  return KB;
}

const program = new Command();

program
  .name('voto')
  .description(chalk.cyan('🗳️  Voto Informado CR 2026 - Investigá a los candidatos'))
  .version('1.1.0');

// === CANDIDATOS ===
program
  .command('candidatos')
  .alias('c')
  .description('Listar todos los candidatos presidenciales')
  .option('-d, --detalle', 'Mostrar información detallada')
  .action((options) => {
    const kb = loadKB();

    console.log(chalk.cyan.bold('\n🗳️  CANDIDATOS PRESIDENCIALES 2026\n'));

    for (const [siglas, info] of Object.entries(kb.candidatos)) {
      const docs = kb.indice_por_candidato[siglas] || [];
      const docCount = docs.length;

      if (options.detalle) {
        console.log(chalk.yellow(`${siglas}`) + ` - ${chalk.white.bold(info.nombre)}`);
        console.log(`   Partido: ${info.partido}`);
        console.log(`   Documentos disponibles: ${docCount}`);
        if (docCount > 0) {
          console.log(`   Fuentes: ${docs.map(d => d.split('-')[0]).join(', ')}`);
        }
        console.log('');
      } else {
        const bar = '█'.repeat(Math.min(docCount, 10));
        console.log(`${chalk.yellow(siglas.padEnd(6))} ${info.nombre.padEnd(35)} ${chalk.green(bar)} (${docCount})`);
      }
    }

    console.log(chalk.gray(`\nTotal: ${Object.keys(kb.candidatos).length} candidatos\n`));
  });

// === TEMAS ===
program
  .command('temas')
  .alias('t')
  .description('Ver temas más discutidos en las entrevistas')
  .option('-n, --top <number>', 'Número de temas a mostrar', '15')
  .action((options) => {
    const kb = loadKB();
    const top = parseInt(options.top);

    console.log(chalk.cyan.bold('\n📊 TEMAS MÁS DISCUTIDOS\n'));

    const sorted = Object.entries(kb.temas_globales).slice(0, top);
    const maxCount = sorted[0]?.[1] || 1;

    for (const [tema, count] of sorted) {
      const barLen = Math.round((count / maxCount) * 30);
      const bar = chalk.green('█'.repeat(barLen));
      console.log(`${tema.padEnd(20)} ${bar} ${count}`);
    }

    console.log('');
  });

// === PERFIL ===
program
  .command('perfil <candidato>')
  .alias('p')
  .description('Ver perfil completo de un candidato (usar siglas: PLN, PUSC, CAC, etc.)')
  .action((candidato) => {
    const kb = loadKB();
    const siglas = candidato.toUpperCase();

    if (!kb.candidatos[siglas]) {
      console.log(chalk.red(`\nCandidato "${siglas}" no encontrado.`));
      console.log(chalk.gray('Usa "voto candidatos" para ver la lista completa.\n'));
      return;
    }

    const info = kb.candidatos[siglas];
    const docs = kb.indice_por_candidato[siglas] || [];

    console.log(chalk.cyan.bold(`\n👤 PERFIL: ${info.nombre}\n`));
    console.log(`Partido: ${chalk.yellow(info.partido)} (${siglas})`);
    console.log(`Documentos: ${docs.length} entrevistas/apariciones\n`);

    if (docs.length > 0) {
      console.log(chalk.white.bold('Fuentes disponibles:'));
      for (const docId of docs) {
        const doc = kb.documentos.find(d => d.id === docId);
        if (doc) {
          console.log(`  • ${doc.fuente}: ${chalk.gray(doc.archivo)} (${doc.palabras} palabras)`);
        }
      }

      // Aggregate topics for this candidate
      const candidateTemas = {};
      for (const docId of docs) {
        const doc = kb.documentos.find(d => d.id === docId);
        if (doc && doc.temas) {
          for (const [tema, count] of Object.entries(doc.temas)) {
            candidateTemas[tema] = (candidateTemas[tema] || 0) + count;
          }
        }
      }

      console.log(chalk.white.bold('\nTemas principales:'));
      const sortedTemas = Object.entries(candidateTemas)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

      for (const [tema, count] of sortedTemas) {
        console.log(`  ${tema}: ${count} menciones`);
      }
    }

    console.log('');
  });

// === COMPARAR ===
program
  .command('comparar <candidato1> <candidato2>')
  .alias('vs')
  .description('Comparar dos candidatos por temas')
  .action((c1, c2) => {
    const kb = loadKB();
    const s1 = c1.toUpperCase();
    const s2 = c2.toUpperCase();

    if (!kb.candidatos[s1] || !kb.candidatos[s2]) {
      console.log(chalk.red('\nUno o ambos candidatos no encontrados.'));
      return;
    }

    console.log(chalk.cyan.bold(`\n⚔️  COMPARACIÓN: ${kb.candidatos[s1].nombre} vs ${kb.candidatos[s2].nombre}\n`));

    // Get topics for each
    const getTemas = (siglas) => {
      const docs = kb.indice_por_candidato[siglas] || [];
      const temas = {};
      for (const docId of docs) {
        const doc = kb.documentos.find(d => d.id === docId);
        if (doc?.temas) {
          for (const [t, c] of Object.entries(doc.temas)) {
            temas[t] = (temas[t] || 0) + c;
          }
        }
      }
      return temas;
    };

    const temas1 = getTemas(s1);
    const temas2 = getTemas(s2);

    // All topics
    const allTemas = new Set([...Object.keys(temas1), ...Object.keys(temas2)]);

    console.log(`${'TEMA'.padEnd(20)} ${s1.padStart(8)} ${s2.padStart(8)}  Diferencia`);
    console.log('-'.repeat(55));

    for (const tema of [...allTemas].sort()) {
      const v1 = temas1[tema] || 0;
      const v2 = temas2[tema] || 0;
      const diff = v1 - v2;
      const diffStr = diff > 0 ? chalk.green(`+${diff}`) : diff < 0 ? chalk.red(`${diff}`) : chalk.gray('=');

      console.log(`${tema.padEnd(20)} ${String(v1).padStart(8)} ${String(v2).padStart(8)}  ${diffStr}`);
    }

    console.log('');
  });

// === BUSCAR ===
program
  .command('buscar <termino>')
  .alias('b')
  .description('Buscar un término en todas las entrevistas')
  .option('-c, --candidato <siglas>', 'Filtrar por candidato')
  .action((termino, options) => {
    const kb = loadKB();
    const spinner = ora('Buscando...').start();

    const results = [];
    const regex = new RegExp(termino, 'gi');

    let files = readdirSync(PROCESSED_DIR).filter(f => f.endsWith('.txt'));

    if (options.candidato) {
      const siglas = options.candidato.toUpperCase();
      files = files.filter(f => f.includes(`-${siglas}-`));
    }

    for (const file of files) {
      const content = readFileSync(join(PROCESSED_DIR, file), 'utf-8');
      const matches = content.match(regex);

      if (matches && matches.length > 0) {
        // Find context
        const idx = content.toLowerCase().indexOf(termino.toLowerCase());
        const start = Math.max(0, idx - 100);
        const end = Math.min(content.length, idx + termino.length + 100);
        const context = content.substring(start, end);

        results.push({
          file: file.replace('.txt', ''),
          count: matches.length,
          context: context.replace(regex, chalk.yellow.bold('$&'))
        });
      }
    }

    spinner.stop();

    if (results.length === 0) {
      console.log(chalk.yellow(`\nNo se encontró "${termino}" en los documentos.\n`));
      return;
    }

    console.log(chalk.cyan.bold(`\n🔍 RESULTADOS PARA "${termino}"\n`));

    results.sort((a, b) => b.count - a.count);

    for (const r of results.slice(0, 10)) {
      console.log(chalk.white.bold(`${r.file}`) + chalk.gray(` (${r.count} menciones)`));
      console.log(chalk.gray(`  "...${r.context.trim()}..."`));
      console.log('');
    }

    console.log(chalk.gray(`Total: ${results.length} documentos con coincidencias\n`));
  });

// === LEER ===
program
  .command('leer <documento>')
  .alias('l')
  .description('Leer el contenido de una entrevista')
  .option('-l, --lineas <number>', 'Número de líneas a mostrar', '50')
  .action((documento, options) => {
    const filepath = join(PROCESSED_DIR, documento + '.txt');

    if (!existsSync(filepath)) {
      console.log(chalk.red(`\nDocumento "${documento}" no encontrado.`));
      console.log(chalk.gray('Usa "voto candidatos -d" para ver documentos disponibles.\n'));
      return;
    }

    const content = readFileSync(filepath, 'utf-8');
    const words = content.split(/\s+/);
    const lineas = parseInt(options.lineas);
    const preview = words.slice(0, lineas * 10).join(' ');

    console.log(chalk.cyan.bold(`\n📄 ${documento}\n`));
    console.log(preview);
    console.log(chalk.gray(`\n... (mostrando ~${lineas * 10} palabras de ${words.length} total)\n`));
  });

// === INTERACTIVO ===
program
  .command('explorar')
  .alias('x')
  .description('Modo interactivo para explorar candidatos')
  .action(async () => {
    const kb = loadKB();

    console.log(chalk.cyan.bold('\n🗳️  VOTO INFORMADO - Modo Interactivo\n'));

    const { candidato } = await inquirer.prompt([
      {
        type: 'list',
        name: 'candidato',
        message: '¿Qué candidato querés conocer?',
        choices: Object.entries(kb.candidatos).map(([siglas, info]) => ({
          name: `${info.nombre} (${siglas})`,
          value: siglas
        }))
      }
    ]);

    // Show profile
    program.commands.find(c => c.name() === 'perfil')._actionHandler(candidato);

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '¿Qué querés hacer?',
        choices: [
          { name: 'Comparar con otro candidato', value: 'comparar' },
          { name: 'Buscar un tema específico', value: 'buscar' },
          { name: 'Ver todos los temas', value: 'temas' },
          { name: 'Salir', value: 'salir' }
        ]
      }
    ]);

    if (action === 'comparar') {
      const { otro } = await inquirer.prompt([
        {
          type: 'list',
          name: 'otro',
          message: '¿Con quién querés comparar?',
          choices: Object.entries(kb.candidatos)
            .filter(([s]) => s !== candidato)
            .map(([siglas, info]) => ({
              name: `${info.nombre} (${siglas})`,
              value: siglas
            }))
        }
      ]);
      program.commands.find(c => c.name() === 'comparar')._actionHandler(candidato, otro);
    } else if (action === 'buscar') {
      const { termino } = await inquirer.prompt([
        { type: 'input', name: 'termino', message: '¿Qué tema te interesa?' }
      ]);
      program.commands.find(c => c.name() === 'buscar')._actionHandler(termino, { candidato });
    } else if (action === 'temas') {
      program.commands.find(c => c.name() === 'temas')._actionHandler({ top: '15' });
    }

    console.log(chalk.cyan('\n¡Gracias por informarte! Tu voto cuenta. 🗳️\n'));
  });

// === QUIZ - DESCUBRÍ TU CANDIDATO ===
program
  .command('quiz')
  .alias('q')
  .description('Descubrí qué candidatos se alinean más con vos')
  .action(async () => {
    await runQuiz();
  });

// === ESPECTRO - VER ESPECTRO POLITICO ===
program
  .command('espectro [partido1] [partido2]')
  .alias('e')
  .description('Ver el espectro político de los partidos (izquierda ◄─► derecha)')
  .option('-d, --detalle', 'Mostrar descripción detallada de cada partido')
  .action((partido1, partido2, options) => {
    if (partido1 && partido2) {
      compareSpectrum(partido1, partido2);
    } else {
      drawSpectrum({ detalle: options.detalle });
    }
  });

// === CONFIG - CONFIGURAR LLM ===
program
  .command('config')
  .description('Configurar el modelo de lenguaje (Ollama, OpenAI, Claude, Gemini)')
  .action(async () => {
    await configureProvider();
  });

// === CHAT - ASISTENTE IA ===
program
  .command('chat')
  .description('Chatear con el asistente IA sobre los candidatos')
  .action(async () => {
    await startChat();
  });

// === ASK - PREGUNTA RÁPIDA ===
program
  .command('ask <pregunta...>')
  .alias('a')
  .description('Hacer una pregunta rápida al asistente IA')
  .action(async (preguntaParts) => {
    const pregunta = preguntaParts.join(' ');
    await askQuestion(pregunta);
  });

// === HELP FOOTER ===
program.addHelpText('after', `
${chalk.cyan('Ejemplos:')}
  $ voto quiz                    # ⭐ Descubrí tu candidato ideal
  $ voto espectro                # 📊 Ver espectro político (izq ◄─► der)
  $ voto espectro -d             # 📊 Espectro con detalles
  $ voto espectro FA PLP         # 📊 Comparar posiciones de dos partidos
  $ voto chat                    # 🤖 Chatear con asistente IA
  $ voto ask "¿qué propone PLN?" # Pregunta rápida
  $ voto config                  # Configurar LLM (Ollama/OpenAI/Claude/Gemini)
  $ voto candidatos              # Ver lista de candidatos
  $ voto perfil PLN              # Ver perfil de Álvaro Ramos
  $ voto comparar PLN PUSC       # Comparar dos candidatos
  $ voto buscar educación        # Buscar tema en entrevistas
  $ voto temas                   # Ver temas más discutidos
  $ voto explorar                # Modo interactivo

${chalk.gray('Siglas principales: PLN, PUSC, CAC, FA, PLP, PNR, UP, PPSO')}
`);

program.parse();
