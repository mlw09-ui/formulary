import { defineCalculator } from '../../../lib/calculator';

export default defineCalculator({
  solve: {
    A: ({ r }) => Math.PI * r * r,
    r: ({ A }) => Math.sqrt(A / Math.PI),
  },
  domain: { A: 'positive', r: 'positive' },
  checks: [({ r }) => ({ level: 'info', message: `Diameter d = ${(2 * r).toPrecision(4)}; circumference C = ${(2 * Math.PI * r).toPrecision(4)}.` })],
  residual: ({ A, r }) => A - Math.PI * r * r,
});
