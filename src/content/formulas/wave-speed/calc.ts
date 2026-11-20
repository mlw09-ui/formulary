import { defineCalculator } from '../../../lib/calculator';

export default defineCalculator({
  solve: {
    v: ({ f, lambda }) => f * lambda,
    f: ({ v, lambda }) => v / lambda,
    lambda: ({ v, f }) => v / f,
  },
  domain: { v: 'positive', f: 'positive', lambda: 'positive' },
  residual: ({ v, f, lambda }) => v - f * lambda,
});
