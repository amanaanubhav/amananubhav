/**
 * [S-REMOTE-ASYNC]: the pre-departure checklist on /professional#remote (§G.3, §I.7).
 * Only lines Aman has confirmed ship (Q-23). Every line stays `confirmed: false` until he answers, so the
 * spread is omitted, not greyed out. The last deck line ("If something is urgent, I'm reachable [TBD]")
 * has no text until Q-23 says how, so it carries `text: undefined` and never renders.
 */
export interface AsyncChecklistLine {
  readonly id: string;
  /** Final copy; undefined while the deck line is `[TBD]`. */
  readonly text?: string;
  readonly confirmed: boolean;
}

export const ASYNC_CHECKLIST: readonly AsyncChecklistLine[] = [
  {
    id: 'brief',
    text: 'I start every task with a short written brief: the problem, constraints, and what "done" looks like.',
    confirmed: false,
  },
  {
    id: 'small-prs',
    text: 'I ship in small, reviewable pull requests with screenshots or logs attached.',
    confirmed: false,
  },
  {
    id: 'daily-update',
    text: 'I post a written update at the end of my day: done, next, blocked.',
    confirmed: false,
  },
  {
    id: 'status',
    text: "I keep my calendar and status current so nobody has to guess whether I'm around.",
    confirmed: false,
  },
  {
    id: 'overlap',
    text: 'I protect the overlap hours for conversations and use the rest for deep work.',
    confirmed: false,
  },
  { id: 'urgent', text: undefined, confirmed: false },
];
