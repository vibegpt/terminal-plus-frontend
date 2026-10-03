// src/lib/chatFormat.ts
// Pure formatting for the chat panel: opening hours and the small slice of
// markdown the concierge writes. No dependencies; returns plain data, so the
// component renders every string as a React text node (escaped) and nothing
// reaches the DOM as HTML. Tests: tests/chatFormat.test.ts.

/**
 * opening_hours is a text column. Most rows are a plain string ("24/7",
 * "05:00-01:00"); 15 hold a JSON object as a string. Returns display lines:
 * a plain string as is, an object (or JSON-object string) as "day: hours".
 */
export function formatHours(hours: unknown): string[] {
  if (hours === null || hours === undefined) return [];
  if (typeof hours === 'string') {
    const s = hours.trim();
    if (!s) return [];
    if (s.startsWith('{')) {
      try {
        return formatHours(JSON.parse(s));
      } catch { /* not JSON after all: show the string */ }
    }
    return [s];
  }
  if (Array.isArray(hours)) return hours.flatMap(formatHours);
  if (typeof hours === 'object') {
    return Object.entries(hours as Record<string, unknown>)
      .filter(([, v]) => typeof v === 'string' || typeof v === 'number')
      .map(([day, v]) => `${day}: ${String(v).trim()}`);
  }
  return [];
}

export type Inline = { type: 'text' | 'strong' | 'em'; text: string };
export type Block = { type: 'p'; inline: Inline[] } | { type: 'ul'; items: Inline[][] };

const BULLET = /^\s*[-*•]\s+(.*)$/;
// **bold**, __bold__, *italic*, _italic_. Markers must hug the text, and
// underscores must sit at word edges, so snake_case and "5 * 3" stay literal.
// No lookbehind: it's a syntax error before Safari 16.4 and would break the bundle,
// so the _italic_ branch captures the character before it (group 4) instead.
const INLINE = /\*\*(?=\S)([\s\S]*?\S)\*\*|__(?=\S)([\s\S]*?\S)__|\*(?=[^\s*])([^*]*?[^\s*])\*|(^|[^\w])_(?=[^\s_])([^_]*?[^\s_])_(?!\w)/g;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    const at = (m.index ?? 0) + (m[4]?.length ?? 0); // skip the captured lead character
    if (at > last) out.push({ type: 'text', text: text.slice(last, at) });
    const bold = m[1] ?? m[2];
    out.push(bold !== undefined ? { type: 'strong', text: bold } : { type: 'em', text: (m[3] ?? m[5]) as string });
    last = (m.index ?? 0) + m[0].length;
  }
  if (last < text.length) out.push({ type: 'text', text: text.slice(last) });
  return out;
}

/** Paragraphs (one per line) and bullet lists. Everything else is literal text. */
export function parseChatMarkdown(text: string): Block[] {
  const blocks: Block[] = [];
  for (const line of text.split(/\r?\n/)) {
    const bullet = line.match(BULLET);
    if (bullet) {
      const prev = blocks[blocks.length - 1];
      const item = parseInline(bullet[1]);
      if (prev?.type === 'ul') prev.items.push(item);
      else blocks.push({ type: 'ul', items: [item] });
    } else if (line.trim()) {
      blocks.push({ type: 'p', inline: parseInline(line.trim()) });
    }
  }
  return blocks;
}
