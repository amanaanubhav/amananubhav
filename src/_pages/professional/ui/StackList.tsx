import { Fragment } from 'react';

/**
 * A stack as "A, B, C" for a log value: each item keeps together ("scikit-learn" never splits at its hyphen) and
 * lines break only after a comma.
 */
export function StackList({ items }: { items: readonly string[] }) {
  return (
    <>
      {items.map((item, index) => (
        <Fragment key={item}>
          {index > 0 ? ', ' : null}
          <span className="whitespace-nowrap">{item}</span>
        </Fragment>
      ))}
    </>
  );
}

/**
 * Text that may wrap at its spaces but never at a hyphen inside a word ("scikit-learn", "Stable-Baselines3"):
 * for long items, such as "Reinforcement learning (DQN, PPO, Stable-Baselines3)", that cannot stay on one line.
 */
export function KeepHyphenated({ text }: { text: string }) {
  if (!text.includes('-')) return <>{text}</>;
  const words = text.split(' ');
  return (
    <>
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          {index > 0 ? ' ' : null}
          {word.includes('-') ? <span className="whitespace-nowrap">{word}</span> : word}
        </Fragment>
      ))}
    </>
  );
}
