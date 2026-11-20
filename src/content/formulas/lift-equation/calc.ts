import { defineCalculator } from '../../../lib/calculator';
import { A_SEA_LEVEL, machCheck } from '../../../lib/checks';

export default defineCalculator({
  solve: {
    L: ({ rho, v, S, CL }) => 0.5 * rho * v ** 2 * S * CL,
    rho: ({ L, v, S, CL }) => (2 * L) / (v ** 2 * S * CL),
    // Lift and C_L must have the same sign; otherwise sqrt of a negative → NaN → "no real solution".
    v: ({ L, rho, S, CL }) => Math.sqrt((2 * L) / (rho * S * CL)),
    S: ({ L, rho, v, CL }) => (2 * L) / (rho * v ** 2 * CL),
    CL: ({ L, rho, v, S }) => (2 * L) / (rho * v ** 2 * S),
  },
  domain: { rho: 'positive', v: 'positive', S: 'positive', CL: 'nonzero', L: 'nonzero' },
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
    ({ v, a }) => machCheck(v, a, 'lift-coefficient data'),
    ({ CL }) =>
      Math.abs(CL) > 2.5
        ? { level: 'warn', message: `A lift coefficient of ${Math.abs(CL).toFixed(2)} exceeds typical maxima even with flaps (≈ 2–2.5 for conventional high-lift systems). The wing is probably stalled, or an input is wrong.` }
        : null,
  ],
  residual: ({ L, rho, v, S, CL }) => L - 0.5 * rho * v ** 2 * S * CL,
});
