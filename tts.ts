import { parseArgs } from '@std/cli/parse-args';
import { ensureDir } from '@std/fs';
import { basename, dirname, extname, join } from '@std/path';
import { load as loadEnv } from '@std/dotenv';
import { synthesizeAudio } from './src/flows/synthesizeAudio.ts';

const HELP = `Usage:
  deno task tts <script-file> [--narrator Charon] [--character Kore] [--out path.wav]

The script file can be either:
  - A plain text/markdown file containing a voiceover script
    (use "Speaker A:" / "Speaker B:" labels and "[pause 400ms]" markers
    for multi-speaker output and pacing).
  - A JSON file produced by \`deno task story --audio\` (the .voiceover_script
    field is used as the script).

Output defaults to <input-basename>.wav next to the input, or use --out.

Example — synthesize a script Claude generated in claude.ai:
  pbpaste > /tmp/werner-script.txt
  deno task tts /tmp/werner-script.txt`;

async function main() {
  await loadEnv({ envPath: '../.env', export: true }).catch(() => {});
  await loadEnv({ export: true }).catch(() => {});

  const argv = Deno.args.filter((a) => a !== '--');
  const flags = parseArgs(argv, {
    string: ['narrator', 'character', 'out'],
    boolean: ['help'],
  });

  const input = flags._[0]?.toString();
  if (flags.help || !input) {
    console.log(HELP);
    Deno.exit(flags.help ? 0 : 1);
  }
  if (!Deno.env.get('GEMINI_API_KEY')) {
    console.error('Missing GEMINI_API_KEY in env');
    Deno.exit(1);
  }

  const raw = await Deno.readTextFile(input);
  let script: string;
  if (extname(input).toLowerCase() === '.json') {
    const parsed = JSON.parse(raw);
    if (typeof parsed.voiceover_script !== 'string' || !parsed.voiceover_script.trim()) {
      console.error(
        `${input} has no .voiceover_script field. ` +
          `Re-run \`deno task story\` with --audio so the model produces it.`,
      );
      Deno.exit(1);
    }
    script = parsed.voiceover_script;
  } else {
    script = raw;
  }

  const outPath = flags.out ??
    join(dirname(input), basename(input).replace(/\.[^.]+$/, '') + '.wav');
  await ensureDir(dirname(outPath));
  console.log(`synthesizing → ${outPath}...`);
  await synthesizeAudio({
    script,
    outputPath: outPath,
    narratorVoice: flags.narrator,
    characterVoice: flags.character,
  });
  console.log(`wrote ${outPath}`);
}

if (import.meta.main) {
  await main();
}
