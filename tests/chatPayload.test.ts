// How /api/chat reads the model's reply. Run: npx tsx --test tests/chatPayload.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type Anthropic from '@anthropic-ai/sdk';
import { UNREADABLE_REPLY, parseReply, replyText } from '../api/lib/chatPayload';

const text = (t: string) => ({ type: 'text', text: t, citations: null }) as Anthropic.TextBlock;
const thinking = { type: 'thinking', thinking: '', signature: 'sig' } as Anthropic.ThinkingBlock;

test('the reply is the first text block, even after a thinking block', () => {
  assert.equal(replyText([thinking, text('{"message":"hi"}')]), '{"message":"hi"}');
  assert.equal(replyText([text('a'), text('b')]), 'a');
  assert.equal(replyText([thinking]), '');
});

test('a well-formed reply parses and is valid', () => {
  const { reply, jsonValid } = parseReply(
    '{"message":"Try Bacha.","recommended_slugs":["bacha-coffee-sint3",7],"follow_up":"When do you board?","extracted_context":{"terminal":"SIN-T3"}}',
  );
  assert.equal(jsonValid, true);
  assert.equal(reply.message, 'Try Bacha.');
  assert.deepEqual(reply.recommended_slugs, ['bacha-coffee-sint3']); // non-strings dropped
  assert.equal(reply.follow_up, 'When do you board?');
  assert.deepEqual(reply.extracted_context, { terminal: 'SIN-T3' });
});

test('JSON inside a markdown fence still parses', () => {
  const { reply, jsonValid } = parseReply('```json\n{"message":"ok","recommended_slugs":[]}\n```');
  assert.equal(jsonValid, true);
  assert.equal(reply.message, 'ok');
});

test('a reply missing recommended_slugs is not valid', () => {
  assert.equal(parseReply('{"message":"ok"}').jsonValid, false);
});

test('truncated JSON never reaches the user raw', () => {
  const cut = parseReply('{"message":"Head to Starbucks \\"T3\\" first.","recommended_slugs":["starb');
  assert.equal(cut.jsonValid, false);
  assert.equal(cut.reply.message, 'Head to Starbucks "T3" first.');
  assert.deepEqual(cut.reply.recommended_slugs, []);

  const noMessage = parseReply('{"recommended_slugs":["a"');
  assert.equal(noMessage.reply.message, UNREADABLE_REPLY);
});

test('plain prose is shown as is', () => {
  const { reply, jsonValid } = parseReply('  Sorry, I can only help with Changi.  ');
  assert.equal(jsonValid, false);
  assert.equal(reply.message, 'Sorry, I can only help with Changi.');
});

test('slugs are capped at 10', () => {
  const slugs = Array.from({ length: 15 }, (_, i) => `s${i}`);
  const { reply } = parseReply(JSON.stringify({ message: 'm', recommended_slugs: slugs }));
  assert.equal(reply.recommended_slugs.length, 10);
});
