import { defineCalculator } from '../../../lib/calculator';
import { relativisticCheck } from '../../../lib/checks';

export default defineCalculator({
  solve: {
    F: ({ m, v, r }) => (m * v * v) / r,
    m: ({ F, v, r }) => (F * r) / (v * v),
    v: ({ F, m, r }) => Math.sqrt((F * r) / m),
    r: ({ F, m, v }) => (m * v * v) / F,
  },
  domain: { F: 'positive', m: 'positive', v: 'positive', r: 'positive' },
  checks: [({ v }) => relativisticCheck(v, 'force', (b) => 1 - Math.sqrt(1 - b * b))],
  residual: ({ F, m, v, r }) => F - (m * v * v) / r,
});
