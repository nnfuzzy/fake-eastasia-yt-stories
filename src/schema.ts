import { z } from 'zod';

export const ScenarioSchema = z.object({
  protagonist: z.object({
    name: z.string(),
    age: z.number().int().min(18).max(110),
    gender: z.enum(['male', 'female', 'non-binary']),
    origin_country: z.string(),
    origin_region: z.string().optional(),
    occupation: z.string(),
    trigger_event: z.string().describe('Why they left — widowed, retirement, burnout, etc.'),
    financials: z.string().describe('Pension, savings, etc. — quote actual numbers'),
    languages: z.array(z.string()).default([]),
  }),
  journey: z.object({
    target_country: z.string(),
    target_city: z.string(),
    duration_years: z.number().int().min(1).max(60),
    arrival_year: z.number().int(),
    outcome: z.enum(['returned', 'stayed', 'moved_on', 'died_abroad']),
    net_cost_or_gain: z.string().describe('e.g. "-€120,000"'),
    currency: z.string().default('EUR'),
  }),
  audience: z.string().default('DACH retirees considering Southeast Asia'),
  reading_level: z.string().default('B1 German-friendly English'),
  language: z.enum(['en', 'de']).default('en'),
});
export type Scenario = z.infer<typeof ScenarioSchema>;

export const ChapterSchema = z.object({
  timestamp_seconds: z.number().int().min(0),
  emoji: z.string(),
  headline: z.string(),
  body: z.string(),
});

export const StoryOutputSchema = z.object({
  title: z.string(),
  hook: z.string().describe('Opening cold-open paragraph'),
  chapters: z.array(ChapterSchema).min(8),
  closing_advice: z.array(z.string()).min(3).max(5),
  voiceover_script: z.string().optional().describe(
    'Plain-text narration with [pause Xms] markers and "Speaker A:/B:" labels',
  ),
});
export type StoryOutput = z.infer<typeof StoryOutputSchema>;
