import { defineCalculator } from '../../../lib/calculator';

export default defineCalculator({
  solve: {
    M: ({ v, a }) => v / a,
    v: ({ M, a }) => M * a,
    a: ({ M, v }) => v / M,
  },
  domain: { M: 'positive', v: 'positive', a: 'positive' },
  checks: [
    ({ M }) => {
      const m = M.toFixed(2);
      if (M < 0.3) return { level: 'info', message: `Mach ${m}: low subsonic. The flow is effectively incompressible.` };
      if (M < 0.8) return { level: 'info', message: `Mach ${m}: subsonic, but compressibility affects pressures and coefficients.` };
      if (M < 1.2) return { level: 'info', message: `Mach ${m}: transonic. Local shocks form, and drag rises sharply.` };
      if (M < 5) return { level: 'info', message: `Mach ${m}: supersonic. A shock forms ahead of the body.` };
      return { level: 'info', message: `Mach ${m}: hypersonic. Shock heating and real-gas effects dominate.` };
    },
  ],
  residual: ({ M, v, a }) => M - v / a,
});
