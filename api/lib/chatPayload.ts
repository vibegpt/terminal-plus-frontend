// api/lib/chatPayload.ts
// Pure helpers for /api/chat: reading the model's reply. No I/O, so
// tests/chatPayload.test.ts can pin the behaviour.

import type Anthropic from '@anthropic-ai/sdk';

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
