'use client';

import { useEffect, useId, useRef, type KeyboardEvent } from 'react';
import { CheckCheck, Send } from 'lucide-react';

import { formatMessageTime, type ChatMessage } from '@/entities/chat-thread';
import { cn } from '@/shared/lib/cn';
import { IconButton } from '@/shared/ui/button';
import { VisuallyHidden } from '@/shared/ui/visually-hidden';

import type { VisitorChatState } from '../model/use-visitor-chat';
import { FIELD_CLASSES } from './field-classes';

const BUBBLE = 'max-w-[min(85%,72ch)] rounded-panel px-3.5 py-2.5 font-body text-ui text-ink [overflow-wrap:anywhere]';
const BUBBLE_AMAN = 'border border-line bg-ground';
const BUBBLE_VISITOR = 'bg-surface-2';
const TIME = 'font-data text-[13px] leading-5 text-ink-muted tabular';

function prefersReducedMotion(): boolean {
  return (
    document.documentElement.dataset.motion === 'off' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function MessageItem({ message }: { message: ChatMessage }) {
  const fromVisitor = message.sender === 'visitor';
  const time = formatMessageTime(message.timestamp);
  return (
    <li className={cn('flex flex-col gap-1', fromVisitor ? 'items-end' : 'items-start')}>
      <div className={cn(BUBBLE, fromVisitor ? BUBBLE_VISITOR : BUBBLE_AMAN)}>
        <VisuallyHidden>{fromVisitor ? 'You: ' : 'Aman: '}</VisuallyHidden>
        <p className="m-0 whitespace-pre-wrap [text-wrap:pretty]">{message.text}</p>
      </div>
      <p className={cn('m-0 flex items-center gap-1.5 px-1', TIME)}>
        {time ? <time>{time}</time> : fromVisitor ? <span className="font-body italic">Sending</span> : null}
        {fromVisitor && time ? (
          <>
            <CheckCheck aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
            <VisuallyHidden>Sent</VisuallyHidden>
          </>
        ) : null}
      </p>
    </li>
  );
}

interface ChatThreadProps {
  chat: VisitorChatState;
}

/**
 * The open conversation (§H.6): Aman's lines on the ground with a hairline edge, the visitor's on surface-2,
 * mono only for timestamps. Sending, the blocked state and the optimistic update are the model's.
 */
export function ChatThread({ chat }: ChatThreadProps) {
  const { visitor, messages, newMessage, setNewMessage, isBlocked, handleSendMessage } = chat;
  const paneRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputId = useId();
  const canSend = newMessage.trim().length > 0 && !isBlocked;

  // Keep the newest message in view. The pane scrolls itself; the page never moves.
  useEffect(() => {
    const pane = paneRef.current;
    if (!pane) return;
    pane.scrollTo({ top: pane.scrollHeight, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [messages]);

  // Enter sends (as before); Shift+Enter adds a line.
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (canSend) formRef.current?.requestSubmit();
  };

  return (
    <>
      <div
        ref={paneRef}
        role="log"
        aria-label="Messages"
        data-lenis-prevent
        className="scroll-pane min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5"
      >
        <ol className="m-0 flex list-none flex-col gap-4 p-0">
          <li className="flex flex-col items-start gap-1">
            <div className={cn(BUBBLE, BUBBLE_AMAN)}>
              <VisuallyHidden>Aman: </VisuallyHidden>
              <p className="m-0 [text-wrap:pretty]">
                Hi {visitor?.name}, glad you&apos;re here. Leave your message and I&apos;ll get back to you soon. You&apos;ll
                get an email when I reply.
              </p>
            </div>
            <p className="m-0 px-1 font-body text-caption italic text-ink-muted">Auto-reply</p>
          </li>
          {messages.map((message, index) => (
            <MessageItem key={message.id || index} message={message} />
          ))}
        </ol>
      </div>

      <form
        ref={formRef}
        onSubmit={handleSendMessage}
        className="flex items-end gap-2 border-t border-line bg-surface px-3 py-3"
      >
        <label htmlFor={inputId} className="sr-only">
          Message
        </label>
        <textarea
          id={inputId}
          rows={1}
          data-autofocus=""
          data-lenis-prevent
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={isBlocked}
          placeholder={isBlocked ? "You can't send messages in this chat" : 'Type a message'}
          className={cn(FIELD_CLASSES, 'scroll-pane max-h-32 resize-none [field-sizing:content]')}
        />
        <IconButton type="submit" label="Send" icon={Send} variant="outline" disabled={!canSend} />
      </form>
    </>
  );
}
