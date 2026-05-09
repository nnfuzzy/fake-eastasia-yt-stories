import { parseArgs } from '@std/cli/parse-args';
import { parse as parseYaml } from '@std/yaml';
import { ensureDir } from '@std/fs';
import { basename, dirname, join } from '@std/path';
import { load as loadEnv } from '@std/dotenv';
import { ScenarioSchema } from './src/schema.ts';
import { generateStory } from './src/flows/generateStory.ts';
import { synthesizeAudio } from './src/flows/synthesizeAudio.ts';
import { DEFAULT_WPM, recomputeTimestamps, renderMarkdown } from './src/render.ts';

const HELP = `Usage:
  deno task story --scenario <path.yaml> [--words 4000] [--problems 12] [--audio] [--premium] [--out out/]

Flags:
  --scenario <path>   YAML scenario file (required)
  --words <n>         Target word count (default 2500)
  --problems <n>      Number of friction chapters (default 10)
  --audio             Also generate WAV via multi-speaker TTS
  --premium           Use the slower, higher-reasoning model
  --out <dir>         Output directory (default ./out)
  --video-id <id>     YouTube video id used in chapter timestamp links
  --wpm <n>           Words per minute for timestamp recompute (default ${DEFAULT_WPM})
  --help              Show this help`;

async function main() {
  await loadEnv({ envPath: '../.env', export: true }).catch(() => {});
  await loadEnv({ export: true }).catch(() => {});

  // Tolerate `deno task story -- --foo` as well as `deno task story --foo`
  const argv = Deno.args.filter((a) => a !== '--');
  const flags = parseArgs(argv, {
    string: ['scenario', 'words', 'problems', 'out', 'video-id', 'wpm'],
    boolean: ['audio', 'premium', 'help'],
    default: {
      words: '2500',
      problems: '10',
      out: './out',
      'video-id': 'PLACEHOLDER',
      wpm: String(DEFAULT_WPM),
    },
  });

  if (flags.help || !flags.scenario) {
    console.log(HELP);
    Deno.exit(flags.help ? 0 : 1);
  }
  if (!Deno.env.get('GEMINI_API_KEY')) {
    console.error('Missing GEMINI_API_KEY in env');
    Deno.exit(1);
  }

  const yaml = parseYaml(await Deno.readTextFile(flags.scenario));
  const scenario = ScenarioSchema.parse(yaml);
  const slug = basename(flags.scenario).replace(/\.(ya?ml)$/i, '');

  const wpm = Number(flags.wpm);
  console.log(`generating story for ${scenario.protagonist.name} (${slug})...`);
  const raw = await generateStory({
    scenario,
    wordCount: Number(flags.words),
    numProblems: Number(flags.problems),
    audioMode: flags.audio,
    premium: flags.premium,
    wordsPerMinute: wpm,
  });
  const story = recomputeTimestamps(raw, wpm);

  await ensureDir(flags.out);
  const mdPath = join(flags.out, `${slug}.md`);
  const jsonPath = join(flags.out, `${slug}.json`);
  await Deno.writeTextFile(mdPath, renderMarkdown(story, flags['video-id']));
  await Deno.writeTextFile(jsonPath, JSON.stringify(story, null, 2));
  console.log(`wrote ${mdPath}`);
  console.log(`wrote ${jsonPath}`);

  if (flags.audio) {
    if (!story.voiceover_script) {
      console.error('audio requested but model returned no voiceover_script');
      Deno.exit(2);
    }
    const wavPath = join(flags.out, `${slug}.wav`);
    await ensureDir(dirname(wavPath));
    console.log(`synthesizing audio → ${wavPath}...`);
    await synthesizeAudio({ script: story.voiceover_script, outputPath: wavPath });
    console.log(`wrote ${wavPath}`);
  }
}

if (import.meta.main) {
  await main();
}
