import { defineCalculator } from '../../../lib/calculator';

export default defineCalculator({
  solve: {
    A1: ({ v1, A2, v2 }) => (A2 * v2) / v1,
    v1: ({ A1, A2, v2 }) => (A2 * v2) / A1,
    A2: ({ A1, v1, v2 }) => (A1 * v1) / v2,
    v2: ({ A1, v1, A2 }) => (A1 * v1) / A2,
  },
  domain: { A1: 'positive', A2: 'positive', v1: 'positive', v2: 'positive' },
  residual: ({ A1, v1, A2, v2 }) => A1 * v1 - A2 * v2,
});
