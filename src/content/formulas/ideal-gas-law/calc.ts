import { defineCalculator } from '../../../lib/calculator';

const R = 8.314462618; // J/(mol·K), exact

export default defineCalculator({
  solve: {
    p: ({ V, n, T }) => (n * R * T) / V,
    V: ({ p, n, T }) => (n * R * T) / p,
    n: ({ p, V, T }) => (p * V) / (R * T),
    T: ({ p, V, n }) => (p * V) / (n * R),
  },
  domain: { p: 'positive', V: 'positive', n: 'positive', T: 'positive' },
  checks: [
    ({ T }) =>
      T < 150
        ? { level: 'warn', message: `T = ${T.toFixed(1)} K is very cold. Did you enter °C instead of kelvin? Most gases also stop being ideal near their condensation point.` }
        : null,
    ({ p }) =>
      p > 1e7
        ? { level: 'warn', message: `p = ${(p / 1e6).toFixed(0)} MPa: at high pressure real gases deviate noticeably from ideal behaviour; use a compressibility factor.` }
        : null,
  ],
  residual: ({ p, V, n, T }) => p * V - n * R * T,
});
