import { defineCalculator } from '../../../lib/calculator';
import { lorentz, relativisticCheck } from '../../../lib/checks';

export default defineCalculator({
  solve: {
    Ek: ({ m, v }) => 0.5 * m * v * v,
    m: ({ Ek, v }) => (2 * Ek) / (v * v),
    v: ({ Ek, m }) => Math.sqrt((2 * Ek) / m),
  },
  domain: { Ek: 'nonnegative', m: 'positive', v: 'nonnegative' },
  // Newtonian ½β²mc² versus relativistic (γ − 1)mc².
  checks: [({ v }) => relativisticCheck(v, 'kinetic energy', (b) => 1 - (0.5 * b * b) / (lorentz(b) - 1))],
  residual: ({ Ek, m, v }) => Ek - 0.5 * m * v * v,
});
