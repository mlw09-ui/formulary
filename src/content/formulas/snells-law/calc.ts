import { CalcError, DEG, defineCalculator } from '../../../lib/calculator';

function refract(nIn: number, theta: number, nOut: number): number {
  const s = (nIn * Math.sin(theta * DEG)) / nOut;
  if (Math.abs(s) > 1) {
    const crit = Math.asin(nOut / nIn) / DEG;
    throw new CalcError(`Total internal reflection: no refracted ray. The critical angle is ${crit.toFixed(2)}°, and the incidence angle exceeds it.`);
  }
  return Math.asin(s) / DEG;
}

export default defineCalculator({
  solve: {
    th2: ({ n1, th1, n2 }) => refract(n1, th1, n2),
    th1: ({ n1, n2, th2 }) => refract(n2, th2, n1),
    n1: ({ th1, n2, th2 }) => (n2 * Math.sin(th2 * DEG)) / Math.sin(th1 * DEG),
    n2: ({ n1, th1, th2 }) => (n1 * Math.sin(th1 * DEG)) / Math.sin(th2 * DEG),
  },
  domain: { n1: 'positive', n2: 'positive' },
  checks: [
    ({ th1, th2 }) =>
      Math.abs(th1) >= 90 || Math.abs(th2) >= 90
        ? { level: 'error', message: 'Angles are measured from the normal and must be below 90°.' }
        : null,
    ({ n1, n2 }) => {
      if (n1 > n2) {
        const crit = Math.asin(n2 / n1) / DEG;
        return { level: 'info', message: `Going into a less dense medium: total internal reflection above ${crit.toFixed(2)}°.` };
      }
      return null;
    },
  ],
  residual: ({ n1, th1, n2, th2 }) => n1 * Math.sin(th1 * DEG) - n2 * Math.sin(th2 * DEG),
});
