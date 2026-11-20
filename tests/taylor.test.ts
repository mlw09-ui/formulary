/**
 * Taylor explorer maths. The worked example on the Taylor-series page uses the
 * widget's defaults, so this is the widget's "calculator vs worked example" test.
 */
import { describe, expect, it } from 'vitest';
import { getLibrary } from '../src/lib/content';
import { evaluateTaylor, getTaylorFn, MAX_TERMS, TAYLOR_DEFAULTS, TAYLOR_FUNCTIONS, taylorPoly } from '../src/lib/taylor';

describe('Taylor explorer', () => {
  it('reproduces the worked example (e^0.5 with 4 terms)', () => {
    const { fn, a, x, terms } = TAYLOR_DEFAULTS;
    const r = evaluateTaylor(fn, a, terms, x);
    expect(r.approx).toBeCloseTo(1.6458333333, 9);
    expect(r.exact).toBeCloseTo(1.6487212707, 9);
    expect(r.absError).toBeCloseTo(0.0028879374, 9);
    expect(r.bound!).toBeCloseTo(0.0042935450, 9);
    expect(r.absError).toBeLessThan(r.bound!);
  });

  it('the worked example on the page uses the widget defaults', () => {
    const f = getLibrary().byId.get('taylor-series')!;
    expect(f.calculator).toEqual({ widget: 'taylor' });
    const text = JSON.stringify(f.example);
    expect(text).toContain('1.645833');
    expect(text).toContain('0.00429');
  });

  // Coefficients checked against independent closed forms of the derivatives.
  it.each([
    ['exp', 0.3, (n: number) => Math.exp(0.3) / [1, 1, 2, 6, 24][n]!],
    ['sin', 0.7, (n: number) => [Math.sin(0.7), Math.cos(0.7), -Math.sin(0.7) / 2, -Math.cos(0.7) / 6, Math.sin(0.7) / 24][n]!],
    ['cos', 0.7, (n: number) => [Math.cos(0.7), -Math.sin(0.7), -Math.cos(0.7) / 2, Math.sin(0.7) / 6, Math.cos(0.7) / 24][n]!],
    ['ln1p', 0.5, (n: number) => [Math.log(1.5), 1 / 1.5, -1 / (2 * 1.5 ** 2), 1 / (3 * 1.5 ** 3), -1 / (4 * 1.5 ** 4)][n]!],
    ['geom', 0.5, (n: number) => 2 ** (n + 1)],
  ])('%s coefficients about a = %s', (id, a, expected) => {
    const fn = getTaylorFn(id);
    for (let n = 0; n < 5; n++) expect(fn.coef(n, a)).toBeCloseTo(expected(n), 12);
  });

  it.each(TAYLOR_FUNCTIONS.map((f) => [f.id]))('%s: converges inside the radius of convergence', (id) => {
    const fn = getTaylorFn(id);
    const a = 0.2;
    const x = a + 0.5 * Math.min(fn.radius(a), 2);
    const errors = [3, 6, 9, MAX_TERMS].map((n) => Math.abs(taylorPoly(fn, a, n, x) - fn.f(x)));
    for (let i = 1; i < errors.length; i++) expect(errors[i]!).toBeLessThan(errors[i - 1]!);
    expect(errors.at(-1)!).toBeLessThan(1e-4);
  });

  it('diverges outside the radius of convergence (ln(1+x) at x = 1.5)', () => {
    const r5 = evaluateTaylor('ln1p', 0, 5, 1.5);
    const r15 = evaluateTaylor('ln1p', 0, 15, 1.5);
    expect(r5.status).toBe('outside');
    expect(r15.absError).toBeGreaterThan(r5.absError);
  });

  it('classifies the boundary of convergence', () => {
    expect(evaluateTaylor('geom', 0, 5, -1).status).toBe('boundary');
    expect(evaluateTaylor('geom', 0, 5, 0.5).status).toBe('inside');
  });

  it('Lagrange bound always holds where it is defined', () => {
    for (const id of ['exp', 'sin', 'cos']) {
      for (const [a, x] of [[0, 2], [1, -1.5], [-0.5, 3]] as const) {
        for (let n = 1; n <= MAX_TERMS; n++) {
          const r = evaluateTaylor(id, a, n, x);
          expect(r.absError, `${id} a=${a} x=${x} n=${n}`).toBeLessThanOrEqual(r.bound! * (1 + 1e-9) + 1e-15);
        }
      }
    }
  });

  it('rejects invalid centres and points', () => {
    expect(getTaylorFn('ln1p').centreError(-1)).toMatch(/greater than −1/);
    expect(getTaylorFn('geom').pointError(1)).toMatch(/undefined/);
    expect(getTaylorFn('exp').centreError(5)).toBeNull();
  });
});
