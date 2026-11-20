/**
 * Loads and validates all content. Imported at build time by every page.
 * Any schema violation or broken cross-reference throws, which fails the build.
 */
import { parse as parseYaml } from 'yaml';
import type { ZodError } from 'zod';
import {
  formulaSchema, taxonomySchema,
  type Domain, type Field, type Formula, type Taxonomy, type Topic, type Variable,
} from './schema';
import type { CalculatorDef, Needed } from './calculator';
import { renderDisplay, renderRichText, stripSym, symIds } from './latex';

const formulaFiles = import.meta.glob<string>('/src/content/formulas/*/formula.yaml', {
  query: '?raw', import: 'default', eager: true,
});
const calcFiles = import.meta.glob<CalculatorDef>('/src/content/formulas/*/calc.ts', {
  import: 'default', eager: true,
});
const taxonomyFiles = import.meta.glob<string>('/src/content/taxonomy.yaml', {
  query: '?raw', import: 'default', eager: true,
});

export interface TopicNode extends Topic { domain: Domain; field: Field; path: string; formulas: Formula[] }
export interface FieldNode extends Omit<Field, 'topics'> { domain: Domain; path: string; topics: TopicNode[]; count: number }
export interface DomainNode extends Omit<Domain, 'fields'> { path: string; fields: FieldNode[]; count: number }

export interface Library {
  taxonomy: Taxonomy;
  domains: DomainNode[];
  formulas: Formula[];
  byId: Map<string, Formula>;
  calculators: Map<string, CalculatorDef>;
  topicOf: (f: Formula) => TopicNode;
  formulaPath: (f: Formula) => string;
}

function formatZod(file: string, err: ZodError): string[] {
  return err.issues.map((i) => `${file}: ${i.path.join('.') || '(root)'}: ${i.message}`);
}

function folderOf(path: string): string {
  return path.split('/').slice(-2, -1)[0]!;
}

/**
 * Build the validated library from raw file contents. Exported separately so
 * tests can feed it deliberately broken content.
 */
export function buildLibrary(
  rawFormulas: Record<string, string>,
  rawTaxonomy: string,
  calcs: Record<string, CalculatorDef>,
): Library {
  const errors: string[] = [];

  // --- taxonomy
  const taxParsed = taxonomySchema.safeParse(parseYaml(rawTaxonomy));
  if (!taxParsed.success) {
    throw new Error(`Invalid taxonomy.yaml:\n  ${formatZod('taxonomy.yaml', taxParsed.error).join('\n  ')}`);
  }
  const taxonomy = taxParsed.data;
  const topicIndex = new Map<string, { domain: Domain; field: Field; topic: Topic }>();
  const seen = new Set<string>();
  for (const domain of taxonomy.domains) {
    if (seen.has(domain.id)) errors.push(`taxonomy.yaml: duplicate domain id "${domain.id}"`);
    seen.add(domain.id);
    const fieldIds = new Set<string>();
    for (const field of domain.fields) {
      if (fieldIds.has(field.id)) errors.push(`taxonomy.yaml: duplicate field "${domain.id}/${field.id}"`);
      fieldIds.add(field.id);
      const topicIds = new Set<string>();
      for (const topic of field.topics) {
        if (topicIds.has(topic.id)) errors.push(`taxonomy.yaml: duplicate topic "${domain.id}/${field.id}/${topic.id}"`);
        topicIds.add(topic.id);
        topicIndex.set(`${domain.id}/${field.id}/${topic.id}`, { domain, field, topic });
      }
    }
  }

  // --- formulas: schema
  const formulas: Formula[] = [];
  const calculators = new Map<string, CalculatorDef>();
  const calcByFolder = new Map(Object.entries(calcs).map(([p, d]) => [folderOf(p), d]));

  for (const [path, raw] of Object.entries(rawFormulas)) {
    const file = path.replace(/^\/src\/content\//, '');
    let data: unknown;
    try {
      data = parseYaml(raw);
    } catch (e) {
      errors.push(`${file}: YAML syntax error: ${(e as Error).message}`);
      continue;
    }
    const parsed = formulaSchema.safeParse(data);
    if (!parsed.success) {
      errors.push(...formatZod(file, parsed.error));
      continue;
    }
    const f = parsed.data;
    if (f.id !== folderOf(path)) errors.push(`${file}: id "${f.id}" must equal its folder name "${folderOf(path)}"`);
    formulas.push(f);
    const calc = calcByFolder.get(folderOf(path));
    if (calc) calculators.set(f.id, calc);
  }

  // --- formulas: cross-checks
  const byId = new Map<string, Formula>();
  for (const f of formulas) {
    const file = `formulas/${f.id}/formula.yaml`;
    if (byId.has(f.id)) errors.push(`${file}: duplicate formula id "${f.id}"`);
    byId.set(f.id, f);

    if (!topicIndex.has(f.topic)) errors.push(`${file}: topic "${f.topic}" does not exist in taxonomy.yaml`);

    // Variables: unique ids, and LaTeX \sym tags must match the variable table exactly.
    const varIds = f.variables.map((v) => v.id);
    const dupVar = varIds.find((id, i) => varIds.indexOf(id) !== i);
    if (dupVar) errors.push(`${file}: duplicate variable id "${dupVar}"`);
    const tagged = symIds(f.latex);
    for (const id of tagged) if (!varIds.includes(id)) errors.push(`${file}: LaTeX uses \\sym{${id}} but no variable has that id`);
    for (const id of varIds) if (!tagged.has(id)) errors.push(`${file}: variable "${id}" is never tagged with \\sym{${id}}{…} in the LaTeX`);
    try { stripSym(f.latex); } catch (e) { errors.push(`${file}: ${(e as Error).message}`); }
    errors.push(...latexErrors(file, f));

    // Calculator consistency.
    const calc = calculators.get(f.id);
    if ('solvable' in f.calculator) {
      if (!calc) {
        errors.push(`${file}: declares a calculator but formulas/${f.id}/calc.ts is missing`);
      } else {
        const declared = [...f.calculator.solvable].sort();
        const implemented = Object.keys(calc.solve).sort();
        if (declared.join() !== implemented.join()) {
          errors.push(`${file}: calculator.solvable [${declared}] does not match calc.ts solvers [${implemented}]`);
        }
        for (const id of declared) {
          const v = f.variables.find((x) => x.id === id);
          if (!v) errors.push(`${file}: solvable "${id}" is not a variable`);
          else if (v.kind !== 'variable') errors.push(`${file}: solvable "${id}" is a ${v.kind}, not a variable`);
          else if (!v.inCalculator) errors.push(`${file}: solvable "${id}" has inCalculator: false`);
        }
        const ex = f.example;
        if (!ex.solveFor || !declared.includes(ex.solveFor)) {
          errors.push(`${file}: example.solveFor must be one of the solvable variables [${declared}]`);
        }
        if (!ex.expected || !ex.solveFor || !(ex.solveFor in ex.expected)) {
          errors.push(`${file}: example.expected must contain the solved variable so the calculator can be tested`);
        }
        const given = ex.given ?? {};
        if (!ex.given) errors.push(`${file}: example.given is required when there is a calculator`);
        const cv = calcVariables(f);
        const cvIds = cv.map((v) => v.id);
        const auxIds = Object.keys(calc.aux ?? {});
        for (const [k, val] of Object.entries(given)) {
          const v = cv.find((x) => x.id === k);
          if (!v && !auxIds.includes(k)) errors.push(`${file}: example.given.${k} is not a calculator variable or aux input`);
          else if (v && (v.shape === 'list') !== Array.isArray(val)) {
            errors.push(`${file}: example.given.${k} must be ${v.shape === 'list' ? 'a list' : 'a single number'}`);
          }
        }
        for (const [k, ins] of Object.entries(calc.inputs ?? {})) {
          if (!declared.includes(k)) errors.push(`${file}: calc.ts inputs.${k} is not a solvable variable`);
          for (const id of ins) if (!cvIds.includes(id)) errors.push(`${file}: calc.ts inputs.${k} lists unknown variable "${id}"`);
        }
        for (const target of Object.keys(ex.expected ?? {})) {
          if (!declared.includes(target)) {
            errors.push(`${file}: example.expected.${target} is not solvable, so it cannot be tested`);
            continue;
          }
          for (const id of solverInputs(f, calc, target)) {
            if (!(id in given)) errors.push(`${file}: example.given is missing "${id}" (needed to solve ${target})`);
          }
        }
        for (const v of f.variables) {
          if (v.kind !== 'variable' && v.shape === 'list') errors.push(`${file}: only variables can be lists ("${v.id}")`);
        }
      }
    } else {
      if (calc) errors.push(`${file}: has calc.ts but calculator is "none"`);
      if (f.example.given || f.example.expected) {
        errors.push(`${file}: example.given/expected are only used with a calculator; put the numbers in the steps`);
      }
    }
  }
  for (const f of formulas) {
    for (const r of f.related) {
      if (!byId.has(r)) errors.push(`formulas/${f.id}/formula.yaml: related formula "${r}" does not exist`);
      if (r === f.id) errors.push(`formulas/${f.id}/formula.yaml: a formula cannot be related to itself`);
    }
  }

  // Every topic must contain at least one formula, so navigation never leads to an empty page.
  const usedTopics = new Set(formulas.map((f) => f.topic));
  for (const key of topicIndex.keys()) {
    if (!usedTopics.has(key)) errors.push(`taxonomy.yaml: topic "${key}" has no formulas`);
  }

  if (errors.length) {
    throw new Error(`Content validation failed (${errors.length} problem${errors.length > 1 ? 's' : ''}):\n  ${errors.join('\n  ')}`);
  }

  // --- assemble the tree (taxonomy order; formulas by difficulty then name)
  const rank = { basic: 0, intermediate: 1, advanced: 2 } as const;
  const sorted = [...formulas].sort(
    (a, b) => rank[a.difficulty] - rank[b.difficulty] || a.name.localeCompare(b.name),
  );
  const topicNodes = new Map<string, TopicNode>();
  const domains: DomainNode[] = taxonomy.domains.map((domain) => {
    const fields: FieldNode[] = domain.fields.map((field) => {
      const topics: TopicNode[] = field.topics.map((topic) => {
        const key = `${domain.id}/${field.id}/${topic.id}`;
        const node: TopicNode = {
          ...topic, domain, field, path: key,
          formulas: sorted.filter((f) => f.topic === key),
        };
        topicNodes.set(key, node);
        return node;
      });
      return {
        ...field, domain, path: `${domain.id}/${field.id}`, topics,
        count: topics.reduce((n, t) => n + t.formulas.length, 0),
      };
    });
    return { ...domain, path: domain.id, fields, count: fields.reduce((n, f) => n + f.count, 0) };
  });

  return {
    taxonomy, domains, formulas: sorted, byId, calculators,
    topicOf: (f) => topicNodes.get(f.topic)!,
    formulaPath: (f) => `${f.topic}/${f.id}`,
  };
}

/** Compile every piece of LaTeX in a formula so errors name the file and field. */
function latexErrors(file: string, f: Formula): string[] {
  const out: string[] = [];
  const display = (where: string, tex: string | undefined) => {
    if (!tex) return;
    try { renderDisplay(tex); } catch (e) { out.push(`${file}: ${where}: ${(e as Error).message}`); }
  };
  const rich = (where: string, text: string | undefined) => {
    if (!text) return;
    try { renderRichText(text); } catch (e) { out.push(`${file}: ${where}: ${(e as Error).message}`); }
  };
  display('latex', f.latex);
  f.variables.forEach((v, i) => { display(`variables[${i}].symbol`, v.symbol); rich(`variables[${i}].description`, v.description); });
  f.assumptions.forEach((a, i) => rich(`assumptions[${i}]`, a));
  rich('intuition', f.intuition);
  f.derivation?.forEach((s, i) => { display(`derivation[${i}].latex`, s.latex); rich(`derivation[${i}].note`, s.note); });
  f.example.steps.forEach((s, i) => { display(`example.steps[${i}].latex`, s.latex); rich(`example.steps[${i}].note`, s.note); });
  rich('example.problem', f.example.problem);
  rich('example.answer', f.example.answer);
  if ('none' in f.calculator) rich('calculator.none', f.calculator.none);
  return out;
}

/** Variables a calculator works with: quantities, minus those marked inCalculator: false. */
export function calcVariables(f: Formula): Variable[] {
  return f.variables.filter((v) => v.kind === 'variable' && v.inCalculator);
}

/** Variable ids needed to solve `target` (excluding aux inputs). */
export function solverInputs(f: Formula, calc: CalculatorDef, target: string): string[] {
  return calc.inputs?.[target] ?? calcVariables(f).map((v) => v.id).filter((id) => id !== target);
}

/** The full input list for runCalculator, including aux inputs. */
export function neededFor(f: Formula, calc: CalculatorDef, target: string): Needed[] {
  const shapes = new Map(f.variables.map((v) => [v.id, v.shape]));
  return [
    ...solverInputs(f, calc, target).map((id) => ({ id, list: shapes.get(id) === 'list' })),
    ...Object.keys(calc.aux ?? {}).map((id) => ({ id })),
  ];
}

let cached: Library | undefined;
export function getLibrary(): Library {
  cached ??= buildLibrary(formulaFiles, taxonomyFiles['/src/content/taxonomy.yaml'] ?? '', calcFiles);
  return cached;
}
