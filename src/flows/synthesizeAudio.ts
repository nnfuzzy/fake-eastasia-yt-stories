import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { Buffer } from 'node:buffer';
import wav from 'wav';

const ai = genkit({ plugins: [googleAI()] });
const TTS_MODEL = Deno.env.get('STORY_TTS_MODEL') ?? 'gemini-3.1-flash-tts-preview';

export interface AudioOptions {
  script: string;
  outputPath: string;
  narratorVoice?: string;
  characterVoice?: string;
}

export async function synthesizeAudio(opts: AudioOptions): Promise<void> {
  const response = await ai.generate({
    model: googleAI.model(TTS_MODEL),
    prompt: opts.script,
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            {
              speaker: 'Speaker A',
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: opts.narratorVoice ?? 'Charon' },
              },
            },
            {
              speaker: 'Speaker B',
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: opts.characterVoice ?? 'Kore' },
              },
            },
          ],
        },
      },
    },
  });

  const url = response.media?.url;
  if (!url) throw new Error('TTS returned no audio');
  const base64 = url.split(',')[1];
  if (!base64) throw new Error('TTS audio missing base64 payload');
  const pcm = Buffer.from(base64, 'base64');
  await writeWav(opts.outputPath, pcm);
}

function writeWav(path: string, pcm: Buffer, sampleRate = 24000): Promise<void> {
  return new Promise((resolve, reject) => {
    const writer = new wav.FileWriter(path, { channels: 1, sampleRate, bitDepth: 16 });
    writer.on('finish', () => resolve());
    writer.on('error', reject);
    writer.write(pcm);
    writer.end();
  });
}
