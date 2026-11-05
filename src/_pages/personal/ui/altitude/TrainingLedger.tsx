import { ACTIVITIES } from '@/entities/activity';
import { TRAINING_COPY } from '../../config/content';

/** Discipline ids in `entities/activity`: a group shows only while one of its activities is still in the entity. */
const DISCIPLINE_IDS: ReadonlySet<string> = new Set(
  ACTIVITIES.filter((activity) => activity.group === 'discipline').map((activity) => activity.id),
);

/**
 * Training (FINAL-DESIGN §4.5, P1-9): four groups headed in his own words, one line each, no frequency claims and no
 * photo plates. Group headings are h4 at every breakpoint (one outline under the h3).
 */
export function TrainingLedger() {
  const groups = TRAINING_COPY.groups.filter((group) =>
    group.activities.some((id: string) => DISCIPLINE_IDS.has(id)),
  );
  return (
    <div className="grid gap-6">
      <h3 id="training-h" className="m-0 font-display text-title font-semibold text-ink">
        {TRAINING_COPY.title}
      </h3>
      <ul aria-labelledby="training-h" className="m-0 grid list-none gap-7 p-0 md:grid-cols-2 lg:grid-cols-4 lg:gap-x-6">
        {groups.map((group) => (
          <li key={group.heading} className="grid content-start gap-1">
            <h4 className="m-0 border-b border-line pb-2.5 font-display text-ui font-semibold leading-[1.3] text-accent-2">
              {group.heading}
            </h4>
            <p className="m-0 max-w-[40ch] font-body text-caption leading-[1.5] text-ink-muted [text-wrap:pretty]">
              {group.line}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
