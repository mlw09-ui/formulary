import { defineCalculator } from '../../../lib/calculator';

export default defineCalculator({
  solve: {
    x: ({ a, b, c }) => {
      const D = b * b - 4 * a * c;
      if (D < 0) {
        const re = -b / (2 * a);
        const im = Math.sqrt(-D) / (2 * Math.abs(a));
        return [
          { label: 'x₁', value: { re, im } },
          { label: 'x₂', value: { re, im: -im } },
        ];
      }
      if (D === 0) return [{ label: 'x (double root)', value: -b / (2 * a) }];
      // Numerically stable form: avoids catastrophic cancellation when b² ≫ 4ac,
      // which the textbook form suffers from in floating point.
      const q = -0.5 * (b + Math.sign(b || 1) * Math.sqrt(D));
      const r1 = q / a;
      const r2 = c / q;
      const [hi, lo] = r1 >= r2 ? [r1, r2] : [r2, r1];
      return [
        { label: 'x₁', value: hi },
        { label: 'x₂', value: lo },
      ];
    },
  },
  domain: { a: 'nonzero' },
  checks: [
    ({ a, b, c }) => {
      const D = b * b - 4 * a * c;
      const d = Number.isInteger(D) ? String(D) : D.toPrecision(4);
      if (D > 0) return { level: 'info', message: `Discriminant Δ = ${d} > 0: two distinct real roots.` };
      if (D === 0) return { level: 'info', message: 'Discriminant Δ = 0: one repeated real root (the vertex touches the x-axis).' };
      return { level: 'info', message: `Discriminant Δ = ${d} < 0: no real roots; two complex-conjugate roots.` };
    },
  ],
  residual: ({ a, b, c, x }) => a * x * x + b * x + c,
});
