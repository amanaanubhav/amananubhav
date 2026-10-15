import 'server-only';

import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import type { LanguageModel } from 'ai';

import { SITE } from '@/shared/config';

/** Used when OPENROUTER_MODEL is unset; any OpenRouter model id can replace it. */
const DEFAULT_CHAT_MODEL = 'openai/gpt-oss-120b';

/** OpenRouter provider; reads OPENROUTER_API_KEY from the server environment at request time. */
const openrouter = createOpenRouter({ appName: SITE.name, appUrl: SITE.url });

/** Whether the server has an OpenRouter key (the primary chat provider). */
export function isOpenRouterConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

/** Primary chat model for the AI terminal. */
export const openRouterChatModel: LanguageModel = openrouter.chat(
  process.env.OPENROUTER_MODEL || DEFAULT_CHAT_MODEL,
);
