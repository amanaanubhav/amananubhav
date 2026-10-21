import { MAP_COPY } from '../../config/copy';
import { markAltitude } from '../../lib/story-labels';
import { STORY_MARKS } from '../scenes/story/marks';

/** The route in walking order, by mark id; side trips sit where he walked them. */
const ORDER: readonly (string | { readonly text: string })[] = [
  'besisahar',
  'bhulbhule',
  'ngadi-khola',
  'bahundanda',
  'syange',
  { text: MAP_COPY.byJeep },
  'tal',
  'dharapani',
  'danagyu',
  'timang',
  'koto',
  'chame',
  'bhratang',
  'dhikur-pokhari',
  'lower-pisang',
  'humde',
  'mungji',
  'blue-lake',
  'green-lake',
  'ice-lake',
  'braka',
  'manang',
  'khangsar',
  'shri-kharka',
  'tilicho-base-camp',
  'tilicho-lake',
  'yak-kharka',
  'churi-ledar',
  'thorong-phedi',
  'thorong-high-camp',
  'thorong-la',
  { text: 'Chongur' },
  'ranipauwa-muktinath',
];

function itemText(id: string): string | null {
  const mark = STORY_MARKS.find((m) => m.id === id);
  if (!mark || !mark.name) return null;
  const alt = markAltitude(mark);
  const notes: string[] = [];
  if (alt) notes.push(alt.startsWith('~') ? `about ${alt.slice(1)}` : alt);
  if (mark.kind === 'lake' || mark.id === 'tilicho-base-camp') notes.push(MAP_COPY.sideTrip);
  if (mark.approxPlace) notes.push(MAP_COPY.approxPosition);
  const name = mark.sub ? `${mark.name} (${mark.sub})` : mark.name;
  return notes.length ? `${name}, ${notes.join(', ')}` : name;
}

/**
 * The text alternative of the story map (R43): what the map shows, then the route in walking order with
 * the cited altitudes and the side trips. Visually hidden; the map itself is aria-hidden.
 */
export function RouteList() {
  return (
    <section aria-labelledby="route-list-title" className="sr-only">
      <h2 id="route-list-title">{MAP_COPY.heading}</h2>
      <p>{MAP_COPY.description}</p>
      <ol aria-label={MAP_COPY.routeListLabel}>
        {ORDER.map((entry) => {
          const text = typeof entry === 'string' ? itemText(entry) : entry.text;
          return text ? <li key={typeof entry === 'string' ? entry : entry.text}>{text}</li> : null;
        })}
      </ol>
    </section>
  );
}
