import { z } from 'zod';

/** Speech rate bounds (player speed steps 0.75–2.0, PROMPT §6). */
export const RATE_RANGE = { min: 0.75, max: 2 } as const;
/** Pitch bounds accepted by the system TTS engines on both platforms. */
export const PITCH_RANGE = { min: 0.5, max: 2 } as const;
export const FONT_SCALES = [0, 1, 2] as const;

/** `abk:settings`. */
export const settingsSchema = z.object({
  voiceId: z.string().min(1).nullable(),
  defaultRate: z.number().min(RATE_RANGE.min).max(RATE_RANGE.max),
  pitch: z.number().min(PITCH_RANGE.min).max(PITCH_RANGE.max),
  highlightSentence: z.boolean(),
  skipHeadersFooters: z.boolean(),
  backgroundPlayback: z.boolean(),
  fontScale: z.literal(FONT_SCALES),
});

export type Settings = z.infer<typeof settingsSchema>;
export type FontScale = Settings['fontScale'];

export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  voiceId: null,
  defaultRate: 1,
  pitch: 1,
  highlightSentence: true,
  skipHeadersFooters: true,
  backgroundPlayback: true,
  fontScale: 1,
});
