import { defineCalculator } from '../../../lib/calculator';

export default defineCalculator({
  solve: {
    xbar: (_, { x }) => x!.reduce((s, v) => s + v, 0) / x!.length,
  },
  checks: [
    (_, { x }) => {
      const sorted = [...x!].sort((p, q) => p - q);
      const n = sorted.length;
      const median = n % 2 ? sorted[(n - 1) / 2]! : (sorted[n / 2 - 1]! + sorted[n / 2]!) / 2;
      return { level: 'info', message: `n = ${n}, sum = ${x!.reduce((s, v) => s + v, 0).toPrecision(6)}, median = ${median.toPrecision(4)}.` };
    },
  ],
  residual: ({ xbar }, { x }) => xbar - x!.reduce((s, v) => s + v, 0) / x!.length,
});
