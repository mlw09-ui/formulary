import { defineCalculator } from '../../../lib/calculator';

export default defineCalculator({
  solve: {
    CDi: ({ CL, e, AR }) => (CL * CL) / (Math.PI * e * AR),
    // C_L enters squared, so only its magnitude is recoverable.
    CL: ({ CDi, e, AR }) => Math.sqrt(CDi * Math.PI * e * AR),
    e: ({ CDi, CL, AR }) => (CL * CL) / (Math.PI * CDi * AR),
    AR: ({ CDi, CL, e }) => (CL * CL) / (Math.PI * e * CDi),
  },
  domain: { CDi: 'positive', CL: 'nonzero', e: 'positive', AR: 'positive' },
  checks: [
    ({ e }) =>
      e > 1
        ? { level: 'warn', message: `e = ${e.toFixed(2)} > 1 is not possible for a planar wing: e = 1 is the ideal elliptical distribution.` }
        : e < 0.5
          ? { level: 'warn', message: `e = ${e.toFixed(2)} is unusually low; typical aircraft have 0.7–0.85.` }
          : null,
    ({ AR }) =>
      AR < 4
        ? { level: 'warn', message: `Aspect ratio ${AR.toFixed(1)} is low. Lifting-line theory is inaccurate below about 4 (delta and strake wings behave differently).` }
        : null,
  ],
  residual: ({ CDi, CL, e, AR }) => CDi - (CL * CL) / (Math.PI * e * AR),
});
