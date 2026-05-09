import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { type Scenario, StoryOutputSchema } from '../schema.ts';
import { buildSystemPrompt, buildUserPrompt, type PromptOptions } from '../prompts/story.ts';

export interface GenerateOptions extends Omit<PromptOptions, 'scenario'> {
  scenario: Scenario;
  premium?: boolean;
}

const ai = genkit({ plugins: [googleAI()] });

const TEXT_MODEL = Deno.env.get('STORY_TEXT_MODEL') ?? 'gemini-3-flash-preview';
const PREMIUM_MODEL = Deno.env.get('STORY_PREMIUM_MODEL') ?? 'gemini-3.1-pro-preview';

export async function generateStory(opts: GenerateOptions) {
  const modelName = opts.premium ? PREMIUM_MODEL : TEXT_MODEL;
  const system = buildSystemPrompt(opts);
  const prompt = buildUserPrompt(opts.scenario);

  const response = await ai.generate({
    model: googleAI.model(modelName),
    system,
    prompt,
    output: { schema: StoryOutputSchema },
    config: opts.premium
      ? { thinkingConfig: { thinkingLevel: 'HIGH', includeThoughts: false } }
      : undefined,
  });

  if (!response.output) {
    throw new Error('Model returned no structured output');
  }
  return response.output;
}
