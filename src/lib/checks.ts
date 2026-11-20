/**
 * Reusable validity checks for calc.ts files.
 */
import type { Check } from './calculator';

/** Speed of light in vacuum, m/s (exact, SI definition). */
export const C_LIGHT = 299_792_458;

/**
 * Newtonian-mechanics validity check (v ≪ c). `relError` is the relative error of
 * the Newtonian quantity versus its relativistic counterpart at speed v.
 */
export function relativisticCheck(v: number, quantity: string, relError: (beta: number) => number): Check | null {
  const beta = Math.abs(v) / C_LIGHT;
  if (beta >= 1) return { level: 'error', message: 'Speed is at or above the speed of light. Impossible for a massive body.' };
  if (beta < 0.01) return null;
  const err = relError(beta) * 100;
  const pct = err < 1 ? err.toFixed(2) : err.toFixed(1);
  return {
    level: beta >= 0.1 ? 'warn' : 'info',
    message: `v = ${beta.toFixed(3)}c: the Newtonian ${quantity} is off by ${pct}% from the relativistic value.${beta >= 0.1 ? ' Use the relativistic formula.' : ''}`,
  };
}

/** Lorentz factor γ = 1/√(1 − β²). */
export const lorentz = (beta: number) => 1 / Math.sqrt(1 - beta * beta);

/** Speed of sound at ISA sea level, m/s. */
export const A_SEA_LEVEL = 340.3;

/**
 * Compressibility check for low-speed aerodynamic coefficients and dynamic pressure.
 * `what` names the data that must match the Mach number (e.g. "lift-coefficient data").
 */
export function machCheck(v: number, a: number, what: string): Check {
  const M = Math.abs(v) / a;
  const m = M.toFixed(2);
  if (M < 0.3) return { level: 'ok', message: `Mach ${m}: incompressible regime; low-speed ${what} apply.` };
  if (M < 0.8) return { level: 'warn', message: `Mach ${m}: compressibility matters. Use ${what} measured at, or corrected to, this Mach number (e.g. Prandtl–Glauert).` };
  return { level: 'warn', message: `Mach ${m}: transonic or supersonic. Low-speed ${what} are not valid; use data for this Mach number.` };
}
