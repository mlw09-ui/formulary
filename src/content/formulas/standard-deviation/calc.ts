import { CalcError, defineCalculator } from '../../../lib/calculator';

function sumSq(x: number[]): number {
  const mean = x.reduce((s, v) => s + v, 0) / x.length;
  return x.reduce((s, v) => s + (v - mean) ** 2, 0);
}

export default defineCalculator({
  solve: {
    s: (_, { x }) => {
      if (x!.length < 2) throw new CalcError('The sample standard deviation needs at least 2 values.');
      return Math.sqrt(sumSq(x!) / (x!.length - 1));
    },
    sigma: (_, { x }) => Math.sqrt(sumSq(x!) / x!.length),
  },
  // Both are computed from the data alone, not from each other.
  inputs: { s: ['x'], sigma: ['x'] },
  checks: [
    (_, { x }) => {
      const n = x!.length;
      const mean = x!.reduce((s, v) => s + v, 0) / n;
      return { level: 'info', message: `n = ${n}, mean = ${mean.toPrecision(4)}, variance (sample) = ${n > 1 ? (sumSq(x!) / (n - 1)).toPrecision(4) : 'n/a'}, variance (population) = ${(sumSq(x!) / n).toPrecision(4)}.` };
    },
  ],
});
