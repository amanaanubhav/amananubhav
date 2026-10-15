import { isEmailConfigured, sendEmail } from '@/shared/api';
import type { VisitorProfile } from '@/entities/chat-thread';

/** Emails Aman about a new visitor message (EmailJS). Never throws. */
export async function notifyOwner(visitor: VisitorProfile, text: string): Promise<void> {
  if (isEmailConfigured()) {
    try {
      const res = await sendEmail('toAman', {
        from_name: visitor.name,
        from_email: visitor.email,
        from_phone: visitor.phone || 'Not provided',
        message: text,
        reply_to: visitor.email,
      });
      console.log('EmailJS Success (to Aman):', res.status, res.text);
    } catch (err) {
      console.error('EmailJS Error (to Aman):', err);
    }
  } else {
    console.warn('EmailJS credentials not configured yet. Check .env file.');
  }
}
