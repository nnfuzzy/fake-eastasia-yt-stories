import { assert, assertEquals } from '@std/assert';
import { recomputeTimestamps, renderMarkdown } from '../src/render.ts';
import type { StoryOutput } from '../src/schema.ts';

const story: StoryOutput = {
  title: 't',
  hook: 'h',
  chapters: [
    { timestamp_seconds: 9999, emoji: '🌴', headline: 'A', body: 'one '.repeat(150).trim() }, // ~150 words → 60s
    { timestamp_seconds: 9999, emoji: '📋', headline: 'B', body: 'two '.repeat(75).trim() }, // ~75 → 30s
    { timestamp_seconds: 9999, emoji: '💔', headline: 'C', body: 'tre '.repeat(300).trim() }, // ~300 → 120s
  ],
  closing_advice: ['a', 'b', 'c'],
};

Deno.test('recomputeTimestamps: chapter 1 starts at 0', () => {
  const out = recomputeTimestamps(story, 150);
  assertEquals(out.chapters[0].timestamp_seconds, 0);
});

Deno.test('recomputeTimestamps: cumulative seconds match wpm math', () => {
  const out = recomputeTimestamps(story, 150);
  assertEquals(out.chapters[1].timestamp_seconds, 60); // after 150 words
  assertEquals(out.chapters[2].timestamp_seconds, 90); // after 150+75 words
});

Deno.test('recomputeTimestamps: faster wpm shortens timestamps', () => {
  const slow = recomputeTimestamps(story, 100);
  const fast = recomputeTimestamps(story, 200);
  assert(fast.chapters[2].timestamp_seconds < slow.chapters[2].timestamp_seconds);
});

Deno.test('renderMarkdown: produces YouTube-style links', () => {
  const md = renderMarkdown(recomputeTimestamps(story, 150), 'abc123');
  assert(md.includes('https://youtube.com/abc123?t=0s'));
  assert(md.includes('https://youtube.com/abc123?t=60s'));
});
