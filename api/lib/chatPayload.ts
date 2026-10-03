// api/lib/chatPayload.ts
// Pure helpers for /api/chat: the amenity block the model reads, and reading
// the model's reply. No I/O, so tests/chatPayload.test.ts can pin the behaviour.

import type Anthropic from '@anthropic-ai/sdk';

// ---------- Amenity block ----------

/** Column order of the amenity block. The system prompt describes the same header. */
export const AMENITY_COLUMNS = 'slug|name|terminal|hours|price|vibes|editorial_score|editorial_note|route_context|description';

const MAX_NOTE = 200;
const MAX_DESCRIPTION = 80;

/** One cell: no pipes or newlines, whitespace collapsed, null as empty. */
function cell(v: unknown, max?: number): string {
  if (v === null || v === undefined) return '';
  let s = String(v).replace(/[\r\n|]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (max && s.length > max) s = s.slice(0, max).trimEnd();
  return s;
}

/** opening_hours is text; 15 rows hold a JSON object as a string. Flatten those to "day: hours". */
function hoursCell(v: unknown): string {
  if (typeof v === 'string' && v.trim().startsWith('{')) {
    try {
      const obj = JSON.parse(v) as Record<string, unknown>;
      return cell(Object.entries(obj).map(([day, h]) => `${day}: ${h}`).join('; '));
    } catch { /* fall through */ }
  }
  return cell(v);
}

/**
 * Header once, then one pipe-separated row per amenity. Replaces per-row JSON,
 * which repeated every key name. gate_location and zone (always null) and
 * walking_time_minutes (a placeholder 5 on 292 of 378 rows) are left out.
 * description is only sent when there's no editorial_note: the note is the
 * richer text, and the 80-char description was about a sixth of each row.
 */
export function formatAmenityBlock(rows: Array<Record<string, unknown>>): string {
  if (!rows.length) return '';
  return [
    AMENITY_COLUMNS,
    ...rows.map(a => [
      cell(a.amenity_slug),
      cell(a.name),
      cell(a.terminal_code),
      hoursCell(a.opening_hours),
      cell(a.price_level),
      cell(a.vibe_tags),
      cell(a.editorial_score),
      cell(a.editorial_note, MAX_NOTE),
      cell(a.route_context),
      cell(cell(a.editorial_note) ? null : a.description, MAX_DESCRIPTION),
    ].join('|')),
  ].join('\n');
}

// ---------- Reply ----------

export interface ChatReply {
  message: string;
  recommended_slugs: string[];
  follow_up: string | null;
  extracted_context: Record<string, unknown> | null;
}

const MAX_SLUGS = 10;

/** Shown when the reply was JSON-shaped but unreadable, so raw JSON never reaches the user. */
export const UNREADABLE_REPLY = "Sorry, I lost my train of thought there. Could you ask that again?";

/**
 * The reply text. Read by block type, not position: with adaptive thinking a
 * response can open with a `thinking` block.
 */
export function replyText(content: Anthropic.ContentBlock[]): string {
  const block = content.find((b): b is Anthropic.TextBlock => b.type === 'text');
  return block?.text ?? '';
}

/**
 * Parses the JSON reply the system prompt asks for. `jsonValid` is true only
 * when an object parsed and carried a string `message` and an array
 * `recommended_slugs`. Otherwise the message is salvaged without exposing JSON.
 */
export function parseReply(text: string): { reply: ChatReply; jsonValid: boolean } {
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const obj = JSON.parse(match[0]) as Record<string, unknown>;
      if (typeof obj.message === 'string' && Array.isArray(obj.recommended_slugs)) {
        return {
          jsonValid: true,
          reply: {
            message: obj.message,
            recommended_slugs: obj.recommended_slugs
              .filter((s): s is string => typeof s === 'string')
              .slice(0, MAX_SLUGS),
            follow_up: typeof obj.follow_up === 'string' && obj.follow_up ? obj.follow_up : null,
            extracted_context:
              obj.extracted_context && typeof obj.extracted_context === 'object' && !Array.isArray(obj.extracted_context)
                ? (obj.extracted_context as Record<string, unknown>)
                : null,
          },
        };
      }
    } catch { /* fall through to salvage */ }
  }
  return { jsonValid: false, reply: { message: salvageMessage(text), recommended_slugs: [], follow_up: null, extracted_context: null } };
}

function salvageMessage(text: string): string {
  // A truncated or malformed object: pull the message string out if it's whole.
  const m = text.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (m) {
    try {
      return JSON.parse(`"${m[1]}"`) as string;
    } catch { /* ignore */ }
  }
  const trimmed = text.trim();
  if (!trimmed || trimmed.startsWith('{') || trimmed.startsWith('```')) return UNREADABLE_REPLY;
  return trimmed; // plain prose: show it as is
}
