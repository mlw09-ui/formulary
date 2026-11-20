import { defineCalculator } from '../../../lib/calculator';

const R_EARTH = 6.371e6; // mean Earth radius, m (IUGG)

export default defineCalculator({
  solve: {
    U: ({ m, g, h }) => m * g * h,
    m: ({ U, g, h }) => U / (g * h),
    g: ({ U, m, h }) => U / (m * h),
    h: ({ U, m, g }) => U / (m * g),
  },
  domain: { m: 'positive', g: 'positive', h: 'nonzero' },
  checks: [
    ({ g, h }) => {
      // The uniform-field check is only meaningful near Earth's surface.
      if (g < 9.7 || g > 9.9) return null;
      const err = Math.abs(h) / (R_EARTH + Math.abs(h));
      return err > 0.01
        ? { level: 'warn', message: `h is ${(Math.abs(h) / 1000).toFixed(0)} km: gravity weakens with height, so mgh is off by about ${(err * 100).toFixed(1)}%. Use U = −GMm/r.` }
        : null;
    },
  ],
  residual: ({ U, m, g, h }) => U - m * g * h,
});
