import type { Scenario } from '../schema.ts';

export const FRICTION_TAXONOMY = [
  'visa & residency bureaucracy',
  'currency / cost-of-living drift',
  'climate, pollution, utility costs',
  'healthcare access & insurance for older expats',
  'loneliness, missed family milestones',
  'romance scams / asymmetric marriage',
  'language & script barriers',
  'cultural communication norms (face, indirectness, hierarchy)',
  'foreign-ownership / employment restrictions',
  'corruption, bribery, informal economy',
  'natural disasters & infrastructure fragility',
  'political instability, speech laws, monarchy/religion taboos',
  'two-tier pricing & soft discrimination',
  'property, voting, civic-rights restrictions',
  'destitute-expat endgame (dying alone, alcoholism)',
  'children: schooling cost, degree recognition, custody asymmetry',
  'homesickness for food, seasons, cultural texture',
] as const;

export interface PromptOptions {
  scenario: Scenario;
  wordCount: number;
  numProblems: number;
  audioMode: boolean;
  wordsPerMinute?: number;
}

export function buildSystemPrompt(opts: PromptOptions): string {
  const audio = opts.audioMode
    ? `\n\nAfter the structured output, also fill voiceover_script: a plain-text narration that strips emojis and timestamps, inserts [pause 400ms] between chapters, and labels anecdote quotes with "Speaker B:" so a multi-speaker TTS can voice them.`
    : '';

  return `You are writing a long-form, first-person retrospective in the style of a YouTube documentary narration.
Tone: reflective, sober, lightly cautionary — not sensational. Past tense. No "as an AI". No moralizing.
Output language: ${opts.scenario.language === 'de' ? 'German' : 'English'}.
Reading level: ${opts.scenario.reading_level}.
Target audience: ${opts.scenario.audience}.${audio}

Universal expat-friction taxonomy (pick the ${opts.numProblems} most plausible for this protagonist × country):
${FRICTION_TAXONOMY.map((f) => `- ${f}`).join('\n')}

For each friction, write one named anecdote: a friend or neighbor with a name, a specific number in ${opts.scenario.journey.currency}, and a specific outcome. Do NOT invent statistics — if a stat is needed, mark it [STAT-NEEDED].

Story shape (in order):
1. Cold-open hook — narrator now, in hindsight, one image. Goes in 'hook'.
2. The dream — why ${opts.scenario.journey.target_country} seemed like the answer. Sensory detail with real numbers.
3. The unraveling — exactly ${opts.numProblems} concrete frictions, one chapter each.
4. Turning point — the exact moment they decided.
5. Return / resolution.
6. Closing advice — 3–5 concrete rules.

Length: ~${opts.wordCount} words total.
Distribute timestamp_seconds proportionally across the story at ~${opts.wordsPerMinute ?? 150} words per minute.
Each chapter starts with a single emoji that reflects its theme.`;
}

export function buildUserPrompt(scenario: Scenario): string {
  const p = scenario.protagonist;
  const j = scenario.journey;
  return `Protagonist:
- Name: ${p.name}
- Age: ${p.age} (${p.gender})
- Origin: ${p.origin_country}${p.origin_region ? ` (${p.origin_region})` : ''}
- Former occupation: ${p.occupation}
- Trigger event: ${p.trigger_event}
- Financial baseline: ${p.financials}
- Languages spoken: ${p.languages.join(', ') || 'none specified'}

Journey:
- Target country: ${j.target_country}
- City / region: ${j.target_city}
- Arrival year: ${j.arrival_year}
- Duration: ${j.duration_years} years
- Outcome: ${j.outcome.replace('_', ' ')}
- Net financial impact vs. staying home: ${j.net_cost_or_gain}
- Quote currency: ${j.currency}

Generate the story now.`;
}
