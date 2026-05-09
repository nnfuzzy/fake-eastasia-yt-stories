---
name: expat-story
description: >
  Generate parametrized first-person YouTube-style "expat retrospective" stories — the genre of
  viral videos like "Why I left Thailand after 6 years", "My Lisbon experiment", "6 years in Bali
  and what it really cost". Output is a structured story with a cold-open hook, N chapters with
  emoji-prefixed timestamped headlines, named anecdotes with specific currency amounts, a turning
  point, a resolution, and 3-5 closing rules of advice. Use this skill whenever the user asks for
  an expat retrospective, "story like that YT video", deconstruction or parody of the genre, or
  wants to generate stories with different protagonists, countries, ages, outcomes, or in German
  vs. English. Companion to the Deno CLI at github.com/nnfuzzy/fake-eastasia-yt-stories — same
  prompt, same output shape, but runs entirely inside Claude with no tools required.
---

# Expat Story Generator

Companion skill to **github.com/nnfuzzy/fake-eastasia-yt-stories** (a Deno + Genkit + Gemini CLI
that does the same thing). This skill is the Claude-Desktop-native version: same prompt template,
same output shape, no CLI required — Claude generates the story directly.

---

## Why this exists

YouTube has been overrun with expat-cautionary-tale videos — a German pensioner returns from
Thailand, a Brit walks back from Spain, an American flees Costa Rica. Different countries,
different protagonists, but the same chapter rhythm, the same emoji-prefixed subtitle style
(`📋 The visa trap`, `💸 The hidden cost of paradise`, `💔 The lonely years`), the same six-act
arc, the same suspiciously specific anecdotes where someone always paid €X for Y. Several
channels, all running the same template. This skill makes the template explicit so you can
read it, parody it, or generate variants with deliberately swapped knobs.

---

## How to use this skill

When the user asks for an expat retrospective story:

1. **Collect parameters.** Required: `name`, `age`, `origin_country`, `target_country`,
   `outcome`, `duration_years`. Secondary parameters (`occupation`, `financials`,
   `trigger_event`, `target_city`, `arrival_year`, `currency`): if missing, propose plausible
   defaults in one short line ("I'll assume Bavaria, retired engineer, widowed in 2019,
   €1,800/month pension + €290k house sale, EUR — proceed?") and continue if the user accepts
   or stays silent.
2. **Pick length.** The user can specify a `duration` preset, or pass
   `word_count` / `num_problems` directly. Presets:

   | `duration` | `word_count` | `num_problems` | Reads in (~150 wpm) |
   |---|---|---|---|
   | `demo` | 400 | 3 | ~3 min |
   | `short` | 1200 | 6 | ~8 min |
   | `medium` *(default)* | 2500 | 10 | ~17 min |
   | `long` | 4000 | 14 | ~27 min |

   If the user says "quick demo", "tldr", "short version", "30-second version",
   or "just show me", default to `duration: demo`. Explicit `word_count` /
   `num_problems` values always override the preset.
3. **Pick language.** Default English. Switch to German if the user specifies, the protagonist
   is from a German-speaking country, or the audience is DACH.
4. **Generate the story** as Markdown directly in your reply (no tool calls, no code, no
   external resources). Follow the output format below exactly.
5. **Compute timestamps yourself** at ~150 words per minute, cumulatively. Chapter 1 starts at
   `00:00`; chapter N's timestamp is the sum of word counts of chapters 1..N-1 divided by 150,
   converted to MM:SS. Round to the nearest second.
6. **Stat discipline.** Do **not** invent statistics. Where a real number would have to be
   fabricated (national death rates, exchange rate movements, average insurance premiums), write
   `[STAT-NEEDED]` so a fact-check pass can fill it.
7. **Voice.** First-person, past tense, reflective, lightly cautionary, never sensational.
   No "as an AI". No moralizing. Local-color words (Baht, Hua Hin, monsoon, Notruf) are fine
   on first use.

---

## Parameters

| Param | Required? | Examples |
|---|---|---|
| `name` | yes | "Werner Bachmann", "Petra Hofmann", "Jonas Albrecht" |
| `age` | yes | 67, 38, 54 |
| `gender` | no — default male | male / female / non-binary |
| `origin_country` | yes | "Germany", "Austria", "UK" |
| `origin_region` | no | "Bavaria", "Vienna" |
| `occupation` | propose if missing | "retired mechanical engineer", "remote senior software engineer" |
| `trigger_event` | propose if missing | "widowed; sold paid-off house", "burnout after 12 years in tech" |
| `financials` | propose if missing | "€1,800/month pension + €290k from selling paid-off house" |
| `languages` | no | ["German", "English"] |
| `target_country` | yes | "Thailand", "Indonesia", "Portugal" |
| `target_city` | propose if missing | "Hua Hin", "Canggu, Bali", "Lisbon" |
| `duration_years` | yes | 6, 4, 3 |
| `arrival_year` | derive from duration | 2019, 2022 |
| `outcome` | yes | `returned` / `stayed` / `moved_on` / `died_abroad` |
| `net_cost_or_gain` | propose if missing | "-€120,000", "+€85,000", "+€20,000" |
| `currency` | derive from origin | "EUR", "USD", "GBP" |
| `audience` | no | "DACH retirees considering Southeast Asia" |
| `language` | no — default `en` | `en` / `de` |
| `duration` | no — default `medium` | `demo` / `short` / `medium` / `long` |
| `word_count` | derived from `duration` | 400–4000 (override) |
| `num_problems` | derived from `duration` | 3–14 (override) |

The single most important knob is `outcome` — it flips the moral arc of the story:

- `returned` — cautionary tale, "I should have known"
- `stayed` — mixed verdict, "the friction is the price of the dividend"
- `moved_on` — restless, "still searching, but smarter"
- `died_abroad` — dark, told by a survivor (friend, child, journalist)

---

## Story shape (always follow in order)

1. **Cold-open hook** — narrator now, in hindsight, one image. 100–200 words. Goes before the
   chapter list under the H1 title.
2. **The dream (chapter 1)** — why `target_country` seemed like the answer. Sensory detail
   with real numbers in `currency` (rent, meal price, utility, transport).
3. **The unraveling (chapters 2 to num_problems+1)** — exactly `num_problems` concrete
   frictions, one chapter each, picked from the friction taxonomy below. **Each must include
   one named anecdote**: a friend or neighbor with a name (Manfred, Klaus, Stefan, Hans, Luc,
   Gerhard…), a specific number in `currency`, and a specific outcome.
4. **Turning point (penultimate chapter)** — the exact moment the protagonist decided.
5. **Return / resolution / continuation (final chapter)** — depending on `outcome`.
6. **Closing advice** — 3 to 5 concrete rules, after the chapter list.

---

## Friction taxonomy

When picking the `num_problems` frictions, choose the ones most plausible for `target_country`
× `age` × `occupation`:

- visa & residency bureaucracy
- currency / cost-of-living drift
- climate, pollution, utility costs
- healthcare access & insurance for older expats
- loneliness, missed family milestones
- romance scams / asymmetric marriage
- language & script barriers
- cultural communication norms (face, indirectness, hierarchy)
- foreign-ownership / employment restrictions
- corruption, bribery, informal economy
- natural disasters & infrastructure fragility
- political instability, speech laws, monarchy/religion taboos
- two-tier pricing & soft discrimination
- property, voting, civic-rights restrictions
- destitute-expat endgame (dying alone, alcoholism)
- children: schooling cost, degree recognition, custody asymmetry
- homesickness for food, seasons, cultural texture

Avoid using all of them — pick the ones that fit the protagonist. Bali nomads don't have a
"healthcare for over-70s" chapter; Thailand pensioners don't have a "remote-work latency" chapter.

---

## Output format

Return Markdown shaped exactly like a YouTube description timeline, plus an advice block at the
end. Use this template literally — do not add sections, summaries, or commentary outside it.

```
# {Title}

{Hook paragraph — 100–200 words, first-person, sets the retrospective frame}

## Chapters

- [00:00](#) {emoji} **{Chapter 1 headline}** — {chapter 1 body, 150–300 words}
- [MM:SS](#) {emoji} **{Chapter 2 headline}** — {chapter 2 body}
- [MM:SS](#) {emoji} **{Chapter 3 headline}** — {chapter 3 body}
... (one bullet per chapter; timestamps cumulative at ~150 wpm; chapter 1 always at 00:00)

## Advice

- {rule 1 — concrete, actionable, one sentence}
- {rule 2}
- {rule 3}
- {rule 4 — optional}
- {rule 5 — optional}
```

Notes:
- The `(#)` link target is a placeholder — leave it as `#` (the user will replace with a real
  YouTube id when they have the video).
- Each chapter starts with **one** emoji that reflects its theme (🌴 dream, 📋 visa, 💸 money,
  🥵 climate, 🏥 health, 💔 loneliness, 🗣️ language, 🎭 culture, ⚖️ law, 🌊 disaster, 🥃 endgame,
  🔄 turning point, 🇩🇪 return, etc.).
- Headlines are bold, ~5 words.

---

## Worked examples

### Long-form

User says:
> *"Generate one — Werner, 67, German, Thailand, returned after 6 years."*

You should:

1. **Confirm inferred defaults briefly:**
   "I'll fill in: Bavaria, retired mechanical engineer, widowed in 2018, €1,800/month pension
   + €290k from selling the house, EUR, `duration: medium` (2500 words / 10 frictions),
   English. Proceed?"
2. **Generate** the full ~2500-word story in the format above on the next turn (or immediately
   if the user said "just go").
3. **Mark stats** with `[STAT-NEEDED]` rather than inventing exchange-rate or insurance numbers.

### Quick demo

User says:
> *"Quick demo — Petra, Austrian tax advisor, Lisbon, stayed."*

You should:

1. **Pick `duration: demo` automatically** (because of "quick demo"). That means ~400 words /
   3 frictions. Skip the parameter-confirmation back-and-forth — just announce the assumed
   defaults in one line and generate immediately.
2. **Pick the 3 most plausible frictions** from the taxonomy for an Austrian in Lisbon:
   bureaucracy, two-tier pricing, language barrier — *not* over-70s healthcare or romance
   asymmetry.
3. **Hook**: 1 short paragraph (60–100 words). **Chapters**: 3 frictions + 1 turning point +
   1 resolution = 5 chapters total. **Advice**: 3 rules. The whole reply should be readable
   in under 3 minutes.

---

## When NOT to use this skill

- The user wants a non-fiction profile of a real person — use plain research instead.
- The user wants to **debunk** or fact-check existing expat content — this skill generates,
  it doesn't verify (point them at search/research tools instead).
- The user wants academic / sociological analysis of expat patterns — the output is narrative,
  not analytical.
- The user wants a screenplay, novel chapter, or marketing copy — this is YouTube-description
  format only. Offer to adapt manually if they ask.

---

## License

The skill itself is MIT (or unrestricted — pick one when you publish). The generated stories
are fictional; any resemblance to real persons or events is coincidental, and you should not
present `[STAT-NEEDED]` placeholders as factual claims without verification.
