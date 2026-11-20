import { CalcError, defineCalculator } from '../../../lib/calculator';

function cross(a: number[], b: number[]): [number, number, number] {
  if (a.length !== 3 || b.length !== 3) {
    throw new CalcError(`The cross product needs two 3-component vectors (got ${a.length} and ${b.length}).`);
  }
  const [a1, a2, a3] = a as [number, number, number];
  const [b1, b2, b3] = b as [number, number, number];
  return [a2 * b3 - a3 * b2, a3 * b1 - a1 * b3, a1 * b2 - a2 * b1];
}

export default defineCalculator({
  solve: {
    x: (_, { a, b }) => {
      const [x1, x2, x3] = cross(a!, b!);
      return [
        { label: 'x-component', value: x1 },
        { label: 'y-component', value: x2 },
        { label: 'z-component', value: x3 },
      ];
    },
  },
  checks: [
    (_, { a, b }) => {
      const len = Math.hypot(...cross(a!, b!));
      return len < 1e-12
        ? { level: 'info', message: 'The vectors are parallel (or one is zero), so the cross product is the zero vector.' }
        : { level: 'info', message: `Length |a × b| = ${len.toPrecision(4)}, the area of the parallelogram spanned by a and b.` };
    },
  ],
});
