import type { ExpeditionId } from '@/entities/expedition';

/*
 * The field notebook's pages (NOTEBOOK-DESIGN §1.2): order, anchors, tab labels and the hashes that open them. Pure
 * data and functions, no runtime imports, so `node` can check the resolver and the pre-paint script is built from the
 * same list (§2.6).
 */

export type NotebookPageId = 'kun-tso' | 'chandrashila' | 'himachal' | 'dodital';

export interface NotebookPageDef {
  /** The page wrapper's id: its anchor (`/stories#dodital`) and the hash a turn writes. */
  readonly id: NotebookPageId;
  /** The tab's label. */
  readonly tab: string;
  /** The expeditions the page holds, in page order. */
  readonly expeditionIds: readonly ExpeditionId[];
}

/** Page order (NB-1: today's section order, opening on Kun Tso). Planned expeditions never get a page. */
export const NOTEBOOK_PAGES: readonly NotebookPageDef[] = [
  { id: 'kun-tso', tab: 'Kun Tso', expeditionIds: ['kun-tso'] },
  { id: 'chandrashila', tab: 'Chandrashila', expeditionIds: ['chandrashila'] },
  { id: 'himachal', tab: 'Himachal', expeditionIds: ['triund', 'kheerganga', 'yulla-kanda'] },
  { id: 'dodital', tab: 'Dodital', expeditionIds: ['dodital'] },
];

/** The section's id (the rail item and `#notebook`). */
export const NOTEBOOK_SECTION_ID = 'notebook';

/** The page the book opens on when no hash names one. */
export const NOTEBOOK_DEFAULT_PAGE: NotebookPageId = NOTEBOOK_PAGES[0].id;

/** Old anchors of single treks inside a page: they open the page and focus that entry's heading. */
export const NOTEBOOK_ALIASES: Readonly<Record<string, NotebookPageId>> = {
  triund: 'himachal',
  kheerganga: 'himachal',
  'yulla-kanda': 'himachal',
};

/** Id of a page's h3 (the focus target of a deep link to the page). */
export function pageHeadingId(pageId: NotebookPageId): string {
  return `nb-${pageId}-title`;
}

/** Id of an entry's h4 on a shared page (the focus target of `#triund` and the others). */
export function entryHeadingId(entryId: string): string {
  return `nb-${entryId}-title`;
}

/** Id of a page's tab. */
export function pageTabId(pageId: NotebookPageId): string {
  return `nb-tab-${pageId}`;
}

export interface NotebookTarget {
  readonly pageId: NotebookPageId;
  /** The heading to focus: the page's h3, an alias entry's h4, or null for `#notebook` (the book only). */
  readonly focusId: string | null;
  /** The hash as written ("dodital", "triund", "notebook"). */
  readonly hash: string;
}

const PAGE_IDS = new Set<string>(NOTEBOOK_PAGES.map((page) => page.id));

function isPageId(id: string): id is NotebookPageId {
  return PAGE_IDS.has(id);
}

function hashId(hash: string): string {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * The one resolver for every way in (§1.2): a page id, an alias or `#notebook` (which keeps `current`, or opens the
 * default page). Anything else, and the empty hash, is null. Accepts the hash with or without `#`.
 */
export function resolveNotebookPage(hash: string, current?: NotebookPageId): NotebookTarget | null {
  const id = hashId(hash);
  if (!id) return null;
  if (isPageId(id)) return { pageId: id, focusId: pageHeadingId(id), hash: id };
  const aliased = Object.prototype.hasOwnProperty.call(NOTEBOOK_ALIASES, id) ? NOTEBOOK_ALIASES[id] : undefined;
  if (aliased) return { pageId: aliased, focusId: entryHeadingId(id), hash: id };
  if (id === NOTEBOOK_SECTION_ID) return { pageId: current ?? NOTEBOOK_DEFAULT_PAGE, focusId: null, hash: id };
  return null;
}

/** The entry an alias hash names (`triund`), or null for a page id, `#notebook` and anything else. */
export function aliasEntryId(hash: string): string | null {
  const id = hashId(hash);
  return Object.prototype.hasOwnProperty.call(NOTEBOOK_ALIASES, id) ? id : null;
}

/** Index of a page in `NOTEBOOK_PAGES` (0 for an unknown id). */
export function pageIndex(pageId: NotebookPageId): number {
  return Math.max(0, NOTEBOOK_PAGES.findIndex((page) => page.id === pageId));
}

/**
 * The inline pre-paint script (§2.6): before the book is parsed it sets `html[data-nb-page]` from the hash (the default
 * page when the hash names none), and keeps it in step with `hashchange` until the controller is live; the first
 * `hashchange` after that removes the listener (the controller owns the attribute from then on). It touches nothing
 * React renders. Built from the same page list and aliases as `resolveNotebookPage`.
 */
export function notebookPrePaintScript(): string {
  const map: Record<string, NotebookPageId> = {};
  for (const page of NOTEBOOK_PAGES) map[page.id] = page.id;
  for (const [alias, pageId] of Object.entries(NOTEBOOK_ALIASES)) map[alias] = pageId;
  return (
    '(function(){try{var d=document.documentElement,m=' +
    JSON.stringify(map) +
    ';function f(e){if(e&&document.querySelector("[data-nb-root][data-nb-live]")){removeEventListener("hashchange",f);return}var h=location.hash.slice(1);try{h=decodeURIComponent(h)}catch(e){}' +
    'var p=Object.prototype.hasOwnProperty.call(m,h)?m[h]:"";' +
    `if(p)d.setAttribute("data-nb-page",p);else if(!d.hasAttribute("data-nb-page"))d.setAttribute("data-nb-page",${JSON.stringify(NOTEBOOK_DEFAULT_PAGE)})}` +
    'f();addEventListener("hashchange",f)}catch(e){}})();'
  );
}

/**
 * The pre-live rules (§2.6): until the controller marks the book live, the page (and its tab) named by
 * `html[data-nb-page]` is shown and the others are hidden: kept in the book's grid cell from 1024 px so the book is
 * already as tall as its tallest page, `display: none` below. One short rule per page, from the same list.
 */
export function notebookPreLiveCss(): string {
  const root = '[data-nb-root]:not([data-nb-live])';
  const hidden: string[] = [];
  const selected: string[] = [];
  for (const { id } of NOTEBOOK_PAGES) {
    hidden.push(`html[data-nb-page]:not([data-nb-page="${id}"]) ${root} [data-nb-pg="${id}"]`);
    selected.push(`html[data-nb-page="${id}"] ${root} [data-nb-tab="${id}"]`);
  }
  return (
    `${hidden.join(',')}{visibility:hidden}` +
    `@media (max-width:1023.98px){${hidden.join(',')}{display:none}}` +
    `${selected.join(',')}{background-color:var(--action-soft);box-shadow:inset 0 -2px 0 var(--action-line)}`
  );
}
