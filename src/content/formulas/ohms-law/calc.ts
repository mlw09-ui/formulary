import { defineCalculator } from '../../../lib/calculator';

export default defineCalculator({
  solve: {
    V: ({ I, R }) => I * R,
    I: ({ V, R }) => V / R,
    R: ({ V, I }) => V / I,
  },
  domain: { R: 'positive', I: 'nonzero' },
  checks: [({ V, I }) => ({ level: 'info', message: `Power dissipated: P = VI = ${Math.abs(V * I).toPrecision(4)} W.` })],
  residual: ({ V, I, R }) => V - I * R,
});
