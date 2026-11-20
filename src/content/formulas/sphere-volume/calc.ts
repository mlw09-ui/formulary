import { defineCalculator } from '../../../lib/calculator';

export default defineCalculator({
  solve: {
    V: ({ r }) => (4 / 3) * Math.PI * r ** 3,
    r: ({ V }) => Math.cbrt((3 * V) / (4 * Math.PI)),
  },
  domain: { V: 'positive', r: 'positive' },
  checks: [({ r }) => ({ level: 'info', message: `Surface area A = 4πr² = ${(4 * Math.PI * r * r).toPrecision(4)}.` })],
  residual: ({ V, r }) => V - (4 / 3) * Math.PI * r ** 3,
});
