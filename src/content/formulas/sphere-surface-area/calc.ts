import { defineCalculator } from '../../../lib/calculator';

export default defineCalculator({
  solve: {
    A: ({ r }) => 4 * Math.PI * r * r,
    r: ({ A }) => Math.sqrt(A / (4 * Math.PI)),
  },
  domain: { A: 'positive', r: 'positive' },
  residual: ({ A, r }) => A - 4 * Math.PI * r * r,
});
