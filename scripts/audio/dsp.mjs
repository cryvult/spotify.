// Podstawowe narzędzia DSP używane przez generator utworów demonstracyjnych.
// Wszystko liczymy samodzielnie na tablicach Float32Array, bez zewnętrznych bibliotek.

export const SR = 44100;
export const TWO_PI = Math.PI * 2;

/** Deterministyczny generator liczb losowych (mulberry32): ten sam seed = ten sam utwór. */
export function createRng(seed) {
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
    int: (min, max) => Math.floor(min + (max - min + 1) * next()),
    pick: (items) => items[Math.floor(next() * items.length)],
    chance: (probability) => next() < probability,
    sign: () => (next() < 0.5 ? -1 : 1),
  };
}

export const mtof = (midi) => 440 * 2 ** ((midi - 69) / 12);
export const dbToGain = (db) => 10 ** (db / 20);
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function createStereo(length) {
  return { L: new Float32Array(length), R: new Float32Array(length), length };
}

/** Panorama o stałej mocy: -1 = lewo, 0 = środek, 1 = prawo. */
export function panGains(pan = 0) {
  const angle = ((clamp(pan, -1, 1) + 1) * Math.PI) / 4;
  return [Math.cos(angle), Math.sin(angle)];
}

/** Korekta PolyBLEP ogranicza aliasing w falach piłokształtnych i prostokątnych. */
function polyBlep(t, dt) {
  if (t < dt) {
    const x = t / dt;
    return x + x - x * x - 1;
  }
  if (t > 1 - dt) {
    const x = (t - 1) / dt;
    return x * x + x + x + 1;
  }
  return 0;
}

export function saw(phase, dt) {
  return 2 * phase - 1 - polyBlep(phase, dt);
}

export function pulse(phase, dt, duty = 0.5) {
  let value = phase < duty ? 1 : -1;
  value += polyBlep(phase, dt);
  let shifted = phase - duty;
  if (shifted < 0) shifted += 1;
  value -= polyBlep(shifted, dt);
  return value;
}

export function triangle(phase) {
  return 1 - 4 * Math.abs(phase - 0.5);
}

/** Filtr zmiennych stanu (topologia TPT): stabilny także przy szybkiej automatyzacji. */
export class Svf {
  constructor(cutoff = 1000, q = 0.707) {
    this.ic1 = 0;
    this.ic2 = 0;
    this.bp = 0;
    this.hp = 0;
    this.set(cutoff, q);
  }

  set(cutoff, q = 0.707) {
    const fc = clamp(cutoff, 10, SR * 0.45);
    const g = Math.tan((Math.PI * fc) / SR);
    this.k = 1 / q;
    this.a1 = 1 / (1 + g * (g + this.k));
    this.a2 = g * this.a1;
    this.a3 = g * this.a2;
  }

  /** Zwraca wyjście dolnoprzepustowe; pasmowe i górnoprzepustowe trafiają do this.bp i this.hp. */
  run(input) {
    const v3 = input - this.ic2;
    const v1 = this.a1 * this.ic1 + this.a2 * v3;
    const v2 = this.ic2 + this.a2 * this.ic1 + this.a3 * v3;
    this.ic1 = 2 * v1 - this.ic1;
    this.ic2 = 2 * v2 - this.ic2;
    this.bp = v1;
    this.hp = input - this.k * v1 - v2;
    return v2;
  }
}

export class OnePole {
  constructor(cutoff) {
    this.z = 0;
    this.set(cutoff);
  }

  set(cutoff) {
    this.a = Math.exp((-TWO_PI * cutoff) / SR);
  }

  run(input) {
    this.z = input * (1 - this.a) + this.z * this.a;
    return this.z;
  }
}

/**
 * Obwiednia ADSR. `gate` to czas trzymania nuty, `decay` i `release` to stałe czasowe
 * zaniku wykładniczego (po ok. 5 stałych dźwięk jest praktycznie cichy).
 */
export function adsr(t, gate, attack, decay, sustain, release) {
  if (t < 0) return 0;
  const levelAt = (time) =>
    time < attack ? time / attack : sustain + (1 - sustain) * Math.exp(-(time - attack) / decay);
  if (t <= gate) return levelAt(t);
  return levelAt(gate) * Math.exp(-(t - gate) / release);
}

/** Filtruje bufor stereo w miejscu. `cutoff` może być liczbą albo funkcją czasu (automatyzacja). */
export function filterStereo(buffer, type, cutoff, q = 0.707) {
  for (const channel of [buffer.L, buffer.R]) {
    const filter = new Svf(typeof cutoff === 'function' ? cutoff(0) : cutoff, q);
    for (let i = 0; i < channel.length; i++) {
      if (typeof cutoff === 'function' && i % 64 === 0) filter.set(cutoff(i / SR), q);
      const low = filter.run(channel[i]);
      channel[i] = type === 'lowpass' ? low : type === 'highpass' ? filter.hp : filter.bp;
    }
  }
}

export function saturateStereo(buffer, drive) {
  const norm = Math.tanh(drive);
  for (const channel of [buffer.L, buffer.R]) {
    for (let i = 0; i < channel.length; i++) channel[i] = Math.tanh(channel[i] * drive) / norm;
  }
}

/** Linia opóźniająca modulowana LFO: chorus (mix < 1) albo „falowanie taśmy” (mix = 1). */
export function modulatedDelay(buffer, { rate = 0.3, depth = 0.002, base = 0.01, mix = 0.5, flutter = 0 }) {
  const size = Math.ceil((base + depth * 2 + 0.01) * SR);
  const channels = [buffer.L, buffer.R];
  channels.forEach((channel, channelIndex) => {
    const line = new Float32Array(size);
    let write = 0;
    const phaseOffset = channelIndex * (Math.PI / 2);
    for (let i = 0; i < channel.length; i++) {
      const t = i / SR;
      const dry = channel[i];
      line[write] = dry;
      const lfo = Math.sin(TWO_PI * rate * t + phaseOffset) + flutter * Math.sin(TWO_PI * 6.3 * t);
      const delaySamples = (base + depth * lfo) * SR;
      let read = write - delaySamples;
      while (read < 0) read += size;
      const index = Math.floor(read);
      const frac = read - index;
      const a = line[index];
      const b = line[(index + 1) % size];
      const wet = a + (b - a) * frac;
      channel[i] = dry * (1 - mix) + wet * mix;
      write = (write + 1) % size;
    }
  });
}

/** Pogłos typu Freeverb (8 filtrów grzebieniowych + 4 wszechprzepustowe na kanał). */
export function reverb(input, { room = 0.84, damp = 0.3, width = 1, preDelay = 0.012 } = {}) {
  const scale = SR / 44100;
  const combTuning = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const allpassTuning = [556, 441, 341, 225];
  const spread = 23;
  const output = createStereo(input.length);
  const pre = Math.round(preDelay * SR);

  for (let channelIndex = 0; channelIndex < 2; channelIndex++) {
    const offset = channelIndex === 0 ? 0 : spread;
    const combs = combTuning.map((length) => ({
      buffer: new Float32Array(Math.round((length + offset) * scale)),
      index: 0,
      store: 0,
    }));
    const allpasses = allpassTuning.map((length) => ({
      buffer: new Float32Array(Math.round((length + offset) * scale)),
      index: 0,
    }));
    const target = channelIndex === 0 ? output.L : output.R;
    const damp2 = 1 - damp;

    for (let i = 0; i < input.length; i++) {
      const source = i - pre;
      const dry = source >= 0 ? (input.L[source] + input.R[source]) * 0.015 : 0;
      let sum = 0;
      for (const comb of combs) {
        const value = comb.buffer[comb.index];
        comb.store = value * damp2 + comb.store * damp;
        comb.buffer[comb.index] = dry + comb.store * room;
        comb.index = (comb.index + 1) % comb.buffer.length;
        sum += value;
      }
      for (const allpass of allpasses) {
        const buffered = allpass.buffer[allpass.index];
        const value = -sum + buffered;
        allpass.buffer[allpass.index] = sum + buffered * 0.5;
        allpass.index = (allpass.index + 1) % allpass.buffer.length;
        sum = value;
      }
      target[i] = sum * 3;
    }
  }

  // Szerokość stereo: 1 = pełna, 0 = mono.
  const wet1 = width / 2 + 0.5;
  const wet2 = (1 - width) / 2;
  for (let i = 0; i < input.length; i++) {
    const left = output.L[i];
    const right = output.R[i];
    output.L[i] = left * wet1 + right * wet2;
    output.R[i] = right * wet1 + left * wet2;
  }
  return output;
}

/** Opóźnienie ping-pong z filtrem w pętli sprzężenia zwrotnego. */
export function pingPongDelay(input, { time = 0.3, feedback = 0.35, cutoff = 3500 } = {}) {
  const size = Math.max(1, Math.round(time * SR));
  const left = new Float32Array(size);
  const right = new Float32Array(size);
  const toneLeft = new OnePole(cutoff);
  const toneRight = new OnePole(cutoff);
  const output = createStereo(input.length);
  let index = 0;
  for (let i = 0; i < input.length; i++) {
    const outLeft = left[index];
    const outRight = right[index];
    const mono = (input.L[i] + input.R[i]) * 0.5;
    left[index] = mono + toneLeft.run(outRight) * feedback;
    right[index] = toneRight.run(outLeft) * feedback;
    output.L[i] = outLeft;
    output.R[i] = outRight;
    index = (index + 1) % size;
  }
  return output;
}

export function mixInto(target, source, gain = 1) {
  const length = Math.min(target.length, source.length);
  for (let i = 0; i < length; i++) {
    target.L[i] += source.L[i] * gain;
    target.R[i] += source.R[i] * gain;
  }
}

export function rms(buffer) {
  let sum = 0;
  let count = 0;
  for (let i = 0; i < buffer.length; i++) {
    const value = (buffer.L[i] * buffer.L[i] + buffer.R[i] * buffer.R[i]) / 2;
    // Pomijamy ciszę (np. wybrzmienie), żeby nie zaniżała pomiaru głośności.
    if (value > 1e-7) {
      sum += value;
      count++;
    }
  }
  return Math.sqrt(sum / Math.max(1, count));
}

/** Limiter z wyprzedzeniem: obniża wzmocnienie zanim pojawi się szczyt, bez przesterowań. */
export function limit(buffer, ceiling = 0.89, lookahead = 0.005, release = 0.12) {
  const n = buffer.length;
  const window = Math.max(1, Math.round(lookahead * SR));
  const required = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const peak = Math.max(Math.abs(buffer.L[i]), Math.abs(buffer.R[i]));
    required[i] = peak > ceiling ? ceiling / peak : 1;
  }
  // Minimum w przesuwnym oknie [i, i + window] (kolejka monotoniczna).
  const target = new Float32Array(n);
  const deque = new Int32Array(n);
  let head = 0;
  let tail = 0;
  for (let i = n - 1; i >= 0; i--) {
    while (tail > head && required[deque[tail - 1]] >= required[i]) tail--;
    deque[tail++] = i;
    while (deque[head] > i + window) head++;
    target[i] = required[deque[head]];
  }
  const attackCoef = Math.exp(-1 / (window / 3));
  const releaseCoef = Math.exp(-1 / (release * SR));
  let gain = 1;
  for (let i = 0; i < n; i++) {
    const goal = target[i];
    gain = goal < gain ? goal + (gain - goal) * attackCoef : goal + (gain - goal) * releaseCoef;
    buffer.L[i] = clamp(buffer.L[i] * gain, -ceiling, ceiling);
    buffer.R[i] = clamp(buffer.R[i] * gain, -ceiling, ceiling);
  }
}

export function fade(buffer, fadeIn, fadeOut) {
  const inSamples = Math.round(fadeIn * SR);
  const outSamples = Math.round(fadeOut * SR);
  for (let i = 0; i < inSamples && i < buffer.length; i++) {
    const g = i / inSamples;
    buffer.L[i] *= g;
    buffer.R[i] *= g;
  }
  for (let i = 0; i < outSamples && i < buffer.length; i++) {
    const index = buffer.length - 1 - i;
    const g = (i / outSamples) ** 1.5;
    buffer.L[index] *= g;
    buffer.R[index] *= g;
  }
}
