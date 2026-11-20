import { defineCalculator } from '../../../lib/calculator';

export default defineCalculator({
  solve: {
    F: ({ m, a }) => m * a,
    m: ({ F, a }) => F / a,
    a: ({ F, m }) => F / m,
  },
  domain: { m: 'positive' },
  residual: ({ F, m, a }) => F - m * a,
});
