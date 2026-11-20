import { defineCalculator } from '../../../lib/calculator';
import { relativisticCheck } from '../../../lib/checks';

export default defineCalculator({
  solve: {
    p: ({ m, v }) => m * v,
    m: ({ p, v }) => p / v,
    v: ({ p, m }) => p / m,
  },
  domain: { m: 'positive', v: 'nonzero' },
  // Newtonian p = mv versus relativistic γmv: relative error 1 − 1/γ.
  checks: [({ v }) => relativisticCheck(v, 'momentum', (b) => 1 - Math.sqrt(1 - b * b))],
  residual: ({ p, m, v }) => p - m * v,
});
