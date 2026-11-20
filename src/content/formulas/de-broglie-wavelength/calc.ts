import { defineCalculator } from '../../../lib/calculator';

const H = 6.62607015e-34; // J·s, exact

export default defineCalculator({
  solve: {
    lambda: ({ p }) => H / p,
    p: ({ lambda }) => H / lambda,
  },
  domain: { lambda: 'positive', p: 'positive' },
  residual: ({ lambda, p }) => lambda - H / p,
});
