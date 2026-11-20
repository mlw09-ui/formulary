/**
 * Content schema. This file is the contract between content (src/content/**)
 * and UI. Every formula.yaml and taxonomy.yaml is validated against it at build
 * time; a violation aborts the build (see src/lib/content.ts).
 */
import { z } from 'zod';
import { ICON_NAMES } from './icons';

export const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be a lowercase-kebab-case slug');

/** Text that may contain inline math in $…$ (rendered with KaTeX at build). */
const richText = z.string().trim().min(1);

// ---------------------------------------------------------------- taxonomy

export const topicSchema = z.strictObject({
  id: slug,
  name: z.string().min(1),
  description: richText,
});

export const fieldSchema = z.strictObject({
  id: slug,
  name: z.string().min(1),
  description: richText,
  icon: z.enum(ICON_NAMES),
  topics: z.array(topicSchema).min(1),
});

export const domainSchema = z.strictObject({
  id: slug,
  name: z.string().min(1),
  description: richText,
  icon: z.enum(ICON_NAMES),
  fields: z.array(fieldSchema).min(1),
});

export const taxonomySchema = z.strictObject({
  domains: z.array(domainSchema).min(1),
});

// ---------------------------------------------------------------- formula

export const variableSchema = z.strictObject({
  /** Id used in \sym{id}{…} inside the LaTeX and as the calculator key. */
  id: z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/, 'must be a valid identifier'),
  /** LaTeX for the symbol as it appears in the formula, e.g. "\\Delta P". */
  symbol: z.string().min(1),
  name: z.string().min(1),
  /**
   * SI unit as display text (e.g. "m³/s", "Pa·s"). "1" = dimensionless
   * physical quantity; null = pure-mathematics quantity without units.
   */
  unit: z.string().min(1).nullable(),
  description: richText,
  /**
   * variable = quantity; operator = ∇, d/dx …; constant = physical/mathematical
   * constant (G, c, π); index = summation index or count (i, n).
   */
  kind: z.enum(['variable', 'operator', 'constant', 'index']).default('variable'),
  /** scalar = one number; list = a data set or vector, entered comma-separated. */
  shape: z.enum(['scalar', 'list']).default('scalar'),
  /**
   * false = shown in the formula but not a calculator input or output (e.g. θ in
   * the dot product, which the calculator reports as a check instead).
   */
  inCalculator: z.boolean().default(true),
  /** Extra search terms, e.g. ["rho"]. Greek letters are added automatically. */
  searchAliases: z.array(z.string()).default([]),
});

const numberOrList = z.union([z.number(), z.array(z.number())]);
const expectedValue = z.union([z.number(), z.array(z.number()), z.strictObject({ re: z.number(), im: z.number() })]);

export const sourceSchema = z.strictObject({
  /** Which value this is about, e.g. "μ = 1.002 × 10⁻³ Pa·s". */
  value: z.string().min(1),
  /** Where it comes from, or "Illustrative choice" / "Exact (pure mathematics)". */
  source: z.string().min(1),
});

export const stepSchema = z.strictObject({
  /** Explanatory prose for the step (inline $math$ allowed). */
  note: richText.optional(),
  /** Display-math LaTeX for the step. */
  latex: z.string().min(1).optional(),
}).refine((s) => s.note || s.latex, 'a step needs a note, latex, or both');

export const exampleSchema = z.strictObject({
  title: z.string().min(1).default('Worked example'),
  problem: richText,
  /**
   * Known values in SI units, keyed by variable id (or calculator aux input id).
   * Required when the formula has a calculator; shown as the "Given" table.
   */
  given: z.record(z.string(), numberOrList).optional(),
  /** Variable the example solves for; must be calculator-solvable if a calculator exists. */
  solveFor: z.string().optional(),
  /** Expected result(s) keyed by variable id; checked by tests against the calculator. */
  expected: z.record(z.string(), expectedValue).optional(),
  /** Relative tolerance for the test comparison. */
  tolerance: z.number().positive().max(0.05).default(1e-3),
  steps: z.array(stepSchema).min(1),
  answer: richText,
  /** Provenance of every reference value, so physics can be spot-checked. */
  sources: z.array(sourceSchema).min(1),
});

export const calculatorSchema = z.union([
  z.strictObject({ solvable: z.array(z.string()).min(1) }),
  z.strictObject({ none: z.string().min(20, 'explain why there is no calculator') }),
]);

export const formulaSchema = z.strictObject({
  id: slug,
  name: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  /** "domain/field/topic", must resolve in taxonomy.yaml. */
  topic: z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+$/, 'must be "domain/field/topic"'),
  difficulty: z.enum(['basic', 'intermediate', 'advanced']),
  /** One-line description shown on cards and in search. */
  summary: z.string().min(10).max(160),
  /** Display LaTeX. Wrap each symbol as \sym{varId}{…}. May contain \\ line breaks. */
  latex: z.string().min(1),
  variables: z.array(variableSchema).min(1),
  assumptions: z.array(richText).min(1),
  intuition: richText,
  derivation: z.array(stepSchema).min(1).optional(),
  example: exampleSchema,
  calculator: calculatorSchema,
  related: z.array(slug).default([]),
  tags: z.array(z.string().min(1)).min(1),
});

export type Taxonomy = z.infer<typeof taxonomySchema>;
export type Domain = z.infer<typeof domainSchema>;
export type Field = z.infer<typeof fieldSchema>;
export type Topic = z.infer<typeof topicSchema>;
export type Formula = z.infer<typeof formulaSchema>;
export type Variable = z.infer<typeof variableSchema>;
export type Step = z.infer<typeof stepSchema>;
