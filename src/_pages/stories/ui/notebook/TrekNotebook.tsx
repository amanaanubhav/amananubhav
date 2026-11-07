import { ChapterHeader } from '@/shared/ui/chapter-header';
import { NOTEBOOK_COPY, trekCopy } from '../../config/treks';
import { TREK_ROUTES } from '../../config/trek-routes.generated';
import { NOTEBOOK_PAGES, NOTEBOOK_SECTION_ID, notebookPreLiveCss } from '../../lib/notebook-pages';
import { HimachalPage } from './HimachalPage';
import { NotebookController, type NotebookControllerPage } from './NotebookController';
import { NotebookPage } from './NotebookPage';
import { NotebookPrePaint } from './NotebookPrePaint';

const PRE_LIVE_CSS = notebookPreLiveCss();

/** Every page, rendered here on the server: sketches, stop lists, logs and photos add no client JS. */
function renderPages(): NotebookControllerPage[] {
  return NOTEBOOK_PAGES.flatMap((page): NotebookControllerPage[] => {
    if (page.id === 'himachal') return [{ id: page.id, tab: page.tab, node: <HimachalPage /> }];
    const expeditionId = page.expeditionIds[0];
    const trek = expeditionId ? trekCopy(expeditionId) : undefined;
    if (!expeditionId || !trek) return [];
    return [
      {
        id: page.id,
        tab: page.tab,
        node: <NotebookPage pageId={page.id} trek={trek} route={TREK_ROUTES[expeditionId]} />,
      },
    ];
  });
}

/**
 * `#notebook`, the field notebook (NOTEBOOK-DESIGN §1, §2): one spread per trek other than Annapurna (Kun Tso,
 * Chandrashila, Himachal, Dodital), turned with tabs, Previous / Next, arrow keys or a swipe. Server component: the
 * pre-paint script and the pre-live rules come first, so the page a deep link names is the one painted; the client
 * controller then owns the turn. Without JS every page stays in the HTML, stacked, and the tabs are plain anchors.
 */
export function TrekNotebook() {
  return (
    <section
      id={NOTEBOOK_SECTION_ID}
      aria-labelledby="notebook-title"
      tabIndex={-1}
      className="journal-grid focus:outline-none"
    >
      <NotebookPrePaint />
      <style dangerouslySetInnerHTML={{ __html: PRE_LIVE_CSS }} />
      <div className="col-[content-start/content-end] min-w-0 lg:col-[2/span_12]">
        <ChapterHeader as="h2" id="notebook-title">
          {NOTEBOOK_COPY.headline}
        </ChapterHeader>
        <p className="m-0 mt-4 max-w-measure font-body text-body text-ink [text-wrap:pretty]">{NOTEBOOK_COPY.line}</p>
        <NotebookController
          pages={renderPages()}
          labels={{ tablist: NOTEBOOK_COPY.tablistLabel, previous: NOTEBOOK_COPY.previous, next: NOTEBOOK_COPY.next }}
        />
      </div>
    </section>
  );
}
