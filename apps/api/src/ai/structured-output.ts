import type { ZodType } from 'zod';

export type ParsedOutput<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly detail: string };

const FENCED_JSON = /^```(?:json)?\s*([\s\S]*?)\s*```$/i;

/**
 * Extracts and validates model JSON. Models routed through an OpenAI-compatible endpoint may wrap
 * JSON in a markdown fence or add a short preamble, so both are tolerated (DEC-061). Anything that
 * still does not validate is malformed — it is never repaired into a guess.
 */
export function parseStructuredOutput<T>(text: string, schema: ZodType<T>): ParsedOutput<T> {
  const json = parseJson(text.trim());

  if (json === undefined) {
    return { ok: false, detail: 'Output is not JSON.' };
  }

  const validated = schema.safeParse(json);

  if (!validated.success) {
    const issues = validated.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`);
    return { ok: false, detail: `Output does not match schema: ${issues.join('; ')}` };
  }

  return { ok: true, value: validated.data };
}

function parseJson(text: string): unknown {
  const fenced = FENCED_JSON.exec(text);
  const candidates = [fenced?.[1] ?? text];
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');

  if (start >= 0 && end > start) {
    candidates.push(text.slice(start, end + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as unknown;
    } catch {
      // Try the next candidate.
    }
  }

  return undefined;
}
