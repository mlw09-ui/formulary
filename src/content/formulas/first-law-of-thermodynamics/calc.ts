import { defineCalculator } from '../../../lib/calculator';

export default defineCalculator({
  solve: {
    dU: ({ Q, W }) => Q - W,
    Q: ({ dU, W }) => dU + W,
    W: ({ dU, Q }) => Q - dU,
  },
  checks: [
    () => ({ level: 'info', message: 'Convention: Q is heat added to the system, W is work done by the system.' }),
  ],
  residual: ({ dU, Q, W }) => dU - (Q - W),
});
