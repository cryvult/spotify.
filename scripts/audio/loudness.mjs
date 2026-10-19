// Pomiar głośności zintegrowanej (LUFS) według ITU-R BS.1770 / EBU R128.
// Dzięki temu wszystkie utwory demonstracyjne mają zbliżoną głośność.

import { SR } from './dsp.mjs';

function biquad({ b0, b1, b2, a0, a1, a2 }) {
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}

// Współczynniki filtrów ważenia K (półka wysokotonowa +4 dB i filtr górnoprzepustowy ok. 38 Hz).
function kWeightingFilters() {
  const shelf = (() => {
    const gain = 3.999843853973347;
    const f0 = 1681.974450955533;
    const q = 0.7071752369554196;
    const A = 10 ** (gain / 40);
    const w0 = (2 * Math.PI * f0) / SR;
    const alpha = Math.sin(w0) / (2 * q);
    const cos = Math.cos(w0);
    const sqrtA = Math.sqrt(A);
    return biquad({
      b0: A * (A + 1 + (A - 1) * cos + 2 * sqrtA * alpha),
      b1: -2 * A * (A - 1 + (A + 1) * cos),
      b2: A * (A + 1 + (A - 1) * cos - 2 * sqrtA * alpha),
      a0: A + 1 - (A - 1) * cos + 2 * sqrtA * alpha,
      a1: 2 * (A - 1 - (A + 1) * cos),
      a2: A + 1 - (A - 1) * cos - 2 * sqrtA * alpha,
    });
  })();
  const highpass = (() => {
    const f0 = 38.13547087602444;
    const q = 0.5003270373238773;
    const w0 = (2 * Math.PI * f0) / SR;
    const alpha = Math.sin(w0) / (2 * q);
    const cos = Math.cos(w0);
    return biquad({
      b0: (1 + cos) / 2,
      b1: -(1 + cos),
      b2: (1 + cos) / 2,
      a0: 1 + alpha,
      a1: -2 * cos,
      a2: 1 - alpha,
    });
  })();
  return [shelf, highpass];
}

function applyBiquad(input, c) {
  const output = new Float32Array(input.length);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < input.length; i++) {
    const x = input[i];
    const y = c.b0 * x + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2;
    output[i] = y;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
  }
  return output;
}

/** Zwraca głośność zintegrowaną w LUFS (bramkowanie bezwzględne -70 i względne -10 LU). */
export function measureLufs(buffer) {
  const [shelf, highpass] = kWeightingFilters();
  const channels = [buffer.L, buffer.R].map((channel) => applyBiquad(applyBiquad(channel, shelf), highpass));
  const block = Math.round(0.4 * SR);
  const hop = Math.round(0.1 * SR);
  const blocks = [];
  for (let start = 0; start + block <= buffer.length; start += hop) {
    let power = 0;
    for (const channel of channels) {
      let sum = 0;
      for (let i = start; i < start + block; i++) sum += channel[i] * channel[i];
      power += sum / block;
    }
    blocks.push(power);
  }
  const loudness = (power) => -0.691 + 10 * Math.log10(power);
  const absolute = blocks.filter((power) => loudness(power) > -70);
  if (absolute.length === 0) return -70;
  const mean = absolute.reduce((a, b) => a + b, 0) / absolute.length;
  const relative = absolute.filter((power) => loudness(power) > loudness(mean) - 10);
  return loudness(relative.reduce((a, b) => a + b, 0) / relative.length);
}
