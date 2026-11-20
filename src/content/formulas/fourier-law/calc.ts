import { defineCalculator } from '../../../lib/calculator';

export default defineCalculator({
  solve: {
    Qdot: ({ k, A, T1, T2, L }) => (k * A * (T1 - T2)) / L,
    k: ({ Qdot, A, T1, T2, L }) => (Qdot * L) / (A * (T1 - T2)),
    A: ({ Qdot, k, T1, T2, L }) => (Qdot * L) / (k * (T1 - T2)),
    T1: ({ Qdot, k, A, T2, L }) => T2 + (Qdot * L) / (k * A),
    T2: ({ Qdot, k, A, T1, L }) => T1 - (Qdot * L) / (k * A),
    L: ({ Qdot, k, A, T1, T2 }) => (k * A * (T1 - T2)) / Qdot,
  },
  domain: { k: 'positive', A: 'positive', L: 'positive' },
  checks: [
    ({ Qdot }) =>
      Qdot < 0 ? { level: 'info', message: 'Negative heat flow: heat flows from side 2 to side 1 (side 2 is hotter).' } : null,
  ],
  residual: ({ Qdot, k, A, T1, T2, L }) => Qdot - (k * A * (T1 - T2)) / L,
});
