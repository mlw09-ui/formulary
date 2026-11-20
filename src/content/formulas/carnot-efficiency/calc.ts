import { CalcError, defineCalculator } from '../../../lib/calculator';

export default defineCalculator({
  solve: {
    eta: ({ Tc, Th }) => {
      if (Tc >= Th) throw new CalcError('T_C must be lower than T_H. With no temperature difference a heat engine produces no work.');
      return 1 - Tc / Th;
    },
    Tc: ({ eta, Th }) => Th * (1 - eta),
    Th: ({ eta, Tc }) => Tc / (1 - eta),
  },
  domain: { Tc: 'positive', Th: 'positive' },
  checks: [
    ({ eta }) =>
      eta <= 0 || eta >= 1
        ? { level: 'error', message: 'Efficiency must be strictly between 0 and 1.' }
        : null,
    ({ Tc, Th }) =>
      Math.min(Tc, Th) < 150
        ? { level: 'warn', message: 'A temperature below 150 K: did you enter °C instead of kelvin?' }
        : null,
  ],
  residual: ({ eta, Tc, Th }) => eta - (1 - Tc / Th),
});
