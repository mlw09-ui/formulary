import { defineCalculator } from '../../../lib/calculator';

export default defineCalculator({
  solve: {
    dp: ({ f, L, D, rho, v }) => (f * L * rho * v * v) / (2 * D),
    f: ({ dp, L, D, rho, v }) => (2 * D * dp) / (L * rho * v * v),
    L: ({ dp, f, D, rho, v }) => (2 * D * dp) / (f * rho * v * v),
    D: ({ dp, f, L, rho, v }) => (f * L * rho * v * v) / (2 * dp),
    v: ({ dp, f, L, D, rho }) => Math.sqrt((2 * D * dp) / (f * L * rho)),
  },
  domain: { dp: 'positive', f: 'positive', L: 'positive', D: 'positive', rho: 'positive', v: 'positive' },
  aux: {
    mu: {
      name: 'Dynamic viscosity',
      unit: 'Pa·s',
      default: 1.002e-3,
      description: 'Needed to check that f suits the flow regime. 1.002 × 10⁻³ Pa·s is water at 20 °C.',
      domain: 'positive',
    },
  },
  checks: [
    ({ f, D, rho, v, mu }) => {
      const Re = (rho * v * D) / mu;
      const re = Re.toFixed(0);
      if (Re < 2300) {
        const fl = 64 / Re;
        const off = Math.abs(f - fl) / fl;
        return off > 0.05
          ? { level: 'warn', message: `Re ≈ ${re}: laminar, so f should be 64/Re = ${fl.toFixed(4)}, but you entered ${f.toFixed(4)}.` }
          : { level: 'ok', message: `Re ≈ ${re}: laminar, and f matches 64/Re.` };
      }
      if (Re < 4000) {
        return { level: 'warn', message: `Re ≈ ${re}: transitional flow. The friction factor is unpredictable here (between laminar and turbulent values).` };
      }
      // Smooth-pipe lower bound (Haaland with zero roughness).
      const fs = (-1.8 * Math.log10(6.9 / Re)) ** -2;
      return f < 0.95 * fs
        ? { level: 'warn', message: `Re ≈ ${re}: turbulent, so f cannot be below the smooth-pipe value (≈ ${fs.toFixed(4)}). Check f.` }
        : { level: 'ok', message: `Re ≈ ${re}: turbulent. Smooth-pipe f ≈ ${fs.toFixed(4)}; rough pipes have higher f (use the Colebrook equation or Moody chart).` };
    },
  ],
  residual: ({ dp, f, L, D, rho, v }) => dp - (f * L * rho * v * v) / (2 * D),
});
