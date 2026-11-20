import { defineCalculator } from '../../../lib/calculator';

export default defineCalculator({
  solve: {
    C: ({ r }) => 2 * Math.PI * r,
    r: ({ C }) => C / (2 * Math.PI),
  },
  domain: { C: 'positive', r: 'positive' },
  checks: [({ r }) => ({ level: 'info', message: `Diameter d = ${(2 * r).toPrecision(4)}; enclosed area A = ${(Math.PI * r * r).toPrecision(4)}.` })],
  residual: ({ C, r }) => C - 2 * Math.PI * r,
});
