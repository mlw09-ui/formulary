import { describe, expect, it } from 'vitest';
import { previewLatex, renderDisplay, renderRichText, stripSym, symIds } from '../src/lib/latex';
import { formatNumber, formatScalar, parseNumber } from '../src/lib/format';
import { runCalculator, defineCalculator, CalcError, erf } from '../src/lib/calculator';

describe('latex', () => {
  it('strips \\sym tags, including nested braces', () => {
    expect(stripSym('\\sym{u}{\\mathbf{u}} = \\frac{\\sym{a}{a}}{2}')).toBe('\\mathbf{u} = \\frac{a}{2}');
  });
  it('does not glue control words to following letters when stripping', () => {
    expect(stripSym('\\sym{rho}{\\rho}\\sym{v}{v}^2')).toBe('\\rho v^2');
    expect(stripSym('\\sym{rho}{\\rho}\\,\\sym{v}{v}')).toBe('\\rho\\,v');
  });
  it('produces compilable LaTeX for every formula', async () => {
    const { getLibrary } = await import('../src/lib/content');
    for (const f of getLibrary().formulas) {
      expect(() => renderDisplay(stripSym(f.latex)), `${f.id} (copy)`).not.toThrow();
      expect(() => renderDisplay(previewLatex(f.latex)), `${f.id} (card preview)`).not.toThrow();
    }
  });
  it('collects sym ids', () => {
    expect([...symIds('\\sym{a}{a}+\\sym{b}{b^{2}}+\\sym{a}{a}')]).toEqual(['a', 'b']);
  });
  it('renders \\sym as data-var for hover highlighting', () => {
    expect(renderDisplay('\\sym{rho}{\\rho}')).toContain('data-var="rho"');
  });
  it('renders inline math and escapes surrounding prose', () => {
    const html = renderRichText('a <b> $x^2$ costs \\$5 **now**');
    expect(html).toContain('&lt;b&gt;');
    expect(html).toContain('class="katex"');
    expect(html).toContain('$5');
    expect(html).toContain('<strong>now</strong>');
  });
  it('throws on invalid LaTeX so the build fails', () => {
    expect(() => renderDisplay('\\frac{1}{')).toThrow();
  });
});

describe('format', () => {
  it.each([
    [0, '0'],
    [3.9191525e-8, '3.919 × 10⁻⁸'],
    [0.35939, '0.3594'],
    [10787.3, '10790'],
    [123456, '1.235 × 10⁵'],
    [-0.5, '-0.5'],
    [3, '3'],
  ])('formatNumber(%s) = %s', (x, s) => {
    expect(formatNumber(x)).toBe(s);
  });
  it('formats complex numbers', () => {
    expect(formatScalar({ re: 1, im: -2 })).toBe('1 − 2i');
    expect(formatScalar({ re: 0, im: 2 })).toBe('2i');
    expect(formatScalar({ re: -1, im: 1.2246e-16 })).toBe('-1');
    expect(formatScalar({ re: 6.1e-17, im: 1 })).toBe('1i');
  });
  it.each([
    ['1.5', 1.5], ['1,5', 1.5], ['−3', -3], ['2e-3', 0.002], [' 4 ', 4],
    ['', NaN], ['abc', NaN], ['1.2.3', NaN],
  ])('parseNumber(%j) = %s', (s, x) => {
    expect(parseNumber(s)).toBe(x);
  });
});

describe('runCalculator', () => {
  const calc = defineCalculator({
    solve: { y: ({ x }) => Math.sqrt(x) },
    domain: { x: 'nonnegative' },
  });
  it('flags missing and out-of-domain inputs', () => {
    expect(runCalculator(calc, 'y', {}, [{ id: 'x' }]).inputErrors.x).toBe('Enter a number');
    expect(runCalculator(calc, 'y', { x: -1 }, [{ id: 'x' }]).inputErrors.x).toMatch(/0 or greater/);
  });
  it('reports NaN results as "no real solution"', () => {
    const c = defineCalculator({ solve: { y: ({ x }) => Math.sqrt(x) } });
    const r = runCalculator(c, 'y', { x: -1 }, [{ id: 'x' }]);
    expect(r.output).toBeUndefined();
    expect(r.checks[0]!.level).toBe('error');
  });

  it('validates list inputs and passes them to the solver', () => {
    const c = defineCalculator({ solve: { m: (_, { x }) => x!.reduce((a, b) => a + b, 0) / x!.length } });
    expect(runCalculator(c, 'm', { x: [1, 2, 6] }, [{ id: 'x', list: true }]).output).toBe(3);
    expect(runCalculator(c, 'm', { x: [] }, [{ id: 'x', list: true }]).inputErrors.x).toMatch(/commas/);
    expect(runCalculator(c, 'm', { x: [1, NaN] }, [{ id: 'x', list: true }]).inputErrors.x).toMatch(/commas/);
  });
  it('turns CalcError into an explained error check', () => {
    const c = defineCalculator({ solve: { y: () => { throw new CalcError('Total internal reflection.'); } } });
    const r = runCalculator(c, 'y', {}, []);
    expect(r.checks).toEqual([{ level: 'error', message: 'Total internal reflection.' }]);
  });
  it('enforces the probability domain', () => {
    const c = defineCalculator({ solve: { y: ({ p }) => p }, domain: { p: 'probability' } });
    expect(runCalculator(c, 'y', { p: 1.2 }, [{ id: 'p' }]).inputErrors.p).toMatch(/between 0 and 1/);
  });
});

describe('erf', () => {
  it.each([[0, 0], [0.5, 0.5204998778], [1, 0.8427007929], [-1, -0.8427007929], [2, 0.9953222650]])('erf(%s)', (x, y) => {
    expect(Math.abs(erf(x) - y)).toBeLessThan(2e-7);
  });
});
