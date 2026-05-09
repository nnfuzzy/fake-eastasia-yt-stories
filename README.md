# fake-eastasia-yt-stories

## Why this exists

Lately my YouTube feed has been buried under expat-cautionary-tale videos —
a German pensioner returns from Thailand, a Brit walks back from Spain, an
American flees Costa Rica. Different countries, different protagonists, but
the same chapter rhythm, the same emoji-prefixed subtitle style
(`📋 The visa trap`, `💸 The hidden cost of paradise`, `💔 The lonely years`),
the same six-act arc, the same suspiciously specific anecdotes where someone
always paid €X for Y. Several channels, all running the same template, all
narrated by the same flavor of calm-baritone TTS. I am annoyed.

So this kit makes the template explicit: one YAML scenario in → one
YouTube-description-style story out (Markdown + JSON, optionally narrated WAV).
Read it as a deconstruction, a parody tool, or a generator — depending on
what you do with the output.

Every parameter (protagonist, target country, age, outcome, currency, language,
length) is swappable, so the same prompt produces very different stories: a
38-year-old Berliner who **stayed** in Bali reads nothing like the Hua Hin
retiree who **returned**.

Stack: **Deno 2 + Genkit + Gemini** (text + multi-speaker TTS). CLI-first.

---

## Two ways to run it

| Want… | Use |
|---|---|
| Batch generation, audio output, scenario YAMLs in version control, scriptable | **The Deno CLI** in this repo (rest of this README) |
| One-shot stories inside any Claude product, no install, conversational parameter collection | **The Claude skill** in [`skills/`](skills/) — see "Use it inside Claude" below |

Both share the same prompt template and output shape. Pick whichever matches the workflow.

---

## Use it inside Claude (no terminal needed, ~60 seconds)

This works on **claude.ai in your browser** with any paid plan. No install, no
file download, no command line.

1. Open https://github.com/nnfuzzy/fake-eastasia-yt-stories/blob/main/skills/SKILL.md
2. On that page, click the **"Copy raw file"** button (top-right of the file view — two stacked rectangles icon).
3. Go to **claude.ai** → click **Projects** in the left sidebar → **Create project**.
4. Give it a name like **"Expat Stories"**, click create.
5. After the project opens, look on the **right side** of the project page for the **"Instructions"** field — paste the SKILL.md content you copied and save.
6. Start a new chat inside the project. Type something like:
   > *Generate one — Werner, 67, German, Thailand, returned after 6 years.*
7. Claude reads the project instructions and produces the full story in the chat.

Re-use the same project for every future story — just start another chat.

---

## How to Deno (60 seconds, if it's new)

Deno is a JS/TS runtime that ships TypeScript natively, has no `package.json`
(deps live in `deno.json` `imports`), and asks for explicit permissions.

```bash
# install (macOS/Linux)
curl -fsSL https://deno.land/install.sh | sh

# install (Homebrew)
brew install deno

# install (Windows)
irm https://deno.land/install.ps1 | iex
```

Then:

| You used to write... | In Deno you write... |
|---|---|
| `npm install` | nothing — deps fetch on first run, cached locally |
| `npm run dev` | `deno task dev` |
| `node script.ts` | `deno run script.ts` |
| `node --inspect` | `deno run --inspect script.ts` |

The `-A` flag you'll see in `deno.json` means "all permissions" (network, fs,
env). Stricter alternative: `--allow-net=generativelanguage.googleapis.com
--allow-env=GEMINI_API_KEY --allow-read --allow-write=./out`. For a CLI you
control, `-A` is fine.

---

## Quickstart

```bash
cd fake-eastasia-yt-stories
cp .env.example .env             # add GEMINI_API_KEY
deno task test                   # 8 pure-function tests, no LLM calls

# generate a story (text only)
deno task story --scenario scenarios/werner-thailand.yaml --words 3000 --problems 12

# generate text + narrated WAV
deno task story --scenario scenarios/jonas-bali.yaml --words 1500 --problems 8 --audio

# slower, deeper-reasoning model for long-form
deno task story --scenario scenarios/petra-portugal.yaml --words 4000 --premium
```

Outputs land in `out/<slug>.{md,json,wav}`.

---

## How a scenario maps to a story

A scenario YAML is the only input. The prompt template + friction taxonomy
live in `src/prompts/story.ts` — not in the YAML — so every story shares the
same shape: cold-open hook → the dream → N concrete frictions with named
anecdotes → turning point → resolution → 3-5 rules of advice.

```yaml
# scenarios/werner-thailand.yaml
protagonist:
  name: Werner Bachmann
  age: 67
  gender: male
  origin_country: Germany
  occupation: retired mechanical engineer
  trigger_event: widowed; sold paid-off house
  financials: "€1,800/month pension + €290k from selling paid-off house"
  languages: [German, English]
journey:
  target_country: Thailand
  target_city: Hua Hin
  duration_years: 6
  arrival_year: 2019
  outcome: returned       # returned | stayed | moved_on | died_abroad
  net_cost_or_gain: "-€120,000"
  currency: EUR
audience: DACH retirees considering Southeast Asia
language: en              # en | de
```

The `outcome` field is the strongest narrative knob — it flips the moral arc
of the story (cautionary vs. mixed vs. negotiated).

### CLI flags

| Flag | Default | Effect |
|---|---|---|
| `--scenario <path>` | required | YAML file to load |
| `--words <n>` | 2500 | target word count |
| `--problems <n>` | 10 | how many friction chapters |
| `--audio` | off | also synthesize a multi-speaker WAV |
| `--premium` | off | use deeper-reasoning model with `thinkingLevel: HIGH` |
| `--out <dir>` | `./out` | output directory |
| `--video-id <id>` | `PLACEHOLDER` | YouTube id used in chapter timestamp links |
| `--wpm <n>` | 150 | words per minute for timestamp recompute |

---

## Models (May 2026)

Defaults can be overridden via env vars (see `.env.example`):

| Role | Default | Override env var |
|---|---|---|
| Text (fast) | `gemini-3-flash-preview` | `STORY_TEXT_MODEL` |
| Text (premium) | `gemini-3.1-pro-preview` | `STORY_PREMIUM_MODEL` |
| TTS (multi-speaker) | `gemini-3.1-flash-tts-preview` | `STORY_TTS_MODEL` |

Verify which TTS models your key has access to:

```bash
curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY" \
  | python3 -c "import json,sys; [print(m['name']) for m in json.load(sys.stdin)['models'] if 'tts' in m['name'].lower()]"
```

---

## Audio mode

`--audio` does two things:

1. The system prompt tells the text model to also fill a `voiceover_script`
   field with `[pause 400ms]` markers and `Speaker A:` / `Speaker B:` labels.
2. The CLI feeds that script to the TTS model via Genkit's
   `multiSpeakerVoiceConfig`. Speaker A = narrator (default `Charon`),
   Speaker B = anecdote characters (default `Kore`).

Voice options live at https://ai.google.dev/gemini-api/docs/speech-generation#voices.
Override per-call by editing `src/flows/synthesizeAudio.ts` — it's intentionally
short.

**Length cap.** Gemini TTS truncates very long inputs. Stories above ~2,500
words may clip — generate in chunks or shorten with `--words 1500`.

---

## Timestamps

Model-emitted `timestamp_seconds` are unreliable (the LLM doesn't know how
many words each chapter ends up with). The CLI passes the raw output through
`recomputeTimestamps()` in `src/render.ts`, which derives timestamps from
cumulative `chapters[].body` word count at `--wpm`. Chapter 1 anchored at
`00:00`; the hook narrates during that window.

---

## Project layout

```
deno.json                         # tasks: story, test, check, fmt, lint
cli.ts                            # arg parser → flow → markdown + json [+ wav]
src/
  schema.ts                       # zod: ScenarioSchema, StoryOutputSchema
  prompts/story.ts                # buildSystemPrompt, buildUserPrompt, FRICTION_TAXONOMY
  flows/generateStory.ts          # text generation
  flows/synthesizeAudio.ts        # TTS, multi-speaker
  render.ts                       # recomputeTimestamps + Markdown render
scenarios/                        # YAML inputs (one per story)
tests/                            # pure-function tests, no LLM calls
out/                              # gitignored: .md / .json / .wav outputs
```

---

## Tasks

```bash
deno task story <flags>     # generate one story
deno task test              # 8 pure-function tests
deno task test:watch        # watch mode
deno task check             # fmt + lint + type-check
deno task fmt
deno task lint
```

---

## Gotchas

- **`--` separator in `deno task`.** `deno task story --foo` works directly;
  `deno task story -- --foo` (npm convention) also works because `cli.ts`
  filters `--` from `Deno.args`.
- **Model 404s.** Genkit doc lists lag the actual API. If a model name 404s,
  hit the ListModels endpoint above to find the live name.
- **Token-cache warm-up.** First Genkit call on a fresh Deno process takes
  3-5s longer (npm dep resolution). Subsequent calls are fast.
- **Stats are not invented.** The model marks `[STAT-NEEDED]` where it would
  have had to fabricate a number. Run a fact-check pass before publishing.

---

## Adding a new scenario

1. Copy `scenarios/werner-thailand.yaml`.
2. Edit the `protagonist` and `journey` blocks.
3. `deno task story --scenario scenarios/<your-slug>.yaml`.

That's the loop. No code change needed for new countries, ages, languages,
or outcomes — the friction taxonomy is intentionally generic.
