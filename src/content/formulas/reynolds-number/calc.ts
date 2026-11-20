import { defineCalculator } from '../../../lib/calculator';

export default defineCalculator({
  solve: {
    Re: ({ rho, v, L, mu }) => (rho * v * L) / mu,
    rho: ({ Re, v, L, mu }) => (Re * mu) / (v * L),
    v: ({ Re, rho, L, mu }) => (Re * mu) / (rho * L),
    L: ({ Re, rho, v, mu }) => (Re * mu) / (rho * v),
    mu: ({ Re, rho, v, L }) => (rho * v * L) / Re,
  },
  domain: { Re: 'positive', rho: 'positive', v: 'positive', L: 'positive', mu: 'positive' },
  checks: [
    ({ Re }) => {
      const s = Re < 100 ? Re.toFixed(1) : Re.toFixed(0);
      if (Re < 2300) return { level: 'info', message: `Re ≈ ${s}. For pipe flow (L = diameter): laminar.` };
      if (Re < 4000) return { level: 'info', message: `Re ≈ ${s}. For pipe flow: transitional, so the flow may switch between laminar and turbulent.` };
      return { level: 'info', message: `Re ≈ ${s}. For pipe flow: turbulent. (Critical values differ for other geometries.)` };
    },
  ],
  residual: ({ Re, rho, v, L, mu }) => Re - (rho * v * L) / mu,
});
