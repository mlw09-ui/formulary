/**
 * Calculator engine. A formula's calc.ts default-exports defineCalculator({...}).
 * This module is pure (no DOM) so it runs identically in tests and in the browser.
 */

export interface Complex { re: number; im: number }
export type Scalar = number | Complex;
/** A solver returns one value, or several labelled ones (both quadratic roots, vector components). */
export type Output = Scalar | Array<{ label: string; value: Scalar }>;
/** Scalar inputs, keyed by variable id. */
export type Values = Record<string, number>;
/** List inputs (data sets, vectors), keyed by variable id. */
export type Lists = Record<string, number[]>;

export type CheckLevel = 'ok' | 'info' | 'warn' | 'error';
export interface Check { level: CheckLevel; message: string }

export type Domain = 'positive' | 'nonnegative' | 'nonzero' | 'probability' | 'any';

/**
 * Throw from a solver when the inputs admit no answer, with a message that
 * explains why (e.g. total internal reflection, legs longer than hypotenuse).
 */
export class CalcError extends Error {}

export interface AuxInput {
  /** Shown as the input label. */
  name: string;
  unit: string | null;
  default: number;
  description: string;
  domain?: Domain;
}

export interface CalculatorDef {
  /** One solver per solvable variable. */
  solve: Record<string, (v: Values, lists: Lists) => Output>;
  /**
   * Inputs per solver. Defaults to every other calculator variable; override it
   * when several outputs share the same inputs (sample and population std dev).
   */
  inputs?: Record<string, string[]>;
  /** Allowed range of each scalar input. Unlisted variables accept any finite number. */
  domain?: Record<string, Domain>;
  /** Inputs that feed validity checks only (e.g. density for Reynolds number). */
  aux?: Record<string, AuxInput>;
  /**
   * Validity checks. Receive the full assignment (inputs + solved value + aux).
   * Used to warn when inputs fall outside the formula's range of validity.
   */
  checks?: Array<(v: Values, lists: Lists) => Check | Check[] | null | undefined>;
  /** LHS − RHS of the equation, used by tests to verify solutions. */
  residual?: (v: Values, lists: Lists) => number;
}

export function defineCalculator(def: CalculatorDef): CalculatorDef {
  return def;
}

export function isComplex(x: unknown): x is Complex {
  return typeof x === 'object' && x !== null && 're' in x && 'im' in x;
}

export function isMulti(o: Output): o is Array<{ label: string; value: Scalar }> {
  return Array.isArray(o);
}

const DOMAIN_TEST: Record<Domain, [(x: number) => boolean, string]> = {
  positive: [(x) => x > 0, 'must be greater than 0'],
  nonnegative: [(x) => x >= 0, 'must be 0 or greater'],
  nonzero: [(x) => x !== 0, 'must not be 0'],
  probability: [(x) => x >= 0 && x <= 1, 'must be between 0 and 1'],
  any: [() => true, ''],
};

/** An input the solver needs; `list` marks data sets / vectors. */
export interface Needed { id: string; list?: boolean }

export interface RunResult {
  output?: Output;
  /** Input-level errors keyed by variable id. */
  inputErrors: Record<string, string>;
  /** Formula-level problems and validity checks. */
  checks: Check[];
}

function scalarIsFinite(s: Scalar): boolean {
  return isComplex(s) ? Number.isFinite(s.re) && Number.isFinite(s.im) : Number.isFinite(s);
}

/** Solve `target` from `inputs`, validating every needed input first. */
export function runCalculator(
  def: CalculatorDef,
  target: string,
  inputs: Record<string, number | number[] | undefined>,
  needed: Needed[],
): RunResult {
  const inputErrors: Record<string, string> = {};
  const values: Values = {};
  const lists: Lists = {};
  for (const { id, list } of needed) {
    const x = inputs[id];
    if (list) {
      if (!Array.isArray(x) || x.length === 0 || !x.every(Number.isFinite)) {
        inputErrors[id] = 'Enter numbers separated by commas';
      } else lists[id] = x;
      continue;
    }
    if (typeof x !== 'number' || !Number.isFinite(x)) {
      inputErrors[id] = 'Enter a number';
      continue;
    }
    const dom = def.domain?.[id] ?? def.aux?.[id]?.domain ?? 'any';
    const [ok, msg] = DOMAIN_TEST[dom];
    if (!ok(x)) inputErrors[id] = msg;
    values[id] = x;
  }
  if (Object.keys(inputErrors).length) return { inputErrors, checks: [] };

  const solver = def.solve[target];
  if (!solver) return { inputErrors, checks: [{ level: 'error', message: `Cannot solve for ${target}.` }] };

  let output: Output;
  try {
    output = solver(values, lists);
  } catch (e) {
    if (e instanceof CalcError) return { inputErrors, checks: [{ level: 'error', message: e.message }] };
    throw e;
  }
  const scalars = isMulti(output) ? output.map((o) => o.value) : [output];
  if (!scalars.every(scalarIsFinite)) {
    return {
      inputErrors,
      checks: [{ level: 'error', message: 'No real solution for these inputs. Check signs and magnitudes.' }],
    };
  }

  // Checks see the solved value only when it is a single real number.
  const full: Values = { ...values };
  if (!isMulti(output) && !isComplex(output)) full[target] = output;

  const checks: Check[] = [];
  for (const check of def.checks ?? []) {
    const r = check(full, lists);
    if (r) checks.push(...(Array.isArray(r) ? r : [r]));
  }
  return { output, inputErrors, checks };
}

// ---------------------------------------------------------------- helpers for calc.ts files

export const DEG = Math.PI / 180;

/** Error function, Abramowitz & Stegun 7.1.26 (|error| < 1.5e-7). */
export function erf(x: number): number {
  const s = Math.sign(x);
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return s * y;
}

