/**
 * Taylor-series explorer: pure maths, shared by the widget and the tests.
 *
 * Each function supplies its Taylor coefficients c_n = f⁽ⁿ⁾(a)/n! directly
 * (never n! itself, which overflows), its radius of convergence about a, and,
 * where it exists in closed form, a bound on |f⁽ᴺ⁾| for the Lagrange remainder.
 */

export interface TaylorFn {
  id: string;
  /** LaTeX shown in the picker and the chart legend. */
  tex: string;
  /** Plain-text name for screen readers and the table. */
  label: string;
  f: (x: number) => number;
  /** c_n = f⁽ⁿ⁾(a) / n! */
  coef: (n: number, a: number) => number;
  /** Radius of convergence of the series about a (Infinity for entire functions). */
  radius: (a: number) => number;
  /** Is a a valid expansion point? Returns an explanation if not. */
  centreError: (a: number) => string | null;
  /** Is x in the function's domain? Returns an explanation if not. */
  pointError: (x: number) => string | null;
  /** Upper bound of |f⁽ᴺ⁾(ξ)| for ξ between a and x, if available. */
  derivBound?: (N: number, a: number, x: number) => number;
}

/** 1/n!, computed by repeated division so it never overflows. */
function invFactorial(n: number): number {
  let r = 1;
  for (let k = 2; k <= n; k++) r /= k;
  return r;
}

export const TAYLOR_FUNCTIONS: TaylorFn[] = [
  {
    id: 'exp',
    tex: 'e^{x}',
    label: 'e to the x',
    f: Math.exp,
    coef: (n, a) => Math.exp(a) * invFactorial(n),
    radius: () => Infinity,
    centreError: () => null,
    pointError: () => null,
    derivBound: (_N, a, x) => Math.exp(Math.max(a, x)),
  },
  {
    id: 'sin',
    tex: '\\sin x',
    label: 'sine of x',
    f: Math.sin,
    // Derivatives cycle sin, cos, −sin, −cos.
    coef: (n, a) => [Math.sin(a), Math.cos(a), -Math.sin(a), -Math.cos(a)][n % 4]! * invFactorial(n),
    radius: () => Infinity,
    centreError: () => null,
    pointError: () => null,
    derivBound: () => 1,
  },
  {
    id: 'cos',
    tex: '\\cos x',
    label: 'cosine of x',
    f: Math.cos,
    coef: (n, a) => [Math.cos(a), -Math.sin(a), -Math.cos(a), Math.sin(a)][n % 4]! * invFactorial(n),
    radius: () => Infinity,
    centreError: () => null,
    pointError: () => null,
    derivBound: () => 1,
  },
  {
    id: 'ln1p',
    tex: '\\ln(1+x)',
    label: 'natural log of 1 plus x',
    f: Math.log1p,
    // f⁽ⁿ⁾(a) = (−1)ⁿ⁻¹ (n−1)! / (1+a)ⁿ  ⇒  cₙ = (−1)ⁿ⁻¹ / (n (1+a)ⁿ)
    coef: (n, a) => (n === 0 ? Math.log1p(a) : (n % 2 ? 1 : -1) / (n * (1 + a) ** n)),
    radius: (a) => 1 + a,
    centreError: (a) => (a <= -1 ? 'ln(1 + x) is only defined for x > −1, so the centre a must be greater than −1.' : null),
    pointError: (x) => (x <= -1 ? 'ln(1 + x) is undefined for x ≤ −1.' : null),
  },
  {
    id: 'geom',
    tex: '\\dfrac{1}{1-x}',
    label: '1 over 1 minus x',
    f: (x) => 1 / (1 - x),
    // f⁽ⁿ⁾(a) = n! / (1−a)ⁿ⁺¹  ⇒  cₙ = 1 / (1−a)ⁿ⁺¹
    coef: (n, a) => 1 / (1 - a) ** (n + 1),
    radius: (a) => Math.abs(1 - a),
    centreError: (a) => (a === 1 ? '1/(1 − x) is undefined at x = 1, so it cannot be the centre.' : null),
    pointError: (x) => (x === 1 ? '1/(1 − x) is undefined at x = 1.' : null),
  },
];

export function getTaylorFn(id: string): TaylorFn {
  const fn = TAYLOR_FUNCTIONS.find((f) => f.id === id);
  if (!fn) throw new Error(`Unknown Taylor function "${id}"`);
  return fn;
}

/** Sum of the first `terms` terms (degree terms − 1) of the series of fn about a, at x. Horner's scheme. */
export function taylorPoly(fn: TaylorFn, a: number, terms: number, x: number): number {
  const h = x - a;
  let sum = 0;
  for (let n = terms - 1; n >= 0; n--) sum = sum * h + fn.coef(n, a);
  return sum;
}

/** Lagrange bound on |f(x) − P(x)| for a `terms`-term polynomial, if the function provides one. */
export function lagrangeBound(fn: TaylorFn, a: number, terms: number, x: number): number | null {
  if (!fn.derivBound) return null;
  return fn.derivBound(terms, a, x) * Math.abs(x - a) ** terms * invFactorial(terms);
}

export interface TaylorResult {
  approx: number;
  exact: number;
  absError: number;
  /** Relative error, or null when the exact value is 0. */
  relError: number | null;
  bound: number | null;
  radius: number;
  /** |x − a| relative to the radius of convergence. */
  status: 'inside' | 'boundary' | 'outside';
}

export function evaluateTaylor(fnId: string, a: number, terms: number, x: number): TaylorResult {
  const fn = getTaylorFn(fnId);
  const approx = taylorPoly(fn, a, terms, x);
  const exact = fn.f(x);
  const absError = Math.abs(approx - exact);
  const radius = fn.radius(a);
  const dist = Math.abs(x - a);
  const status = dist < radius - 1e-12 ? 'inside' : dist <= radius + 1e-12 ? 'boundary' : 'outside';
  return {
    approx,
    exact,
    absError,
    relError: exact === 0 ? null : absError / Math.abs(exact),
    bound: lagrangeBound(fn, a, terms, x),
    radius,
    status,
  };
}

/** The widget's starting state; matches the worked example on the Taylor-series page. */
export const TAYLOR_DEFAULTS = { fn: 'exp', a: 0, x: 0.5, terms: 4 } as const;

export const MAX_TERMS = 15;
