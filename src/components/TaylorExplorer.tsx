/** @jsxImportSource preact */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { evaluateTaylor, getTaylorFn, MAX_TERMS, TAYLOR_DEFAULTS, TAYLOR_FUNCTIONS, taylorPoly } from '../lib/taylor';
import { formatNumber, parseNumber } from '../lib/format';
import type { Check } from '../lib/calculator';

interface Props {
  /** Pre-rendered KaTeX HTML for each function id. */
  fnLabels: Record<string, string>;
}

const SAMPLES = 241;
const HEIGHT = 300;
const M = { top: 16, right: 64, bottom: 30, left: 52 };

/** "Nice" axis ticks (1, 2, 5 × 10ⁿ steps). */
function niceTicks(lo: number, hi: number, count = 5): number[] {
  const span = hi - lo;
  if (!(span > 0)) return [lo];
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => span / s <= count) ?? 10 * mag;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return out;
}

function quantile(sorted: number[], q: number): number {
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i);
  return sorted[lo]! + (sorted[Math.min(lo + 1, sorted.length - 1)]! - sorted[lo]!) * (i - lo);
}

const fmt = (v: number) => (Number.isFinite(v) ? formatNumber(v, 6) : '—');

export default function TaylorExplorer({ fnLabels }: Props) {
  const [fnId, setFnId] = useState<string>(TAYLOR_DEFAULTS.fn);
  const [aRaw, setARaw] = useState(String(TAYLOR_DEFAULTS.a));
  const [xRaw, setXRaw] = useState(String(TAYLOR_DEFAULTS.x));
  const [terms, setTerms] = useState<number>(TAYLOR_DEFAULTS.terms);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, Math.floor(e!.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fn = getTaylorFn(fnId);
  const a = parseNumber(aRaw);
  const x = parseNumber(xRaw);
  const aErr = !Number.isFinite(a) ? 'Enter a number' : fn.centreError(a);
  const xErr = !Number.isFinite(x) ? 'Enter a number' : fn.pointError(x);
  const valid = !aErr && !xErr;
  const result = valid ? evaluateTaylor(fnId, a, terms, x) : null;

  // ---- validity checks -------------------------------------------------------
  const checks: Check[] = [];
  if (result) {
    const d = Math.abs(x - a);
    if (!Number.isFinite(result.radius)) {
      checks.push({ level: 'ok', message: 'This series converges for every x, so adding terms always helps eventually.' });
    } else if (result.status === 'inside') {
      checks.push({ level: 'ok', message: `|x − a| = ${fmt(d)} is inside the radius of convergence R = ${fmt(result.radius)}, so the series converges here.` });
    } else if (result.status === 'boundary') {
      checks.push({ level: 'warn', message: `|x − a| = R = ${fmt(result.radius)}: x is exactly on the edge of convergence. Convergence, if any, is extremely slow.` });
    } else {
      checks.push({ level: 'warn', message: `|x − a| = ${fmt(d)} is outside the radius of convergence R = ${fmt(result.radius)}. The series diverges here, so adding terms makes the approximation worse. Try it.` });
    }
    if (result.bound !== null) {
      checks.push({ level: 'info', message: `Lagrange remainder bound: |error| ≤ ${fmt(result.bound)}. The actual error is ${fmt(result.absError)}.` });
    }
  }

  // ---- chart data ------------------------------------------------------------
  const chart = useMemo(() => {
    if (!valid) return null;
    const R = fn.radius(a);
    let half = Number.isFinite(R) ? Math.max(1.3 * R, Math.abs(x - a) * 1.25) : Math.max(3, Math.abs(x - a) * 1.25);
    half = Math.min(half, 50);
    let lo = a - half;
    let hi = a + half;
    if (fn.id === 'ln1p') lo = Math.max(lo, -0.999);
    const ts = Array.from({ length: SAMPLES }, (_, i) => lo + ((hi - lo) * i) / (SAMPLES - 1));
    const fs = ts.map((t) => fn.f(t));
    const ps = ts.map((t) => taylorPoly(fn, a, terms, t));
    // y-range from the true function (robust to poles), widened to include the point of interest.
    const finite = fs.filter(Number.isFinite).sort((p, q) => p - q);
    let yLo = quantile(finite, 0.03);
    let yHi = quantile(finite, 0.97);
    const fx = fn.f(x);
    if (Number.isFinite(fx)) { yLo = Math.min(yLo, fx); yHi = Math.max(yHi, fx); }
    const pad = (yHi - yLo || 1) * 0.15;
    return { lo, hi, ts, fs, ps, yLo: yLo - pad, yHi: yHi + pad, R };
  }, [fnId, a, x, terms, valid]);

  const plotW = width - M.left - M.right;
  const plotH = HEIGHT - M.top - M.bottom;
  const sx = (t: number) => (chart ? M.left + ((t - chart.lo) / (chart.hi - chart.lo)) * plotW : 0);
  const sy = (v: number) => (chart ? M.top + (1 - (v - chart.yLo) / (chart.yHi - chart.yLo)) * plotH : 0);

  /** SVG path that breaks where values are non-finite or jump across the plot (poles). */
  const pathFor = (vals: number[]) => {
    if (!chart) return '';
    let d = '';
    let pen = false;
    const big = (chart.yHi - chart.yLo) * 20;
    vals.forEach((v, i) => {
      const prev = vals[i - 1];
      const jump = prev !== undefined && Math.abs(v - prev) > big;
      if (!Number.isFinite(v) || Math.abs(v) > 1e12 || jump) { pen = false; if (!Number.isFinite(v) || Math.abs(v) > 1e12) return; }
      const cy = Math.max(-1e5, Math.min(1e5, sy(v)));
      d += `${pen ? 'L' : 'M'}${sx(chart.ts[i]!).toFixed(1)},${cy.toFixed(1)}`;
      pen = true;
    });
    return d;
  };

  const xTicks = chart ? niceTicks(chart.lo, chart.hi, Math.max(3, Math.floor(plotW / 90))) : [];
  const yTicks = chart ? niceTicks(chart.yLo, chart.yHi, 5) : [];
  const inY = (v: number) => chart && Number.isFinite(v) && v >= chart.yLo && v <= chart.yHi;

  // Direct labels at the right end of each line; drop the polynomial's if they would collide.
  // Only label a line where it actually reaches the right edge; otherwise the legend carries it.
  const endLabel = (vals: number[]) => (inY(vals[vals.length - 1]!) ? { y: sy(vals[vals.length - 1]!) } : null);
  const fEnd = chart ? endLabel(chart.fs) : null;
  const pEnd = chart ? endLabel(chart.ps) : null;
  const showPLabel = pEnd && (!fEnd || Math.abs(pEnd.y - fEnd.y) >= 14);

  const pName = `P${toSub(terms)}`;
  const hoverIdx = hover !== null && chart ? Math.max(0, Math.min(SAMPLES - 1, hover)) : null;

  function onPointer(e: PointerEvent) {
    if (!chart) return;
    const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
    const px = e.clientX - rect.left;
    const frac = (px - M.left) / plotW;
    if (frac < 0 || frac > 1) { setHover(null); return; }
    setHover(Math.round(frac * (SAMPLES - 1)));
  }
  function onKey(e: KeyboardEvent) {
    if (!chart) return;
    const step = e.shiftKey ? 24 : 6;
    if (e.key === 'ArrowRight') { e.preventDefault(); setHover((h) => Math.min(SAMPLES - 1, (h ?? SAMPLES >> 1) + step)); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); setHover((h) => Math.max(0, (h ?? SAMPLES >> 1) - step)); }
    else if (e.key === 'Escape') setHover(null);
  }

  const tableRows = chart ? Array.from({ length: 11 }, (_, k) => Math.round((k * (SAMPLES - 1)) / 10)) : [];

  return (
    <div class="rounded-xl border border-border bg-surface">
      {/* Function picker */}
      <fieldset class="border-b border-border px-5 py-4">
        <legend class="float-left mb-2 w-full text-xs font-semibold uppercase tracking-wider text-muted">Function</legend>
        <div class="clear-both flex flex-wrap gap-2">
          {TAYLOR_FUNCTIONS.map((f) => (
            <label
              key={f.id}
              class={`flex cursor-pointer items-center rounded-lg border px-3 py-1.5 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
                f.id === fnId ? 'border-accent bg-accent-soft text-text' : 'border-border bg-raised text-muted hover:border-border-strong hover:text-text'
              }`}
            >
              <input type="radio" name="taylor-fn" value={f.id} checked={f.id === fnId} onChange={() => { setFnId(f.id); setHover(null); }} class="sr-only" aria-label={f.label} />
              <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: fnLabels[f.id] ?? f.label }} />
            </label>
          ))}
        </div>
      </fieldset>

      {/* Inputs */}
      <div class="grid gap-x-5 gap-y-4 px-5 py-5 sm:grid-cols-3">
        <NumberField id="taylor-a" label="Centre a" hint="Expansion point" value={aRaw} onInput={setARaw} error={aErr} />
        <NumberField id="taylor-x" label="Evaluate at x" hint="Point to approximate" value={xRaw} onInput={setXRaw} error={xErr} />
        <div>
          <label for="taylor-n" class="flex items-baseline justify-between text-sm">
            <span class="text-muted">Number of terms</span>
            <span class="font-mono text-text tabular-nums">{terms}</span>
          </label>
          <input
            id="taylor-n"
            type="range"
            min={1}
            max={MAX_TERMS}
            value={terms}
            onInput={(e) => setTerms(Number((e.target as HTMLInputElement).value))}
            aria-describedby="taylor-n-hint"
            class="mt-3 w-full accent-[var(--c-accent)]"
          />
          <p id="taylor-n-hint" class="mt-1 text-xs text-muted">Polynomial of degree {terms - 1}</p>
        </div>
      </div>

      {/* Chart */}
      <div class="border-t border-border bg-raised px-3 pb-3 pt-4 sm:px-5">
        <ul class="mb-2 flex flex-wrap items-center gap-x-5 gap-y-1 px-2 text-sm text-muted" aria-label="Legend">
          <li class="flex items-center gap-2">
            <span aria-hidden="true" class="inline-block h-[2px] w-5 rounded" style="background: var(--c-series-1)" />
            <span>f(x), the true function</span>
          </li>
          <li class="flex items-center gap-2">
            <span aria-hidden="true" class="inline-block h-[2px] w-5 rounded" style="background: var(--c-series-2)" />
            <span>{pName}(x), {terms}-term Taylor polynomial</span>
          </li>
          {chart && Number.isFinite(chart.R) && (
            <li class="flex items-center gap-2">
              <span aria-hidden="true" class="inline-block h-3 w-5 rounded-sm" style="background: var(--c-converge)" />
              <span>converges (|x − a| &lt; R)</span>
            </li>
          )}
        </ul>
        <div
          ref={boxRef}
          class="relative"
          tabIndex={0}
          role="group"
          aria-label={`Chart of f(x) and ${pName}(x). Use the left and right arrow keys to read values.`}
          aria-describedby="taylor-readout"
          onKeyDown={onKey}
          onBlur={() => setHover(null)}
        >
          {chart ? (
            <svg width={width} height={HEIGHT} class="block touch-none select-none" onPointerMove={onPointer} onPointerLeave={() => setHover(null)} aria-hidden="true">
              <defs>
                <clipPath id="taylor-clip"><rect x={M.left} y={M.top} width={plotW} height={plotH} /></clipPath>
              </defs>
              {/* convergence band */}
              {Number.isFinite(chart.R) && (
                <rect
                  x={Math.max(M.left, sx(a - chart.R))}
                  y={M.top}
                  width={Math.max(0, Math.min(M.left + plotW, sx(a + chart.R)) - Math.max(M.left, sx(a - chart.R)))}
                  height={plotH}
                  fill="var(--c-converge)"
                />
              )}
              {/* grid + axes */}
              {yTicks.map((v) => (
                <g key={`y${v}`}>
                  <line x1={M.left} x2={M.left + plotW} y1={sy(v)} y2={sy(v)} stroke={v === 0 ? 'var(--c-border-strong)' : 'var(--c-border)'} stroke-width="1" />
                  <text x={M.left - 8} y={sy(v)} dy="0.32em" text-anchor="end" class="fill-muted text-[11px] tabular-nums">{formatNumber(v, 3)}</text>
                </g>
              ))}
              {xTicks.map((v) => (
                <text key={`x${v}`} x={sx(v)} y={M.top + plotH + 18} text-anchor="middle" class="fill-muted text-[11px] tabular-nums">{formatNumber(v, 3)}</text>
              ))}
              {/* centre a and point x */}
              <line x1={sx(a)} x2={sx(a)} y1={M.top} y2={M.top + plotH} stroke="var(--c-border-strong)" stroke-width="1" />
              <text x={sx(a) + 4} y={M.top + 11} class="fill-muted text-[11px] italic">a</text>
              {/* series */}
              <g clip-path="url(#taylor-clip)" fill="none" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
                <path d={pathFor(chart.fs)} stroke="var(--c-series-1)" />
                <path d={pathFor(chart.ps)} stroke="var(--c-series-2)" />
              </g>
              {/* the evaluated point */}
              {result && inY(result.exact) && <circle cx={sx(x)} cy={sy(result.exact)} r="4" fill="var(--c-series-1)" stroke="var(--c-raised)" stroke-width="2" />}
              {result && inY(result.approx) && <circle cx={sx(x)} cy={sy(result.approx)} r="4" fill="var(--c-series-2)" stroke="var(--c-raised)" stroke-width="2" />}
              {/* direct labels */}
              {fEnd && <text x={M.left + plotW + 6} y={fEnd.y} dy="0.32em" class="fill-text text-[12px]">f(x)</text>}
              {showPLabel && <text x={M.left + plotW + 6} y={pEnd!.y} dy="0.32em" class="fill-text text-[12px]">{pName}(x)</text>}
              {/* crosshair */}
              {hoverIdx !== null && (
                <g>
                  <line x1={sx(chart.ts[hoverIdx]!)} x2={sx(chart.ts[hoverIdx]!)} y1={M.top} y2={M.top + plotH} stroke="var(--c-muted)" stroke-width="1" />
                  {inY(chart.fs[hoverIdx]!) && <circle cx={sx(chart.ts[hoverIdx]!)} cy={sy(chart.fs[hoverIdx]!)} r="4" fill="var(--c-series-1)" stroke="var(--c-raised)" stroke-width="2" />}
                  {inY(chart.ps[hoverIdx]!) && <circle cx={sx(chart.ts[hoverIdx]!)} cy={sy(chart.ps[hoverIdx]!)} r="4" fill="var(--c-series-2)" stroke="var(--c-raised)" stroke-width="2" />}
                </g>
              )}
            </svg>
          ) : (
            <div class="flex items-center justify-center text-sm text-muted" style={`height:${HEIGHT}px`}>Fix the inputs to see the chart.</div>
          )}
          {/* tooltip */}
          {chart && hoverIdx !== null && (
            <div
              class="pointer-events-none absolute top-2 rounded-lg border border-border bg-raised px-3 py-2 text-xs shadow-md"
              style={sx(chart.ts[hoverIdx]!) > width / 2 ? `right:${width - sx(chart.ts[hoverIdx]!) + 12}px` : `left:${sx(chart.ts[hoverIdx]!) + 12}px`}
            >
              <p class="mb-1 text-muted">x = {fmt(chart.ts[hoverIdx]!)}</p>
              <TooltipRow color="var(--c-series-1)" value={fmt(chart.fs[hoverIdx]!)} name="f(x)" />
              <TooltipRow color="var(--c-series-2)" value={fmt(chart.ps[hoverIdx]!)} name={`${pName}(x)`} />
              <p class="mt-1 text-muted">error {fmt(Math.abs(chart.fs[hoverIdx]! - chart.ps[hoverIdx]!))}</p>
            </div>
          )}
          <p id="taylor-readout" class="sr-only" aria-live="polite">
            {chart && hoverIdx !== null
              ? `At x = ${fmt(chart.ts[hoverIdx]!)}: f = ${fmt(chart.fs[hoverIdx]!)}, ${pName} = ${fmt(chart.ps[hoverIdx]!)}.`
              : ''}
          </p>
        </div>
        {chart && (
          <details class="mt-2 px-2 text-sm">
            <summary class="cursor-pointer rounded text-muted hover:text-text">Show values as a table</summary>
            <div class="mt-2 overflow-x-auto">
              <table class="w-full text-left font-mono text-xs tabular-nums">
                <thead class="text-muted">
                  <tr><th scope="col" class="py-1 pr-4 font-sans font-medium">x</th><th scope="col" class="py-1 pr-4 font-sans font-medium">f(x)</th><th scope="col" class="py-1 pr-4 font-sans font-medium">{pName}(x)</th><th scope="col" class="py-1 font-sans font-medium">|error|</th></tr>
                </thead>
                <tbody>
                  {tableRows.map((i) => (
                    <tr key={i} class="border-t border-border">
                      <td class="py-1 pr-4">{fmt(chart.ts[i]!)}</td>
                      <td class="py-1 pr-4">{fmt(chart.fs[i]!)}</td>
                      <td class="py-1 pr-4">{fmt(chart.ps[i]!)}</td>
                      <td class="py-1">{fmt(Math.abs(chart.fs[i]! - chart.ps[i]!))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </div>

      {/* Result */}
      <div class="rounded-b-xl border-t border-border bg-raised px-5 py-5" aria-live="polite" aria-atomic="true">
        <p class="text-xs font-semibold uppercase tracking-wider text-muted">Result at x = {Number.isFinite(x) ? fmt(x) : '?'}</p>
        {result ? (
          <dl class="mt-2 grid gap-x-8 gap-y-1 sm:grid-cols-2">
            <ResultRow label={`Approximation ${pName}(x)`} value={fmt(result.approx)} strong />
            <ResultRow label="True value f(x)" value={fmt(result.exact)} strong />
            <ResultRow label="Absolute error" value={fmt(result.absError)} />
            <ResultRow label="Relative error" value={result.relError === null ? '—' : `${formatNumber(result.relError * 100, 3)}%`} />
          </dl>
        ) : (
          <p class="mt-2 text-sm text-muted">Fix the highlighted inputs to see a result.</p>
        )}
        {checks.length > 0 && (
          <ul class="mt-4 space-y-2">
            {checks.map((c, i) => <CheckRow key={i} check={c} />)}
          </ul>
        )}
      </div>
    </div>
  );
}

function toSub(n: number): string {
  return String(n).split('').map((d) => '₀₁₂₃₄₅₆₇₈₉'[Number(d)]).join('');
}

function NumberField(props: { id: string; label: string; hint: string; value: string; onInput: (v: string) => void; error: string | null }) {
  const { id, label, hint, value, onInput, error } = props;
  return (
    <div>
      <label for={id} class="text-sm text-muted">{label}</label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onInput={(e) => onInput((e.target as HTMLInputElement).value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-desc`}
        class={`mt-1.5 h-10 w-full rounded-lg border bg-bg px-3 font-mono text-sm tabular-nums outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${error ? 'border-error' : 'border-border-strong'}`}
      />
      <p id={`${id}-desc`} class={`mt-1 text-xs ${error ? 'text-error' : 'text-muted'}`}>{error ?? hint}</p>
    </div>
  );
}

function ResultRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div class="flex items-baseline justify-between gap-4 border-b border-border/60 py-1">
      <dt class="text-sm text-muted">{label}</dt>
      <dd class={`font-mono tabular-nums ${strong ? 'text-lg font-medium text-text' : 'text-sm text-text'}`}>{value}</dd>
    </div>
  );
}

function TooltipRow({ color, value, name }: { color: string; value: string; name: string }) {
  return (
    <p class="flex items-center gap-2">
      <span aria-hidden="true" class="inline-block h-[2px] w-3 rounded" style={`background:${color}`} />
      <span class="font-mono font-medium text-text tabular-nums">{value}</span>
      <span class="text-muted">{name}</span>
    </p>
  );
}

const CHECK_STYLE: Record<Check['level'], { cls: string; label: string }> = {
  ok: { cls: 'border-ok/40 bg-ok-soft', label: 'Valid' },
  info: { cls: 'border-accent/40 bg-accent-soft', label: 'Note' },
  warn: { cls: 'border-warn/50 bg-warn-soft', label: 'Warning' },
  error: { cls: 'border-error/50 bg-error-soft', label: 'Error' },
};

function CheckRow({ check }: { check: Check }) {
  const s = CHECK_STYLE[check.level];
  const icon = { ok: 'text-ok', info: 'text-accent', warn: 'text-warn', error: 'text-error' }[check.level];
  return (
    <li class={`flex gap-2.5 rounded-lg border px-3 py-2 text-sm ${s.cls}`}>
      <svg aria-hidden="true" viewBox="0 0 24 24" class={`mt-0.5 h-4 w-4 shrink-0 ${icon}`} fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        {check.level === 'warn' ? <path d="M12 3 2 20h20zM12 9v5M12 17v.01" /> : check.level === 'ok' ? <><circle cx="12" cy="12" r="9.5" /><path d="M7.5 12.5l3 3 6-6.5" /></> : <><circle cx="12" cy="12" r="9.5" /><path d="M12 11v6M12 7.5v.01" /></>}
      </svg>
      <span class="text-text"><span class="sr-only">{s.label}: </span>{check.message}</span>
    </li>
  );
}
