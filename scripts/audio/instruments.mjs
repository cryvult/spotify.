// Instrumenty syntezatora. Każda funkcja dopisuje (sumuje) jedną nutę do szyny stereo.
// Nuta: { time, dur, midi, vel, pan } - czas i długość w sekundach, vel w zakresie 0-1.

import { SR, TWO_PI, adsr, clamp, mtof, OnePole, panGains, pulse, saw, Svf, triangle } from './dsp.mjs';

function span(bus, note, tail) {
  const start = Math.max(0, Math.round(note.time * SR));
  const end = Math.min(bus.length, Math.round((note.time + note.dur + tail) * SR));
  return [start, end];
}

function wrap(phase) {
  return phase >= 1 ? phase - Math.floor(phase) : phase;
}

/** Pianino elektryczne w stylu Rhodes (synteza FM z krótkim „dzwoneczkiem” przy ataku). */
export function electricPiano(bus, note, { brightness = 1 } = {}) {
  const f = mtof(note.midi);
  const vel = note.vel ?? 0.7;
  const [gl, gr] = panGains(note.pan ?? 0);
  const [start, end] = span(bus, note, 1.4);
  const decay = clamp(2.4 * (261 / f) ** 0.5, 0.6, 4.5);
  const indexStart = (1.4 * vel + 0.45) * brightness;
  let carrier = 0;
  let tine = 0;
  const dc = f / SR;
  const dt = (f * 13.98) / SR;
  for (let i = start; i < end; i++) {
    const t = (i - start) / SR;
    const amp = adsr(t, note.dur, 0.003, decay, 0, 0.22);
    if (amp < 1e-4 && t > note.dur) break;
    const index = indexStart * Math.exp(-t / 0.4) + 0.32;
    const ping = 0.55 * vel * brightness * Math.exp(-t / 0.035) * Math.sin(TWO_PI * tine);
    const value = Math.sin(TWO_PI * carrier + index * Math.sin(TWO_PI * carrier) + ping) * amp * vel * 0.3;
    bus.L[i] += value * gl;
    bus.R[i] += value * gr;
    carrier = wrap(carrier + dc);
    tine = wrap(tine + dt);
  }
}

/** Fortepian addytywny: lekko nieharmoniczne alikwoty, dwufazowy zanik i odgłos młoteczka. */
export function piano(bus, note, rng) {
  const f = mtof(note.midi);
  const vel = note.vel ?? 0.7;
  const [gl, gr] = panGains(note.pan ?? 0);
  const [start, end] = span(bus, note, 2.5);
  const inharmonicity = 0.00018 * (f / 261) ** 0.8;
  const baseTau = clamp(5 * (220 / f) ** 0.55, 0.8, 9);
  const partials = [];
  for (let k = 1; k <= 9; k++) {
    const fk = k * f * Math.sqrt(1 + inharmonicity * k * k);
    if (fk > 9500) break;
    const w = (TWO_PI * fk) / SR;
    const phase = rng.next() * TWO_PI;
    const tau = baseTau / (1 + 0.55 * (k - 1));
    partials.push({
      amp: (1 / k ** 1.2) * vel ** ((k - 1) * 0.22),
      coef: 2 * Math.cos(w),
      y1: Math.sin(phase),
      y2: Math.sin(phase - w),
      fast: Math.exp(-1 / (tau * 0.16 * SR)),
      slow: Math.exp(-1 / (tau * SR)),
      fastLevel: 0.6,
      slowLevel: 0.4,
    });
  }
  const damper = Math.exp(-1 / (0.14 * SR));
  const hammer = new OnePole(2600);
  const gateEnd = Math.round(note.dur * SR);
  for (let i = start; i < end; i++) {
    const n = i - start;
    let sum = 0;
    for (const p of partials) {
      const y = p.coef * p.y1 - p.y2;
      p.y2 = p.y1;
      p.y1 = y;
      if (n > gateEnd) {
        p.fastLevel *= damper;
        p.slowLevel *= damper;
      } else {
        p.fastLevel *= p.fast;
        p.slowLevel *= p.slow;
      }
      sum += y * p.amp * (p.fastLevel + p.slowLevel);
    }
    if (n < 900) sum += hammer.run(rng.next() * 2 - 1) * Math.exp(-n / 180) * 0.25 * vel;
    const attack = Math.min(1, n / 40);
    const value = sum * attack * vel * 0.2;
    bus.L[i] += value * gl;
    bus.R[i] += value * gr;
    if (n > gateEnd && partials[0].slowLevel < 1e-4) break;
  }
}

/** Szarpana struna (Karplus-Strong) ze strojeniem ułamkowym przez filtr wszechprzepustowy. */
export function pluck(bus, note, rng, { brightness = 0.55, sustain = 2.2 } = {}) {
  const f = mtof(note.midi);
  const vel = note.vel ?? 0.7;
  const [gl, gr] = panGains(note.pan ?? 0);
  const [start, end] = span(bus, note, sustain);
  const delay = SR / f - 0.5;
  const length = Math.max(2, Math.floor(delay - 0.1));
  const frac = delay - length;
  const c = (1 - frac) / (1 + frac);
  const line = new Float32Array(length);
  let smooth = 0;
  let mean = 0;
  for (let k = 0; k < length; k++) {
    smooth += (rng.next() * 2 - 1 - smooth) * brightness;
    line[k] = smooth;
    mean += smooth;
  }
  mean /= length;
  for (let k = 0; k < length; k++) line[k] -= mean;
  const loopGain = 10 ** (-3 / (sustain * f));
  const releaseGain = 10 ** (-3 / (0.25 * f));
  const gateEnd = Math.round(note.dur * SR);
  let index = 0;
  let previous = 0;
  let apX = 0;
  let apY = 0;
  for (let i = start; i < end; i++) {
    const out = line[index];
    const averaged = 0.5 * (out + previous);
    previous = out;
    const shifted = c * averaged + apX - c * apY;
    apX = averaged;
    apY = shifted;
    line[index] = shifted * (i - start > gateEnd ? releaseGain : loopGain);
    index = (index + 1) % length;
    const value = out * vel * 0.5;
    bus.L[i] += value * gl;
    bus.R[i] += value * gr;
  }
}

/** Plama dźwiękowa: kilka rozstrojonych oscylatorów piłokształtnych przez łagodny filtr. */
export function pad(bus, note, rng, options = {}) {
  const {
    voices = 3,
    detune = 0.09,
    cutoff = 1800,
    q = 0.75,
    attack = 1.2,
    release = 1.6,
    lfoRate = 0.08,
    lfoDepth = 0.3,
    wave = 'saw',
    level = 0.12,
  } = options;
  const f = mtof(note.midi);
  const vel = note.vel ?? 0.7;
  const [start, end] = span(bus, note, release * 5);
  const oscillators = Array.from({ length: voices }, (_, v) => {
    const spreadPosition = voices === 1 ? 0 : v / (voices - 1) - 0.5;
    const freq = f * 2 ** ((spreadPosition * 2 * detune) / 12);
    const [gl, gr] = panGains(spreadPosition * 1.2 + (note.pan ?? 0));
    return { phase: rng.next(), dt: freq / SR, gl, gr };
  });
  const left = new Svf(cutoff, q);
  const right = new Svf(cutoff, q);
  const lfoPhase = rng.next() * TWO_PI;
  for (let i = start; i < end; i++) {
    const t = (i - start) / SR;
    if (i % 64 === 0) {
      const c = cutoff * (1 + lfoDepth * Math.sin(TWO_PI * lfoRate * t + lfoPhase));
      left.set(c, q);
      right.set(c, q);
    }
    const amp = adsr(t, note.dur, attack, 1, 1, release);
    if (t > note.dur && amp < 1e-4) break;
    let sumL = 0;
    let sumR = 0;
    for (const osc of oscillators) {
      const value =
        wave === 'saw'
          ? saw(osc.phase, osc.dt)
          : wave === 'triangle'
            ? triangle(osc.phase)
            : Math.sin(TWO_PI * osc.phase);
      sumL += value * osc.gl;
      sumR += value * osc.gr;
      osc.phase = wrap(osc.phase + osc.dt);
    }
    const g = (amp * vel * level) / Math.sqrt(voices);
    bus.L[i] += left.run(sumL) * g;
    bus.R[i] += right.run(sumR) * g;
  }
}

/** Bas syntezatorowy: dwie piły przez filtr z obwiednią + czysty sinus wzmacniający podstawę. */
export function synthBass(bus, note, rng, options = {}) {
  const {
    cutoff = 280,
    envAmount = 1400,
    envDecay = 0.12,
    q = 1.1,
    sub = 0.5,
    level = 0.32,
    release = 0.06,
  } = options;
  const f = mtof(note.midi);
  const vel = note.vel ?? 0.8;
  const [gl, gr] = panGains(note.pan ?? 0);
  const [start, end] = span(bus, note, release * 6);
  let p1 = rng.next();
  let p2 = rng.next();
  let pSub = 0;
  const dt1 = f / SR;
  const dt2 = (f * 1.004) / SR;
  const dSub = f / SR;
  const filter = new Svf(cutoff, q);
  for (let i = start; i < end; i++) {
    const t = (i - start) / SR;
    if ((i - start) % 16 === 0) filter.set(cutoff + envAmount * vel * Math.exp(-t / envDecay), q);
    const amp = adsr(t, note.dur, 0.003, 0.25, 0.75, release);
    if (t > note.dur && amp < 1e-4) break;
    const raw = (saw(p1, dt1) + saw(p2, dt2)) * 0.5;
    const value = (filter.run(raw) + Math.sin(TWO_PI * pSub) * sub) * amp * vel * level;
    bus.L[i] += value * gl;
    bus.R[i] += value * gr;
    p1 = wrap(p1 + dt1);
    p2 = wrap(p2 + dt2);
    pSub = wrap(pSub + dSub);
  }
}

/** Głęboki, czysty bas sinusoidalny z opcjonalnym poślizgiem z poprzedniej wysokości. */
export function subBass(bus, note, { level = 0.4, drive = 1.6, glide = 0.07 } = {}) {
  const target = mtof(note.midi);
  const from = note.glideFrom !== undefined ? mtof(note.glideFrom) : target;
  const vel = note.vel ?? 0.85;
  const [start, end] = span(bus, note, 0.4);
  const norm = Math.tanh(drive);
  let phase = 0;
  for (let i = start; i < end; i++) {
    const t = (i - start) / SR;
    const amp = adsr(t, note.dur, 0.008, 0.4, 0.85, 0.07);
    if (t > note.dur && amp < 1e-4) break;
    const freq = target + (from - target) * Math.exp(-t / glide);
    const value = (Math.tanh(Math.sin(TWO_PI * phase) * drive) / norm) * amp * vel * level;
    bus.L[i] += value;
    bus.R[i] += value;
    phase = wrap(phase + freq / SR);
  }
}

/** Syntezatorowa melodia: piła + prostokąt, vibrato wchodzące po chwili i poślizg między nutami. */
export function lead(bus, note, rng, options = {}) {
  const {
    cutoff = 1400,
    envAmount = 2600,
    envDecay = 0.25,
    q = 0.9,
    vibratoRate = 5.4,
    vibratoDepth = 0.16,
    vibratoDelay = 0.22,
    glide = 0.045,
    level = 0.16,
    attack = 0.012,
    release = 0.18,
    pulseMix = 0.4,
  } = options;
  const target = note.midi;
  const from = note.glideFrom ?? note.midi;
  const vel = note.vel ?? 0.8;
  const [gl, gr] = panGains(note.pan ?? 0);
  const [start, end] = span(bus, note, release * 6);
  let pSaw = rng.next();
  let pPulse = rng.next();
  const filter = new Svf(cutoff, q);
  for (let i = start; i < end; i++) {
    const t = (i - start) / SR;
    if ((i - start) % 16 === 0) filter.set(cutoff + envAmount * vel * Math.exp(-t / envDecay), q);
    const amp = adsr(t, note.dur, attack, 0.6, 0.8, release);
    if (t > note.dur && amp < 1e-4) break;
    const vibrato = vibratoDepth * clamp((t - vibratoDelay) / 0.3, 0, 1) * Math.sin(TWO_PI * vibratoRate * t);
    const midi = target + (from - target) * Math.exp(-t / glide) + vibrato;
    const dt = mtof(midi) / SR;
    const raw = saw(pSaw, dt) * (1 - pulseMix) + pulse(pPulse, dt * 1.003, 0.42) * pulseMix;
    const value = filter.run(raw) * amp * vel * level;
    bus.L[i] += value * gl;
    bus.R[i] += value * gr;
    pSaw = wrap(pSaw + dt);
    pPulse = wrap(pPulse + dt * 1.003);
  }
}

/** Krótki, perkusyjny dźwięk prostokątny przez filtr (arpeggia, „plucki” w house). */
export function pulsePluck(bus, note, rng, options = {}) {
  const {
    duty = 0.35,
    cutoff = 700,
    envAmount = 3800,
    envDecay = 0.09,
    ampDecay = 0.22,
    q = 1.4,
    level = 0.14,
  } = options;
  const f = mtof(note.midi);
  const vel = note.vel ?? 0.8;
  const [gl, gr] = panGains(note.pan ?? 0);
  const [start, end] = span(bus, note, 0.6);
  let phase = rng.next();
  const dt = f / SR;
  const filter = new Svf(cutoff, q);
  for (let i = start; i < end; i++) {
    const t = (i - start) / SR;
    if ((i - start) % 16 === 0) filter.set(cutoff + envAmount * vel * Math.exp(-t / envDecay), q);
    const amp = adsr(t, note.dur, 0.002, ampDecay, 0, 0.08);
    if (amp < 1e-4 && t > 0.01) break;
    const value = filter.run(pulse(phase, dt, duty)) * amp * vel * level;
    bus.L[i] += value * gl;
    bus.R[i] += value * gr;
    phase = wrap(phase + dt);
  }
}

/** Dzwonek / czelesta: nieharmoniczne alikwoty o różnym czasie zaniku. */
export function bell(bus, note, rng, { decay = 2.4, level = 0.12 } = {}) {
  const f = mtof(note.midi);
  const vel = note.vel ?? 0.6;
  const [gl, gr] = panGains(note.pan ?? 0);
  const [start, end] = span(bus, note, decay * 4);
  const ratios = [1, 2, 2.76, 4.07, 5.4];
  const amps = [1, 0.3, 0.42, 0.18, 0.12];
  const partials = ratios
    .map((ratio, k) => ({ ratio, amp: amps[k] }))
    .filter((p) => f * p.ratio < 12000)
    .map((p, k) => {
      const w = (TWO_PI * f * p.ratio) / SR;
      const phase = rng.next() * TWO_PI;
      return {
        amp: p.amp,
        coef: 2 * Math.cos(w),
        y1: Math.sin(phase),
        y2: Math.sin(phase - w),
        level: 1,
        mult: Math.exp(-1 / ((decay / (1 + k * 0.9)) * SR)),
      };
    });
  for (let i = start; i < end; i++) {
    let sum = 0;
    for (const p of partials) {
      const y = p.coef * p.y1 - p.y2;
      p.y2 = p.y1;
      p.y1 = y;
      p.level *= p.mult;
      sum += y * p.amp * p.level;
    }
    const n = i - start;
    const value = sum * Math.min(1, n / 60) * vel * level;
    bus.L[i] += value * gl;
    bus.R[i] += value * gr;
    if (partials[0].level < 1e-4) break;
  }
}

/** Fala prostokątna w stylu 8-bit z prostą obwiednią i opcjonalnym vibrato. */
export function chipSquare(bus, note, { duty = 0.25, level = 0.09, vibrato = 0, sustain = 0.65 } = {}) {
  const vel = note.vel ?? 0.8;
  const [gl, gr] = panGains(note.pan ?? 0);
  const [start, end] = span(bus, note, 0.08);
  let phase = 0;
  for (let i = start; i < end; i++) {
    const t = (i - start) / SR;
    const amp = adsr(t, note.dur, 0.002, 0.12, sustain, 0.02);
    const midi = note.midi + vibrato * clamp((t - 0.12) / 0.2, 0, 1) * Math.sin(TWO_PI * 6 * t);
    const dt = mtof(midi) / SR;
    // Kwantyzacja głośności do 16 poziomów, jak w starych układach dźwiękowych.
    const stepped = Math.round(amp * 15) / 15;
    const value = pulse(phase, dt, duty) * stepped * vel * level;
    bus.L[i] += value * gl;
    bus.R[i] += value * gr;
    phase = wrap(phase + dt);
  }
}

/** Schodkowa fala trójkątna (16 poziomów): klasyczny bas z konsol 8-bitowych. */
export function chipTriangle(bus, note, { level = 0.3 } = {}) {
  const f = mtof(note.midi);
  const [start, end] = span(bus, note, 0.02);
  let phase = 0;
  const dt = f / SR;
  for (let i = start; i < end; i++) {
    const t = (i - start) / SR;
    const gate = t <= note.dur ? 1 : Math.max(0, 1 - (t - note.dur) / 0.02);
    const value = (Math.round(triangle(phase) * 7.5) / 7.5) * gate * level * (note.vel ?? 1);
    bus.L[i] += value;
    bus.R[i] += value;
    phase = wrap(phase + dt);
  }
}

/** Kanał szumu 8-bit: szum „trzymany” przez kilka próbek daje charakterystyczną barwę. */
export function chipNoise(bus, hit, rng, { hold = 2, decay = 0.06, level = 0.12 } = {}) {
  const [gl, gr] = panGains(hit.pan ?? 0);
  const start = Math.round(hit.time * SR);
  const end = Math.min(bus.length, start + Math.round(decay * 6 * SR));
  let value = 0;
  for (let i = start; i < end; i++) {
    const n = i - start;
    if (n % hold === 0) value = rng.next() * 2 - 1;
    const amp = Math.round(Math.exp(-n / (decay * SR)) * 15) / 15;
    const out = value * amp * level * (hit.vel ?? 1);
    bus.L[i] += out * gl;
    bus.R[i] += out * gr;
  }
}

// ---------------------------------------------------------------- perkusja

export function kick(
  bus,
  hit,
  { start = 150, end = 54, pitchDecay = 0.035, decay = 0.2, click = 0.25, drive = 1.5, level = 0.85 } = {},
) {
  const begin = Math.round(hit.time * SR);
  const stop = Math.min(bus.length, begin + Math.round(decay * 6 * SR));
  const vel = hit.vel ?? 1;
  const norm = Math.tanh(drive);
  let phase = 0;
  for (let i = begin; i < stop; i++) {
    const t = (i - begin) / SR;
    const freq = end + (start - end) * Math.exp(-t / pitchDecay);
    const body = Math.sin(TWO_PI * phase) * Math.exp(-t / decay);
    const tick = t < 0.004 ? Math.sin(TWO_PI * 3200 * t) * (1 - t / 0.004) * click : 0;
    const value = (Math.tanh((body + tick) * drive) / norm) * vel * level * Math.min(1, t / 0.0008);
    bus.L[i] += value;
    bus.R[i] += value;
    phase = wrap(phase + freq / SR);
  }
}

export function snare(bus, hit, rng, options = {}) {
  const {
    tone = 185,
    toneDecay = 0.06,
    noiseDecay = 0.16,
    highpass = 1300,
    lowpass = 9000,
    toneMix = 0.4,
    level = 0.5,
  } = options;
  const begin = Math.round(hit.time * SR);
  const stop = Math.min(bus.length, begin + Math.round(noiseDecay * 6 * SR));
  const vel = hit.vel ?? 1;
  const [gl, gr] = panGains(hit.pan ?? 0);
  const hp = new Svf(highpass, 0.7);
  const lp = new OnePole(lowpass);
  let p1 = 0;
  let p2 = 0;
  for (let i = begin; i < stop; i++) {
    const t = (i - begin) / SR;
    hp.run(rng.next() * 2 - 1);
    const noise = lp.run(hp.hp) * Math.exp(-t / noiseDecay);
    const body = (Math.sin(TWO_PI * p1) + 0.6 * Math.sin(TWO_PI * p2)) * Math.exp(-t / toneDecay);
    const value = (noise * (1 - toneMix) + body * toneMix) * vel * level * Math.min(1, t / 0.0005);
    bus.L[i] += value * gl;
    bus.R[i] += value * gr;
    p1 = wrap(p1 + tone / SR);
    p2 = wrap(p2 + (tone * 1.78) / SR);
  }
}

export function clap(bus, hit, rng, { level = 0.45, decay = 0.14 } = {}) {
  const begin = Math.round(hit.time * SR);
  const stop = Math.min(bus.length, begin + Math.round((decay * 6 + 0.03) * SR));
  const vel = hit.vel ?? 1;
  const band = new Svf(1300, 1.4);
  for (let i = begin; i < stop; i++) {
    const t = (i - begin) / SR;
    band.run(rng.next() * 2 - 1);
    // Trzy szybkie „klaśnięcia” i dłuższy ogon.
    const bursts = [0, 0.009, 0.018].reduce(
      (acc, offset) => acc + (t >= offset ? Math.exp(-(t - offset) / 0.004) : 0),
      0,
    );
    const tailEnv = t > 0.02 ? Math.exp(-(t - 0.02) / decay) : 0;
    const value = band.bp * (bursts * 0.7 + tailEnv) * vel * level * 2.2;
    bus.L[i] += value;
    bus.R[i] += value;
  }
}

export function hat(bus, hit, rng, { open = false, decay, highpass = 7500, level = 0.18 } = {}) {
  const length = decay ?? (open ? 0.22 : 0.035);
  const begin = Math.round(hit.time * SR);
  const stop = Math.min(bus.length, begin + Math.round(length * 6 * SR));
  const vel = hit.vel ?? 1;
  const [gl, gr] = panGains(hit.pan ?? 0.15);
  const hp = new Svf(highpass, 0.9);
  const ratios = [1, 1.483, 1.932, 2.546, 2.63, 3.897];
  const phases = ratios.map(() => rng.next());
  for (let i = begin; i < stop; i++) {
    const t = (i - begin) / SR;
    let metal = 0;
    for (let k = 0; k < ratios.length; k++) {
      phases[k] = wrap(phases[k] + (330 * ratios[k]) / SR);
      metal += phases[k] < 0.5 ? 1 : -1;
    }
    hp.run(metal * 0.12 + (rng.next() * 2 - 1) * 0.8);
    const value = hp.hp * Math.exp(-t / length) * vel * level;
    bus.L[i] += value * gl;
    bus.R[i] += value * gr;
  }
}

export function shaker(bus, hit, rng, { level = 0.07 } = {}) {
  const begin = Math.round(hit.time * SR);
  const stop = Math.min(bus.length, begin + Math.round(0.09 * SR));
  const vel = hit.vel ?? 1;
  const band = new Svf(6500, 1.2);
  const [gl, gr] = panGains(hit.pan ?? -0.25);
  for (let i = begin; i < stop; i++) {
    const t = (i - begin) / SR;
    band.run(rng.next() * 2 - 1);
    const env = Math.min(1, t / 0.006) * Math.exp(-t / 0.022);
    const value = band.bp * env * vel * level * 2;
    bus.L[i] += value * gl;
    bus.R[i] += value * gr;
  }
}

export function rim(bus, hit, { level = 0.22 } = {}) {
  const begin = Math.round(hit.time * SR);
  const stop = Math.min(bus.length, begin + Math.round(0.06 * SR));
  const vel = hit.vel ?? 1;
  const [gl, gr] = panGains(hit.pan ?? 0.3);
  for (let i = begin; i < stop; i++) {
    const t = (i - begin) / SR;
    const value =
      (Math.sin(TWO_PI * 1700 * t) * 0.6 + Math.sin(TWO_PI * 820 * t)) * Math.exp(-t / 0.009) * vel * level;
    bus.L[i] += value * gl;
    bus.R[i] += value * gr;
  }
}

export function crash(bus, hit, rng, { decay = 1.5, level = 0.12 } = {}) {
  const begin = Math.round(hit.time * SR);
  const stop = Math.min(bus.length, begin + Math.round(decay * 5 * SR));
  const vel = hit.vel ?? 1;
  const hpL = new Svf(5200, 0.8);
  const hpR = new Svf(5200, 0.8);
  for (let i = begin; i < stop; i++) {
    const t = (i - begin) / SR;
    const env = Math.min(1, t / 0.003) * Math.exp(-t / decay);
    hpL.run(rng.next() * 2 - 1);
    hpR.run(rng.next() * 2 - 1);
    bus.L[i] += hpL.hp * env * vel * level;
    bus.R[i] += hpR.hp * env * vel * level;
  }
}

/** Narastający szum z otwierającym się filtrem: przejście przed refrenem. */
export function riser(bus, { time, dur }, rng, { level = 0.08 } = {}) {
  const begin = Math.round(time * SR);
  const stop = Math.min(bus.length, begin + Math.round(dur * SR));
  const filterL = new Svf(300, 2);
  const filterR = new Svf(300, 2);
  for (let i = begin; i < stop; i++) {
    const progress = (i - begin) / (stop - begin);
    if ((i - begin) % 64 === 0) {
      const cutoff = 300 * 2 ** (progress * 5);
      filterL.set(cutoff, 2);
      filterR.set(cutoff, 2);
    }
    filterL.run(rng.next() * 2 - 1);
    filterR.run(rng.next() * 2 - 1);
    const env = progress ** 2 * level;
    bus.L[i] += filterL.bp * env;
    bus.R[i] += filterR.bp * env;
  }
}

/** Trzaski płyty winylowej i delikatny szum. */
export function vinyl(bus, rng, { crackles = 5, hiss = 0.004, level = 1 } = {}) {
  const hissFilter = new Svf(5000, 0.6);
  let crackle = 0;
  for (let i = 0; i < bus.length; i++) {
    if (rng.next() < crackles / SR) crackle = (rng.next() * 2 - 1) * rng.range(0.02, 0.1);
    crackle *= 0.82;
    hissFilter.run(rng.next() * 2 - 1);
    const value = (crackle + hissFilter.bp * hiss) * level;
    bus.L[i] += value;
    bus.R[i] += value * 0.92;
  }
}

/** Deszcz za oknem: szum pasmowy z wolną modulacją i pojedynczymi kroplami. */
export function rain(bus, rng, { level = 0.02 } = {}) {
  const bandL = new Svf(2200, 0.5);
  const bandR = new Svf(2600, 0.5);
  const drops = [];
  for (let i = 0; i < bus.length; i++) {
    const t = i / SR;
    const swell = 0.7 + 0.3 * Math.sin(TWO_PI * 0.05 * t) * Math.sin(TWO_PI * 0.013 * t);
    bandL.run(rng.next() * 2 - 1);
    bandR.run(rng.next() * 2 - 1);
    if (rng.next() < 9 / SR)
      drops.push({
        start: i,
        freq: rng.range(2500, 5000),
        pan: rng.range(-0.8, 0.8),
        amp: rng.range(0.1, 0.35),
      });
    let dropSum = 0;
    let dropPan = 0;
    for (let d = drops.length - 1; d >= 0; d--) {
      const drop = drops[d];
      const age = (i - drop.start) / SR;
      if (age > 0.03) {
        drops.splice(d, 1);
        continue;
      }
      const value = Math.sin(TWO_PI * drop.freq * age * (1 - age * 8)) * Math.exp(-age / 0.006) * drop.amp;
      dropSum += value;
      dropPan += value * drop.pan;
    }
    bus.L[i] += (bandL.bp * swell + (dropSum - dropPan) * 0.06) * level;
    bus.R[i] += (bandR.bp * swell + (dropSum + dropPan) * 0.06) * level;
  }
}
