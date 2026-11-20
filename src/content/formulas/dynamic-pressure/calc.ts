import { defineCalculator } from '../../../lib/calculator';
import { A_SEA_LEVEL } from '../../../lib/checks';

export default defineCalculator({
  solve: {
    q: ({ rho, v }) => 0.5 * rho * v * v,
    rho: ({ q, v }) => (2 * q) / (v * v),
    v: ({ q, rho }) => Math.sqrt((2 * q) / rho),
  },
  domain: { q: 'positive', rho: 'positive', v: 'positive' },
  aux: {
    a: {
      name: 'Speed of sound',
      unit: 'm/s',
      default: A_SEA_LEVEL,
      description: 'Used to compute the Mach number. 340.3 m/s at ISA sea level.',
      domain: 'positive',
    },
  },
  checks: [
    ({ v, a }) => {
      const M = v / a;
      if (M < 0.3) return { level: 'ok', message: `Mach ${M.toFixed(2)}: incompressible, so a pitot tube's p₀ − p equals q.` };
      // Isentropic stagnation pressure rise relative to q (γ = 1.4): (p0 − p)/q ≈ 1 + M²/4 + M⁴/40 + …
      const ratio = 1 + (M * M) / 4 + M ** 4 / 40;
      return {
        level: 'warn',
        message: `Mach ${M.toFixed(2)}: compressible. q is still ½ρv², but a pitot tube would read about ${((ratio - 1) * 100).toFixed(0)}% more than q${M >= 1 ? ' (and a shock forms ahead of it)' : ''}.`,
      };
    },
  ],
  residual: ({ q, rho, v }) => q - 0.5 * rho * v * v,
});
