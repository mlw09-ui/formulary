import { defineCalculator } from '../../../lib/calculator';

const G = 6.6743e-11; // CODATA 2022

export default defineCalculator({
  solve: {
    F: ({ m1, m2, r }) => (G * m1 * m2) / (r * r),
    m1: ({ F, m2, r }) => (F * r * r) / (G * m2),
    m2: ({ F, m1, r }) => (F * r * r) / (G * m1),
    r: ({ F, m1, m2 }) => Math.sqrt((G * m1 * m2) / F),
  },
  domain: { F: 'positive', m1: 'positive', m2: 'positive', r: 'positive' },
  residual: ({ F, m1, m2, r }) => F - (G * m1 * m2) / (r * r),
});
