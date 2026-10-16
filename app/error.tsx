'use client';

import { useEffect } from 'react';
import { House, RotateCcw } from 'lucide-react';
import { ROUTES } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { ChapterHeader } from '@/shared/ui/chapter-header';
import { Log } from '@/shared/ui/journal';

/** Route error boundary (§H.11): names the problem and both ways out; logs the error as before. */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section aria-labelledby="route-error-title" className="journal-grid min-h-[80svh] content-center pb-24 pt-32 lg:pt-40">
      <div className="col-[content-start/content-end] lg:col-[2/span_7]">
        <ChapterHeader as="h1" id="route-error-title" size="h2">
          Something went wrong on this page.
        </ChapterHeader>
        <Log items={[{ key: 'reference', value: error.digest }]} layout="strip" label="Error reference" className="mt-4" />
        <p className="m-0 mt-4 font-body text-lead text-ink">Try again, or head back to base camp.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button icon={RotateCcw} onClick={reset}>
            Try again
          </Button>
          <Button variant="secondary" href={ROUTES.home} icon={House}>
            Back to base camp
          </Button>
        </div>
      </div>
    </section>
  );
}
