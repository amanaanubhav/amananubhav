import emailjs, { type EmailJSResponseStatus } from '@emailjs/browser';

import { clientEnv } from '@/shared/config';

export type EmailTemplate = 'toAman' | 'toVisitor';

/** True when the EmailJS service id is configured (legacy `if (import.meta.env.VITE_EMAILJS_SERVICE_ID)`). */
export function isEmailConfigured(): boolean {
  return Boolean(clientEnv.emailjs.serviceId);
}

/** Sends an EmailJS template using the configured service id, template id and public key. */
export function sendEmail(
  template: EmailTemplate,
  params: Record<string, unknown>,
): Promise<EmailJSResponseStatus> {
  const { serviceId, templateToAman, templateToVisitor, publicKey } = clientEnv.emailjs;
  const templateId = template === 'toAman' ? templateToAman : templateToVisitor;
  return emailjs.send(serviceId ?? '', templateId ?? '', params, publicKey);
}
