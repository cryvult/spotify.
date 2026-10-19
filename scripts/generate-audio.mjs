#!/usr/bin/env node
// Generator utworów demonstracyjnych SONORA.
//
// Użycie:  npm run generate:audio               (wszystkie utwory)
//          npm run generate:audio -- szklo pulsar  (wybrane utwory)
//
// Wymaga programu ffmpeg (kodowanie do MP3). Wygenerowane pliki są już w repozytorium
// w public/audio, więc skrypt jest potrzebny tylko do ich odtworzenia lub zmiany.

import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { SR } from './audio/dsp.mjs';
import { SONGS } from './audio/songs.mjs';
import * as styles from './audio/styles.mjs';

const outputDir = fileURLToPath(new URL('../public/audio/', import.meta.url));
const manifestPath = fileURLToPath(new URL('./audio/manifest.json', import.meta.url));

function encodeMp3(buffer, file, song) {
  const interleaved = new Float32Array(buffer.length * 2);
  for (let i = 0; i < buffer.length; i++) {
    interleaved[i * 2] = buffer.L[i];
    interleaved[i * 2 + 1] = buffer.R[i];
  }
  const args = [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-f',
    'f32le',
    '-ar',
    String(SR),
    '-ac',
    '2',
    '-i',
    'pipe:0',
    '-codec:a',
    'libmp3lame',
    '-b:a',
    '96k',
    '-metadata',
    `title=${song.title}`,
    '-metadata',
    `artist=${song.artist}`,
    '-metadata',
    `album=${song.album}`,
    '-metadata',
    'comment=SONORA demo: utwor wygenerowany algorytmicznie, licencja CC0 1.0',
    file,
  ];
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
    ffmpeg.on('error', (error) => reject(new Error(`Nie udało się uruchomić ffmpeg: ${error.message}`)));
    ffmpeg.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg zakończył się kodem ${code}`)),
    );
    ffmpeg.stdin.end(Buffer.from(interleaved.buffer));
  });
}

async function readManifest() {
  try {
    return JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch {
    return {};
  }
}

const only = process.argv.slice(2);
const selected = only.length ? SONGS.filter((song) => only.includes(song.id)) : SONGS;
if (selected.length === 0) {
  console.error('Nie znaleziono utworów o podanych identyfikatorach.');
  process.exit(1);
}

await mkdir(outputDir, { recursive: true });
const manifest = await readManifest();

for (const song of selected) {
  const started = performance.now();
  const buffer = styles[song.style](song.params);
  const file = `${outputDir}${song.id}.mp3`;
  await encodeMp3(buffer, file, song);
  const duration = Math.round((buffer.length / SR) * 10) / 10;
  manifest[song.id] = { file: `audio/${song.id}.mp3`, durationSec: duration };
  const seconds = ((performance.now() - started) / 1000).toFixed(1);
  const lufs = buffer.loudness === undefined ? '' : `  ${buffer.loudness.toFixed(1)} LUFS`;
  console.log(`✓ ${song.id.padEnd(24)} ${duration.toFixed(1).padStart(5)} s${lufs}  (render ${seconds} s)`);
}

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  `\nZapisano ${selected.length} utworów w public/audio oraz manifest w scripts/audio/manifest.json`,
);
