// Minutes to boarding the user states in THIS message, or null (CC-29 A3, D1).
// Pure. nowSgt is minutes since midnight, Singapore time. Contract: tests/chatMinutes.test.ts.
// Only a duration inside an intent phrase counts ("I have 2 hours", "3 hour layover"), so "a 5 min walk"
// and "open 24 hours" never do. Bounds 5 to 600 minutes.
const WORD: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
const N = String.raw`(\d+(?:\.\d+)?|an?|one|two|three|four|five|six)`;
// A duration: "2 hours", "an hour and a half", "1 hour 20 minutes", "45 min", "half an hour".
const DUR = new RegExp(String.raw`(?:${N}\s*(?:hours?|hrs?|h)\b(\s*and a half)?(?:\s*(?:and\s*)?(\d+)\s*(?:minutes?|mins?|m)\b)?|(\d+)\s*(?:minutes?|mins?|m)\b|half an? hour)`, 'g');
// It counts only inside an intent phrase: "I have / I've got / we have <dur>", "<dur> left / layover / until …",
// or "in <dur>" when the message opens with it ("In about 2.5 hours.") or follows boarding / flight / departs / leaves.
const BEFORE = /(?:\b(?:i|we)\s*(?:have|'ve got|ve got|got|'ve|ve)|\b(?:boarding|boards?|flight|departs?|leaves?|leaving|gate closes?)\s+(?:is\s+)?in|^\s*(?:in|within))\s*(?:only\s*|just\s*|about\s*|around\s*|roughly\s*)?$/;
const AFTER = /^\s*(?:left|layover|stopover|connection|transit|to spare|to kill|until|till|before)\b/;
const MIN = 5, MAX = 600;

function minutesOf(m: RegExpExecArray): number {
  if (m[0].startsWith('half')) return 30;
  if (m[4]) return parseInt(m[4], 10);
  const hours = WORD[m[1]] ?? parseFloat(m[1]);
  return Math.round(hours * 60 + (m[2] ? 30 : 0) + (m[3] ? parseInt(m[3], 10) : 0));
}

function duration(q: string): number | null {
  for (const m of q.matchAll(DUR)) {
    const i = m.index ?? 0;
    if (BEFORE.test(q.slice(0, i)) || AFTER.test(q.slice(i + m[0].length))) return minutesOf(m as RegExpExecArray);
  }
  return null;
}

function clock(q: string, nowSgt: number): number | null {
  const t = q.match(/\b(?:boarding|board|flight|departs?|departure|leaves?|leaving|gate closes?)\b[^\d]{0,12}\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  if (!t) return null;
  let hh = parseInt(t[1], 10);
  const mm = parseInt(t[2] ?? '0', 10);
  if (t[3] === 'pm' && hh < 12) hh += 12;
  if (t[3] === 'am' && hh === 12) hh = 0;
  if (hh > 23 || mm > 59) return null;
  const diff = hh * 60 + mm - nowSgt;
  return diff > 0 ? diff : diff + 1440;
}

export function statedMinutes(query: string, nowSgt: number): number | null {
  const q = query.toLowerCase().replace(/[’]/g, "'");
  const v = clock(q, nowSgt) ?? duration(q);
  return v !== null && v >= MIN && v <= MAX ? v : null;
}
