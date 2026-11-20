import katex from 'katex';

/**
 * \sym{id}{tex} tags a symbol so hovering it highlights its variable-table row.
 * It expands to KaTeX's \htmlData, which renders as data-var="id".
 */
const MACROS = { '\\sym': '\\htmlData{var=#1}{#2}' };

const OPTIONS: katex.KatexOptions = {
  macros: MACROS,
  output: 'htmlAndMathml', // MathML for screen readers, HTML for visuals
  throwOnError: true, // a LaTeX error must fail the build, not render red text
  strict: (code: string) => (code === 'htmlExtension' ? 'ignore' : 'error'),
  trust: (ctx) => ctx.command === '\\htmlData',
};

export function renderDisplay(tex: string): string {
  return katex.renderToString(tex, { ...OPTIONS, displayMode: true });
}

export function renderInlineMath(tex: string): string {
  return katex.renderToString(tex, { ...OPTIONS, displayMode: false });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Render prose with inline $…$ math. Everything outside $…$ is HTML-escaped.
 * Use \$ for a literal dollar sign. **bold** is supported for emphasis.
 */
export function renderRichText(text: string): string {
  const out: string[] = [];
  const re = /(?<!\\)\$(.+?)(?<!\\)\$/gs;
  let last = 0;
  for (const m of text.matchAll(re)) {
    out.push(formatProse(text.slice(last, m.index)));
    out.push(renderInlineMath(m[1]!));
    last = m.index! + m[0].length;
  }
  out.push(formatProse(text.slice(last)));
  return out.join('');
}

function formatProse(s: string): string {
  return escapeHtml(s.replace(/\\\$/g, '$')).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

/** Read a balanced {…} group starting at s[i] === '{'. Returns [content, indexAfter]. */
function readGroup(s: string, i: number): [string, number] {
  if (s[i] !== '{') throw new Error(`expected "{" at ${i} in: ${s}`);
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    const ch = s[j];
    if (ch === '\\') { j++; continue; }
    if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return [s.slice(i + 1, j), j + 1];
  }
  throw new Error(`unbalanced braces in: ${s}`);
}

/**
 * Append `piece`, inserting a space where a control word would otherwise run into
 * a letter (`\rho` + `v` must not become the undefined command `\rhov`).
 */
function join(out: string, piece: string): string {
  return /\\[A-Za-z]+$/.test(out) && /^[A-Za-z]/.test(piece) ? `${out} ${piece}` : out + piece;
}

/** Replace every \sym{id}{tex} with tex — the clean LaTeX users copy. */
export function stripSym(tex: string): string {
  let out = '';
  let i = 0;
  while (i < tex.length) {
    const k = tex.indexOf('\\sym{', i);
    if (k === -1) { out = join(out, tex.slice(i)); break; }
    out = join(out, tex.slice(i, k));
    const [, afterId] = readGroup(tex, k + 4);
    const [body, afterBody] = readGroup(tex, afterId);
    out = join(out, stripSym(body));
    i = afterBody;
  }
  return out;
}

/** All variable ids referenced via \sym{id}{…}. */
export function symIds(tex: string): Set<string> {
  return new Set([...tex.matchAll(/\\sym\{([^}]+)\}/g)].map((m) => m[1]!));
}

/**
 * LaTeX for a compact preview (formula cards): for multi-line `aligned` formulas,
 * only the first line, without alignment markers. Anything else is returned whole.
 */
export function previewLatex(tex: string): string {
  const clean = stripSym(tex).trim();
  const m = clean.match(/^\\begin\{aligned\}([\s\S]*)\\end\{aligned\}$/);
  if (!m) return clean;
  const firstRow = m[1]!.split(/\\\\(?:\[[^\]]*\])?/)[0]!;
  return firstRow.replace(/&/g, '').trim();
}
