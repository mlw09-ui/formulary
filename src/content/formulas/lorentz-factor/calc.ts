import { CalcError, defineCalculator } from '../../../lib/calculator';
import { C_LIGHT } from '../../../lib/checks';

export default defineCalculator({
  solve: {
    gamma: ({ v }) => {
      if (Math.abs(v) >= C_LIGHT) throw new CalcError('v must be below the speed of light (299 792 458 m/s).');
      return 1 / Math.sqrt(1 - (v / C_LIGHT) ** 2);
    },
    v: ({ gamma }) => {
      if (gamma < 1) throw new CalcError('γ cannot be less than 1.');
      return C_LIGHT * Math.sqrt(1 - 1 / (gamma * gamma));
    },
  },
  checks: [
    ({ v }) => ({ level: 'info', message: `v = ${(Math.abs(v) / C_LIGHT).toPrecision(4)}c` }),
    ({ gamma }) =>
      gamma - 1 < 0.01
        ? { level: 'info', message: `γ − 1 = ${(gamma - 1).toExponential(2)}: relativistic effects under 1%, so Newtonian mechanics is adequate here.` }
        : null,
  ],
  residual: ({ gamma, v }) => gamma - 1 / Math.sqrt(1 - (v / C_LIGHT) ** 2),
});
