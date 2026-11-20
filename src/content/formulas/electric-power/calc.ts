import { defineCalculator } from '../../../lib/calculator';

export default defineCalculator({
  solve: {
    P: ({ V, I }) => V * I,
    V: ({ P, I }) => P / I,
    I: ({ P, V }) => P / V,
  },
  domain: { V: 'nonzero', I: 'nonzero' },
  checks: [
    ({ V, I }) => ({ level: 'info', message: `If the load is a resistor, R = V/I = ${(V / I).toPrecision(4)} Ω.` }),
  ],
  residual: ({ P, V, I }) => P - V * I,
});
