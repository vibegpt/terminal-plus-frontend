// Chat panel formatting. Run: npx tsx --test tests/chatFormat.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatHours, parseChatMarkdown, parseInline } from '../src/lib/chatFormat';

test('hours: the 5 shapes in amenity_detail.opening_hours', () => {
  assert.deepEqual(formatHours('05:00-01:00'), ['05:00-01:00']); // was rendered as "0"
  assert.deepEqual(formatHours('24/7'), ['24/7']); // was "2"
  assert.deepEqual(formatHours('{"Monday-Sunday": "06:00-01:00"}'), ['Monday-Sunday: 06:00-01:00']); // was "{"
  assert.deepEqual(formatHours('Mon-Fri 11:00-20:00, Sat-Sun 10:00-20:00'), ['Mon-Fri 11:00-20:00, Sat-Sun 10:00-20:00']);
  assert.deepEqual(formatHours({ Mon: '09:00-17:00', Tue: '09:00-18:00' }), ['Mon: 09:00-17:00', 'Tue: 09:00-18:00']);
});

test('hours: nothing usable means no lines', () => {
  assert.deepEqual(formatHours(null), []);
  assert.deepEqual(formatHours(undefined), []);
  assert.deepEqual(formatHours('   '), []);
  assert.deepEqual(formatHours({}), []);
  assert.deepEqual(formatHours('{not json'), ['{not json']); // shown as written, never split into characters
});

test('bold and italics become tokens; the rest stays text', () => {
  assert.deepEqual(parseInline('Try **Bacha Coffee** first, *then* _Starbucks_.'), [
    { type: 'text', text: 'Try ' },
    { type: 'strong', text: 'Bacha Coffee' },
    { type: 'text', text: ' first, ' },
    { type: 'em', text: 'then' },
    { type: 'text', text: ' ' },
    { type: 'em', text: 'Starbucks' },
    { type: 'text', text: '.' },
  ]);
  assert.deepEqual(parseInline('__Jewel__'), [{ type: 'strong', text: 'Jewel' }]);
});

test('markers that are not markdown stay literal', () => {
  const literal = (s: string) => assert.deepEqual(parseInline(s), [{ type: 'text', text: s }]);
  literal('an unclosed **bold');
  literal('5 * 3 = 15');
  literal('snake_case_name');
  literal('** spaced **');
});

test('HTML is never markup: it comes back as plain text for React to escape', () => {
  const blocks = parseChatMarkdown('<img src=x onerror=alert(1)> **<b>hi</b>**');
  assert.deepEqual(blocks, [
    { type: 'p', inline: [{ type: 'text', text: '<img src=x onerror=alert(1)> ' }, { type: 'strong', text: '<b>hi</b>' }] },
  ]);
});

test('bullet lines group into one list; other lines are paragraphs', () => {
  const blocks = parseChatMarkdown('Three picks:\n- **Bacha Coffee** for views\n* Starbucks\n• Toast Box\n\nEnjoy!');
  assert.equal(blocks.length, 3);
  assert.deepEqual(blocks[0], { type: 'p', inline: [{ type: 'text', text: 'Three picks:' }] });
  assert.equal(blocks[1].type, 'ul');
  if (blocks[1].type === 'ul') {
    assert.equal(blocks[1].items.length, 3);
    assert.deepEqual(blocks[1].items[0][0], { type: 'strong', text: 'Bacha Coffee' });
  }
  assert.deepEqual(blocks[2], { type: 'p', inline: [{ type: 'text', text: 'Enjoy!' }] });
});
