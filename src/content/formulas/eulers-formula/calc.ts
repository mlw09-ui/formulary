import { defineCalculator } from '../../../lib/calculator';

export default defineCalculator({
  solve: {
    z: ({ theta }) => ({ re: Math.cos(theta), im: Math.sin(theta) }),
  },
  checks: [
    ({ theta }) => {
      const deg = (theta * 180) / Math.PI;
      const turns = theta / (2 * Math.PI);
      return { level: 'info', message: `θ = ${deg.toPrecision(5)}° (${turns.toPrecision(4)} turns). The result always has modulus |z| = 1.` };
    },
  ],
});
