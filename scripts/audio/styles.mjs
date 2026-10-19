// Aranżacje gatunków. Każda funkcja przyjmuje parametry utworu i zwraca gotowy bufor stereo.

import * as I from './instruments.mjs';
import { Song } from './song.mjs';
import { SCALES, chordOnDegree, generateMelody, voiceChord } from './theory.mjs';

/** Rozpisuje sekcje (intro, A, B...) na kolejne takty. */
function layout(sections) {
  const bars = [];
  const starts = {};
  let position = 0;
  for (const section of sections) {
    starts[section.name] = position;
    for (let index = 0; index < section.bars; index++)
      bars.push({ section: section.name, index, length: section.bars });
    position += section.bars;
  }
  return { bars, total: position, start: (name) => starts[name] };
}

function harmony(p, size) {
  const scale = SCALES[p.scale];
  const chords = p.progression.map((degree) => chordOnDegree(scale, degree, size));
  const perChord = p.barsPerChord ?? 1;
  return { scale, chordAt: (bar) => chords[Math.floor(bar / perChord) % chords.length], perChord };
}

/** Prima akordu w podanym przedziale MIDI (dla linii basu). */
function rootIn(key, chord, low) {
  let midi = low + ((((key + chord.root - low) % 12) + 12) % 12);
  if (midi >= low + 12) midi -= 12;
  return midi;
}

function playMelody(song, notes, play, { legato = 0.92, glide = false } = {}) {
  let previous = null;
  for (const n of notes) {
    const time = song.time(n.bar, n.step) + song.humanize(0.004);
    const note = { time, dur: song.steps(n.length) * legato, midi: n.midi, vel: n.vel, pan: 0.05 };
    if (glide && previous && time - (previous.time + previous.dur) < 0.06) note.glideFrom = previous.midi;
    play(note);
    previous = note;
  }
}

const RHYTHMS = {
  lofi: [
    [
      [0, 4],
      [4, 2],
      [6, 6],
      [14, 2],
      [16, 6],
      [24, 8],
    ],
    [
      [2, 2],
      [4, 4],
      [8, 2],
      [10, 6],
      [18, 2],
      [20, 4],
      [24, 6],
    ],
    [
      [0, 6],
      [6, 2],
      [8, 4],
      [12, 4],
      [16, 3],
      [19, 3],
      [22, 10],
    ],
  ],
  synth: [
    [
      [0, 4],
      [4, 4],
      [8, 2],
      [10, 2],
      [12, 4],
      [16, 6],
      [22, 2],
      [24, 8],
    ],
    [
      [0, 2],
      [2, 2],
      [4, 4],
      [8, 4],
      [12, 4],
      [16, 4],
      [20, 4],
      [24, 4],
      [28, 4],
    ],
    [
      [0, 6],
      [6, 2],
      [8, 6],
      [14, 2],
      [16, 8],
      [24, 4],
      [28, 4],
    ],
  ],
  ambient: [
    [
      [0, 8],
      [8, 4],
      [12, 4],
      [16, 16],
    ],
    [
      [0, 4],
      [4, 12],
      [16, 8],
      [24, 8],
    ],
    [
      [0, 12],
      [12, 4],
      [16, 12],
      [28, 4],
    ],
  ],
  house: [
    [
      [0, 2],
      [3, 2],
      [6, 2],
      [10, 2],
      [12, 2],
      [16, 2],
      [19, 2],
      [22, 4],
      [28, 2],
    ],
    [
      [2, 2],
      [6, 2],
      [8, 2],
      [11, 3],
      [14, 2],
      [18, 2],
      [22, 2],
      [24, 2],
      [27, 3],
    ],
  ],
  chip: [
    [
      [0, 2],
      [2, 2],
      [4, 2],
      [6, 2],
      [8, 4],
      [12, 2],
      [14, 2],
      [16, 2],
      [18, 2],
      [20, 4],
      [24, 2],
      [26, 2],
      [28, 4],
    ],
    [
      [0, 3],
      [3, 3],
      [6, 2],
      [8, 2],
      [10, 2],
      [12, 4],
      [16, 3],
      [19, 3],
      [22, 2],
      [24, 8],
    ],
    [
      [0, 4],
      [4, 2],
      [6, 2],
      [8, 4],
      [12, 4],
      [16, 2],
      [18, 2],
      [20, 2],
      [22, 2],
      [24, 6],
      [30, 2],
    ],
  ],
  down: [
    [
      [0, 6],
      [6, 2],
      [8, 8],
      [16, 4],
      [20, 4],
      [24, 8],
    ],
    [
      [2, 4],
      [6, 2],
      [8, 6],
      [18, 4],
      [22, 2],
      [24, 8],
    ],
  ],
};

// ------------------------------------------------------------------ lo-fi

export function lofi(p) {
  const form = layout([
    { name: 'intro', bars: 4 },
    { name: 'A', bars: 8 },
    { name: 'B', bars: 8 },
    { name: 'C', bars: 4 },
    { name: 'outro', bars: 4 },
  ]);
  const song = new Song({ bpm: p.bpm, bars: form.total, seed: p.seed, swing: 0.2, tail: 4 });
  const { rng } = song;
  const { scale, chordAt } = harmony(p, 5);

  const keys = song.bus('keys', {
    reverb: 0.22,
    delay: 0.04,
    lowpass: 5200,
    tremolo: { rate: 3.1, depth: 0.12 },
    wow: 0.0011,
  });
  const bass = song.bus('bass', { gain: 0.62, lowpass: 1200 });
  const drums = song.bus('drums', { gain: 0.72, reverb: 0.05, lowpass: 9500, highpass: 45, saturate: 1.8 });
  const melody = song.bus('melody', { gain: 0.8, reverb: 0.3, delay: 0.22, lowpass: 5200, wow: 0.0011 });
  const texture = song.bus('texture');

  const compPatterns = [
    [
      [0, 7],
      [10, 5],
    ],
    [[0, 14]],
    [
      [0, 5],
      [6, 4],
      [12, 3],
    ],
    [
      [0, 3],
      [3, 11],
    ],
  ];
  const mainComp = compPatterns[p.comp ?? rng.int(0, compPatterns.length - 1)];
  const kickPattern = rng.pick([
    [0, 7, 10],
    [0, 10],
    [0, 3, 10],
  ]);
  let voicing = null;

  for (let bar = 0; bar < form.total; bar++) {
    const { section, index } = form.bars[bar];
    const chord = chordAt(bar);
    voicing = voiceChord(p.key, chord, voicing, 55, 79, { rootless: true });
    const ambientBar = section === 'intro' || section === 'outro';
    const pattern = ambientBar
      ? [[0, 16]]
      : bar % 4 === 3
        ? compPatterns[(bar >> 2) % compPatterns.length]
        : mainComp;
    const isLast = bar === form.total - 1;
    for (const [step, length] of pattern) {
      const base = song.time(bar, step) + song.humanize(0.006);
      voicing.forEach((midi, k) => {
        I.electricPiano(keys, {
          time: base + k * 0.013,
          dur: isLast ? song.barLength * 1.5 : song.steps(length) * 0.95,
          midi,
          vel: rng.range(0.5, 0.64) * (step === 0 ? 1 : 0.85),
          pan: (k - 1.5) * 0.18,
        });
      });
    }

    const groove = section === 'A' || section === 'B' || section === 'C';
    const bassPlays = groove || (section === 'outro' && index < 2);
    if (bassPlays) {
      const root = rootIn(p.key, chord, 40);
      I.subBass(bass, { time: song.time(bar, 0), dur: song.steps(6), midi: root, vel: 0.9 });
      I.subBass(bass, {
        time: song.time(bar, 10),
        dur: song.steps(3),
        midi: rng.chance(0.3) ? root + 7 : root,
        vel: 0.75,
      });
      if (rng.chance(0.35)) {
        const next = rootIn(p.key, chordAt(bar + 1), 40);
        I.subBass(bass, {
          time: song.time(bar, 14),
          dur: song.steps(1.6),
          midi: next + rng.pick([-1, 2]),
          vel: 0.6,
        });
      }
    }

    if (groove) {
      const fill = index === form.bars[bar].length - 1;
      for (const step of kickPattern) {
        I.kick(
          drums,
          { time: song.time(bar, step) + song.humanize(0.004), vel: step === 0 ? 1 : 0.8 },
          {
            start: 125,
            end: 56,
            pitchDecay: 0.03,
            decay: 0.17,
            click: 0.1,
            level: 0.8,
          },
        );
      }
      for (const step of fill ? [4, 12, 13, 15] : [4, 12]) {
        const ghost = step === 13 || step === 15;
        I.snare(drums, { time: song.time(bar, step) + song.humanize(0.006), vel: ghost ? 0.3 : 0.9 }, rng, {
          tone: 190,
          noiseDecay: 0.12,
          highpass: 1500,
          lowpass: 6000,
          toneMix: 0.35,
          level: 0.42,
        });
      }
      for (let step = 0; step < 16; step += 2) {
        I.hat(
          drums,
          { time: song.time(bar, step) + song.humanize(0.005), vel: step % 4 === 0 ? 0.6 : 0.38 },
          rng,
          {
            decay: step === 14 && rng.chance(0.25) ? 0.12 : 0.03,
            highpass: 6500,
            level: 0.17,
          },
        );
        if (rng.chance(0.15))
          I.hat(drums, { time: song.time(bar, step + 1), vel: 0.22 }, rng, { decay: 0.02, level: 0.1 });
      }
    }
  }

  const notes = generateMelody({
    rng,
    startBar: form.start('B'),
    plan: ['A', 'A', 'B', 'A!', 'B', 'A!'],
    rhythms: RHYTHMS.lofi,
    chordAt,
    keyRoot: p.key,
    scale,
    low: 64,
    high: 81,
    velocity: 0.72,
  });
  const instrument = {
    pluck: (n) => I.pluck(melody, n, rng, { brightness: 0.45, sustain: 1.6 }),
    bell: (n) => I.bell(melody, { ...n, midi: n.midi + 12 }, rng, { decay: 1.4, level: 0.09 }),
    flute: (n) =>
      I.lead(melody, n, rng, {
        cutoff: 700,
        envAmount: 700,
        pulseMix: 0,
        vibratoDepth: 0.12,
        attack: 0.05,
        level: 0.11,
      }),
  }[p.lead ?? 'pluck'];
  playMelody(song, notes, instrument, { glide: p.lead === 'flute' });

  I.vinyl(texture, rng, { crackles: 4, hiss: 0.003, level: 0.4 });
  if (p.rain) I.rain(texture, rng, { level: 0.012 });

  return song.render({
    reverb: { room: 0.8, damp: 0.45, gain: 0.9 },
    delay: { feedback: 0.3, cutoff: 2500 },
    targetLufs: -17,
    lowpass: 13000,
    fadeOut: 3.5,
  });
}

// ------------------------------------------------------------------ synthwave

export function synthwave(p) {
  const form = layout([
    { name: 'intro', bars: 4 },
    { name: 'A', bars: 8 },
    { name: 'B', bars: 8 },
    { name: 'break', bars: 4 },
    { name: 'B2', bars: 8 },
    { name: 'outro', bars: 4 },
  ]);
  const song = new Song({ bpm: p.bpm, bars: form.total, seed: p.seed, tail: 4 });
  const { rng } = song;
  const { scale, chordAt, perChord } = harmony(p, 4);

  const padBus = song.bus('pad', { gain: 0.85, reverb: 0.35, chorus: {}, lowpass: 4200 });
  const arpBus = song.bus('arp', { gain: 0.62, reverb: 0.22, delay: 0.32 });
  const bassBus = song.bus('bass', { gain: 1, lowpass: 2600, sidechain: { depth: 0.35, release: 0.15 } });
  const drumBus = song.bus('drums', { gain: 0.85, reverb: 0.1 });
  const snareBus = song.bus('snare', { gain: 0.72, reverb: 0.55 });
  const leadBus = song.bus('lead', { gain: 0.82, reverb: 0.3, delay: 0.3 });

  let voicing = null;
  for (let bar = 0; bar < form.total; bar++) {
    const { section, index } = form.bars[bar];
    const chord = chordAt(bar);
    if (bar % perChord === 0) {
      voicing = voiceChord(p.key, chord, voicing, 52, 74);
      voicing.forEach((midi) =>
        I.pad(
          padBus,
          {
            time: song.time(bar),
            dur: song.barLength * perChord,
            midi,
            vel: section === 'break' ? 0.8 : 0.7,
          },
          rng,
          {
            voices: 3,
            detune: 0.12,
            cutoff: section === 'intro' ? 1100 + index * 300 : 2100,
            attack: section === 'intro' && index === 0 ? 1.8 : 0.25,
            release: 0.9,
            level: 0.1,
          },
        ),
      );
    }

    const arpTones = [...voicing, voicing[0] + 12, voicing[1] + 12].sort((a, b) => a - b);
    const order = [0, 1, 2, 3, 4, 3, 2, 1, 0, 2, 4, 5, 4, 2, 3, 1];
    const arpOn = section !== 'break' || index >= 2;
    if (arpOn) {
      for (let step = 0; step < 16; step++) {
        const fadeIn = section === 'intro' ? (index * 16 + step) / 64 : 1;
        const fadeOut = section === 'outro' ? 1 - (index * 16 + step) / 64 : 1;
        I.pulsePluck(
          arpBus,
          {
            time: song.time(bar, step),
            dur: song.steps(0.9),
            midi: arpTones[order[step] % arpTones.length] + 12,
            vel: (step % 4 === 0 ? 0.85 : 0.6) * fadeIn * fadeOut,
          },
          rng,
          { duty: 0.3, cutoff: 900, envAmount: 2800, envDecay: 0.08, ampDecay: 0.16, level: 0.1 },
        );
      }
    }

    const driving = section === 'A' || section === 'B' || section === 'B2';
    if (driving) {
      const root = rootIn(p.key, chord, 33);
      for (let step = 0; step < 16; step += 2) {
        I.synthBass(
          bassBus,
          {
            time: song.time(bar, step),
            dur: song.steps(1.7),
            midi: root + (step % 4 === 2 ? 12 : 0),
            vel: step === 0 ? 1 : 0.85,
          },
          rng,
          {
            cutoff: 220,
            envAmount: 1600,
            envDecay: 0.09,
            q: 1.3,
            sub: 0.5,
            level: 0.3,
          },
        );
      }
      const fourFloor = section !== 'A';
      for (const step of fourFloor ? [0, 4, 8, 12] : [0, 8, 10]) {
        const time = song.time(bar, step);
        song.kickTimes.push(time);
        I.kick(
          drumBus,
          { time, vel: 1 },
          { start: 165, end: 52, pitchDecay: 0.04, decay: 0.2, click: 0.25, level: 0.85 },
        );
      }
      for (const step of [4, 12]) {
        I.snare(snareBus, { time: song.time(bar, step), vel: 1 }, rng, {
          tone: 200,
          noiseDecay: 0.2,
          highpass: 900,
          toneMix: 0.4,
          level: 0.5,
        });
      }
      for (let step = 0; step < 16; step++) {
        I.hat(drumBus, { time: song.time(bar, step), vel: step % 2 === 0 ? 0.5 : 0.25 }, rng, {
          decay: 0.03,
          level: 0.1,
        });
      }
      if (index === 0) I.crash(drumBus, { time: song.time(bar), vel: 0.9 }, rng, { decay: 1.6, level: 0.1 });
    }
  }

  const leadSettings = { cutoff: 1200, envAmount: 2400, vibratoDepth: 0.18, level: 0.15 };
  for (const [section, plan] of [
    ['B', ['A', 'A', 'B', 'A!']],
    ['break', ['B', 'A!']],
    ['B2', ['A', 'A', 'B', 'A!']],
  ]) {
    const notes = generateMelody({
      rng,
      startBar: form.start(section),
      plan,
      rhythms: section === 'break' ? RHYTHMS.ambient : RHYTHMS.synth,
      chordAt,
      keyRoot: p.key,
      scale,
      low: 67,
      high: 86,
      velocity: section === 'break' ? 0.6 : 0.85,
    });
    playMelody(song, notes, (n) => I.lead(leadBus, n, rng, leadSettings), { glide: true, legato: 0.95 });
  }

  return song.render({
    reverb: { room: 0.88, damp: 0.3 },
    delay: { feedback: 0.4, cutoff: 3000 },
    targetLufs: -16.5,
    fadeOut: 4,
  });
}

// ------------------------------------------------------------------ ambient / neoklasyka

export function ambient(p) {
  const form = layout([
    { name: 'intro', bars: 4 },
    { name: 'A', bars: 8 },
    { name: 'B', bars: 8 },
    { name: 'outro', bars: 4 },
  ]);
  const song = new Song({ bpm: p.bpm, bars: form.total, seed: p.seed, tail: 7 });
  const { rng } = song;
  const { scale, chordAt, perChord } = harmony(p, 4);
  const variant = p.variant ?? 'piano';

  const pianoBus = song.bus('piano', { reverb: 0.45, delay: 0.06, lowpass: 7000 });
  const padBus = song.bus('pad', { gain: variant === 'drone' ? 0.9 : 0.62, reverb: 0.6, lowpass: 2600 });
  const bellBus = song.bus('bells', { gain: 0.55, reverb: 0.7, delay: 0.4 });
  const lowBus = song.bus('low', { gain: 0.6, reverb: 0.3, lowpass: 400 });

  let voicing = null;
  for (let bar = 0; bar < form.total; bar++) {
    const { section, index } = form.bars[bar];
    const chord = chordAt(bar);
    const chordStart = bar % perChord === 0;
    if (chordStart) voicing = voiceChord(p.key, chord, voicing, 55, 76);
    const chordLength = song.barLength * perChord;
    const root = rootIn(p.key, chord, 36);

    // Plama i niski dźwięk: w intro tylko w wariantach bez fortepianu.
    const padOn = variant !== 'piano' || section === 'B' || section === 'outro';
    if (chordStart && padOn) {
      voicing.forEach((midi) =>
        I.pad(padBus, { time: song.time(bar), dur: chordLength, midi, vel: 0.6 }, rng, {
          voices: variant === 'strings' ? 4 : 2,
          detune: 0.1,
          wave: variant === 'drone' ? 'triangle' : 'saw',
          cutoff: variant === 'strings' ? 1500 : 1100,
          attack: 2.2,
          release: 2.5,
          lfoRate: 0.06,
          lfoDepth: 0.35,
          level: variant === 'drone' ? 0.16 : 0.09,
        }),
      );
      I.pad(lowBus, { time: song.time(bar), dur: chordLength, midi: root, vel: 0.7 }, rng, {
        voices: 1,
        wave: 'sine',
        attack: 2,
        release: 2.5,
        lfoDepth: 0,
        level: 0.35,
      });
    }

    if (variant === 'piano' || variant === 'strings') {
      const lowNote = rootIn(p.key, chord, 38);
      const fading = section === 'outro' ? 1 - index / 5 : 1;
      if (variant === 'piano' || section !== 'intro') {
        I.piano(
          pianoBus,
          {
            time: song.time(bar) + song.humanize(0.01),
            dur: song.barLength * 0.98,
            midi: lowNote,
            vel: 0.55 * fading,
            pan: -0.25,
          },
          rng,
        );
      }
      if (variant === 'piano' && section !== 'outro') {
        const tones = [...voicing, voicing[1] + 12];
        const pattern = [2, 4, 6, 8, 10, 12, 14];
        pattern.forEach((step, k) => {
          const midi = tones[(k + (bar % 2)) % tones.length];
          I.piano(
            pianoBus,
            {
              time: song.time(bar, step) + song.humanize(0.012),
              dur: song.barLength - song.steps(step) + song.steps(2),
              midi,
              vel: rng.range(0.32, 0.45) * (k === 0 ? 1.15 : 1),
              pan: (midi - 66) / 30,
            },
            rng,
          );
        });
      }
    }

    if (variant === 'glass' && section !== 'intro') {
      const tones = [...voicing, voicing[0] + 12, voicing[2] + 12];
      for (let step = 0; step < 16; step += 2) {
        const midi = tones[(step / 2 + bar) % tones.length] + 12;
        I.bell(
          bellBus,
          {
            time: song.time(bar, step),
            dur: 0.1,
            midi,
            vel: rng.range(0.35, 0.55) * (section === 'outro' ? 0.6 : 1),
            pan: rng.range(-0.6, 0.6),
          },
          rng,
          { decay: 1.8, level: 0.07 },
        );
      }
    }

    if (variant === 'drone' && section !== 'intro') {
      // Pojedyncze dzwonki w losowych chwilach, zawsze na dźwiękach akordu.
      const hits = rng.int(1, 3);
      for (let h = 0; h < hits; h++) {
        const midi = voicing[rng.int(0, voicing.length - 1)] + 12 * rng.int(1, 2);
        I.bell(
          bellBus,
          {
            time: song.time(bar, rng.int(0, 7) * 2),
            dur: 0.1,
            midi,
            vel: rng.range(0.3, 0.6),
            pan: rng.range(-0.7, 0.7),
          },
          rng,
          { decay: 3, level: 0.1 },
        );
      }
    }
  }

  const melodyAt = variant === 'drone' ? null : form.start('B');
  if (melodyAt !== null) {
    const notes = generateMelody({
      rng,
      startBar: melodyAt,
      plan: ['A', 'A', 'B', 'A!'],
      rhythms: RHYTHMS.ambient,
      chordAt,
      keyRoot: p.key,
      scale,
      low: 72,
      high: 88,
      velocity: 0.5,
    });
    const play =
      variant === 'glass'
        ? (n) =>
            I.pad(padBus, { ...n, dur: n.dur * 1.1 }, rng, {
              voices: 2,
              wave: 'sine',
              attack: 0.4,
              release: 1.5,
              lfoDepth: 0,
              level: 0.12,
            })
        : (n) => I.piano(pianoBus, { ...n, pan: 0.2 }, rng);
    playMelody(song, notes, play, { legato: 1 });
  }

  return song.render({
    reverb: { room: 0.93, damp: 0.25, gain: 1.1 },
    delay: { feedback: 0.45, cutoff: 2800 },
    targetLufs: -18.5,
    fadeIn: 1.2,
    fadeOut: 6,
  });
}

// ------------------------------------------------------------------ house

export function house(p) {
  const form = layout([
    { name: 'intro', bars: 8 },
    { name: 'A', bars: 8 },
    { name: 'break', bars: 4 },
    { name: 'B', bars: 8 },
    { name: 'outro', bars: 4 },
  ]);
  const song = new Song({ bpm: p.bpm, bars: form.total, seed: p.seed, tail: 3 });
  const { rng } = song;
  const { scale, chordAt } = harmony(p, 5);
  const introEnd = form.start('A') * song.barLength;

  const kickBus = song.bus('kick', { gain: 1 });
  const drumBus = song.bus('drums', { gain: 0.8, reverb: 0.05 });
  const chordBus = song.bus('chords', {
    gain: 1.05,
    reverb: 0.25,
    delay: 0.15,
    chorus: {},
    sidechain: { depth: 0.55, release: 0.16 },
    // Filtr stopniowo otwiera się w intro: klasyczne narastanie w house.
    lowpass: (t) => (t < introEnd ? 450 * 2 ** ((t / introEnd) * 3.8) : 7000),
  });
  const padBus = song.bus('pad', {
    gain: 0.55,
    reverb: 0.4,
    lowpass: 3000,
    sidechain: { depth: 0.6, release: 0.2 },
  });
  const bassBus = song.bus('bass', { gain: 0.95, sidechain: { depth: 0.3, release: 0.1 } });
  const pluckBus = song.bus('pluck', {
    gain: 0.85,
    reverb: 0.25,
    delay: 0.3,
    sidechain: { depth: 0.3, release: 0.12 },
  });
  const fxBus = song.bus('fx', { reverb: 0.4 });

  const stabPatterns = [
    [
      [0, 2],
      [3, 2],
      [6, 2],
      [10, 3],
    ],
    [
      [2, 1],
      [6, 2],
      [10, 1],
      [14, 2],
    ],
    [
      [0, 3],
      [7, 2],
      [10, 2],
    ],
  ];
  const stabs = stabPatterns[p.stabs ?? rng.int(0, stabPatterns.length - 1)];
  let voicing = null;

  for (let bar = 0; bar < form.total; bar++) {
    const { section, index } = form.bars[bar];
    const chord = chordAt(bar);
    voicing = voiceChord(p.key, chord, voicing, 53, 75, { rootless: true });

    if (section !== 'break') {
      for (const [step, length] of stabs) {
        voicing.forEach((midi) =>
          I.pad(
            chordBus,
            { time: song.time(bar, step), dur: song.steps(length) * 0.9, midi, vel: 0.75 },
            rng,
            {
              voices: 2,
              detune: 0.06,
              cutoff: 3200,
              q: 1,
              attack: 0.004,
              release: 0.14,
              lfoDepth: 0,
              level: 0.16,
            },
          ),
        );
      }
    }
    if (section === 'break' || section === 'B') {
      voicing.forEach((midi) =>
        I.pad(padBus, { time: song.time(bar), dur: song.barLength, midi, vel: 0.6 }, rng, {
          voices: 3,
          cutoff: 1500,
          attack: 0.6,
          release: 1.2,
          level: 0.1,
        }),
      );
    }

    const hasKick = section !== 'break';
    if (hasKick) {
      for (const step of [0, 4, 8, 12]) {
        const time = song.time(bar, step);
        song.kickTimes.push(time);
        I.kick(
          kickBus,
          { time, vel: 1 },
          { start: 145, end: 54, pitchDecay: 0.03, decay: 0.19, click: 0.35, level: 0.9 },
        );
      }
      for (let step = 0; step < 16; step++) {
        I.hat(drumBus, { time: song.time(bar, step), vel: [0.4, 0.2, 0.3, 0.2][step % 4] }, rng, {
          decay: 0.02,
          level: 0.1,
        });
      }
    }
    const full = section === 'A' || section === 'B';
    if (full) {
      for (const step of [4, 12])
        I.clap(drumBus, { time: song.time(bar, step), vel: 0.9 }, rng, { level: 0.42 });
      for (const step of [2, 6, 10, 14])
        I.hat(drumBus, { time: song.time(bar, step), vel: 0.85 }, rng, {
          open: true,
          decay: 0.09,
          level: 0.14,
        });
      if (index % 2 === 1) I.rim(drumBus, { time: song.time(bar, 7), vel: 0.7 });
      const root = rootIn(p.key, chord, 36);
      for (const step of [2, 6, 10, 14]) {
        const midi = step === 14 && rng.chance(0.4) ? root + 12 : root;
        I.synthBass(bassBus, { time: song.time(bar, step), dur: song.steps(1.6), midi, vel: 0.9 }, rng, {
          cutoff: 200,
          envAmount: 900,
          envDecay: 0.08,
          q: 1.2,
          sub: 0.8,
          level: 0.34,
        });
      }
      if (index === 0) I.crash(drumBus, { time: song.time(bar), vel: 0.8 }, rng, { decay: 1.4, level: 0.09 });
    }
    if (section === 'B') {
      for (let step = 0; step < 16; step++)
        I.shaker(drumBus, { time: song.time(bar, step), vel: step % 2 ? 0.6 : 1 }, rng);
    }
  }

  I.riser(fxBus, { time: song.time(form.start('break') + 2), dur: song.barLength * 2 }, rng, { level: 0.06 });

  const notes = generateMelody({
    rng,
    startBar: form.start('B'),
    plan: ['A', 'A', 'B', 'A!'],
    rhythms: RHYTHMS.house,
    chordAt,
    keyRoot: p.key,
    scale,
    low: 67,
    high: 84,
    velocity: 0.8,
  });
  playMelody(song, notes, (n) =>
    I.pulsePluck(pluckBus, n, rng, {
      duty: 0.5,
      cutoff: 1200,
      envAmount: 3000,
      envDecay: 0.1,
      ampDecay: 0.18,
      level: 0.12,
    }),
  );

  return song.render({
    reverb: { room: 0.82, damp: 0.4 },
    delay: { feedback: 0.35, cutoff: 3500 },
    targetLufs: -16.5,
    fadeOut: 3,
  });
}

// ------------------------------------------------------------------ chiptune

export function chiptune(p) {
  const form = layout([
    { name: 'intro', bars: 2 },
    { name: 'A', bars: 8 },
    { name: 'B', bars: 8 },
    { name: 'A2', bars: 8 },
    { name: 'C', bars: 8 },
    { name: 'outro', bars: 2 },
  ]);
  const song = new Song({ bpm: p.bpm, bars: form.total, seed: p.seed, tail: 2 });
  const { rng } = song;
  const { scale, chordAt } = harmony(p, 3);

  const leadBus = song.bus('lead', { reverb: 0.08, delay: 0.1 });
  const echoBus = song.bus('echo', { gain: 0.5 });
  const arpBus = song.bus('arp', { gain: 0.6, reverb: 0.05 });
  const bassBus = song.bus('bass');
  const noiseBus = song.bus('noise', { gain: 0.8 });

  for (let bar = 0; bar < form.total; bar++) {
    const { section } = form.bars[bar];
    const chord = chordAt(bar);
    const triad = voiceChord(p.key, chord, null, 69, 84);
    const arpOn = section === 'intro' || section === 'B' || section === 'C' || section === 'outro';
    if (arpOn) {
      // Szybkie arpeggio w 32-kach zamiast akordu: typowy chwyt z czasów 8-bit.
      for (let half = 0; half < 32; half++) {
        I.chipSquare(
          arpBus,
          {
            time: song.time(bar, half / 2),
            dur: song.steps(0.45),
            midi: triad[half % triad.length],
            vel: 0.9,
          },
          {
            duty: 0.125,
            level: 0.04,
            sustain: 1,
          },
        );
      }
    }
    if (section !== 'intro' && section !== 'outro') {
      const root = rootIn(p.key, chord, 36);
      for (let step = 0; step < 16; step += 2) {
        const midi = step % 4 === 2 ? root + 12 : step === 12 ? root + 7 : root;
        I.chipTriangle(bassBus, { time: song.time(bar, step), dur: song.steps(1.7), midi }, { level: 0.32 });
      }
      for (const step of section === 'C' ? [0, 6, 8, 14] : [0, 8, 10]) {
        I.kick(
          noiseBus,
          { time: song.time(bar, step), vel: 1 },
          { start: 220, end: 60, pitchDecay: 0.02, decay: 0.07, click: 0, drive: 1, level: 0.45 },
        );
        I.chipNoise(noiseBus, { time: song.time(bar, step), vel: 1 }, rng, {
          hold: 12,
          decay: 0.02,
          level: 0.16,
        });
      }
      for (const step of [4, 12])
        I.chipNoise(noiseBus, { time: song.time(bar, step), vel: 1 }, rng, {
          hold: 3,
          decay: 0.07,
          level: 0.17,
        });
      for (let step = 2; step < 16; step += 4)
        I.chipNoise(noiseBus, { time: song.time(bar, step), vel: 0.8, pan: 0.2 }, rng, {
          hold: 1,
          decay: 0.015,
          level: 0.07,
        });
    }
  }
  const finalChord = voiceChord(p.key, chordOnDegree(scale, 0, 3), null, 60, 76);
  finalChord.forEach((midi) =>
    I.chipSquare(
      leadBus,
      { time: song.time(form.total - 2), dur: song.barLength * 1.5, midi, vel: 0.7 },
      { duty: 0.25, level: 0.06, sustain: 0.5 },
    ),
  );

  const theme = generateMelody({
    rng,
    startBar: form.start('A'),
    plan: ['A', 'A', 'B', 'A!'],
    rhythms: RHYTHMS.chip,
    chordAt,
    keyRoot: p.key,
    scale,
    low: 72,
    high: 88,
    velocity: 0.9,
  });
  const bridge = generateMelody({
    rng,
    startBar: form.start('B'),
    plan: ['A', 'B', 'A', 'B!'],
    rhythms: RHYTHMS.chip,
    chordAt,
    keyRoot: p.key,
    scale,
    low: 76,
    high: 91,
    velocity: 0.85,
  });
  const coda = generateMelody({
    rng,
    startBar: form.start('C'),
    plan: ['A', 'A', 'B', 'A!'],
    rhythms: RHYTHMS.ambient,
    chordAt,
    keyRoot: p.key,
    scale,
    low: 69,
    high: 84,
    velocity: 0.8,
  });
  // Powtórzenie tematu w A2: w muzyce z gier powtarzalność jest zaletą.
  const shift = form.start('A2') - form.start('A');
  const all = [...theme, ...bridge, ...theme.map((n) => ({ ...n, bar: n.bar + shift })), ...coda];
  playMelody(
    song,
    all,
    (n) => {
      I.chipSquare(leadBus, n, { duty: 0.25, vibrato: 0.15, level: 0.085 });
      I.chipSquare(
        echoBus,
        { ...n, time: n.time + song.steps(3), vel: n.vel * 0.5, pan: 0.45 },
        { duty: 0.125, level: 0.07 },
      );
    },
    { legato: 0.85 },
  );

  return song.render({
    reverb: { room: 0.5, damp: 0.5, gain: 0.3 },
    delay: { feedback: 0.2 },
    targetLufs: -17,
    lowpass: 11000,
    fadeOut: 1.5,
  });
}

// ------------------------------------------------------------------ downtempo

export function downtempo(p) {
  const form = layout([
    { name: 'intro', bars: 4 },
    { name: 'A', bars: 8 },
    { name: 'B', bars: 8 },
    { name: 'outro', bars: 4 },
  ]);
  const song = new Song({ bpm: p.bpm, bars: form.total, seed: p.seed, swing: 0.14, tail: 5 });
  const { rng } = song;
  const { scale, chordAt } = harmony(p, 5);

  const keys = song.bus('keys', {
    reverb: 0.3,
    lowpass: 5600,
    tremolo: { rate: 2.6, depth: 0.2 },
    wow: 0.0009,
  });
  const padBus = song.bus('pad', { gain: 0.5, reverb: 0.5, lowpass: 1800 });
  const drums = song.bus('drums', { gain: 0.78, reverb: 0.12, lowpass: 8000, highpass: 45, saturate: 2.2 });
  const bassBus = song.bus('bass', { gain: 0.62 });
  const melodyBus = song.bus('melody', { gain: 0.85, reverb: 0.3, delay: 0.35, lowpass: 4500 });
  const texture = song.bus('texture');

  let voicing = null;
  let previousRoot;
  for (let bar = 0; bar < form.total; bar++) {
    const { section, index } = form.bars[bar];
    const chord = chordAt(bar);
    voicing = voiceChord(p.key, chord, voicing, 53, 77, { rootless: true });
    const last = bar === form.total - 1;

    const hits =
      section === 'intro' || section === 'outro'
        ? [[0, 16]]
        : rng.chance(0.4)
          ? [
              [0, 10],
              [11, 5],
            ]
          : [[0, 15]];
    for (const [step, length] of hits) {
      voicing.forEach((midi, k) =>
        I.electricPiano(keys, {
          time: song.time(bar, step) + k * 0.015,
          dur: last ? song.barLength * 1.6 : song.steps(length) * 0.95,
          midi,
          vel: rng.range(0.5, 0.62),
          pan: (k - 1.5) * 0.2,
        }),
      );
    }
    if (section !== 'intro') {
      voicing.forEach((midi) =>
        I.pad(padBus, { time: song.time(bar), dur: song.barLength, midi, vel: 0.5 }, rng, {
          voices: 2,
          wave: 'triangle',
          attack: 0.8,
          release: 1.4,
          level: 0.12,
        }),
      );
    }

    const groove = section === 'A' || section === 'B';
    if (groove || (section === 'outro' && index < 2)) {
      const root = rootIn(p.key, chord, 38);
      I.subBass(
        bassBus,
        {
          time: song.time(bar),
          dur: song.barLength * 0.9,
          midi: root,
          vel: 0.9,
          glideFrom: previousRoot !== root ? previousRoot : undefined,
        },
        { glide: 0.09 },
      );
      previousRoot = root;
    }
    if (groove) {
      const kicks = rng.chance(0.3) ? [0, 7, 10] : [0, 10];
      for (const step of kicks)
        I.kick(
          drums,
          { time: song.time(bar, step) + song.humanize(0.004), vel: step === 0 ? 1 : 0.8 },
          { start: 115, end: 52, decay: 0.2, click: 0.15, level: 0.85 },
        );
      for (const step of [4, 12])
        I.snare(drums, { time: song.time(bar, step) + song.humanize(0.005), vel: 0.95 }, rng, {
          tone: 175,
          noiseDecay: 0.15,
          highpass: 1100,
          lowpass: 5000,
          level: 0.45,
        });
      for (const step of [7, 9, 15]) {
        if (rng.chance(0.55))
          I.snare(drums, { time: song.time(bar, step), vel: rng.range(0.15, 0.3) }, rng, {
            tone: 175,
            noiseDecay: 0.08,
            highpass: 1500,
            level: 0.4,
          });
      }
      for (let step = 0; step < 16; step++) {
        I.hat(
          drums,
          { time: song.time(bar, step) + song.humanize(0.004), vel: [0.45, 0.2, 0.35, 0.2][step % 4] },
          rng,
          { decay: 0.028, highpass: 7000, level: 0.16 },
        );
      }
    }
  }

  const notes = generateMelody({
    rng,
    startBar: form.start('B'),
    plan: ['A', 'A', 'B', 'A!'],
    rhythms: RHYTHMS.down,
    chordAt,
    keyRoot: p.key,
    scale,
    low: 62,
    high: 79,
    velocity: 0.75,
  });
  playMelody(song, notes, (n) => I.pluck(melodyBus, n, rng, { brightness: 0.4, sustain: 2.2 }));
  I.vinyl(texture, rng, { crackles: 5, hiss: 0.003, level: 0.5 });

  return song.render({
    reverb: { room: 0.85, damp: 0.45 },
    delay: { time: song.beat * 0.75, feedback: 0.42, cutoff: 2200 },
    targetLufs: -17,
    lowpass: 12500,
    fadeOut: 3.5,
  });
}
