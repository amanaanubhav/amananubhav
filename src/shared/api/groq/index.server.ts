import 'server-only';

import { groq } from '@ai-sdk/groq';
import type { LanguageModel } from 'ai';

/** Used when GROQ_MODEL is unset; matches the OpenRouter default so fallback answers stay consistent. */
const DEFAULT_CHAT_MODEL = 'openai/gpt-oss-120b';

/** Whether the server has a Groq key (the fallback chat provider). */
export function isGroqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

/** Fallback chat model; @ai-sdk/groq reads GROQ_API_KEY from the server environment at request time. */
export const groqChatModel: LanguageModel = groq(process.env.GROQ_MODEL || DEFAULT_CHAT_MODEL);
