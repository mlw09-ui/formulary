import { CalcError, DEG, defineCalculator } from '../../../lib/calculator';

const norm = (v: number[]) => Math.hypot(...v);

export default defineCalculator({
  solve: {
    s: (_, { a, b }) => {
      if (a!.length !== b!.length) throw new CalcError(`The vectors must have the same number of components (got ${a!.length} and ${b!.length}).`);
      return a!.reduce((sum, ai, i) => sum + ai * b![i]!, 0);
    },
  },
  checks: [
    ({ s }, { a, b }) => {
      const na = norm(a!);
      const nb = norm(b!);
      if (na === 0 || nb === 0) return { level: 'info', message: 'A zero vector has no direction, so the angle is undefined.' };
      const cos = Math.max(-1, Math.min(1, s / (na * nb)));
      const theta = Math.acos(cos) / DEG;
      const extra = Math.abs(s) < 1e-12 ? ' The vectors are perpendicular.' : '';
      return { level: 'info', message: `|a| = ${na.toPrecision(4)}, |b| = ${nb.toPrecision(4)}, angle θ = ${theta.toFixed(2)}°.${extra}` };
    },
  ],
  residual: ({ s }, { a, b }) => s - a!.reduce((sum, ai, i) => sum + ai * b![i]!, 0),
});
