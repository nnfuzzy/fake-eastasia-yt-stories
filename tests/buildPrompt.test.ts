import { assertEquals, assertStringIncludes } from '@std/assert';
import { ScenarioSchema } from '../src/schema.ts';
import { buildSystemPrompt, buildUserPrompt, FRICTION_TAXONOMY } from '../src/prompts/story.ts';

const fixture = ScenarioSchema.parse({
  protagonist: {
    name: 'Werner Bachmann',
    age: 67,
    gender: 'male',
    origin_country: 'Germany',
    occupation: 'retired engineer',
    trigger_event: 'widowed',
    financials: '€1,800/month pension',
    languages: ['German'],
  },
  journey: {
    target_country: 'Thailand',
    target_city: 'Hua Hin',
    duration_years: 6,
    arrival_year: 2019,
    outcome: 'returned',
    net_cost_or_gain: '-€120,000',
    currency: 'EUR',
  },
});

Deno.test('user prompt interpolates protagonist + journey', () => {
  const out = buildUserPrompt(fixture);
  assertStringIncludes(out, 'Werner Bachmann');
  assertStringIncludes(out, 'Thailand');
  assertStringIncludes(out, 'Hua Hin');
  assertStringIncludes(out, '-€120,000');
  assertStringIncludes(out, 'returned');
});

Deno.test('system prompt embeds num_problems and word_count', () => {
  const out = buildSystemPrompt({
    scenario: fixture,
    wordCount: 3000,
    numProblems: 12,
    audioMode: false,
  });
  assertStringIncludes(out, '~3000 words');
  assertStringIncludes(out, 'exactly 12 concrete frictions');
  assertEquals(out.includes('voiceover_script'), false);
});

Deno.test('system prompt adds audio block when audioMode is true', () => {
  const out = buildSystemPrompt({
    scenario: fixture,
    wordCount: 2500,
    numProblems: 10,
    audioMode: true,
  });
  assertStringIncludes(out, 'voiceover_script');
  assertStringIncludes(out, '[pause 400ms]');
  assertStringIncludes(out, 'Speaker B:');
});

Deno.test('friction taxonomy covers the major categories', () => {
  const must = ['visa', 'currency', 'healthcare', 'language', 'corruption'];
  for (const term of must) {
    const hit = FRICTION_TAXONOMY.some((f) => f.toLowerCase().includes(term));
    assertEquals(hit, true, `taxonomy missing term: ${term}`);
  }
});
