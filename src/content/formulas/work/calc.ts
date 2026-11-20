import { CalcError, DEG, defineCalculator } from '../../../lib/calculator';

export default defineCalculator({
  solve: {
    W: ({ F, d, theta }) => F * d * Math.cos(theta * DEG),
    F: ({ W, d, theta }) => W / (d * Math.cos(theta * DEG)),
    d: ({ W, F, theta }) => W / (F * Math.cos(theta * DEG)),
    theta: ({ W, F, d }) => {
      const c = W / (F * d);
      if (Math.abs(c) > 1) throw new CalcError('|W| cannot exceed F·d: no angle gives this much work.');
      return Math.acos(c) / DEG;
    },
  },
  domain: { F: 'positive', d: 'positive' },
  checks: [
    ({ theta }) => {
      const t = ((theta % 360) + 360) % 360;
      if (Math.abs(t - 90) < 1e-9 || Math.abs(t - 270) < 1e-9) {
        return { level: 'info', message: 'Force perpendicular to the motion: it does no work.' };
      }
      return null;
    },
  ],
  residual: ({ W, F, d, theta }) => W - F * d * Math.cos(theta * DEG),
});
