import { defineCalculator } from '../../../lib/calculator';
import { A_SEA_LEVEL, machCheck } from '../../../lib/checks';

export default defineCalculator({
  solve: {
    D: ({ rho, v, S, CD }) => 0.5 * rho * v * v * S * CD,
    rho: ({ D, v, S, CD }) => (2 * D) / (v * v * S * CD),
    v: ({ D, rho, S, CD }) => Math.sqrt((2 * D) / (rho * S * CD)),
    S: ({ D, rho, v, CD }) => (2 * D) / (rho * v * v * CD),
    CD: ({ D, rho, v, S }) => (2 * D) / (rho * v * v * S),
  },
  domain: { D: 'positive', rho: 'positive', v: 'positive', S: 'positive', CD: 'positive' },
  aux: {
    a: {
      name: 'Speed of sound',
      unit: 'm/s',
      default: A_SEA_LEVEL,
      description: 'Used to compute the Mach number. 340.3 m/s at ISA sea level; 343 m/s in air at 20 °C.',
      domain: 'positive',
    },
  },
  checks: [({ v, a }) => machCheck(v, a, 'drag-coefficient data')],
  residual: ({ D, rho, v, S, CD }) => D - 0.5 * rho * v * v * S * CD,
});
