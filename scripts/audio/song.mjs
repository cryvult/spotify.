// Klasa Song: siatka czasu (takty, szesnastki, swing), szyny miksu i końcowy mastering.

import {
  SR,
  TWO_PI,
  createRng,
  createStereo,
  dbToGain,
  fade,
  filterStereo,
  limit,
  mixInto,
  modulatedDelay,
  pingPongDelay,
  reverb,
  saturateStereo,
} from './dsp.mjs';
import { measureLufs } from './loudness.mjs';

export class Song {
  constructor({ bpm, bars, seed, swing = 0, tail = 4 }) {
    this.bpm = bpm;
    this.bars = bars;
    this.rng = createRng(seed);
    this.beat = 60 / bpm;
    this.barLength = this.beat * 4;
    this.stepLength = this.beat / 4;
    this.swing = swing;
    this.duration = bars * this.barLength + tail;
    this.length = Math.ceil(this.duration * SR);
    this.buses = new Map();
    this.kickTimes = [];
  }

  /** Czas (s) dla taktu i kroku szesnastkowego; nieparzyste szesnastki są opóźniane przez swing. */
  time(bar, step = 0) {
    const whole = Math.floor(step);
    const swingOffset = whole % 2 === 1 ? this.swing * this.stepLength : 0;
    return bar * this.barLength + step * this.stepLength + swingOffset;
  }

  steps(count) {
    return count * this.stepLength;
  }

  /** Niewielkie losowe przesunięcie w czasie: „ludzka” niedokładność gry. */
  humanize(seconds = 0.008) {
    return this.rng.range(-seconds, seconds);
  }

  bus(name, options = {}) {
    if (!this.buses.has(name)) {
      this.buses.set(name, {
        ...createStereo(this.length),
        options: { gain: 1, reverb: 0, delay: 0, ...options },
      });
    }
    return this.buses.get(name);
  }

  render({
    reverb: reverbOptions = {},
    delay: delayOptions = {},
    targetLufs = -17,
    lowpass,
    highpass = 35,
    fadeIn = 0.02,
    fadeOut = 3,
  }) {
    const master = createStereo(this.length);
    const reverbSend = createStereo(this.length);
    const delaySend = createStereo(this.length);

    for (const bus of this.buses.values()) {
      const o = bus.options;
      if (o.highpass) filterStereo(bus, 'highpass', o.highpass, 0.7);
      if (o.lowpass) filterStereo(bus, 'lowpass', o.lowpass, 0.7);
      if (o.saturate) saturateStereo(bus, o.saturate);
      if (o.chorus) modulatedDelay(bus, { rate: 0.25, depth: 0.0025, base: 0.014, mix: 0.45, ...o.chorus });
      if (o.wow) modulatedDelay(bus, { rate: 0.45, depth: o.wow, base: 0.006, mix: 1, flutter: 0.15 });
      if (o.tremolo) this.applyTremolo(bus, o.tremolo);
      if (o.sidechain) this.applySidechain(bus, o.sidechain);
      mixInto(master, bus, o.gain);
      if (o.reverb) mixInto(reverbSend, bus, o.reverb * o.gain);
      if (o.delay) mixInto(delaySend, bus, o.delay * o.gain);
    }

    const delayed = pingPongDelay(delaySend, {
      time: this.beat * 0.75,
      feedback: 0.38,
      cutoff: 3200,
      ...delayOptions,
    });
    mixInto(master, delayed, delayOptions.gain ?? 1);
    mixInto(reverbSend, delayed, 0.35);
    const wet = reverb(reverbSend, { room: 0.84, damp: 0.35, ...reverbOptions });
    mixInto(master, wet, reverbOptions.gain ?? 1);

    if (highpass) filterStereo(master, 'highpass', highpass, 0.7);
    if (lowpass) filterStereo(master, 'lowpass', lowpass, 0.7);

    // Normalizacja do docelowej głośności (LUFS), potem limiter (szczyty maks. -1 dBFS).
    // Limiter odrobinę ścisza utwór, więc korygujemy wzmocnienie w drugim przebiegu.
    const unlimited = { L: master.L.slice(), R: master.R.slice(), length: master.length };
    let gainDb = targetLufs - measureLufs(master);
    for (let pass = 0; pass < 2; pass++) {
      const gain = dbToGain(gainDb);
      for (let i = 0; i < master.length; i++) {
        master.L[i] = unlimited.L[i] * gain;
        master.R[i] = unlimited.R[i] * gain;
      }
      limit(master, dbToGain(-1));
      gainDb += targetLufs - measureLufs(master);
    }
    this.loudness = measureLufs(master);
    master.loudness = this.loudness;
    fade(master, fadeIn, fadeOut);
    return master;
  }

  applyTremolo(bus, { rate = 4, depth = 0.15, stereo = true }) {
    for (let i = 0; i < bus.length; i++) {
      const phase = TWO_PI * rate * (i / SR);
      bus.L[i] *= 1 - depth * (0.5 + 0.5 * Math.sin(phase));
      bus.R[i] *= 1 - depth * (0.5 + 0.5 * Math.sin(phase + (stereo ? Math.PI : 0)));
    }
  }

  /** „Pompowanie”: ściszenie szyny przy każdym uderzeniu stopy (typowe dla house). */
  applySidechain(bus, { depth = 0.6, release = 0.18 }) {
    const times = [...this.kickTimes].sort((a, b) => a - b);
    let next = 0;
    let last = -Infinity;
    for (let i = 0; i < bus.length; i++) {
      const t = i / SR;
      while (next < times.length && times[next] <= t) last = times[next++];
      const since = t - last;
      const duck = since < 0.004 ? (since / 0.004) * depth : depth * Math.exp(-(since - 0.004) / release);
      const g = 1 - (Number.isFinite(since) ? duck : 0);
      bus.L[i] *= g;
      bus.R[i] *= g;
    }
  }
}
