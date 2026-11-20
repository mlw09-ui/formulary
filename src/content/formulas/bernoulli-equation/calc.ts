import { defineCalculator } from '../../../lib/calculator';

/** Total head per volume: p + ½ρv² + ρgz. */
const H = (p: number, v: number, z: number, rho: number, g: number) => p + 0.5 * rho * v * v + rho * g * z;

export default defineCalculator({
  solve: {
    p2: ({ p1, v1, z1, v2, z2, rho, g }) => H(p1, v1, z1, rho, g) - 0.5 * rho * v2 * v2 - rho * g * z2,
    p1: ({ p2, v1, z1, v2, z2, rho, g }) => H(p2, v2, z2, rho, g) - 0.5 * rho * v1 * v1 - rho * g * z1,
    v2: ({ p1, v1, z1, p2, z2, rho, g }) => Math.sqrt((2 * (H(p1, v1, z1, rho, g) - p2 - rho * g * z2)) / rho),
    v1: ({ p2, v2, z2, p1, z1, rho, g }) => Math.sqrt((2 * (H(p2, v2, z2, rho, g) - p1 - rho * g * z1)) / rho),
    z2: ({ p1, v1, z1, p2, v2, rho, g }) => (H(p1, v1, z1, rho, g) - p2 - 0.5 * rho * v2 * v2) / (rho * g),
    z1: ({ p2, v2, z2, p1, v1, rho, g }) => (H(p2, v2, z2, rho, g) - p1 - 0.5 * rho * v1 * v1) / (rho * g),
  },
  domain: { rho: 'positive', g: 'positive', v1: 'nonnegative', v2: 'nonnegative' },
  checks: [
    ({ p1, p2 }) =>
      p1 < 0 || p2 < 0
        ? { level: 'warn', message: 'A pressure is negative. If you are using absolute pressure, that is impossible: the liquid would cavitate (boil) or the flow would separate first.' }
        : null,
  ],
  residual: ({ p1, v1, z1, p2, v2, z2, rho, g }) => H(p1, v1, z1, rho, g) - H(p2, v2, z2, rho, g),
});
