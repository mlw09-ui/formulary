import { defineCalculator, erf } from '../../../lib/calculator';

const pdf = (x: number, mu: number, sigma: number) =>
  Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma)) / (sigma * Math.sqrt(2 * Math.PI));

export default defineCalculator({
  solve: {
    f: ({ x, mu, sigma }) => pdf(x, mu, sigma),
  },
  domain: { sigma: 'positive' },
  checks: [
    ({ x, mu, sigma }) => {
      const z = (x - mu) / sigma;
      const cdf = 0.5 * (1 + erf(z / Math.SQRT2));
      return {
        level: 'info',
        message: `z = ${z.toFixed(3)}. P(X ≤ x) = ${(cdf * 100).toFixed(2)}%, P(X > x) = ${((1 - cdf) * 100).toFixed(2)}%. f(x) is a density, not a probability.`,
      };
    },
  ],
  residual: ({ f, x, mu, sigma }) => f - pdf(x, mu, sigma),
});
