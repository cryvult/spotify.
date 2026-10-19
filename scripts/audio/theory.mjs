// Teoria muzyki dla generatora: skale, akordy, prowadzenie głosów i melodie oparte na motywach.

export const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
};

/**
 * Akord zbudowany tercjami na danym stopniu skali.
 * Zwraca interwały względem toniki oraz interwał prymy akordu.
 */
export function chordOnDegree(scale, degree, size = 4) {
  const tones = [];
  for (let j = 0; j < size; j++) {
    const index = degree + j * 2;
    tones.push(scale[index % 7] + 12 * Math.floor(index / 7));
  }
  return { root: scale[degree % 7], tones };
}

const pitchClass = (midi) => ((midi % 12) + 12) % 12;

/**
 * Wybiera przewrót akordu najbliższy poprzedniemu brzmieniu (płynne prowadzenie głosów).
 * `rootless` pomija prymę, jak w jazzowych układach pianina elektrycznego.
 */
export function voiceChord(keyRoot, chord, previous, low, high, { rootless = false } = {}) {
  let classes = chord.tones.map((interval) => pitchClass(keyRoot + interval));
  if (rootless && classes.length > 3) classes = classes.slice(1);
  const candidates = [];
  for (let rotation = 0; rotation < classes.length; rotation++) {
    const ordered = [...classes.slice(rotation), ...classes.slice(0, rotation)];
    for (let base = low - 12; base <= high; base += 12) {
      const notes = [];
      let current = base + ordered[0];
      notes.push(current);
      for (let k = 1; k < ordered.length; k++) {
        let next = Math.floor(current / 12) * 12 + ordered[k];
        while (next <= current) next += 12;
        notes.push(next);
        current = next;
      }
      if (notes[0] >= low && notes[notes.length - 1] <= high) candidates.push(notes);
    }
  }
  if (candidates.length === 0) return classes.map((pc) => low + pc);
  const center = previous ? previous.reduce((a, b) => a + b, 0) / previous.length : (low + high) / 2;
  const score = (notes) => {
    if (previous && previous.length === notes.length) {
      return notes.reduce((sum, note, index) => sum + Math.abs(note - previous[index]), 0);
    }
    return Math.abs(notes.reduce((a, b) => a + b, 0) / notes.length - center) * notes.length;
  };
  return candidates.reduce((best, notes) => (score(notes) < score(best) ? notes : best));
}

/** Wszystkie dźwięki skali w podanym zakresie MIDI. */
export function scaleRange(keyRoot, scale, low, high) {
  const result = [];
  for (let midi = low; midi <= high; midi++) {
    if (scale.includes(pitchClass(midi - keyRoot))) result.push(midi);
  }
  return result;
}

export function isChordTone(midi, keyRoot, chord) {
  return chord.tones.some((interval) => pitchClass(keyRoot + interval) === pitchClass(midi));
}

function nearestIndex(allowed, midi) {
  let best = 0;
  for (let i = 1; i < allowed.length; i++) {
    if (Math.abs(allowed[i] - midi) < Math.abs(allowed[best] - midi)) best = i;
  }
  return best;
}

function nearestChordToneIndex(allowed, midi, keyRoot, chord, rng) {
  const options = [];
  allowed.forEach((note, index) => {
    if (isChordTone(note, keyRoot, chord) && Math.abs(note - midi) <= 7) options.push(index);
  });
  if (options.length === 0) return nearestIndex(allowed, midi);
  options.sort((a, b) => Math.abs(allowed[a] - midi) - Math.abs(allowed[b] - midi));
  // Zwykle najbliższy dźwięk akordu, czasem drugi najbliższy: melodia nie stoi w miejscu.
  return rng.chance(0.3) && options.length > 1 ? options[1] : options[0];
}

/**
 * Melodia budowana z dwutaktowych motywów (np. plan A A B A).
 * rhythms: lista szablonów [krok16, długość16] dla dwóch taktów (32 kroki).
 * chordAt(bar) zwraca akord obowiązujący w danym takcie.
 */
export function generateMelody({
  rng,
  startBar,
  plan,
  rhythms,
  chordAt,
  keyRoot,
  scale,
  low,
  high,
  velocity = 0.8,
}) {
  const allowed = scaleRange(keyRoot, scale, low, high);
  const center = (low + high) / 2;
  const motifs = new Map();
  const notes = [];
  let previousMidi = allowed[nearestIndex(allowed, center)];

  const createMotif = (bar, registerShift) => {
    const rhythm = rng.pick(rhythms);
    const indices = [];
    let index = nearestChordToneIndex(allowed, previousMidi + registerShift, keyRoot, chordAt(bar), rng);
    rhythm.forEach(([step, length], position) => {
      const chord = chordAt(bar + Math.floor(step / 16));
      const strong = step % 8 === 0 || length >= 6;
      if (position > 0) {
        if (strong) {
          index = nearestChordToneIndex(allowed, allowed[index], keyRoot, chord, rng);
        } else {
          // Ruch krokowy z lekką tendencją powrotu do środka skali.
          const towardCenter =
            allowed[index] > center + 4 ? -1 : allowed[index] < center - 4 ? 1 : rng.sign();
          const direction = rng.chance(0.7) ? towardCenter : -towardCenter;
          index += direction * rng.pick([1, 1, 1, 2, 2, 3]);
        }
      }
      index = Math.max(0, Math.min(allowed.length - 1, index));
      indices.push(index);
    });
    return { rhythm, indices };
  };

  plan.forEach((label, blockIndex) => {
    const bar = startBar + blockIndex * 2;
    const base = label.replace(/[^A-Z]/g, '');
    const cadence = label.endsWith('!');
    if (!motifs.has(base)) motifs.set(base, createMotif(bar, base === 'B' ? 4 : 0));
    const motif = motifs.get(base);
    // Przesunięcie motywu tak, aby pierwsza nuta pasowała do nowego akordu.
    const firstTarget = nearestChordToneIndex(allowed, allowed[motif.indices[0]], keyRoot, chordAt(bar), rng);
    const shift = blockIndex === 0 ? 0 : firstTarget - motif.indices[0];
    motif.rhythm.forEach(([step, length], position) => {
      const chord = chordAt(bar + Math.floor(step / 16));
      let index = Math.max(0, Math.min(allowed.length - 1, motif.indices[position] + shift));
      const strong = step % 8 === 0 || length >= 6;
      if (strong && !isChordTone(allowed[index], keyRoot, chord)) {
        index = nearestChordToneIndex(allowed, allowed[index], keyRoot, chord, { chance: () => false });
      }
      const last = position === motif.rhythm.length - 1;
      if (last && cadence) {
        // Zakończenie frazy na tonice daje poczucie domknięcia.
        const tonicOptions = allowed
          .map((note, i) => ({ note, i }))
          .filter(({ note }) => pitchClass(note - keyRoot) === 0);
        if (tonicOptions.length > 0) {
          index = tonicOptions.reduce((best, option) =>
            Math.abs(option.note - allowed[index]) < Math.abs(best.note - allowed[index]) ? option : best,
          ).i;
        }
      }
      const accent = step % 4 === 0 ? 1 : 0.85;
      notes.push({
        bar: bar + Math.floor(step / 16),
        step: step % 16,
        length,
        midi: allowed[index],
        vel: velocity * accent,
      });
      previousMidi = allowed[index];
    });
  });
  return notes;
}
