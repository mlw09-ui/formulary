import { CalcError, defineCalculator } from '../../../lib/calculator';

function leg(hyp: number, other: number): number {
  if (other >= hyp) throw new CalcError('A leg must be shorter than the hypotenuse.');
  return Math.sqrt(hyp * hyp - other * other);
}

export default defineCalculator({
  solve: {
    c: ({ a, b }) => Math.hypot(a, b),
    a: ({ b, c }) => leg(c, b),
    b: ({ a, c }) => leg(c, a),
  },
  domain: { a: 'positive', b: 'positive', c: 'positive' },
  residual: ({ a, b, c }) => a * a + b * b - c * c,
});
