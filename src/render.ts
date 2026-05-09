import type { StoryOutput } from './schema.ts';

export const DEFAULT_WPM = 150;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Replace model-emitted timestamps with ones derived from cumulative chapter
 * word count at `wpm`. The first chapter starts at 0:00; the hook narrates
 * during that window. Deterministic, no LLM call.
 */
export function recomputeTimestamps(story: StoryOutput, wpm = DEFAULT_WPM): StoryOutput {
  let cursor = 0;
  const chapters = story.chapters.map((c) => {
    const ts = cursor;
    cursor += Math.round((countWords(c.body) / wpm) * 60);
    return { ...c, timestamp_seconds: ts };
  });
  return { ...story, chapters };
}

export function formatTimestamp(seconds: number): { hms: string; href: string } {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const hms = h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  const href = seconds === 0 ? '0s' : `${seconds}s`;
  return { hms, href };
}

export function renderMarkdown(story: StoryOutput, videoId = 'PLACEHOLDER'): string {
  const head = `# ${story.title}\n\n${story.hook}\n\n## Chapters\n`;
  const lines = story.chapters.map((c) => {
    const { hms, href } = formatTimestamp(c.timestamp_seconds);
    return `- [${hms}](https://youtube.com/${videoId}?t=${href}) ${c.emoji} **${c.headline}** — ${c.body}`;
  });
  const advice = `\n\n## Advice\n` + story.closing_advice.map((a) => `- ${a}`).join('\n');
  return head + lines.join('\n') + advice + '\n';
}
