import { defineCalculator } from '../../../lib/calculator';
import { C_LIGHT } from '../../../lib/checks';

const C2 = C_LIGHT * C_LIGHT;

export default defineCalculator({
  solve: {
    E: ({ m }) => m * C2,
    m: ({ E }) => E / C2,
  },
  domain: { E: 'nonnegative', m: 'nonnegative' },
  checks: [
    ({ E }) => ({ level: 'info', message: `Equivalent to ${(E / 4.184e12).toPrecision(3)} kilotons of TNT, or ${(E / 3.6e12).toPrecision(3)} GWh.` }),
  ],
  residual: ({ E, m }) => E - m * C2,
});
