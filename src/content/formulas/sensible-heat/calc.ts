import { defineCalculator } from '../../../lib/calculator';

export default defineCalculator({
  solve: {
    Q: ({ m, c, dT }) => m * c * dT,
    m: ({ Q, c, dT }) => Q / (c * dT),
    c: ({ Q, m, dT }) => Q / (m * dT),
    dT: ({ Q, m, c }) => Q / (m * c),
  },
  domain: { m: 'positive', c: 'positive', dT: 'nonzero', Q: 'nonzero' },
  checks: [
    ({ dT }) =>
      Math.abs(dT) > 200
        ? { level: 'info', message: 'Large temperature range: check that no phase change happens in between and that c is roughly constant over it.' }
        : null,
  ],
  residual: ({ Q, m, c, dT }) => Q - m * c * dT,
});
