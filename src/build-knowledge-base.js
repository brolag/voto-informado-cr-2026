#!/usr/bin/env node
/**
 * Build structured knowledge base from processed transcripts
 * Creates a searchable index of candidates, topics, and content
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const PROCESSED_DIR = join(PROJECT_ROOT, 'data/processed');
const DATA_DIR = join(PROJECT_ROOT, 'data');

// Candidate database
const CANDIDATOS = {
  'PLN': { nombre: 'Álvaro Ramos Chaves', partido: 'Partido Liberación Nacional', siglas: 'PLN' },
  'PUSC': { nombre: 'Juan Carlos Hidalgo Bogantes', partido: 'Partido Unidad Social Cristiana', siglas: 'PUSC' },
  'CAC': { nombre: 'Claudia Dobles Camargo', partido: 'Coalición Acción Ciudadana', siglas: 'CAC' },
  'FA': { nombre: 'Ariel Robles Barrantes', partido: 'Frente Amplio', siglas: 'FA' },
  'PLP': { nombre: 'Eliécer Feinzaig Mintz', partido: 'Partido Liberal Progresista', siglas: 'PLP' },
  'PNR': { nombre: 'Fabricio Alvarado Muñoz', partido: 'Partido Nueva República', siglas: 'PNR' },
  'UP': { nombre: 'Natalia Díaz Quintana', partido: 'Unidos Podemos', siglas: 'UP' },
  'PPSO': { nombre: 'Laura Fernández Delgado', partido: 'Partido Pueblo Soberano', siglas: 'PPSO' },
  'PA': { nombre: 'José Aguilar Berrocal', partido: 'Partido Avanza', siglas: 'PA' },
  'PSD': { nombre: 'Luz Mary Alpízar Loaiza', partido: 'Partido Social Demócrata', siglas: 'PSD' },
  'CDS': { nombre: 'Ana Virginia Calzada Miranda', partido: 'Ciudadanos', siglas: 'CDS' },
  'PNG': { nombre: 'Fernando Zamora Castellanos', partido: 'Partido Nacionalista', siglas: 'PNG' },
  'PEN': { nombre: 'Claudio Alpízar Otoya', partido: 'Partido El Pueblo', siglas: 'PEN' },
  'PIN': { nombre: 'Luis Amador Jiménez', partido: 'Partido Integración Nacional', siglas: 'PIN' },
  'CR1': { nombre: 'Douglas Caamaño Quirós', partido: 'Costa Rica 1', siglas: 'CR1' },
  'PJSC': { nombre: 'Walter Hernández Juárez', partido: 'Partido Justicia Social', siglas: 'PJSC' },
  'PEL': { nombre: 'Marco Rodríguez Badilla', partido: 'Partido El Libano', siglas: 'PEL' },
  'PUCD': { nombre: 'Boris Molina Acevedo', partido: 'Partido Unión Costarricense Democrática', siglas: 'PUCD' },
  'PDLCT': { nombre: 'David Hernández Brenes', partido: 'Partido de los Trabajadores', siglas: 'PDLCT' },
  'ACRM': { nombre: 'Ronny Castillo González', partido: 'Aquí Costa Rica Manda', siglas: 'ACRM' }
};

// Topics to extract mentions
const TEMAS = [
  'educación', 'salud', 'empleo', 'trabajo', 'seguridad', 'corrupción',
  'economía', 'impuestos', 'fiscal', 'deuda', 'inflación',
  'ambiente', 'medio ambiente', 'cambio climático', 'agua',
  'vivienda', 'infraestructura', 'carreteras',
  'pensiones', 'CCSS', 'Caja',
  'tecnología', 'digitalización', 'internet',
  'mujeres', 'género', 'familia',
  'jóvenes', 'juventud', 'niñez',
  'pobreza', 'desigualdad', 'social',
  'agricultura', 'agro', 'campo',
  'turismo', 'pymes', 'empresas'
];

function extractCandidateFromFilename(filename) {
  // TSE-01-PJSC-Walter_Hernandez.txt -> PJSC
  // NPN-PLN-Alvaro_Ramos.txt -> PLN
  // EP-CAC-Claudia_Dobles.txt -> CAC
  const parts = filename.replace('.txt', '').split('-');

  for (const part of parts) {
    if (CANDIDATOS[part]) {
      return part;
    }
  }
  return null;
}

function extractSourceType(filename) {
  if (filename.startsWith('TSE-')) return 'TSE (Entrevista Oficial)';
  if (filename.startsWith('DEBATE-')) return 'Debate TSE';
  if (filename.startsWith('NPN-')) return 'No Pasa Nada / Apolítico';
  if (filename.startsWith('SSL-')) return 'Sepamos Ser Libres';
  if (filename.startsWith('EP-')) return 'En Profundidad (Teletica)';
  if (filename.startsWith('HC-')) return 'Hablando Claro (Columbia)';
  return 'Otro';
}

function countTopicMentions(text) {
  const mentions = {};
  const lowerText = text.toLowerCase();

  for (const tema of TEMAS) {
    const regex = new RegExp(tema, 'gi');
    const matches = lowerText.match(regex);
    if (matches && matches.length > 0) {
      mentions[tema] = matches.length;
    }
  }

  return mentions;
}

function buildKnowledgeBase() {
  const files = readdirSync(PROCESSED_DIR).filter(f => f.endsWith('.txt'));

  const kb = {
    metadata: {
      version: '1.0.0',
      created: new Date().toISOString(),
      totalDocuments: files.length,
      totalCandidates: Object.keys(CANDIDATOS).length
    },
    candidatos: { ...CANDIDATOS },
    documentos: [],
    indice_por_candidato: {},
    indice_por_fuente: {},
    temas_globales: {}
  };

  // Initialize indices
  for (const siglas of Object.keys(CANDIDATOS)) {
    kb.indice_por_candidato[siglas] = [];
  }

  console.log(`Building knowledge base from ${files.length} documents...`);

  for (const file of files) {
    const filepath = join(PROCESSED_DIR, file);
    const content = readFileSync(filepath, 'utf-8');
    const candidato = extractCandidateFromFilename(file);
    const fuente = extractSourceType(file);
    const temas = countTopicMentions(content);

    const doc = {
      id: file.replace('.txt', ''),
      archivo: file,
      candidato_siglas: candidato,
      candidato_nombre: candidato ? CANDIDATOS[candidato]?.nombre : null,
      fuente: fuente,
      longitud: content.length,
      palabras: content.split(/\s+/).length,
      temas: temas,
      resumen: content.substring(0, 500) + '...'
    };

    kb.documentos.push(doc);

    // Index by candidate
    if (candidato && kb.indice_por_candidato[candidato]) {
      kb.indice_por_candidato[candidato].push(doc.id);
    }

    // Index by source
    if (!kb.indice_por_fuente[fuente]) {
      kb.indice_por_fuente[fuente] = [];
    }
    kb.indice_por_fuente[fuente].push(doc.id);

    // Aggregate topics
    for (const [tema, count] of Object.entries(temas)) {
      if (!kb.temas_globales[tema]) {
        kb.temas_globales[tema] = 0;
      }
      kb.temas_globales[tema] += count;
    }

    console.log(`  ✓ ${file} (${candidato || 'DEBATE'})`);
  }

  // Sort global topics
  kb.temas_globales = Object.fromEntries(
    Object.entries(kb.temas_globales).sort((a, b) => b[1] - a[1])
  );

  // Save knowledge base
  const outputPath = join(DATA_DIR, 'knowledge-base.json');
  writeFileSync(outputPath, JSON.stringify(kb, null, 2));
  console.log(`\n✓ Knowledge base saved to ${outputPath}`);

  // Print summary
  console.log('\n=== RESUMEN ===');
  console.log(`Documentos: ${kb.documentos.length}`);
  console.log(`Candidatos: ${Object.keys(CANDIDATOS).length}`);
  console.log(`Temas más mencionados:`);
  Object.entries(kb.temas_globales).slice(0, 10).forEach(([tema, count]) => {
    console.log(`  - ${tema}: ${count} menciones`);
  });
}

buildKnowledgeBase();
