import { defineCalculator } from '../../../lib/calculator';

export default defineCalculator({
  solve: {
    p: ({ p0, rho, g, h }) => p0 + rho * g * h,
    p0: ({ p, rho, g, h }) => p - rho * g * h,
    rho: ({ p, p0, g, h }) => (p - p0) / (g * h),
    g: ({ p, p0, rho, h }) => (p - p0) / (rho * h),
    h: ({ p, p0, rho, g }) => (p - p0) / (rho * g),
  },
  domain: { rho: 'positive', g: 'positive', h: 'nonzero', p0: 'nonnegative' },
  checks: [
    ({ p }) =>
      p < 0 ? { level: 'error', message: 'Negative absolute pressure is impossible. Check p₀ and the sign of h.' } : null,
    ({ rho, h }) =>
      rho < 100 && Math.abs(h) > 300
        ? { level: 'warn', message: 'Low density suggests a gas. Over several hundred metres its density changes, so the linear law is inaccurate.' }
        : null,
  ],
  residual: ({ p, p0, rho, g, h }) => p - p0 - rho * g * h,
});
