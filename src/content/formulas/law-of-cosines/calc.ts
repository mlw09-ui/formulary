import { CalcError, DEG, defineCalculator, type Output } from '../../../lib/calculator';

const cos = (deg: number) => Math.cos(deg * DEG);

/** Solve an adjacent side x from c² = x² + o² − 2xo·cos C (a quadratic in x). */
function adjacent(c: number, other: number, C: number): Output {
  const disc = c * c - other * other * (1 - cos(C) ** 2);
  if (disc < 0) throw new CalcError('No triangle exists with these values: side c is too short for this angle.');
  const roots = [other * cos(C) + Math.sqrt(disc), other * cos(C) - Math.sqrt(disc)].filter((x) => x > 1e-12);
  const unique = roots.filter((x, i) => i === 0 || Math.abs(x - roots[0]!) > 1e-9);
  if (unique.length === 0) throw new CalcError('No triangle exists with these values.');
  if (unique.length === 1) return unique[0]!;
  return unique.map((value, i) => ({ label: `solution ${i + 1}`, value }));
}

export default defineCalculator({
  solve: {
    c: ({ a, b, C }) => Math.sqrt(a * a + b * b - 2 * a * b * cos(C)),
    C: ({ a, b, c }) => {
      const x = (a * a + b * b - c * c) / (2 * a * b);
      if (Math.abs(x) > 1) throw new CalcError('These sides violate the triangle inequality (each side must be shorter than the other two combined).');
      return Math.acos(x) / DEG;
    },
    a: ({ b, c, C }) => adjacent(c, b, C),
    b: ({ a, c, C }) => adjacent(c, a, C),
  },
  domain: { a: 'positive', b: 'positive', c: 'positive', C: 'positive' },
  checks: [
    ({ C }) => (C >= 180 ? { level: 'error', message: 'An interior angle must be less than 180°.' } : null),
    ({ C }) => (Math.abs(C - 90) < 1e-9 ? { level: 'info', message: 'C = 90°: this is the Pythagorean theorem.' } : null),
  ],
  residual: ({ a, b, c, C }) => c * c - (a * a + b * b - 2 * a * b * cos(C)),
});
