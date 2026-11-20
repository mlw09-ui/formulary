import { CalcError, DEG, defineCalculator, type Output } from '../../../lib/calculator';

const sin = (deg: number) => Math.sin(deg * DEG);

/** Solve an angle opposite `side`, given the other side–angle pair. Handles the ambiguous SSA case. */
function angle(side: number, otherSide: number, otherAngle: number): Output {
  const s = (side * sin(otherAngle)) / otherSide;
  if (s > 1) throw new CalcError('No triangle exists with these values: the side is too long for the given angle.');
  const acute = Math.asin(s) / DEG;
  const obtuse = 180 - acute;
  const options = [acute, obtuse].filter((x, i) => otherAngle + x < 180 && (i === 0 || Math.abs(obtuse - acute) > 1e-9));
  if (options.length === 0) throw new CalcError('No triangle exists: the two angles would sum to 180° or more.');
  if (options.length === 1) return options[0]!;
  return [
    { label: 'acute solution', value: acute },
    { label: 'obtuse solution', value: obtuse },
  ];
}

export default defineCalculator({
  solve: {
    b: ({ a, A, B }) => (a * sin(B)) / sin(A),
    a: ({ b, A, B }) => (b * sin(A)) / sin(B),
    B: ({ a, A, b }) => angle(b, a, A),
    A: ({ a, b, B }) => angle(a, b, B),
  },
  domain: { a: 'positive', b: 'positive', A: 'positive', B: 'positive' },
  checks: [
    ({ A, B }) => (A + B >= 180 ? { level: 'error', message: 'A + B must be less than 180°.' } : null),
    ({ a, A, B }) => {
      if (A === undefined || B === undefined || A + B >= 180) return null;
      const C = 180 - A - B;
      return { level: 'info', message: `Third angle C = ${C.toFixed(2)}°, side c = ${((a * sin(C)) / sin(A)).toPrecision(4)}, circumradius R = ${(a / (2 * sin(A))).toPrecision(4)}.` };
    },
  ],
  residual: ({ a, A, b, B }) => a * sin(B) - b * sin(A),
});
