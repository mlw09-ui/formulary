/**
 * Generic calculator tests. Every formula with a calculator is tested automatically:
 * adding a formula adds its tests, with no test code to write.
 *
 * 1. Worked example: the calculator reproduces every value in example.expected.
 * 2. Round trip: solving each solvable variable back from the full solution
 *    recovers its value (for multi-valued solvers, one of the returned values).
 * 3. Residual: the full solution satisfies the equation (LHS − RHS ≈ 0).
 * 4. Validity checks report no errors on the worked example.
 */
import { describe, expect, it } from 'vitest';
import { getLibrary, neededFor } from '../src/lib/content';
import { isComplex, isMulti, runCalculator, type Output, type Scalar } from '../src/lib/calculator';

const lib = getLibrary();
const withCalc = lib.formulas.filter((f) => lib.calculators.has(f.id));

type Expected = number | number[] | { re: number; im: number };

function scalars(out: Output): Scalar[] {
  return isMulti(out) ? out.map((o) => o.value) : [out];
}

function close(a: number, e: number, relTol: number): boolean {
  return Math.abs(a - e) <= relTol * Math.max(Math.abs(e), 1e-300) || Math.abs(a - e) < 1e-12;
}

function closeScalar(a: Scalar, e: Scalar, tol: number): boolean {
  if (isComplex(a) || isComplex(e)) {
    const ac = isComplex(a) ? a : { re: a, im: 0 };
    const ec = isComplex(e) ? e : { re: e, im: 0 };
    const scale = Math.max(Math.hypot(ec.re, ec.im), 1e-300);
    return Math.hypot(ac.re - ec.re, ac.im - ec.im) <= tol * scale || Math.hypot(ac.re - ec.re, ac.im - ec.im) < 1e-12;
  }
  return close(a, e, tol);
}

function expectedScalars(e: Expected): Scalar[] {
  return Array.isArray(e) ? e : [e];
}

describe('content', () => {
  it('loads and validates', () => {
    expect(lib.formulas.length).toBeGreaterThan(0);
  });
  it('has at least one calculator to test', () => {
    expect(withCalc.length).toBeGreaterThan(0);
  });
});

describe.each(withCalc.map((f) => [f.id, f] as const))('calculator: %s', (_id, f) => {
  const calc = lib.calculators.get(f.id)!;
  const ex = f.example;
  const auxDefaults = Object.fromEntries(Object.entries(calc.aux ?? {}).map(([k, a]) => [k, a.default]));
  const given: Record<string, number | number[]> = { ...auxDefaults, ...ex.given };
  const expected = Object.entries(ex.expected ?? {}) as Array<[string, Expected]>;
  const run = (target: string, inputs: Record<string, number | number[]>) =>
    runCalculator(calc, target, inputs, neededFor(f, calc, target));

  it.each(expected)('reproduces the worked example: %s', (target, exp) => {
    const r = run(target, given);
    expect(r.inputErrors).toEqual({});
    expect(r.checks.filter((c) => c.level === 'error'), 'error checks').toEqual([]);
    expect(r.output, 'calculator returned no output').toBeDefined();
    const actual = scalars(r.output!);
    const want = expectedScalars(exp);
    expect(actual.length, `number of results for ${target}`).toBe(want.length);
    want.forEach((w, i) => {
      expect(closeScalar(actual[i]!, w, ex.tolerance), `${target}[${i}] = ${JSON.stringify(actual[i])}, expected ${JSON.stringify(w)} ±${ex.tolerance * 100}%`).toBe(true);
    });
  });

  // Full solution: given values plus the calculator's exact (unrounded) result for
  // every single real expected value.
  const full: Record<string, number | number[]> = { ...given };
  for (const [k, e] of expected) {
    const out = typeof e === 'number' ? run(k, given).output : undefined;
    if (typeof out === 'number') full[k] = out;
  }

  it('round-trips through every solver whose inputs are known', () => {
    let tested = 0;
    for (const target of Object.keys(calc.solve)) {
      const want = full[target];
      if (typeof want !== 'number') continue;
      const needed = neededFor(f, calc, target);
      if (!needed.every((n) => n.id in full)) continue;
      const r = run(target, full);
      expect(r.inputErrors, `inputs for solving ${target}`).toEqual({});
      expect(r.output, `solving ${target}: ${JSON.stringify(r.checks)}`).toBeDefined();
      const got = scalars(r.output!);
      expect(got.some((g) => closeScalar(g, want, 1e-6)), `${target}: got ${JSON.stringify(got)}, expected ${want}`).toBe(true);
      tested++;
    }
    // With a single solver, the worked-example test already covers it.
    if (Object.keys(calc.solve).length > 1) expect(tested, 'no solver could be round-tripped').toBeGreaterThan(0);
  });

  it('satisfies the equation (residual ≈ 0)', () => {
    if (!calc.residual) return;
    const target = ex.solveFor!;
    const r = run(target, given);
    for (const x of scalars(r.output!)) {
      if (isComplex(x)) continue;
      const scal = Object.fromEntries(Object.entries({ ...full, [target]: x }).filter(([, v]) => typeof v === 'number')) as Record<string, number>;
      const lists = Object.fromEntries(Object.entries(full).filter(([, v]) => Array.isArray(v))) as Record<string, number[]>;
      const res = calc.residual(scal, lists);
      expect(Math.abs(res) / Math.max(Math.abs(x), 1)).toBeLessThan(1e-9);
    }
  });
});
