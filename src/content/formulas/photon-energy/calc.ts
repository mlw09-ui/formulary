import { defineCalculator } from '../../../lib/calculator';
import { C_LIGHT } from '../../../lib/checks';

const H = 6.62607015e-34; // J·s, exact
const EV = 1.602176634e-19; // J, exact

function band(lambda: number): string {
  const nm = lambda * 1e9;
  if (nm < 0.01) return 'gamma rays';
  if (nm < 10) return 'X-rays';
  if (nm < 380) return 'ultraviolet';
  if (nm <= 750) return 'visible light';
  if (nm < 1e6) return 'infrared';
  return 'microwaves / radio';
}

export default defineCalculator({
  solve: {
    E: ({ f }) => H * f,
    f: ({ E }) => E / H,
  },
  domain: { E: 'positive', f: 'positive' },
  checks: [
    ({ E, f }) => {
      const lambda = C_LIGHT / f;
      return { level: 'info', message: `E = ${(E / EV).toPrecision(4)} eV; vacuum wavelength λ = ${(lambda * 1e9).toPrecision(4)} nm (${band(lambda)}).` };
    },
  ],
  residual: ({ E, f }) => E - H * f,
});
