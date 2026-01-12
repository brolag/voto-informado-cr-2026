#!/usr/bin/env node
/**
 * Process VTT transcripts into clean text files
 * Removes timestamps and formatting, outputs readable text
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const TRANSCRIPTS_DIR = join(PROJECT_ROOT, 'data/transcripts');
const PROCESSED_DIR = join(PROJECT_ROOT, 'data/processed');

function parseVTT(content) {
  const lines = content.split('\n');
  const textLines = [];
  let lastText = '';

  for (const line of lines) {
    // Skip WebVTT header, timestamps, and empty lines
    if (line.startsWith('WEBVTT') ||
        line.includes('-->') ||
        line.match(/^\d+$/) ||
        line.trim() === '') {
      continue;
    }

    // Remove HTML tags and clean up
    let text = line
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .trim();

    // Avoid duplicates (VTT often repeats text)
    if (text && text !== lastText && !lastText.includes(text)) {
      textLines.push(text);
      lastText = text;
    }
  }

  return textLines.join(' ').replace(/\s+/g, ' ').trim();
}

function processTranscripts() {
  if (!existsSync(PROCESSED_DIR)) {
    mkdirSync(PROCESSED_DIR, { recursive: true });
  }

  const files = readdirSync(TRANSCRIPTS_DIR).filter(f => f.endsWith('.vtt'));
  console.log(`Processing ${files.length} transcripts...`);

  for (const file of files) {
    const inputPath = join(TRANSCRIPTS_DIR, file);
    const outputName = basename(file, '.es.vtt') + '.txt';
    const outputPath = join(PROCESSED_DIR, outputName);

    const content = readFileSync(inputPath, 'utf-8');
    const text = parseVTT(content);

    writeFileSync(outputPath, text);
    console.log(`  ✓ ${outputName} (${Math.round(text.length/1000)}KB)`);
  }

  console.log(`\nProcessed ${files.length} files to ${PROCESSED_DIR}`);
}

processTranscripts();
