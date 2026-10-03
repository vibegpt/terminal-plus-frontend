// api/lib/models.ts
// The only file that names an Anthropic model. Everything else imports from here.
//
// CHAT_MODEL answers /api/chat. ANTHROPIC_MODEL overrides it per Vercel
// environment (the CC-6 eval switched models this way on a preview), so a model
// change never needs a code edit. FALLBACK_MODEL takes 1 retry when the primary
// is overloaded, times out, or doesn't exist (api/chat.ts).

import type Anthropic from '@anthropic-ai/sdk';

// Chosen by the CC-6 eval (tasks/cc-6-report.md): tied claude-sonnet-4-6 on
// validity and slug quality, faster at p50 (4.5 s vs 6.8 s).
export const CHAT_MODEL: string = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';

/** Active until at least 17 Feb 2027. */
export const FALLBACK_MODEL = 'claude-sonnet-4-6';

type ChatParams = Pick<Anthropic.MessageCreateParamsNonStreaming, 'thinking' | 'output_config'>;

/**
 * Request settings per model. Chat is a short, latency-bound turn, so both
 * current models run at low effort. An ID not listed here (the 4.5 baseline,
 * or a bad ANTHROPIC_MODEL) gets none: 4.5 rejects `effort`.
 */
export function chatParams(model: string): ChatParams {
  switch (model) {
    case 'claude-sonnet-5-5':
      // Adaptive thinking is this model's default; at low effort it skips
      // thinking on most simple turns. `disabled` is a 400 here.
      return { output_config: { effort: 'low' } };
    case 'claude-sonnet-4-6':
      // Omitting `thinking` already means none on 4.6; effort defaults to high.
      return { thinking: { type: 'disabled' }, output_config: { effort: 'low' } };
    default:
      return {};
  }
}

/** USD per million tokens, first-party API. Used to cost eval runs; the 4.5 entry costs the CC-6 baseline. */
export const PRICE_PER_MTOK: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-5-20250929': { input: 3, output: 15 },
  'claude-sonnet-4-6': { input: 3, output: 15 },
  'claude-sonnet-5-5': { input: 2, output: 10 },
};
