import { defineCalculator } from '../../../lib/calculator';

const EPS0 = 8.8541878188e-12; // F/m, CODATA 2022
const K = 1 / (4 * Math.PI * EPS0);

export default defineCalculator({
  solve: {
    F: ({ q1, q2, r }) => (K * q1 * q2) / (r * r),
    q1: ({ F, q2, r }) => (F * r * r) / (K * q2),
    q2: ({ F, q1, r }) => (F * r * r) / (K * q1),
    // F must have the same sign as q₁q₂, otherwise the square root is NaN → "no real solution".
    r: ({ F, q1, q2 }) => Math.sqrt((K * q1 * q2) / F),
  },
  domain: { q1: 'nonzero', q2: 'nonzero', r: 'positive', F: 'nonzero' },
  checks: [
    ({ F }) => ({ level: 'info', message: F > 0 ? 'Positive force: the charges repel (like signs).' : 'Negative force: the charges attract (opposite signs).' }),
  ],
  residual: ({ F, q1, q2, r }) => F - (K * q1 * q2) / (r * r),
});
