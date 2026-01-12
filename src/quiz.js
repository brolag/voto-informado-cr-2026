#!/usr/bin/env node
/**
 * Quiz de Afinidad Política - Voto Informado CR 2026
 * Analiza tendencias y necesidades del votante para recomendar candidatos
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const DATA_DIR = join(PROJECT_ROOT, 'data');
const PROCESSED_DIR = join(DATA_DIR, 'processed');

// Load knowledge base
function loadKB() {
  const kbPath = join(DATA_DIR, 'knowledge-base.json');
  return JSON.parse(readFileSync(kbPath, 'utf-8'));
}

// Categories and their associated topics
const CATEGORIAS = {
  economia: {
    nombre: 'Economía y Empleo',
    temas: ['economía', 'empleo', 'trabajo', 'pymes', 'empresas', 'impuestos', 'fiscal', 'deuda', 'inflación'],
    descripcion: 'Generación de empleo, crecimiento económico, apoyo a empresas'
  },
  social: {
    nombre: 'Bienestar Social',
    temas: ['social', 'pobreza', 'desigualdad', 'pensiones', 'vivienda'],
    descripcion: 'Reducción de pobreza, programas sociales, pensiones'
  },
  salud: {
    nombre: 'Salud Pública',
    temas: ['salud', 'Caja', 'CCSS'],
    descripcion: 'Sistema de salud, CCSS, acceso a servicios médicos'
  },
  educacion: {
    nombre: 'Educación',
    temas: ['educación', 'jóvenes', 'juventud', 'niñez'],
    descripcion: 'Calidad educativa, oportunidades para jóvenes'
  },
  seguridad: {
    nombre: 'Seguridad Ciudadana',
    temas: ['seguridad', 'corrupción'],
    descripcion: 'Combate al crimen, lucha anticorrupción'
  },
  ambiente: {
    nombre: 'Medio Ambiente',
    temas: ['ambiente', 'medio ambiente', 'cambio climático', 'agua'],
    descripcion: 'Protección ambiental, recursos naturales, sostenibilidad'
  },
  genero: {
    nombre: 'Género y Familia',
    temas: ['mujeres', 'género', 'familia'],
    descripcion: 'Igualdad de género, protección familiar'
  },
  infraestructura: {
    nombre: 'Infraestructura',
    temas: ['infraestructura', 'carreteras', 'tecnología', 'digitalización'],
    descripcion: 'Obras públicas, modernización, conectividad'
  },
  agro: {
    nombre: 'Agricultura y Campo',
    temas: ['agricultura', 'agro', 'campo', 'turismo'],
    descripcion: 'Apoyo al agro, desarrollo rural, turismo'
  }
};

// Questions for the quiz
const PREGUNTAS = [
  {
    type: 'list',
    name: 'prioridad1',
    message: '¿Cuál es tu MAYOR preocupación para Costa Rica?',
    choices: [
      { name: '💼 La falta de empleo y la economía', value: 'economia' },
      { name: '🏥 El estado del sistema de salud (CCSS)', value: 'salud' },
      { name: '🎓 La calidad de la educación', value: 'educacion' },
      { name: '🚔 La inseguridad y el crimen', value: 'seguridad' },
      { name: '🌿 El medio ambiente y el agua', value: 'ambiente' },
      { name: '🏠 La pobreza y desigualdad social', value: 'social' }
    ]
  },
  {
    type: 'list',
    name: 'prioridad2',
    message: '¿Y tu SEGUNDA mayor preocupación?',
    choices: [
      { name: '💼 La falta de empleo y la economía', value: 'economia' },
      { name: '🏥 El estado del sistema de salud (CCSS)', value: 'salud' },
      { name: '🎓 La calidad de la educación', value: 'educacion' },
      { name: '🚔 La inseguridad y el crimen', value: 'seguridad' },
      { name: '🌿 El medio ambiente y el agua', value: 'ambiente' },
      { name: '🏠 La pobreza y desigualdad social', value: 'social' }
    ]
  },
  {
    type: 'list',
    name: 'enfoque_economico',
    message: '¿Qué enfoque económico preferís?',
    choices: [
      { name: '📈 Reducir impuestos y dejar que el mercado funcione', value: 'mercado' },
      { name: '🏛️ Más inversión estatal en programas sociales', value: 'estado' },
      { name: '⚖️ Un balance entre mercado y Estado', value: 'balance' }
    ]
  },
  {
    type: 'list',
    name: 'ccss',
    message: '¿Qué debería pasar con la Caja (CCSS)?',
    choices: [
      { name: '🔧 Reformarla profundamente para hacerla más eficiente', value: 'reforma' },
      { name: '💪 Fortalecerla con más recursos y personal', value: 'fortalecer' },
      { name: '🏥 Permitir más participación del sector privado', value: 'privado' }
    ]
  },
  {
    type: 'list',
    name: 'seguridad_enfoque',
    message: '¿Cómo se debería combatir la inseguridad?',
    choices: [
      { name: '👮 Mano dura: más policía y penas más fuertes', value: 'mano_dura' },
      { name: '🎓 Prevención: educación y oportunidades', value: 'prevencion' },
      { name: '🤝 Ambas: seguridad + oportunidades sociales', value: 'integral' }
    ]
  },
  {
    type: 'list',
    name: 'ambiente_desarrollo',
    message: '¿Cómo balancear ambiente y desarrollo?',
    choices: [
      { name: '🌿 Priorizar la protección ambiental siempre', value: 'ambiente_primero' },
      { name: '🏭 El desarrollo económico es más urgente', value: 'desarrollo_primero' },
      { name: '♻️ Se pueden lograr ambos con planificación', value: 'sostenible' }
    ]
  },
  {
    type: 'list',
    name: 'genero',
    message: '¿Qué opinás sobre políticas de género?',
    choices: [
      { name: '✊ Son necesarias para lograr igualdad real', value: 'favor' },
      { name: '👨‍👩‍👧 La familia tradicional debe ser la prioridad', value: 'tradicional' },
      { name: '🤷 No es un tema prioritario para mí', value: 'neutral' }
    ]
  },
  {
    type: 'list',
    name: 'corrupcion',
    message: '¿Qué es más importante en un candidato?',
    choices: [
      { name: '🧹 Que sea nuevo y no tenga pasado político', value: 'nuevo' },
      { name: '📚 Que tenga experiencia aunque sea de partidos tradicionales', value: 'experiencia' },
      { name: '🔍 Que tenga un historial limpio, sin importar si es nuevo', value: 'historial' }
    ]
  },
  {
    type: 'checkbox',
    name: 'grupos',
    message: '¿Con cuáles grupos te identificás más? (podés elegir varios)',
    choices: [
      { name: '👨‍💼 Trabajador/empleado', value: 'trabajador' },
      { name: '🏪 Emprendedor/empresario', value: 'emprendedor' },
      { name: '👨‍🎓 Estudiante/joven', value: 'joven' },
      { name: '👴 Pensionado/adulto mayor', value: 'pensionado' },
      { name: '👩‍🌾 Del campo/zona rural', value: 'rural' },
      { name: '🏙️ De zona urbana', value: 'urbano' },
      { name: '👩 Mujer trabajadora/madre', value: 'mujer' }
    ]
  }
];

// Candidate profiles based on their emphasis and positions
const PERFILES_CANDIDATOS = {
  PLN: {
    nombre: 'Álvaro Ramos',
    fortalezas: ['salud', 'infraestructura', 'agro'],
    enfoque: 'balance',
    perfil: 'Experiencia en gobierno, enfoque en salud y CCSS, infraestructura',
    keywords: ['Caja', 'salud', 'infraestructura', 'agua', 'turismo']
  },
  PUSC: {
    nombre: 'Juan Carlos Hidalgo',
    fortalezas: ['economia', 'educacion', 'seguridad'],
    enfoque: 'mercado',
    perfil: 'Liberal clásico, reducción del Estado, énfasis en educación y empleo',
    keywords: ['impuestos', 'fiscal', 'educación', 'empleo', 'seguridad']
  },
  CAC: {
    nombre: 'Claudia Dobles',
    fortalezas: ['ambiente', 'social', 'genero'],
    enfoque: 'estado',
    perfil: 'Progresista, medio ambiente, igualdad de género, bienestar social',
    keywords: ['ambiente', 'mujeres', 'social', 'educación', 'cambio climático']
  },
  FA: {
    nombre: 'Ariel Robles',
    fortalezas: ['social', 'genero', 'educacion'],
    enfoque: 'estado',
    perfil: 'Izquierda progresista, derechos sociales, igualdad, educación pública',
    keywords: ['social', 'mujeres', 'educación', 'jóvenes', 'trabajo']
  },
  PLP: {
    nombre: 'Eliécer Feinzaig',
    fortalezas: ['economia', 'seguridad', 'infraestructura'],
    enfoque: 'mercado',
    perfil: 'Liberal, reducción de impuestos, eficiencia estatal, seguridad',
    keywords: ['impuestos', 'fiscal', 'empleo', 'seguridad', 'tecnología']
  },
  PNR: {
    nombre: 'Fabricio Alvarado',
    fortalezas: ['seguridad', 'genero', 'social'],
    enfoque: 'tradicional',
    perfil: 'Conservador, valores tradicionales, familia, seguridad',
    keywords: ['familia', 'seguridad', 'social', 'educación']
  },
  UP: {
    nombre: 'Natalia Díaz',
    fortalezas: ['social', 'salud', 'genero'],
    enfoque: 'estado',
    perfil: 'Progresista, bienestar social, salud, igualdad de género',
    keywords: ['social', 'mujeres', 'salud', 'pensiones', 'jóvenes']
  },
  PPSO: {
    nombre: 'Laura Fernández',
    fortalezas: ['social', 'seguridad', 'economia'],
    enfoque: 'balance',
    perfil: 'Independiente, lucha anticorrupción, bienestar social',
    keywords: ['corrupción', 'social', 'seguridad', 'empleo']
  },
  PA: {
    nombre: 'José Aguilar',
    fortalezas: ['economia', 'agro', 'infraestructura'],
    enfoque: 'mercado',
    perfil: 'Empresarial, apoyo a pymes, desarrollo económico',
    keywords: ['empresas', 'pymes', 'empleo', 'economía']
  },
  PSD: {
    nombre: 'Luz Mary Alpízar',
    fortalezas: ['social', 'salud', 'educacion'],
    enfoque: 'estado',
    perfil: 'Socialdemócrata, bienestar social, salud, educación',
    keywords: ['social', 'salud', 'educación', 'pensiones']
  }
};

// Calculate candidate scores based on answers
function calcularPuntajes(respuestas, kb) {
  const scores = {};

  // Initialize scores
  for (const siglas of Object.keys(kb.candidatos)) {
    scores[siglas] = {
      puntos: 0,
      razones: [],
      coincidencias: []
    };
  }

  // Get candidate topic data
  const candidatoTemas = {};
  for (const siglas of Object.keys(kb.candidatos)) {
    candidatoTemas[siglas] = {};
    const docs = kb.indice_por_candidato[siglas] || [];
    for (const docId of docs) {
      const doc = kb.documentos.find(d => d.id === docId);
      if (doc?.temas) {
        for (const [tema, count] of Object.entries(doc.temas)) {
          candidatoTemas[siglas][tema] = (candidatoTemas[siglas][tema] || 0) + count;
        }
      }
    }
  }

  // Score based on priority 1 (weight: 3)
  const cat1 = CATEGORIAS[respuestas.prioridad1];
  if (cat1) {
    for (const siglas of Object.keys(scores)) {
      const perfil = PERFILES_CANDIDATOS[siglas];
      if (perfil?.fortalezas.includes(respuestas.prioridad1)) {
        scores[siglas].puntos += 3;
        scores[siglas].razones.push(`Enfocado en ${cat1.nombre}`);
      }
      // Also check topic mentions
      let topicScore = 0;
      for (const tema of cat1.temas) {
        topicScore += candidatoTemas[siglas]?.[tema] || 0;
      }
      scores[siglas].puntos += Math.min(topicScore / 50, 2); // Normalize
    }
  }

  // Score based on priority 2 (weight: 2)
  const cat2 = CATEGORIAS[respuestas.prioridad2];
  if (cat2 && respuestas.prioridad2 !== respuestas.prioridad1) {
    for (const siglas of Object.keys(scores)) {
      const perfil = PERFILES_CANDIDATOS[siglas];
      if (perfil?.fortalezas.includes(respuestas.prioridad2)) {
        scores[siglas].puntos += 2;
        scores[siglas].razones.push(`También prioriza ${cat2.nombre}`);
      }
    }
  }

  // Score based on economic approach
  for (const siglas of Object.keys(scores)) {
    const perfil = PERFILES_CANDIDATOS[siglas];
    if (perfil?.enfoque === respuestas.enfoque_economico) {
      scores[siglas].puntos += 2;
      scores[siglas].coincidencias.push('Enfoque económico');
    } else if (respuestas.enfoque_economico === 'balance') {
      // Balance matches partially with everyone
      scores[siglas].puntos += 0.5;
    }
  }

  // Score based on CCSS position
  if (respuestas.ccss === 'fortalecer') {
    ['FA', 'UP', 'CAC', 'PSD'].forEach(s => {
      if (scores[s]) {
        scores[s].puntos += 1.5;
        scores[s].coincidencias.push('Fortalecer CCSS');
      }
    });
  } else if (respuestas.ccss === 'reforma') {
    ['PUSC', 'PLP', 'PLN'].forEach(s => {
      if (scores[s]) {
        scores[s].puntos += 1.5;
        scores[s].coincidencias.push('Reforma de CCSS');
      }
    });
  }

  // Score based on security approach
  if (respuestas.seguridad_enfoque === 'mano_dura') {
    ['PNR', 'PUSC', 'PLP'].forEach(s => {
      if (scores[s]) {
        scores[s].puntos += 1.5;
        scores[s].coincidencias.push('Seguridad: mano dura');
      }
    });
  } else if (respuestas.seguridad_enfoque === 'prevencion') {
    ['FA', 'CAC', 'UP'].forEach(s => {
      if (scores[s]) {
        scores[s].puntos += 1.5;
        scores[s].coincidencias.push('Seguridad: prevención');
      }
    });
  } else {
    ['PLN', 'PPSO', 'PSD'].forEach(s => {
      if (scores[s]) {
        scores[s].puntos += 1;
        scores[s].coincidencias.push('Seguridad: enfoque integral');
      }
    });
  }

  // Score based on environment position
  if (respuestas.ambiente_desarrollo === 'ambiente_primero') {
    ['CAC', 'FA'].forEach(s => {
      if (scores[s]) {
        scores[s].puntos += 2;
        scores[s].coincidencias.push('Prioridad ambiental');
      }
    });
  } else if (respuestas.ambiente_desarrollo === 'desarrollo_primero') {
    ['PUSC', 'PLP', 'PA'].forEach(s => {
      if (scores[s]) {
        scores[s].puntos += 1.5;
        scores[s].coincidencias.push('Prioridad desarrollo');
      }
    });
  }

  // Score based on gender policies
  if (respuestas.genero === 'favor') {
    ['CAC', 'FA', 'UP'].forEach(s => {
      if (scores[s]) {
        scores[s].puntos += 2;
        scores[s].coincidencias.push('Políticas de género');
      }
    });
  } else if (respuestas.genero === 'tradicional') {
    ['PNR'].forEach(s => {
      if (scores[s]) {
        scores[s].puntos += 2;
        scores[s].coincidencias.push('Valores familiares');
      }
    });
  }

  // Score based on experience preference
  if (respuestas.corrupcion === 'nuevo') {
    ['PPSO', 'UP', 'PA'].forEach(s => {
      if (scores[s]) {
        scores[s].puntos += 1;
        scores[s].coincidencias.push('Caras nuevas');
      }
    });
  } else if (respuestas.corrupcion === 'experiencia') {
    ['PLN', 'PUSC'].forEach(s => {
      if (scores[s]) {
        scores[s].puntos += 1;
        scores[s].coincidencias.push('Experiencia política');
      }
    });
  }

  // Score based on group identification
  if (respuestas.grupos?.includes('emprendedor')) {
    ['PUSC', 'PLP', 'PA'].forEach(s => {
      if (scores[s]) scores[s].puntos += 1;
    });
  }
  if (respuestas.grupos?.includes('trabajador')) {
    ['FA', 'PLN', 'PSD'].forEach(s => {
      if (scores[s]) scores[s].puntos += 1;
    });
  }
  if (respuestas.grupos?.includes('joven')) {
    ['FA', 'CAC', 'UP'].forEach(s => {
      if (scores[s]) scores[s].puntos += 1;
    });
  }
  if (respuestas.grupos?.includes('rural')) {
    ['PLN', 'PA'].forEach(s => {
      if (scores[s]) scores[s].puntos += 1;
    });
  }
  if (respuestas.grupos?.includes('mujer')) {
    ['CAC', 'FA', 'UP'].forEach(s => {
      if (scores[s]) scores[s].puntos += 1;
    });
  }
  if (respuestas.grupos?.includes('pensionado')) {
    ['PLN', 'PSD', 'UP'].forEach(s => {
      if (scores[s]) scores[s].puntos += 1;
    });
  }

  return scores;
}

// Generate recommendation text
function generarRecomendacion(siglas, score, kb) {
  const info = kb.candidatos[siglas];
  const perfil = PERFILES_CANDIDATOS[siglas];
  const docs = kb.indice_por_candidato[siglas]?.length || 0;

  let texto = '';

  texto += `${chalk.yellow.bold(info.nombre)} (${siglas})\n`;
  texto += `   ${chalk.gray(info.partido)}\n`;

  if (perfil?.perfil) {
    texto += `   ${chalk.white(perfil.perfil)}\n`;
  }

  if (score.coincidencias.length > 0) {
    texto += `   ${chalk.green('✓')} Coincidencias: ${score.coincidencias.join(', ')}\n`;
  }

  if (score.razones.length > 0) {
    texto += `   ${chalk.cyan('★')} ${score.razones.join(', ')}\n`;
  }

  texto += `   ${chalk.gray(`(${docs} entrevistas disponibles para investigar más)`)}\n`;

  return texto;
}

// Main quiz function
export async function runQuiz() {
  const kb = loadKB();

  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('       🗳️  DESCUBRÍ TU CANDIDATO IDEAL - CR 2026'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════\n'));

  console.log(chalk.gray('Respondé las siguientes preguntas para encontrar'));
  console.log(chalk.gray('los candidatos más alineados con tus valores y prioridades.\n'));

  // Run the quiz
  const respuestas = await inquirer.prompt(PREGUNTAS);

  console.log(chalk.cyan('\n⏳ Analizando tus respuestas...\n'));

  // Calculate scores
  const scores = calcularPuntajes(respuestas, kb);

  // Sort by score
  const ranking = Object.entries(scores)
    .filter(([siglas]) => PERFILES_CANDIDATOS[siglas]) // Only candidates with profiles
    .sort((a, b) => b[1].puntos - a[1].puntos);

  // Display results
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('              📊 TUS RESULTADOS'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════\n'));

  console.log(chalk.white('Basado en tus respuestas, estos son los candidatos'));
  console.log(chalk.white('que podrían estar más alineados con vos:\n'));

  // Top 3
  const medals = ['🥇', '🥈', '🥉'];

  for (let i = 0; i < 3; i++) {
    const [siglas, score] = ranking[i];
    const pct = Math.round((score.puntos / ranking[0][1].puntos) * 100);

    console.log(chalk.cyan.bold(`\n${medals[i]} #${i + 1} - ${pct}% de afinidad`));
    console.log('─'.repeat(45));
    console.log(generarRecomendacion(siglas, score, kb));
  }

  // Summary of priorities
  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('              📝 RESUMEN DE TUS PRIORIDADES'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════\n'));

  const cat1 = CATEGORIAS[respuestas.prioridad1];
  const cat2 = CATEGORIAS[respuestas.prioridad2];

  console.log(`${chalk.yellow('1.')} ${cat1?.nombre}: ${cat1?.descripcion}`);
  console.log(`${chalk.yellow('2.')} ${cat2?.nombre}: ${cat2?.descripcion}`);

  // Next steps
  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('              🔍 PRÓXIMOS PASOS'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════\n'));

  const topSiglas = ranking[0][0];
  console.log(chalk.white('Para conocer más sobre tus candidatos recomendados:\n'));
  console.log(chalk.gray(`  voto perfil ${topSiglas}         # Ver perfil detallado`));
  console.log(chalk.gray(`  voto comparar ${ranking[0][0]} ${ranking[1][0]}   # Comparar los dos primeros`));
  console.log(chalk.gray(`  voto buscar educación   # Buscar tema específico`));
  console.log(chalk.gray(`  voto leer TSE-*-${topSiglas}-*   # Leer entrevista completa`));

  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════'));
  console.log(chalk.yellow.bold('  ⚠️  IMPORTANTE: Esta es solo una guía inicial.'));
  console.log(chalk.white('  Investigá más, leé los planes de gobierno y'));
  console.log(chalk.white('  escuchá los debates antes de decidir tu voto.'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════\n'));

  console.log(chalk.green.bold('¡Tu voto informado hace la diferencia! 🇨🇷\n'));

  return ranking.slice(0, 3);
}

// Run if called directly
if (process.argv[1]?.includes('quiz.js')) {
  runQuiz();
}
