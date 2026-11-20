import { isComplex, type Scalar } from './calculator';

const SUP: Record<string, string> = {
  '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
};

/**
 * Format a number for humans: 4 significant figures by default, scientific
 * notation (×10ⁿ) outside [1e-3, 1e5). Trailing zeros are trimmed.
 */
export function formatNumber(x: number, sig = 4): string {
  if (x === 0) return '0';
  if (!Number.isFinite(x)) return String(x);
  const abs = Math.abs(x);
  if (abs >= 1e-3 && abs < 1e5) {
    const s = x.toPrecision(sig);
    return trim(s.includes('e') ? Number(s).toString() : s);
  }
  const [mant, exp] = x.toExponential(sig - 1).split('e');
  const e = String(Number(exp)).split('').map((c) => SUP[c] ?? c).join('');
  return `${trim(mant!)} × 10${e}`;
}

function trim(s: string): string {
  return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
}

export function formatScalar(v: Scalar, sig = 4): string {
  if (!isComplex(v)) return formatNumber(v, sig);
  // Drop floating-point noise, e.g. sin(π) = 1.2e-16 should read as 0.
  const scale = Math.max(Math.abs(v.re), Math.abs(v.im));
  v = {
    re: Math.abs(v.re) < 1e-12 * scale ? 0 : v.re,
    im: Math.abs(v.im) < 1e-12 * scale ? 0 : v.im,
  };
  if (v.im === 0) return formatNumber(v.re, sig);
  const sign = v.im < 0 ? '−' : '+';
  const re = v.re === 0 ? '' : `${formatNumber(v.re, sig)} ${sign} `;
  const im = formatNumber(Math.abs(v.im), sig);
  return re ? `${re}${im}i` : `${v.im < 0 ? '−' : ''}${im}i`;
}

/** Parse user input: accepts "1.2e-3", "1,5" (decimal comma), "−3" (unicode minus). */
export function parseNumber(raw: string): number {
  const s = raw.trim().replace(/−/g, '-').replace(/\s/g, '').replace(/,/g, '.');
  if (s === '' || !/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return NaN;
  return Number(s);
}

/** Parse a comma/semicolon/space-separated list. Any bad entry → [NaN] (reported as invalid). */
export function parseList(raw: string): number[] {
  const parts = raw.trim().replace(/−/g, '-').split(/[\s,;]+/).filter(Boolean);
  const nums = parts.map((p) => parseNumber(p));
  return nums.length && nums.every(Number.isFinite) ? nums : nums.length ? [NaN] : [];
}
