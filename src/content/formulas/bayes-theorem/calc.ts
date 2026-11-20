import { CalcError, defineCalculator } from '../../../lib/calculator';

const nonzero = (x: number, name: string) => {
  if (x === 0) throw new CalcError(`${name} is 0, so the equation cannot be solved for this variable.`);
  return x;
};

export default defineCalculator({
  solve: {
    pAgB: ({ pBgA, pA, pB }) => (pBgA * pA) / nonzero(pB, 'P(B)'),
    pBgA: ({ pAgB, pA, pB }) => (pAgB * pB) / nonzero(pA, 'P(A)'),
    pA: ({ pAgB, pBgA, pB }) => (pAgB * pB) / nonzero(pBgA, 'P(B|A)'),
    pB: ({ pAgB, pBgA, pA }) => (pBgA * pA) / nonzero(pAgB, 'P(A|B)'),
  },
  domain: { pAgB: 'probability', pBgA: 'probability', pA: 'probability', pB: 'probability' },
  checks: [
    ({ pAgB, pBgA, pA, pB }) => {
      const vals = [pAgB, pBgA, pA, pB];
      if (vals.some((v) => v > 1 + 1e-12 || v < 0)) {
        return { level: 'error', message: 'A probability came out outside 0–1, so these inputs are inconsistent. P(B) must be at least P(B|A)·P(A).' };
      }
      return pB < pBgA * pA - 1e-12
        ? { level: 'error', message: 'Inconsistent: P(B) cannot be smaller than P(B|A)·P(A), the probability of B occurring together with A.' }
        : null;
    },
  ],
  residual: ({ pAgB, pBgA, pA, pB }) => pAgB * pB - pBgA * pA,
});
