/** @jsxImportSource preact */
import { useEffect, useMemo, useState } from 'preact/hooks';
import {
  isComplex, isMulti, runCalculator,
  type CalculatorDef, type Check, type Needed, type Output, type Scalar,
} from '../lib/calculator';
import { formatScalar, parseList, parseNumber } from '../lib/format';

// Each formula's calc.ts becomes its own small chunk, loaded only on its page.
const loaders = import.meta.glob<CalculatorDef>('/src/content/formulas/*/calc.ts', { import: 'default' });

export interface CalcVar {
  id: string;
  name: string;
  unit: string | null;
  /** Pre-rendered KaTeX HTML for the symbol. */
  symbolHtml: string;
  description?: string;
  /** Data set / vector input, entered comma-separated. */
  list?: boolean;
}

interface Props {
  formulaId: string;
  variables: CalcVar[];
  aux: CalcVar[];
  solvable: string[];
  /** Input variable ids for each solvable target. */
  inputsFor: Record<string, string[]>;
  defaults: Record<string, number | number[]>;
  initialTarget: string;
}

const toRaw = (d: Record<string, number | number[]>) =>
  Object.fromEntries(Object.entries(d).map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : String(v)]));

const unitSuffix = (u: string | null) => (u === null || u === '1' ? '' : u);

export default function Calculator({ formulaId, variables, aux, solvable, inputsFor, defaults, initialTarget }: Props) {
  const [def, setDef] = useState<CalculatorDef | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [target, setTarget] = useState(initialTarget);
  const [raw, setRaw] = useState<Record<string, string>>(() => toRaw(defaults));

  useEffect(() => {
    const load = loaders[`/src/content/formulas/${formulaId}/calc.ts`];
    if (!load) { setLoadError(true); return; }
    load().then(setDef).catch(() => setLoadError(true));
  }, [formulaId]);

  const inputVars = (inputsFor[target] ?? []).map((id) => variables.find((v) => v.id === id)!);
  const needed: Needed[] = [...inputVars, ...aux].map((v) => ({ id: v.id, list: v.list }));
  const values = useMemo(
    () => Object.fromEntries(needed.map(({ id, list }) => [id, list ? parseList(raw[id] ?? '') : parseNumber(raw[id] ?? '')])),
    [raw, target],
  );
  const result = def ? runCalculator(def, target, values, needed) : null;
  const targetVar = variables.find((v) => v.id === target)!;
  const uid = `calc-${formulaId}`;

  function switchTarget(next: string) {
    if (next === target) return;
    // Carry the current result into the old target's input, so switching is reversible.
    const out = result?.output;
    if (out !== undefined && !isMulti(out) && !isComplex(out)) {
      setRaw((r) => ({ ...r, [target]: String(Number(out.toPrecision(6))) }));
    }
    setTarget(next);
  }

  function reset() {
    setRaw(toRaw(defaults));
    setTarget(initialTarget);
  }

  const field = (v: CalcVar) => {
    const err = result?.inputErrors[v.id];
    const id = `${uid}-${v.id}`;
    const unit = unitSuffix(v.unit);
    return (
      <div key={v.id}>
        <label for={id} class="flex items-baseline gap-2 text-sm">
          <span class="text-text" dangerouslySetInnerHTML={{ __html: v.symbolHtml }} />
          <span class="text-muted">{v.name}</span>
        </label>
        <div
          class={`mt-1.5 flex h-10 items-center rounded-lg border bg-bg focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-accent ${
            err ? 'border-error' : 'border-border-strong'
          }`}
        >
          <input
            id={id}
            type="text"
            inputMode={v.list ? 'text' : 'decimal'}
            autoComplete="off"
            spellcheck={false}
            value={raw[v.id] ?? ''}
            onInput={(e) => setRaw((r) => ({ ...r, [v.id]: (e.target as HTMLInputElement).value }))}
            aria-invalid={err ? true : undefined}
            aria-describedby={err ? `${id}-err` : undefined}
            class="h-full w-full min-w-0 rounded-lg bg-transparent px-3 font-mono text-sm tabular-nums outline-none"
          />
          {unit && <span class="shrink-0 pr-3 text-sm text-muted" aria-label={`in ${unit}`}>{unit}</span>}
        </div>
        {v.list && !err && <p class="mt-1 text-xs text-muted">Separate values with commas or spaces.</p>}
        {err && <p id={`${id}-err`} class="mt-1 text-xs text-error">{err}</p>}
        {v.description && <p class="mt-1 text-xs text-muted">{v.description}</p>}
      </div>
    );
  };

  return (
    <div class="rounded-xl border border-border bg-surface">
      {solvable.length > 1 && (
        <fieldset class="border-b border-border px-5 py-4">
          <legend class="float-left mb-2 w-full text-xs font-semibold uppercase tracking-wider text-muted">Solve for</legend>
          <div class="clear-both flex flex-wrap gap-2">
            {variables.filter((v) => solvable.includes(v.id)).map((v) => (
              <label
                key={v.id}
                class={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
                  v.id === target
                    ? 'border-accent bg-accent-soft text-text'
                    : 'border-border bg-raised text-muted hover:border-border-strong hover:text-text'
                }`}
              >
                <input
                  type="radio"
                  name={`${uid}-target`}
                  value={v.id}
                  checked={v.id === target}
                  onChange={() => switchTarget(v.id)}
                  class="sr-only"
                />
                <span dangerouslySetInnerHTML={{ __html: v.symbolHtml }} />
                <span>{v.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div class="grid gap-x-5 gap-y-4 px-5 py-5 sm:grid-cols-2">{inputVars.map(field)}</div>

      {aux.length > 0 && (
        <div class="border-t border-dashed border-border px-5 py-5">
          <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Extra input for validity checks</p>
          <div class="grid gap-x-5 gap-y-4 sm:grid-cols-2">{aux.map(field)}</div>
        </div>
      )}

      <div class="rounded-b-xl border-t border-border bg-raised px-5 py-5" aria-live="polite" aria-atomic="true">
        <div class="flex items-start justify-between gap-4">
          <p class="text-xs font-semibold uppercase tracking-wider text-muted">Result</p>
          <button type="button" onClick={reset} class="rounded text-xs text-muted underline-offset-2 hover:text-accent hover:underline">
            Reset to example
          </button>
        </div>
        {loadError ? (
          <p class="mt-2 text-sm text-error">The calculator failed to load.</p>
        ) : !result ? (
          <p class="mt-2 text-sm text-muted">Loading…</p>
        ) : result.output !== undefined ? (
          <ResultView output={result.output} symbolHtml={targetVar.symbolHtml} unit={unitSuffix(targetVar.unit)} />
        ) : Object.keys(result.inputErrors).length ? (
          <p class="mt-2 text-sm text-muted">Fix the highlighted inputs to see a result.</p>
        ) : null}
        {result && result.checks.length > 0 && (
          <ul class="mt-4 space-y-2">
            {result.checks.map((c, i) => <CheckItem key={i} check={c} />)}
          </ul>
        )}
      </div>
    </div>
  );
}

function ResultView({ output, symbolHtml, unit }: { output: Output; symbolHtml: string; unit: string }) {
  const rows = isMulti(output) ? output : [{ label: '', value: output }];
  return (
    <div class="mt-2 space-y-1">
      {rows.map((r, i) => (
        <p key={i} class="flex flex-wrap items-baseline gap-x-3 text-2xl">
          <span dangerouslySetInnerHTML={{ __html: symbolHtml }} />
          {r.label && <span class="text-sm text-muted">({r.label})</span>}
          <span class="text-muted">=</span>
          <span class="font-mono font-medium tabular-nums text-text">{formatScalar(r.value, 4)}</span>
          {unit && <span class="text-lg text-muted">{unit}</span>}
          {copyable(r.value) && (
            <span class="font-mono text-xs text-muted" title="Copyable value">({copyable(r.value)})</span>
          )}
        </p>
      ))}
    </div>
  );
}

/** Plain e-notation (e.g. 3.91915e-8) for very large or small results, easy to copy. */
function copyable(v: Scalar): string | null {
  if (isComplex(v) || v === 0) return null;
  const a = Math.abs(v);
  return a >= 1e5 || a < 1e-3 ? v.toExponential(5).replace(/\.?0+e/, 'e').replace('e+', 'e') : null;
}

const CHECK_STYLE: Record<Check['level'], { cls: string; label: string; path: string }> = {
  ok: { cls: 'border-ok/40 bg-ok-soft text-ok', label: 'Valid', path: 'M5 12.5l4.5 4.5L19 7.5' },
  info: { cls: 'border-accent/40 bg-accent-soft text-accent', label: 'Note', path: 'M12 11v6M12 7.5v.01' },
  warn: { cls: 'border-warn/50 bg-warn-soft text-warn', label: 'Warning', path: 'M12 8v5M12 16.5v.01' },
  error: { cls: 'border-error/50 bg-error-soft text-error', label: 'Error', path: 'M8 8l8 8M16 8l-8 8' },
};

function CheckItem({ check }: { check: Check }) {
  const s = CHECK_STYLE[check.level];
  return (
    <li class={`flex gap-2.5 rounded-lg border px-3 py-2 text-sm ${s.cls}`}>
      <svg aria-hidden="true" viewBox="0 0 24 24" class="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        {check.level === 'warn' ? <path d="M12 3 2 20h20z" stroke-width="1.8" /> : <circle cx="12" cy="12" r="9.5" stroke-width="1.8" />}
        <path d={s.path} />
      </svg>
      <span class="text-text"><span class="sr-only">{s.label}: </span>{check.message}</span>
    </li>
  );
}
