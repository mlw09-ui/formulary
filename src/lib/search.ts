import type { Library } from './content';
import type { Variable } from './schema';
import { href } from './url';

export interface SearchEntry {
  id: string;
  name: string;
  aliases: string[];
  summary: string;
  tags: string[];
  /** Variable names, symbols (Unicode + ASCII spellings) and search aliases. */
  symbols: string[];
  /** Name and aliases normalised with compact(), so "E=mc2" matches "E = mc²". */
  compact: string[];
  /** Human-readable location, e.g. "Physics › Fluid Mechanics › Internal Flow". */
  path: string;
  url: string;
  difficulty: string;
}

const GREEK: Record<string, string> = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η',
  theta: 'θ', vartheta: 'θ', iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π',
  rho: 'ρ', sigma: 'σ', tau: 'τ', upsilon: 'υ', phi: 'φ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ', Phi: 'Φ', Psi: 'Ψ',
  Omega: 'Ω', nabla: '∇', hbar: 'ℏ', partial: '∂',
};

const SUPERSCRIPTS: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', 'ⁿ': 'n', '⁻': '-',
};

/** Normalise for formula-style queries: lowercase, no spaces, superscripts → digits, no ^ · *. */
export function compact(s: string): string {
  return s
    .toLowerCase()
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ⁻]/g, (c) => SUPERSCRIPTS[c] ?? c)
    .replace(/[\s^·*]/g, '');
}

/** Search spellings of a LaTeX symbol: "\Delta P" → ["ΔP", "Delta P", "DeltaP"]. */
export function symbolSpellings(tex: string): string[] {
  const words = tex
    .replace(/\\(mathbf|mathrm|boldsymbol|vec|hat|bar|tilde|text|operatorname)\b/g, '')
    .replace(/[{}^_\\,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const unicode = words.replace(/\b([A-Za-z]+)\b/g, (w) => GREEK[w] ?? w).replace(/\s+/g, '');
  return [...new Set([unicode, words, words.replace(/\s+/g, '')])].filter(Boolean);
}

function variableTerms(v: Variable): string[] {
  return [v.name, ...symbolSpellings(v.symbol), ...v.searchAliases];
}

export function buildSearchIndex(lib: Library): SearchEntry[] {
  return lib.formulas.map((f) => {
    const t = lib.topicOf(f);
    return {
      id: f.id,
      name: f.name,
      aliases: f.aliases,
      summary: f.summary,
      tags: f.tags,
      symbols: [...new Set(f.variables.flatMap(variableTerms))],
      compact: [f.name, ...f.aliases].map(compact),
      path: [t.domain.name, t.field.name, t.name].join(' › '),
      url: href(lib.formulaPath(f)),
      difficulty: f.difficulty,
    };
  });
}
