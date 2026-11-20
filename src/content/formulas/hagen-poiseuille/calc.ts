import { defineCalculator } from '../../../lib/calculator';
import { formatNumber as fmt } from '../../../lib/format';

/** Reynolds number based on mean velocity and diameter. */
const reynolds = (Q: number, R: number, mu: number, rho: number) =>
  (rho * (Q / (Math.PI * R * R)) * 2 * R) / mu;

export default defineCalculator({
  solve: {
    Q: ({ R, dP, mu, L }) => (Math.PI * R ** 4 * dP) / (8 * mu * L),
    R: ({ Q, dP, mu, L }) => ((8 * mu * L * Q) / (Math.PI * dP)) ** 0.25,
    dP: ({ Q, R, mu, L }) => (8 * mu * L * Q) / (Math.PI * R ** 4),
    mu: ({ Q, R, dP, L }) => (Math.PI * R ** 4 * dP) / (8 * Q * L),
    L: ({ Q, R, dP, mu }) => (Math.PI * R ** 4 * dP) / (8 * mu * Q),
  },
  domain: { Q: 'positive', R: 'positive', dP: 'positive', mu: 'positive', L: 'positive' },
  aux: {
    rho: {
      name: 'Fluid density',
      unit: 'kg/m³',
      default: 998.2,
      description: 'Not in the formula itself; needed to check the Reynolds number. 998.2 kg/m³ is water at 20 °C.',
      domain: 'positive',
    },
  },
  checks: [
    ({ Q, R, mu, rho }) => {
      const Re = reynolds(Q, R, mu, rho);
      const s = Re < 100 ? Re.toFixed(1) : Re.toFixed(0);
      if (Re <= 2300) return { level: 'ok', message: `Re ≈ ${s}: laminar (≤ 2300), so Hagen–Poiseuille applies.` };
      return {
        level: 'warn',
        message: `Re ≈ ${s}: above 2300, so the flow is likely transitional or turbulent. Hagen–Poiseuille is invalid here and underestimates the pressure drop; use Darcy–Weisbach with a turbulent friction factor.`,
      };
    },
    ({ Q, R, mu, rho, L }) => {
      const Re = reynolds(Q, R, mu, rho);
      const Le = 0.05 * Re * 2 * R;
      if (Re > 2300) return null; // entrance-length correlation is for laminar flow
      return Le > 0.1 * L
        ? { level: 'warn', message: `Entrance length ≈ ${fmt(Le)} m is ${(100 * Le / L).toFixed(0)}% of the pipe length. The flow is not fully developed over much of the pipe, so the real pressure drop is higher than predicted.` }
        : { level: 'ok', message: `Entrance length ≈ ${fmt(Le)} m is under 10% of the pipe length, so the flow is fully developed.` };
    },
  ],
  residual: ({ Q, R, dP, mu, L }) => Q - (Math.PI * R ** 4 * dP) / (8 * mu * L),
});

