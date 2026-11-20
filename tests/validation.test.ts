/**
 * The build must fail on broken content. These tests feed deliberately broken
 * files to the same validator the build uses and assert that it throws.
 */
import { describe, expect, it } from 'vitest';
import { parse, stringify } from 'yaml';
import { buildLibrary } from '../src/lib/content';
import type { CalculatorDef } from '../src/lib/calculator';

const taxonomy = `
domains:
  - id: physics
    name: Physics
    description: d
    icon: physics
    fields:
      - id: mech
        name: Mechanics
        description: d
        icon: mechanics
        topics:
          - id: dyn
            name: Dynamics
            description: d
`;

const base = {
  id: 'newton',
  name: "Newton's second law",
  topic: 'physics/mech/dyn',
  difficulty: 'basic',
  summary: 'Force equals mass times acceleration.',
  latex: '\\sym{F}{F} = \\sym{m}{m}\\sym{a}{a}',
  variables: [
    { id: 'F', symbol: 'F', name: 'Force', unit: 'N', description: 'Net force.' },
    { id: 'm', symbol: 'm', name: 'Mass', unit: 'kg', description: 'Mass.' },
    { id: 'a', symbol: 'a', name: 'Acceleration', unit: 'm/s²', description: 'Acceleration.' },
  ],
  assumptions: ['Inertial frame.'],
  intuition: 'Force causes acceleration.',
  example: {
    problem: 'Push a 2 kg mass at 3 m/s².',
    given: { m: 2, a: 3 },
    solveFor: 'F',
    expected: { F: 6 },
    steps: [{ latex: 'F = 6' }],
    answer: '6 N',
    sources: [{ value: 'm, a', source: 'Illustrative choice' }],
  },
  calculator: { solvable: ['F'] },
  tags: ['force'],
};

const calc: CalculatorDef = { solve: { F: ({ m, a }) => m * a } };
const calcs = { '/src/content/formulas/newton/calc.ts': calc };

function build(formula: unknown, c: Record<string, CalculatorDef> = calcs) {
  return buildLibrary({ '/src/content/formulas/newton/formula.yaml': stringify(formula) }, taxonomy, c);
}

function mutate(fn: (f: any) => void) {
  const f = structuredClone(base);
  fn(f);
  return f;
}

describe('content validation', () => {
  it('accepts a valid formula', () => {
    expect(build(base).formulas).toHaveLength(1);
  });

  const broken: Array<[string, unknown, RegExp, Record<string, CalculatorDef>?]> = [
    ['missing assumptions', mutate((f) => delete f.assumptions), /assumptions/],
    ['empty assumptions', mutate((f) => (f.assumptions = [])), /assumptions/],
    ['bad difficulty', mutate((f) => (f.difficulty = 'easy')), /difficulty/],
    ['unknown topic', mutate((f) => (f.topic = 'physics/mech/nope')), /does not exist in taxonomy/],
    ['unknown field', mutate((f) => (f.extra = 1)), /extra|Unrecognized/i],
    ['id ≠ folder', mutate((f) => (f.id = 'other')), /must equal its folder/],
    ['untagged variable', mutate((f) => (f.latex = 'F = \\sym{m}{m}\\sym{a}{a}')), /never tagged/],
    ['tag without variable', mutate((f) => (f.latex += ' + \\sym{g}{g}')), /no variable has that id/],
    ['dangling related', mutate((f) => (f.related = ['ghost'])), /related formula "ghost"/],
    ['missing source provenance', mutate((f) => (f.example.sources = [])), /sources/],
    ['solvable ≠ calc.ts', mutate((f) => (f.calculator.solvable = ['F', 'm'])), /does not match calc\.ts/],
    ['missing expected', mutate((f) => delete f.example.expected), /expected/],
    ['missing given input', mutate((f) => delete f.example.given.a), /missing "a"/],
    ['calculator without calc.ts', base, /calc\.ts is missing/, {}],
    ['broken LaTeX in a derivation step', mutate((f) => (f.derivation = [{ latex: '\\frac{1}{' }])), /derivation\[0\]\.latex/],
    ['broken inline math in an assumption', mutate((f) => (f.assumptions = ['Holds for $\\sqrt{x$.'])), /assumptions\[0\]/],
    ['unknown widget', mutate((f) => { f.calculator = { widget: 'nope' }; delete f.example.given; delete f.example.expected; }), /calculator/, {}],
    ['calc.ts alongside a widget', mutate((f) => { f.calculator = { widget: 'taylor' }; delete f.example.given; delete f.example.expected; }), /calculator is a widget/],
    ['calc.ts with calculator none', mutate((f) => (f.calculator = { none: 'A long enough reason for no calculator.' })), /calculator is "none"/],
  ];

  it.each(broken)('rejects: %s', (_name, formula, msg, c) => {
    expect(() => build(formula, c ?? calcs)).toThrow(msg);
  });

  it('rejects invalid YAML', () => {
    expect(() =>
      buildLibrary({ '/src/content/formulas/newton/formula.yaml': 'id: [unclosed' }, taxonomy, calcs),
    ).toThrow(/YAML syntax error/);
  });

  it('rejects a topic with no formulas', () => {
    const extra = taxonomy.replace('          - id: dyn', '          - id: empty\n            name: Empty\n            description: d\n          - id: dyn');
    expect(() => buildLibrary({ '/src/content/formulas/newton/formula.yaml': stringify(base) }, extra, calcs)).toThrow(/topic "physics\/mech\/empty" has no formulas/);
  });

  it('rejects an unknown taxonomy icon', () => {
    const bad = stringify({ ...parse(taxonomy), domains: [{ ...parse(taxonomy).domains[0], icon: 'rocket' }] });
    expect(() => buildLibrary({}, bad, {})).toThrow(/icon/);
  });

  it('reports every problem at once, not just the first', () => {
    // Unknown topic + dangling related + the real topic left empty.
    const f = mutate((x) => { x.topic = 'physics/mech/nope'; x.related = ['ghost']; });
    expect(() => build(f)).toThrow(/3 problems/);
  });
});
