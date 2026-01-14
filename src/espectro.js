#!/usr/bin/env node
/**
 * Espectro Político - Voto Informado CR 2026
 * Visualización del espectro político de los partidos
 */

import chalk from 'chalk';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const DATA_DIR = join(PROJECT_ROOT, 'data');

// Political spectrum data for each party
// economico: -5 (izquierda) to +5 (derecha)
// social: -5 (progresista) to +5 (conservador)
const ESPECTRO_DATA = {
  // Izquierda
  FA: {
    economico: -4,
    social: -4,
    label: 'Izquierda progresista',
    descripcion: 'Estado activo, derechos sociales, igualdad de género, medio ambiente',
    color: 'red'
  },
  PDLCT: {
    economico: -4,
    social: -3,
    label: 'Izquierda',
    descripcion: 'Derechos laborales, sindicalismo, justicia social',
    color: 'red'
  },

  // Centro-izquierda
  CAC: {
    economico: -2,
    social: -3,
    label: 'Centro-izquierda progresista',
    descripcion: 'Progresista, medio ambiente, políticas de género, desarrollo sostenible',
    color: 'magenta'
  },
  UP: {
    economico: -2,
    social: -2,
    label: 'Centro-izquierda',
    descripcion: 'Bienestar social, salud, derechos de la mujer',
    color: 'magenta'
  },
  PSD: {
    economico: -1,
    social: -1,
    label: 'Socialdemocracia',
    descripcion: 'Estado de bienestar, educación, salud pública',
    color: 'magenta'
  },
  PJSC: {
    economico: -2,
    social: -1,
    label: 'Centro-izquierda social',
    descripcion: 'Justicia social, protección de trabajadores',
    color: 'magenta'
  },

  // Centro
  PLN: {
    economico: 0,
    social: 0,
    label: 'Centro pragmático',
    descripcion: 'Tradición socialdemócrata, pragmatismo, infraestructura',
    color: 'green'
  },
  PPSO: {
    economico: 0,
    social: 1,
    label: 'Centro independiente',
    descripcion: 'Anti-corrupción, soberanía nacional, independiente',
    color: 'green'
  },
  CDS: {
    economico: 1,
    social: 0,
    label: 'Centro',
    descripcion: 'Ciudadanía activa, transparencia, eficiencia',
    color: 'green'
  },

  // Centro-derecha
  PUSC: {
    economico: 2,
    social: 1,
    label: 'Centro-derecha liberal',
    descripcion: 'Libre mercado, reducción del Estado, educación',
    color: 'blue'
  },
  PA: {
    economico: 3,
    social: 1,
    label: 'Centro-derecha empresarial',
    descripcion: 'Pro-empresa, pymes, desarrollo económico',
    color: 'blue'
  },
  PIN: {
    economico: 2,
    social: 2,
    label: 'Centro-derecha',
    descripcion: 'Integración, desarrollo, valores tradicionales',
    color: 'blue'
  },

  // Derecha
  PLP: {
    economico: 4,
    social: 0,
    label: 'Derecha liberal',
    descripcion: 'Liberalismo clásico, reducción de impuestos, Estado mínimo',
    color: 'cyan'
  },
  CR1: {
    economico: 3,
    social: 2,
    label: 'Derecha',
    descripcion: 'Nacionalismo cívico, seguridad, desarrollo',
    color: 'cyan'
  },

  // Derecha conservadora
  PNR: {
    economico: 2,
    social: 4,
    label: 'Derecha conservadora',
    descripcion: 'Valores tradicionales, familia, seguridad, fe',
    color: 'yellow'
  },
  PNG: {
    economico: 3,
    social: 4,
    label: 'Derecha nacionalista',
    descripcion: 'Nacionalismo, soberanía, valores tradicionales',
    color: 'yellow'
  },
  ACRM: {
    economico: 2,
    social: 3,
    label: 'Derecha populista',
    descripcion: 'Soberanía popular, anti-establishment',
    color: 'yellow'
  },

  // Otros / Difícil clasificar
  PEN: {
    economico: 1,
    social: 2,
    label: 'Centro-derecha popular',
    descripcion: 'Populismo, anti-élite, pueblo primero',
    color: 'white'
  },
  PEL: {
    economico: 0,
    social: 1,
    label: 'Centro',
    descripcion: 'Propuestas variadas, desarrollo local',
    color: 'white'
  },
  PUCD: {
    economico: 1,
    social: 1,
    label: 'Centro-derecha',
    descripcion: 'Unión democrática, desarrollo',
    color: 'white'
  }
};

// Load knowledge base for candidate names
function loadKB() {
  const kbPath = join(DATA_DIR, 'knowledge-base.json');
  if (existsSync(kbPath)) {
    return JSON.parse(readFileSync(kbPath, 'utf-8'));
  }
  return null;
}

// Get color function based on color name
function getColor(colorName) {
  const colors = {
    red: chalk.red,
    magenta: chalk.magenta,
    green: chalk.green,
    blue: chalk.blue,
    cyan: chalk.cyan,
    yellow: chalk.yellow,
    white: chalk.white
  };
  return colors[colorName] || chalk.white;
}

// Draw ASCII spectrum visualization
function drawSpectrum(options = {}) {
  const kb = loadKB();

  console.log(chalk.cyan.bold('\n' + '═'.repeat(70)));
  console.log(chalk.cyan.bold('              ESPECTRO POLITICO - CR 2026'));
  console.log(chalk.cyan.bold('═'.repeat(70) + '\n'));

  // Economic axis header
  console.log(chalk.white.bold('  EJE ECONOMICO'));
  console.log(chalk.gray('  Estado activo ◄─────────────────────────────────► Libre mercado\n'));

  // Sort parties by economic position
  const sorted = Object.entries(ESPECTRO_DATA)
    .sort((a, b) => a[1].economico - b[1].economico);

  // Draw the spectrum line
  const width = 60;
  const center = width / 2;

  // Group by approximate position for cleaner display
  const groups = {
    '-4': [], '-3': [], '-2': [], '-1': [], '0': [], '1': [], '2': [], '3': [], '4': []
  };

  for (const [siglas, data] of sorted) {
    const key = String(data.economico);
    if (groups[key]) {
      groups[key].push({ siglas, ...data });
    }
  }

  // Draw scale
  const scaleLabels = ['IZQUIERDA', '', '', '', 'CENTRO', '', '', '', 'DERECHA'];
  let scaleLine = '  ';
  for (let i = -4; i <= 4; i++) {
    const label = scaleLabels[i + 4] || '';
    scaleLine += label.padEnd(7);
  }
  console.log(chalk.gray(scaleLine));

  // Draw position markers
  let markerLine = '  ';
  for (let i = -4; i <= 4; i++) {
    markerLine += (i === 0 ? '│' : '·').padEnd(7);
  }
  console.log(chalk.gray(markerLine));

  // Draw parties at their positions
  console.log('');
  for (let pos = -4; pos <= 4; pos++) {
    const partiesAtPos = groups[String(pos)] || [];
    if (partiesAtPos.length > 0) {
      for (const party of partiesAtPos) {
        const colorFn = getColor(party.color);
        const candidato = kb?.candidatos[party.siglas];
        const nombre = candidato ? candidato.nombre.split(' ').slice(0, 2).join(' ') : '';

        // Position indicator
        const spaces = '       '.repeat(pos + 4);
        console.log(spaces + colorFn.bold(party.siglas));
      }
    }
  }

  console.log('');

  // Legend with details
  if (options.detalle) {
    console.log(chalk.cyan.bold('─'.repeat(70)));
    console.log(chalk.cyan.bold('  DETALLE POR PARTIDO'));
    console.log(chalk.cyan.bold('─'.repeat(70) + '\n'));

    // Group by category for cleaner display
    const categories = [
      { name: 'Izquierda', range: [-5, -3], color: 'red' },
      { name: 'Centro-izquierda', range: [-2, -1], color: 'magenta' },
      { name: 'Centro', range: [0, 0], color: 'green' },
      { name: 'Centro-derecha', range: [1, 2], color: 'blue' },
      { name: 'Derecha', range: [3, 5], color: 'cyan' }
    ];

    for (const cat of categories) {
      const parties = sorted.filter(([_, d]) =>
        d.economico >= cat.range[0] && d.economico <= cat.range[1]
      );

      if (parties.length > 0) {
        const colorFn = getColor(cat.color);
        console.log(colorFn.bold(`\n  ${cat.name.toUpperCase()}`));
        console.log(chalk.gray('  ' + '─'.repeat(40)));

        for (const [siglas, data] of parties) {
          const candidato = kb?.candidatos[siglas];
          const nombre = candidato ? candidato.nombre : 'Desconocido';
          const partido = candidato ? candidato.partido : '';

          console.log(`  ${colorFn(siglas.padEnd(6))} ${chalk.white.bold(nombre)}`);
          console.log(`         ${chalk.gray(partido)}`);
          console.log(`         ${chalk.yellow(data.label)}`);
          console.log(`         ${chalk.gray(data.descripcion)}`);

          // Visual position indicator
          const ecoPos = '·'.repeat(data.economico + 5) + chalk.yellow('●') + '·'.repeat(4 - data.economico);
          const socPos = '·'.repeat(data.social + 5) + chalk.cyan('●') + '·'.repeat(4 - data.social);
          console.log(`         Económico: [${ecoPos}]`);
          console.log(`         Social:    [${socPos}]`);
          console.log('');
        }
      }
    }
  } else {
    // Compact legend
    console.log(chalk.cyan.bold('─'.repeat(70)));
    console.log(chalk.cyan.bold('  LEYENDA'));
    console.log(chalk.cyan.bold('─'.repeat(70) + '\n'));

    const compactList = sorted.map(([siglas, data]) => {
      const colorFn = getColor(data.color);
      const candidato = kb?.candidatos[siglas];
      const nombre = candidato ? candidato.nombre.split(' ').slice(0, 2).join(' ') : '';
      return `  ${colorFn(siglas.padEnd(6))} ${nombre.padEnd(22)} ${chalk.gray(data.label)}`;
    });

    // Print in columns if possible
    for (const line of compactList) {
      console.log(line);
    }
  }

  // Social axis note
  console.log(chalk.cyan.bold('\n─'.repeat(70)));
  console.log(chalk.white.bold('  EJE SOCIAL (valores)'));
  console.log(chalk.gray('  Progresista ◄───────────────────────────────────► Conservador'));
  console.log(chalk.gray('  (igualdad de género, diversidad)    (familia tradicional, fe)\n'));

  // Footer
  console.log(chalk.cyan.bold('═'.repeat(70)));
  console.log(chalk.gray('  Nota: Esta clasificación es aproximada y basada en declaraciones'));
  console.log(chalk.gray('  públicas. Usá "voto perfil <SIGLAS>" para ver más detalles.'));
  console.log(chalk.cyan.bold('═'.repeat(70) + '\n'));
}

// Compare spectrum positions of specific parties
function compareSpectrum(party1, party2) {
  const kb = loadKB();
  const s1 = party1.toUpperCase();
  const s2 = party2.toUpperCase();

  const d1 = ESPECTRO_DATA[s1];
  const d2 = ESPECTRO_DATA[s2];

  if (!d1 || !d2) {
    console.log(chalk.red('\nUno o ambos partidos no encontrados en el espectro.'));
    return;
  }

  const c1 = kb?.candidatos[s1];
  const c2 = kb?.candidatos[s2];

  console.log(chalk.cyan.bold('\n' + '═'.repeat(60)));
  console.log(chalk.cyan.bold('  COMPARACION DE ESPECTRO POLITICO'));
  console.log(chalk.cyan.bold('═'.repeat(60) + '\n'));

  // Party 1
  const color1 = getColor(d1.color);
  console.log(color1.bold(`  ${s1} - ${c1?.nombre || 'Desconocido'}`));
  console.log(`  ${chalk.gray(d1.label)}`);
  console.log(`  ${d1.descripcion}\n`);

  // Party 2
  const color2 = getColor(d2.color);
  console.log(color2.bold(`  ${s2} - ${c2?.nombre || 'Desconocido'}`));
  console.log(`  ${chalk.gray(d2.label)}`);
  console.log(`  ${d2.descripcion}\n`);

  // Visual comparison
  console.log(chalk.white.bold('  Posición en el espectro:'));
  console.log(chalk.gray('  ' + '─'.repeat(50)));

  // Economic axis comparison
  console.log(chalk.white('\n  Eje Económico (Izq ◄──► Der):'));
  const drawAxis = (val, colorFn, label) => {
    const pos = val + 5; // Convert -5..5 to 0..10
    const line = '·'.repeat(pos) + colorFn('●') + '·'.repeat(10 - pos);
    return `  [${line}] ${label}`;
  };
  console.log(drawAxis(d1.economico, color1, s1));
  console.log(drawAxis(d2.economico, color2, s2));

  // Social axis comparison
  console.log(chalk.white('\n  Eje Social (Prog ◄──► Cons):'));
  console.log(drawAxis(d1.social, color1, s1));
  console.log(drawAxis(d2.social, color2, s2));

  // Distance
  const distance = Math.sqrt(
    Math.pow(d1.economico - d2.economico, 2) +
    Math.pow(d1.social - d2.social, 2)
  ).toFixed(1);

  console.log(chalk.white('\n  Distancia ideológica: ') +
    chalk.yellow.bold(distance) +
    chalk.gray(` (escala 0-14)`));

  if (distance < 2) {
    console.log(chalk.green('  → Muy cercanos ideológicamente'));
  } else if (distance < 4) {
    console.log(chalk.yellow('  → Relativamente cercanos'));
  } else if (distance < 6) {
    console.log(chalk.cyan('  → Diferencias moderadas'));
  } else {
    console.log(chalk.red('  → Posiciones muy distintas'));
  }

  console.log(chalk.cyan.bold('\n' + '═'.repeat(60) + '\n'));
}

// Export for CLI usage
export { drawSpectrum, compareSpectrum, ESPECTRO_DATA };

// Run if called directly
if (process.argv[1]?.includes('espectro.js')) {
  const args = process.argv.slice(2);
  if (args.length === 2) {
    compareSpectrum(args[0], args[1]);
  } else {
    drawSpectrum({ detalle: args.includes('--detalle') || args.includes('-d') });
  }
}
