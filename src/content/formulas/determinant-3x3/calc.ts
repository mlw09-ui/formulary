import { defineCalculator } from '../../../lib/calculator';

const det3 = (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) =>
  a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);

export default defineCalculator({
  solve: {
    D: ({ a, b, c, d, e, f, g, h, i }) => det3(a, b, c, d, e, f, g, h, i),
  },
  checks: [
    ({ D }) =>
      Math.abs(D) < 1e-12
        ? { level: 'info', message: 'Determinant is 0: the matrix is singular (not invertible); its columns are linearly dependent.' }
        : { level: 'info', message: `Invertible. Volumes are scaled by ${Math.abs(D).toPrecision(4)}${D < 0 ? ', and orientation is reversed' : ''}.` },
  ],
  residual: ({ D, a, b, c, d, e, f, g, h, i }) => D - det3(a, b, c, d, e, f, g, h, i),
});
