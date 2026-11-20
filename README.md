# Formulary

A static reference library of mathematics and physics formulas. Every formula page shows the equation, its
variables and units, the conditions under which it holds, an intuitive explanation, an interactive calculator
with validity warnings, a worked example with sourced numbers, a step-by-step derivation, and related formulas.

- **Navigation:** Domain → Field → Topic → Formula, with breadcrumbs on every page. Field pages group their formulas under topic headings.
- **Search:** <kbd>Ctrl</kbd>/<kbd>⌘</kbd> <kbd>K</kbd> or <kbd>/</kbd>. Matches names, aliases, symbols (`ρ`, `rho`, `ΔP`, `Re`), tags and descriptions, and formula-style queries such as `E=mc^2`.
- **Stack:** Astro (static output), TypeScript, Tailwind CSS v4, KaTeX (rendered at build time), Preact (calculator only), Fuse.js (search), Zod (schema), Vitest (tests). No backend, no database.
- **Content:** 64 formulas (39 physics, 25 mathematics), 50 with calculators.

## Commands

```bash
npm install
```

```bash
npm run dev        # dev server at http://localhost:4321
```

```bash
npm test           # content validation + every calculator against its worked example
```

```bash
npm run build      # tests, then the static site into dist/ (fails on any content error)
```

```bash
npm run check      # TypeScript / Astro type-check
```

## Deploying

The output in `dist/` is plain static files.

- **Netlify / Vercel:** zero config. `netlify.toml` and `vercel.json` set the build command (`npm run build`) and the output directory (`dist`).
- **GitHub Pages:** `.github/workflows/deploy.yml` builds with `BASE_PATH=/<repo-name>` and deploys on every push to `main`. In the repository settings, set Pages → Source → **GitHub Actions**. For a custom domain, remove `BASE_PATH` from the workflow.

`SITE_URL` and `BASE_PATH` (environment variables, read in `astro.config.mjs`) are the only deployment settings.

## Project layout

```
src/content/taxonomy.yaml                   category tree: domains → fields → topics
src/content/formulas/<id>/formula.yaml      one formula: content only
src/content/formulas/<id>/calc.ts           optional calculator: solvers + validity checks
src/lib/schema.ts                           Zod schema for formula.yaml and taxonomy.yaml
src/lib/content.ts                          loader + cross-file validation (errors fail the build)
src/lib/calculator.ts                       calculator engine (pure, used by tests and browser)
src/lib/checks.ts                           reusable validity checks (v ≪ c, Mach number)
src/components/, src/layouts/, src/pages/   UI (never needs editing to add content)
tests/                                      Vitest suites
```

---

## Adding a formula

Adding a formula means adding one folder. You never touch UI code, and the build rejects anything incomplete or
inconsistent, with a message naming the file and the field.

### 1. Make sure the topic exists

Formulas attach to a topic in `src/content/taxonomy.yaml`, addressed as `domain/field/topic`. To add a topic,
field or domain, add an entry there. Every topic must end up with at least one formula, and field and domain
icons must be names defined in `src/lib/icons.ts`.

### 2. Create `src/content/formulas/<id>/formula.yaml`

The folder name **is** the id: lowercase-kebab-case, unique, and used in the URL. A minimal complete example:

```yaml
id: ohms-law
name: Ohm's Law
aliases: [V = IR]                          # optional; searchable
topic: physics/electromagnetism/circuits   # must exist in taxonomy.yaml
difficulty: basic                          # basic | intermediate | advanced
summary: The voltage across a resistor is proportional to the current through it.   # ≤ 160 chars

latex: |-
  \sym{V}{V} = \sym{I}{I}\,\sym{R}{R}

variables:
  - id: V
    symbol: V
    name: Voltage
    unit: V                                # SI unit; '1' = dimensionless; null = pure maths
    description: Potential difference across the component.
    searchAliases: [voltage]               # optional
  - id: I
    symbol: I
    name: Current
    unit: A
    description: Electric current through the component.
  - id: R
    symbol: R
    name: Resistance
    unit: Ω
    description: Electrical resistance of the component.

assumptions:                               # required, at least one
  - '**Ohmic component**: $R$ does not depend on $V$ or $I$.'

intuition: >-
  Two to four sentences on what the formula actually says.

derivation:                                # optional; shown collapsed
  - note: Microscopic Ohm's law.
    latex: \mathbf{J} = \sigma\mathbf{E}

example:
  title: Current through a resistor
  problem: A 4 Ω resistor is connected across a 12 V battery. What current flows?
  given: { V: 12, R: 4 }                   # SI values, keyed by variable id
  solveFor: I
  expected: { I: 3 }                       # checked by the tests
  tolerance: 1.0e-9                        # relative; default 1e-3
  steps:
    - latex: I = V/R = 12/4 = 3\ \text{A}
  answer: $I = 3\ \text{A}$
  sources:                                 # required: where every number comes from
    - value: V = 12 V, R = 4 Ω
      source: Illustrative choice.

calculator:
  solvable: [V, I, R]                      # must match the solvers in calc.ts
  # or, if a calculator makes no sense:
  # none: Explanation (≥ 20 characters) of why there is no calculator.

related: [electric-power]                  # ids of existing formulas
tags: [circuit, voltage, current]          # at least one
```

#### Tag every symbol with `\sym{id}{…}`

In `latex`, wrap each symbol as `\sym{varId}{tex}`, e.g. `\sym{dP}{\Delta P}` or `\sym{u}{\mathbf{u}}`. This drives the
hover-highlighting between the formula and the variable table. Every variable must be tagged at least once, and
every tag must name a variable. Tags may be nested, as in `\sym{s}{\sym{a}{\mathbf{a}}\cdot\sym{b}{\mathbf{b}}}`.
Copy LaTeX strips the tags automatically.

#### Variable options

| Field | Values | Use |
|---|---|---|
| `kind` | `variable` (default), `constant`, `operator`, `index` | Constants (`G`, `c`, `ε₀`), operators (`∇`, `d/dx`) and indices (`i`, `n`) appear in the table but never in the calculator. |
| `shape` | `scalar` (default), `list` | `list` = a data set or vector, entered comma-separated (mean, dot product). |
| `inCalculator` | `true` (default), `false` | Shown in the formula but neither an input nor an output, e.g. θ in the dot product, which the calculator reports as a check instead. |
| `unit` | SI unit text, `'1'`, or `null` | Use `'1'` for dimensionless physical quantities and `null` for pure mathematics. Angles use `°` in calculators (see Conventions). |

#### Text fields

`description`, `assumptions`, `intuition`, `note`, `problem`, `answer` and `calculator.none` accept inline math in
`$…$` and `**bold**`. `latex` fields are display math. Everything is rendered by KaTeX at build time, and any LaTeX
error fails the build.

#### YAML pitfalls

These are the errors that come up in practice:

- Quote any string containing `: ` or ending in `:`, e.g. `note: 'Check: it works.'`. Otherwise YAML reads it as a key.
- A value may not start with `|`. Use `\lvert … \rvert` in LaTeX instead of `|…|`.
- Use block scalars for long prose (`>-`) and for the main LaTeX (`|-`). Backslashes need no escaping in them.

### 3. Optional: create `calc.ts` next to it

```ts
import { CalcError, defineCalculator } from '../../../lib/calculator';

export default defineCalculator({
  // One solver per solvable variable. Inputs are all other calculator variables.
  solve: {
    V: ({ I, R }) => I * R,
    I: ({ V, R }) => V / R,
    R: ({ V, I }) => {
      if (I === 0) throw new CalcError('With zero current the resistance is undefined.');
      return V / I;
    },
  },
  // Input validation: 'positive' | 'nonnegative' | 'nonzero' | 'probability' | 'any'
  domain: { R: 'positive' },
  // Validity checks run on the full solution (inputs + result). Return null for "nothing to say".
  checks: [
    ({ V, I }) => ({ level: 'info', message: `P = ${(V * I).toPrecision(4)} W` }),
  ],
  // LHS − RHS; the tests verify it is ≈ 0 at the worked example.
  residual: ({ V, I, R }) => V - I * R,
});
```

| Option | Purpose |
|---|---|
| `solve` | `(values, lists) => number \| {re, im} \| [{label, value}, …]`. Return several labelled values for multiple solutions (quadratic roots, the ambiguous case of the law of sines) or vector components. |
| `inputs` | Override which variables a solver needs, e.g. `{ s: ['x'], sigma: ['x'] }` when outputs do not depend on each other. |
| `aux` | Extra inputs used only by validity checks, with a default, e.g. fluid density for the Reynolds-number check in Hagen–Poiseuille. |
| `checks` | Each returns `{ level: 'ok' \| 'info' \| 'warn' \| 'error', message }` or `null`. **If the formula has a checkable validity condition (Reynolds number, v ≪ c, Mach number, total internal reflection), it must be checked here.** |
| `CalcError` | Throw it when inputs admit no answer. Its message is shown to the user, so say *why*. NaN and Infinity are caught automatically as "no real solution". |

Shared checks live in `src/lib/checks.ts`: `relativisticCheck(v, quantity, relError)` and `machCheck(v, a, what)`.

### 4. Run `npm test`

Nothing else is needed: the tests pick the formula up automatically. For every calculator they check that:

1. it reproduces **every** value in `example.expected` within `tolerance`;
2. solving each variable back from the full solution recovers its value (the round trip);
3. the full solution satisfies `residual` ≈ 0;
4. its validity checks raise no error on the worked example.

> These tests prove the calculator and the worked example **agree with each other**, not that the physics is right.
> If both use a wrong formula, they still pass. That is why every reference value needs a `sources` entry, so a
> reviewer can check the numbers against the literature.

### What the build rejects

- Schema violations: a missing required field, an unknown field, a bad slug, no assumptions, no sources, a summary over 160 characters.
- A `topic` that is not in the taxonomy, a duplicate id, or an id that differs from its folder name.
- A `\sym` tag without a variable, or a variable that is never tagged.
- LaTeX that does not compile, anywhere: formula, symbols, steps, inline math, or the Copy-LaTeX and card-preview forms.
- `calculator.solvable` that differs from the solvers in `calc.ts`, a `calc.ts` with `calculator: none`, or a calculator without one.
- An example that does not give every input its solvers need, whose `expected` names a non-solvable variable, or that uses `given`/`expected` without a calculator.
- A list given where a number is expected, or the reverse.
- `related` ids that do not exist; an empty topic; an unknown icon.

## Conventions

- **SI units** for every input and output, with one deliberate exception: **calculator angles are in degrees** (law of sines and cosines, Snell's law, work), because nobody types 0.5236 for 30°. Formulas whose mathematics require radians (Euler's formula) use radians and say so.
- Physical constants use CODATA 2022 values; exact SI constants (c, h, e, k_B, N_A, R) are exact.
- Prose is plain and direct, and assumptions name the regime where the formula fails, not just where it holds.
