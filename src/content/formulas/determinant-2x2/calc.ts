import { CalcError, defineCalculator } from '../../../lib/calculator';

const nonzero = (x: number, name: string) => {
  if (x === 0) throw new CalcError(`Cannot solve: ${name} is 0, so this entry does not affect the determinant.`);
  return x;
};

export default defineCalculator({
  solve: {
    D: ({ a, b, c, d }) => a * d - b * c,
    a: ({ D, b, c, d }) => (D + b * c) / nonzero(d, 'd'),
    d: ({ D, a, b, c }) => (D + b * c) / nonzero(a, 'a'),
    b: ({ D, a, c, d }) => (a * d - D) / nonzero(c, 'c'),
    c: ({ D, a, b, d }) => (a * d - D) / nonzero(b, 'b'),
  },
  checks: [
    ({ D }) =>
      Math.abs(D) < 1e-12
        ? { level: 'info', message: 'Determinant is 0: the matrix is singular (not invertible); its columns are parallel.' }
        : { level: 'info', message: `Invertible. Areas are scaled by ${Math.abs(D).toPrecision(4)}${D < 0 ? ', and orientation is reversed' : ''}.` },
  ],
  residual: ({ D, a, b, c, d }) => D - (a * d - b * c),
});
