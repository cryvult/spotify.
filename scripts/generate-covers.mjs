#!/usr/bin/env node
// Generator okładek SONORA: abstrakcyjne grafiki SVG dla albumów, playlist i wykonawców.
// Użycie: npm run generate:covers  (pliki trafiają do public/covers)

import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const SIZE = 600;

function createRng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (min, max) => min + (max - min) * next(),
    pick: (items) => items[Math.floor(next() * items.length)],
  };
}

const round = (value) => Math.round(value * 10) / 10;

/** Delikatne ziarno nadające grafikom „drukowany” charakter. */
const GRAIN = `<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>`;

function svg(body, defs = '', grain = 0.07) {
  const grainLayer =
    grain > 0 ? `<rect width="${SIZE}" height="${SIZE}" filter="url(#grain)" opacity="${grain}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}"><defs>${GRAIN}${defs}</defs>${body}${grainLayer}</svg>\n`;
}

const linear = (id, stops, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map((c, i) => `<stop offset="${round((i / (stops.length - 1)) * 100)}%" stop-color="${c}"/>`).join('')}</linearGradient>`;

// ------------------------------------------------------------------ wzory

const patterns = {
  /** Rozmyte kule światła: miękki gradient siatkowy. */
  orbs({ palette, seed, background }) {
    const rng = createRng(seed);
    const circles = palette
      .map(
        (color) =>
          `<circle cx="${round(rng.range(60, 540))}" cy="${round(rng.range(60, 540))}" r="${round(rng.range(120, 220))}" fill="${color}" opacity="${round(rng.range(0.8, 1))}"/>`,
      )
      .join('');
    return svg(
      `<rect width="600" height="600" fill="${background}"/><g filter="url(#blur)">${circles}</g>`,
      `<filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="55"/></filter>`,
      0.09,
    );
  },

  /** Słońce w stylu lat 80. z poziomymi cięciami i siatką perspektywiczną. */
  sunset({ palette: [skyTop, skyBottom, sunTop, sunBottom, grid] }) {
    const cuts = Array.from({ length: 6 }, (_, i) => {
      const y = 300 + i * 22 + i * i * 1.5;
      return `<rect x="0" y="${round(y)}" width="600" height="${round(3 + i * 2.2)}" fill="black"/>`;
    }).join('');
    // Linie zbiegające się w punkcie na horyzoncie dają efekt perspektywy.
    const vertical = Array.from(
      { length: 17 },
      (_, i) => `<line x1="300" y1="390" x2="${300 + (i - 8) * 95}" y2="600"/>`,
    ).join('');
    const horizontal = Array.from({ length: 7 }, (_, i) => {
      const y = 390 + (i / 6) ** 1.8 * 210;
      return `<line x1="0" y1="${round(y)}" x2="600" y2="${round(y)}" />`;
    }).join('');
    const defs = `${linear('sky', [skyTop, skyBottom])}${linear('sun', [sunTop, sunBottom])}<mask id="cuts"><rect width="600" height="600" fill="white"/>${cuts}</mask>`;
    return svg(
      `<rect width="600" height="600" fill="url(#sky)"/><circle cx="300" cy="300" r="160" fill="url(#sun)" mask="url(#cuts)"/><rect y="390" width="600" height="210" fill="${skyTop}"/><g stroke="${grid}" stroke-width="2" opacity="0.85">${vertical}${horizontal}</g><line x1="0" y1="390" x2="600" y2="390" stroke="${sunBottom}" stroke-width="3"/>`,
      defs,
    );
  },

  /** Koncentryczne pierścienie z przesuniętym środkiem. */
  rings({ palette, background, seed }) {
    const rng = createRng(seed);
    const cx = round(rng.range(220, 380));
    const cy = round(rng.range(220, 380));
    const rings = Array.from(
      { length: 9 },
      (_, i) => `<circle cx="${cx}" cy="${cy}" r="${430 - i * 46}" fill="${palette[i % palette.length]}"/>`,
    ).join('');
    return svg(`<rect width="600" height="600" fill="${background}"/>${rings}`);
  },

  /** Symetryczny „sprite” 8-bit na siatce pikseli. */
  pixels({ palette: [background, main, accent, shade], seed }) {
    const rng = createRng(seed);
    const cells = 10;
    const size = 40;
    const offset = (600 - cells * size) / 2;
    let body = `<rect width="600" height="600" fill="${background}"/>`;
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells / 2; x++) {
        const roll = rng.next();
        if (roll < 0.42) continue;
        const color = roll > 0.86 ? accent : roll > 0.66 ? shade : main;
        for (const px of [x, cells - 1 - x])
          body += `<rect x="${offset + px * size}" y="${offset + y * size}" width="${size}" height="${size}" fill="${color}"/>`;
      }
    }
    const gridLines = Array.from(
      { length: 16 },
      (_, i) =>
        `<line x1="${i * 40}" y1="0" x2="${i * 40}" y2="600"/><line x1="0" y1="${i * 40}" x2="600" y2="${i * 40}"/>`,
    ).join('');
    return svg(`${body}<g stroke="${background}" stroke-width="2" opacity="0.5">${gridLines}</g>`, '', 0.05);
  },

  /** Linie jak na planie komunikacji miejskiej, z przystankami. */
  transit({ palette: [background, ...lines], seed }) {
    const rng = createRng(seed);
    const paths = lines
      .map((color, i) => {
        const startY = 120 + i * 120 + rng.range(-20, 20);
        const turnX = 180 + rng.range(0, 160);
        const drop = rng.pick([-1, 1]) * rng.range(80, 140);
        const points = [
          [-20, startY],
          [turnX, startY],
          [turnX + Math.abs(drop), startY + drop],
          [620, startY + drop],
        ];
        const d = points.map(([x, y], k) => `${k === 0 ? 'M' : 'L'}${round(x)} ${round(y)}`).join(' ');
        const stops = [points[1], [(points[2][0] + points[3][0]) / 2 + rng.range(-60, 60), points[2][1]]]
          .map(
            ([x, y]) =>
              `<circle cx="${round(x)}" cy="${round(y)}" r="15" fill="${background}" stroke="#f4f1ea" stroke-width="8"/>`,
          )
          .join('');
        return `<path d="${d}" fill="none" stroke="${color}" stroke-width="30" stroke-linejoin="round" stroke-linecap="round"/>${stops}`;
      })
      .join('');
    return svg(`<rect width="600" height="600" fill="${background}"/>${paths}`);
  },

  /** Warstwy fal od góry do dołu. */
  waves({ palette, seed }) {
    const rng = createRng(seed);
    const layers = palette
      .map((color, i) => {
        const base = 40 + (i + 1) * (520 / palette.length);
        const amplitude = rng.range(18, 42);
        const frequency = rng.range(1.2, 2.4);
        const phase = rng.range(0, Math.PI * 2);
        let d = `M0 600 L0 ${round(base)}`;
        for (let x = 0; x <= 600; x += 20)
          d += ` L${x} ${round(base + amplitude * Math.sin((x / 600) * Math.PI * 2 * frequency + phase))}`;
        return `<path d="${d} L600 600 Z" fill="${color}"/>`;
      })
      .join('');
    return svg(`<rect width="600" height="600" fill="${palette[0]}"/>${layers}`);
  },

  /** Pałki wodne (trzciny) na tle zachodu słońca. */
  reeds({ palette: [top, bottom, stem, head], seed }) {
    const rng = createRng(seed);
    const reeds = Array.from({ length: 13 }, () => {
      const x = rng.range(30, 570);
      const topY = rng.range(140, 330);
      const lean = rng.range(-30, 30);
      return `<path d="M${round(x)} 600 Q${round(x + lean * 0.3)} ${round((600 + topY) / 2)} ${round(x + lean)} ${round(topY)}" stroke="${stem}" stroke-width="5" fill="none"/><rect x="${round(x + lean - 9)}" y="${round(topY + 14)}" width="18" height="${round(rng.range(60, 90))}" rx="9" fill="${head}" transform="rotate(${round(lean * 0.3)} ${round(x + lean)} ${round(topY)})"/>`;
    }).join('');
    return svg(
      `<rect width="600" height="600" fill="url(#bg)"/><circle cx="420" cy="230" r="90" fill="#f7d9a8" opacity="0.8"/>${reeds}`,
      linear('bg', [top, bottom]),
    );
  },

  /** Fasada budynku nocą: kilka zapalonych okien i ciepła poświata. */
  windows({ palette: [background, wall, lit, glow], seed }) {
    const rng = createRng(seed);
    let windows = '';
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 5; col++) {
        const on = rng.next() < 0.22 || (row === 3 && col === 1);
        windows += `<rect x="${110 + col * 80}" y="${100 + row * 80}" width="44" height="52" rx="4" fill="${on ? lit : background}" opacity="${on ? 1 : 0.55}"/>`;
      }
    }
    return svg(
      `<rect width="600" height="600" fill="${background}"/><rect x="80" y="70" width="440" height="560" rx="10" fill="${wall}"/>${windows}<circle cx="200" cy="360" r="240" fill="url(#glow)"/>`,
      `<radialGradient id="glow"><stop offset="0%" stop-color="${glow}" stop-opacity="0.75"/><stop offset="35%" stop-color="${glow}" stop-opacity="0.3"/><stop offset="100%" stop-color="${glow}" stop-opacity="0"/></radialGradient>`,
    );
  },

  /** Ukośne pasy o różnej szerokości. */
  stripes({ palette, seed }) {
    const rng = createRng(seed);
    let x = -600;
    let body = `<rect width="600" height="600" fill="${palette[0]}"/>`;
    let i = 0;
    while (x < 1200) {
      const width = rng.range(40, 120);
      body += `<rect x="${round(x)}" y="-300" width="${round(width)}" height="1200" fill="${palette[i % palette.length]}" transform="rotate(35 300 300)"/>`;
      x += width;
      i++;
    }
    return svg(body);
  },

  /** Raster kropek, których wielkość tworzy gradient. */
  dots({ palette: [background, dot, accent], seed }) {
    const rng = createRng(seed);
    const cx = rng.range(150, 450);
    const cy = rng.range(150, 450);
    let body = `<rect width="600" height="600" fill="${background}"/>`;
    for (let y = 30; y < 600; y += 40) {
      for (let x = 30; x < 600; x += 40) {
        const distance = Math.hypot(x - cx, y - cy);
        const r = Math.max(2, 16 - distance / 28);
        body += `<circle cx="${x}" cy="${y}" r="${round(r)}" fill="${distance < 90 ? accent : dot}"/>`;
      }
    }
    return svg(body, '', 0.05);
  },

  /** Kompozycja figur w duchu Bauhausu na siatce 2x2. */
  bauhaus({ palette: [background, a, b, c, d], seed }) {
    const rng = createRng(seed);
    const shapes = [
      (x, y, color) => `<circle cx="${x + 150}" cy="${y + 150}" r="130" fill="${color}"/>`,
      (x, y, color) =>
        `<path d="M${x} ${y} L${x + 300} ${y} A300 300 0 0 1 ${x} ${y + 300} Z" fill="${color}"/>`,
      (x, y, color) => `<rect x="${x + 30}" y="${y + 30}" width="240" height="240" fill="${color}"/>`,
      (x, y, color) => `<path d="M${x} ${y + 150} A150 150 0 0 1 ${x + 300} ${y + 150} Z" fill="${color}"/>`,
      (x, y, color) =>
        `<path d="M${x + 150} ${y + 20} L${x + 280} ${y + 280} L${x + 20} ${y + 280} Z" fill="${color}"/>`,
    ];
    const colors = [a, b, c, d];
    let body = `<rect width="600" height="600" fill="${background}"/>`;
    [
      [0, 0],
      [300, 0],
      [0, 300],
      [300, 300],
    ].forEach(([x, y], i) => {
      body += rng.pick(shapes)(x, y, colors[i]);
    });
    return svg(body);
  },

  /** Słupki jak w korektorze graficznym. */
  bars({ palette: [background, ...colors], seed }) {
    const rng = createRng(seed);
    let body = `<rect width="600" height="600" fill="${background}"/>`;
    for (let i = 0; i < 9; i++) {
      const height = 120 + Math.sin(i * 0.9 + rng.range(0, 1)) * 120 + rng.range(40, 180);
      body += `<rect x="${48 + i * 58}" y="${round(560 - height)}" width="40" height="${round(height)}" rx="20" fill="${colors[i % colors.length]}"/>`;
    }
    return svg(body);
  },

  /** Wielkie koło z kropek (półton). */
  halftone({ palette: [background, color, accent] }) {
    let body = `<rect width="600" height="600" fill="${background}"/><circle cx="300" cy="330" r="190" fill="${accent}" opacity="0.35"/>`;
    for (let y = 120; y <= 540; y += 22) {
      for (let x = 90; x <= 510; x += 22) {
        const distance = Math.hypot(x - 300, y - 330);
        if (distance > 210) continue;
        const r = 9 * (1 - (y - 120) / 520);
        if (r > 0.8) body += `<circle cx="${x}" cy="${y}" r="${round(r)}" fill="${color}"/>`;
      }
    }
    return svg(body);
  },

  /** Jodełki (chevrony) w ruchu. */
  chevrons({ palette: [background, ...colors] }) {
    let body = `<rect width="600" height="600" fill="${background}"/>`;
    for (let i = 0; i < 7; i++) {
      const y = 40 + i * 80;
      body += `<path d="M60 ${y + 70} L300 ${y} L540 ${y + 70}" fill="none" stroke="${colors[i % colors.length]}" stroke-width="34" stroke-linejoin="round" stroke-linecap="round"/>`;
    }
    return svg(body);
  },

  /** Konfetti z prostych figur. */
  confetti({ palette: [background, ...colors], seed }) {
    const rng = createRng(seed);
    let body = `<rect width="600" height="600" fill="${background}"/>`;
    for (let i = 0; i < 26; i++) {
      const x = round(rng.range(20, 580));
      const y = round(rng.range(20, 580));
      const color = rng.pick(colors);
      const angle = round(rng.range(0, 180));
      const kind = rng.next();
      body +=
        kind < 0.4
          ? `<circle cx="${x}" cy="${y}" r="${round(rng.range(14, 34))}" fill="${color}"/>`
          : kind < 0.75
            ? `<rect x="${x}" y="${y}" width="${round(rng.range(40, 90))}" height="22" rx="11" fill="${color}" transform="rotate(${angle} ${x} ${y})"/>`
            : `<path d="M${x} ${y} l30 52 l-60 0 Z" fill="${color}" transform="rotate(${angle} ${x} ${y})"/>`;
    }
    return svg(body);
  },
};

// ------------------------------------------------------------------ lista okładek

const COVERS = {
  albums: {
    'herbata-o-drugiej': {
      pattern: 'windows',
      palette: ['#191a33', '#2a2850', '#ffbf73', '#ff9f5a'],
      seed: 11,
    },
    'autostrada-1986': {
      pattern: 'sunset',
      palette: ['#160b2e', '#4a1564', '#ffd36e', '#ff3d8b', '#d14cff'],
    },
    'szklo-i-mgla': {
      pattern: 'orbs',
      palette: ['#7f97ff', '#c9a6ff', '#6cc9d6', '#f4f1ff', '#9d8cff'],
      background: '#d9def5',
      seed: 23,
    },
    'cieple-noce': {
      pattern: 'rings',
      palette: ['#ff5e62', '#3b0d2c', '#ff9966', '#5c1338', '#ffc371'],
      background: '#2a0a20',
      seed: 34,
    },
    'osmy-bit': { pattern: 'pixels', palette: ['#1d2b53', '#29adff', '#ffec27', '#ff77a8'], seed: 45 },
    'linia-33': { pattern: 'transit', palette: ['#12161f', '#2ec4b6', '#f4a259', '#8e7dff'], seed: 56 },
    calming: {
      pattern: 'waves',
      palette: ['#dff3ee', '#b7e4dc', '#84cdc4', '#4fa9a6', '#2d7f87', '#1d5468'],
      seed: 67,
    },
    cattails: { pattern: 'reeds', palette: ['#f3b27a', '#7d4e7a', '#2d1f2f', '#4a2b22'], seed: 78 },
  },
  playlists: {
    'top-sonora': { pattern: 'bars', palette: ['#16121f', '#8b6cff', '#3dd6c6', '#b49bff'], seed: 101 },
    'odkrycia-tygodnia': {
      pattern: 'confetti',
      palette: ['#241a3d', '#8b6cff', '#3dd6c6', '#ffb86b', '#ff6b9a'],
      seed: 102,
    },
    'poranna-kawa': { pattern: 'halftone', palette: ['#f6e3c8', '#7a4b2a', '#ffb45e'] },
    'nocna-jazda': { pattern: 'sunset', palette: ['#06141f', '#0b3a4f', '#9ff3e9', '#2ec4b6', '#2ec4b6'] },
    skupienie: { pattern: 'dots', palette: ['#0f1a2e', '#2e4a7d', '#7fb2ff'], seed: 105 },
    energia: { pattern: 'stripes', palette: ['#ff5e3a', '#ffb13b', '#ff2e63', '#2b1033'], seed: 106 },
    spokoj: {
      pattern: 'orbs',
      palette: ['#3fbfa8', '#b6f0d6', '#2a6f86', '#e3fff3', '#5fa8d3'],
      background: '#0f3438',
      seed: 107,
    },
    nostalgia: {
      pattern: 'rings',
      palette: ['#c97b84', '#3d2c4d', '#e6b89c', '#5b4370'],
      background: '#2a1f38',
      seed: 108,
    },
    nauka: {
      pattern: 'bauhaus',
      palette: ['#f2efe6', '#2f4b8f', '#e4a43b', '#c4513d', '#1e2a3a'],
      seed: 109,
    },
    praca: {
      pattern: 'bauhaus',
      palette: ['#1b1f27', '#5e7bd6', '#3dd6c6', '#e8e4dc', '#8b6cff'],
      seed: 112,
    },
    trening: { pattern: 'chevrons', palette: ['#1a0f14', '#ff4d6d', '#ff8c42', '#ffd166'] },
    relaks: {
      pattern: 'waves',
      palette: ['#efe3ff', '#d4c1ff', '#b49bff', '#8b6cff', '#6648d6', '#3e2a8c'],
      seed: 111,
    },
  },
  artists: {
    'pola-wiatr': { pattern: 'windows', palette: ['#241c3b', '#3a2f5c', '#ffcf8a', '#ffb06b'], seed: 201 },
    okto: { pattern: 'sunset', palette: ['#1c0b33', '#61207a', '#ffe08a', '#ff5fa2', '#ff5fa2'] },
    'mira-halden': {
      pattern: 'orbs',
      palette: ['#8aa0ff', '#e3c2ff', '#7fcfe0', '#ffffff'],
      background: '#cfd7f2',
      seed: 203,
    },
    kaskada: {
      pattern: 'rings',
      palette: ['#ff7a59', '#40112e', '#ffb199', '#6b1a40'],
      background: '#2a0a20',
      seed: 204,
    },
    'bit-brigada': { pattern: 'pixels', palette: ['#29adff', '#1d2b53', '#ffec27', '#ff004d'], seed: 205 },
    'nocny-tramwaj': { pattern: 'transit', palette: ['#0e1219', '#f4a259', '#2ec4b6'], seed: 206 },
    'kevin-macleod': {
      pattern: 'waves',
      palette: ['#fdf0d5', '#f6c89f', '#e59a7a', '#b8677d', '#6d4c74', '#3b3355'],
      seed: 207,
    },
  },
};

const root = fileURLToPath(new URL('../public/covers/', import.meta.url));
let count = 0;
for (const [folder, covers] of Object.entries(COVERS)) {
  await mkdir(`${root}${folder}`, { recursive: true });
  for (const [id, { pattern, ...options }] of Object.entries(covers)) {
    await writeFile(`${root}${folder}/${id}.svg`, patterns[pattern]({ seed: 1, ...options }));
    count++;
  }
}
console.log(`Zapisano ${count} okładek w public/covers`);
