/**
 * LLM Providers - Soporte para múltiples modelos de lenguaje
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const CONFIG_PATH = join(PROJECT_ROOT, '.config.json');

// Default configuration
const DEFAULT_CONFIG = {
  provider: null, // Will prompt user to choose
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: 'llama3.2'
  },
  openai: {
    apiKey: null,
    model: 'gpt-4o-mini'
  },
  anthropic: {
    apiKey: null,
    model: 'claude-3-5-sonnet-20241022'
  },
  gemini: {
    apiKey: null,
    model: 'gemini-1.5-flash'
  }
};

// Load or create config
export function loadConfig() {
  if (existsSync(CONFIG_PATH)) {
    const saved = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
    return { ...DEFAULT_CONFIG, ...saved };
  }
  return DEFAULT_CONFIG;
}

export function saveConfig(config) {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

// Provider implementations
async function callOllama(messages, config) {
  const response = await fetch(`${config.ollama.baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.ollama.model,
      messages: messages,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}. ¿Está corriendo Ollama? (ollama serve)`);
  }

  const data = await response.json();
  return data.message.content;
}

async function callOpenAI(messages, config) {
  if (!config.openai.apiKey) {
    throw new Error('OpenAI API key no configurada. Usa: voto config --provider openai --key TU_API_KEY');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.openai.apiKey}`
    },
    body: JSON.stringify({
      model: config.openai.model,
      messages: messages,
      max_tokens: 2048
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI error: ${error.error?.message || response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAnthropic(messages, config) {
  if (!config.anthropic.apiKey) {
    throw new Error('Anthropic API key no configurada. Usa: voto config --provider anthropic --key TU_API_KEY');
  }

  // Convert messages to Anthropic format
  const systemMsg = messages.find(m => m.role === 'system')?.content || '';
  const userMsgs = messages.filter(m => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.anthropic.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: config.anthropic.model,
      max_tokens: 2048,
      system: systemMsg,
      messages: userMsgs
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Anthropic error: ${error.error?.message || response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callGemini(messages, config) {
  if (!config.gemini.apiKey) {
    throw new Error('Gemini API key no configurada. Usa: voto config --provider gemini --key TU_API_KEY');
  }

  // Convert to Gemini format
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  const systemInstruction = messages.find(m => m.role === 'system')?.content;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Gemini error: ${error.error?.message || response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Main chat function
export async function chat(messages, config = null) {
  config = config || loadConfig();

  switch (config.provider) {
    case 'ollama':
      return callOllama(messages, config);
    case 'openai':
      return callOpenAI(messages, config);
    case 'anthropic':
      return callAnthropic(messages, config);
    case 'gemini':
      return callGemini(messages, config);
    default:
      throw new Error('Proveedor no configurado. Usa: voto config');
  }
}

// Check if provider is available
export async function checkProvider(provider, config) {
  try {
    switch (provider) {
      case 'ollama':
        const res = await fetch(`${config.ollama.baseUrl}/api/tags`, {
          signal: AbortSignal.timeout(3000)
        });
        return res.ok;
      case 'openai':
        return !!config.openai.apiKey;
      case 'anthropic':
        return !!config.anthropic.apiKey;
      case 'gemini':
        return !!config.gemini.apiKey;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

// Get available models for Ollama
export async function getOllamaModels(config) {
  try {
    const res = await fetch(`${config.ollama.baseUrl}/api/tags`);
    if (res.ok) {
      const data = await res.json();
      return data.models?.map(m => m.name) || [];
    }
  } catch {
    return [];
  }
  return [];
}

export const PROVIDERS = {
  ollama: {
    name: 'Ollama (Local)',
    description: 'Gratis, privado, corre en tu máquina',
    requiresKey: false,
    defaultModel: 'llama3.2'
  },
  openai: {
    name: 'OpenAI',
    description: 'GPT-4o, rápido y preciso',
    requiresKey: true,
    defaultModel: 'gpt-4o-mini'
  },
  anthropic: {
    name: 'Claude (Anthropic)',
    description: 'Claude 3.5, excelente razonamiento',
    requiresKey: true,
    defaultModel: 'claude-3-5-sonnet-20241022'
  },
  gemini: {
    name: 'Google Gemini',
    description: 'Free tier generoso',
    requiresKey: true,
    defaultModel: 'gemini-1.5-flash'
  }
};
