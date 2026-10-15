import { addDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { messagesCollection, threadDoc, type VisitorProfile } from '@/entities/chat-thread';

import { notifyOwner } from './notify-owner';

/** Creates / refreshes the thread document when the visitor starts a chat. */
export async function startThread(id: string, { name, email, phone }: VisitorProfile): Promise<void> {
  await setDoc(
    threadDoc(id),
    {
      visitorName: name,
      visitorEmail: email,
      visitorPhone: phone,
      lastActive: serverTimestamp(),
      unreadCount: 0,
    },
    { merge: true },
  );
}

/** Saves the message, updates the parent thread, then emails the owner. */
export async function sendVisitorMessage(
  chatId: string,
  text: string,
  visitor: VisitorProfile,
): Promise<void> {
  // 1. Save message to chat history
  await addDoc(messagesCollection(chatId), {
    text: text,
    sender: 'visitor',
    timestamp: serverTimestamp(),
  });

  // 2. Update parent chat document
  await setDoc(
    threadDoc(chatId),
    {
      visitorName: visitor.name,
      visitorEmail: visitor.email,
      visitorPhone: visitor.phone || '',
      lastMessage: text,
      lastActive: serverTimestamp(),
      unreadCount: 1,
    },
    { merge: true },
  );

  // 3. Trigger Email to Aman using EmailJS (Free Tier)
  await notifyOwner(visitor, text);
}
