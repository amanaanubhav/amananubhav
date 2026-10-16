import { ArrowRight } from 'lucide-react';
import type { Project } from '@/entities/project';
import { ROUTES } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { ChapterHeader } from '@/shared/ui/chapter-header';
import { DrawOnView } from '@/shared/ui/draw';
import { Log, Spread } from '@/shared/ui/journal';
import type { LogEntry } from '@/shared/ui/journal';
import { MediaSlot } from '@/shared/ui/media-slot';
import { VisuallyHidden } from '@/shared/ui/visually-hidden';
import { BLUEPRINT_NOTES, PROJECT_LOG_RESULT, PROJECTS_COPY, blueprintCaption } from '../config/copy';
import { BLUEPRINTS, SELF_ANIMATED } from './blueprints';
import { BlueprintFigure } from './BlueprintFigure';
import { RichLine } from './RichLine';
import { StackList } from './StackList';

const TITLE_ID = 'projects-title';

const LINK_CLASSES =
  'inline-flex min-h-6 items-center rounded-control text-ink underline decoration-signal decoration-1 underline-offset-[0.22em] transition-[text-decoration-thickness] duration-hover hover:decoration-2';

function ProjectLinks({ project }: { project: Project }) {
  const links = project.links ?? [];
  if (links.length === 0) return null;
  return (
    <span className="flex flex-col gap-1">
      {links.map((link) => (
        <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className={LINK_CLASSES}>
          {link.label}
          <VisuallyHidden> (opens in a new tab)</VisuallyHidden>
        </a>
      ))}
    </span>
  );
}

/**
 * The project's G-05 blueprint inside its M-WORK-03 plate, in the layout that suits the plate's width; static ones
 * draw once in view, DIVERT runs its own corridor. A diagram's disclaimer (BLUEPRINT_NOTES) is the plate caption's second sentence.
 */
function BlueprintPlate({ project }: { project: Project }) {
  const Blueprint = BLUEPRINTS[project.id];
  if (!Blueprint) return null;
  const selfAnimated = SELF_ANIMATED.has(project.id);
  return (
    <BlueprintFigure
      id="M-WORK-03"
      layout="bleed"
      breakpoints="bleed"
      captionText={blueprintCaption(project.title, BLUEPRINT_NOTES[project.id])}
      render={(variant) =>
        selfAnimated ? (
          <div className="absolute inset-0">
            <Blueprint variant={variant} />
          </div>
        ) : (
          <DrawOnView className="absolute inset-0">
            <Blueprint variant={variant} />
          </DrawOnView>
        )
      }
    />
  );
}

function ProjectSpread({ project }: { project: Project }) {
  const headingId = `project-${project.id}`;
  const resultShort = PROJECT_LOG_RESULT[project.id];
  // `project` is not in the §G.3 list: the h3 sets the one-liner, so this row is where the name is visible.
  const log: LogEntry[] = [
    { key: 'project', value: project.title, mono: false },
    { key: 'period', value: project.period },
    { key: 'role', value: project.role, mono: false },
    { key: 'team', value: project.team, mono: false },
    { key: 'stack', value: project.tech.length > 0 ? <StackList items={project.tech} /> : undefined },
    { key: 'links', value: project.links?.length ? <ProjectLinks project={project} /> : undefined, mono: false },
    { key: 'result', value: resultShort ? <RichLine parts={resultShort} /> : undefined, mono: false },
  ];

  const screens = project.slotIds?.[0];

  return (
    <Spread
      as="article"
      labelledBy={headingId}
      // §G.3: each spread is about 90svh tall on desktop; content stays top-aligned (Spread's 1fr row takes the rest).
      className="mt-24 lg:mt-32 lg:min-h-[90svh]"
      plateSpan="bleed"
      heading={
        <ChapterHeader as="h3" size="h3" id={headingId} srPrefix={`${project.title}: `}>
          {project.oneLiner ?? project.title}
        </ChapterHeader>
      }
      log={<Log items={log} />}
      plate={
        // From 1024 px the plate column stops short of the window edge, where the waypoint rail and its active
        // label live: 96 px (§J.3), and 128 px from 1280 px so the label clears the diagram's text too.
        <div className="flex flex-col gap-6 px-4 md:px-8 lg:pl-0 lg:pr-24 xl:pr-32">
          <BlueprintPlate project={project} />
          {project.id === 'divert' ? (
            <MediaSlot id="M-NOTEBOOK-02" layout="inset" sizes="280px" className="max-w-[280px]" />
          ) : null}
          {screens ? <MediaSlot id={screens} layout="inset" ratio="16:10" sizes="280px" className="max-w-[280px]" /> : null}
        </div>
      }
    >
      <div className="flex max-w-measure flex-col gap-4 font-body text-body text-ink">
        {project.problem ? (
          <p className="m-0 [text-wrap:pretty]">
            <em className="mr-1 text-ink-muted">{PROJECTS_COPY.runIn.problem}</em>
            {project.problem}
          </p>
        ) : null}
        {project.approach ? (
          <p className="m-0 [text-wrap:pretty]">
            <em className="mr-1 text-ink-muted">{PROJECTS_COPY.runIn.approach}</em>
            {project.approach}
          </p>
        ) : null}
        {project.result ? (
          <p className="m-0 [text-wrap:pretty]">
            <em className="mr-1 text-ink-muted">{PROJECTS_COPY.runIn.result}</em>
            {project.result}
          </p>
        ) : null}
      </div>
    </Spread>
  );
}

/**
 * §G.3 #projects: the featured six in `featuredOrder`, each a spread with its G-05 blueprint (M-WORK-03) and a
 * compact screenshot plate (its `M-PROJ-*` slot; pending plates say what is to come). DIVERT's corridor plays once
 * in view, then shows a Play button; the others draw once. Then the way into the full archive.
 */
export function FeaturedProjectsSection({ projects }: { projects: readonly Project[] }) {
  return (
    <section id="projects" aria-labelledby={TITLE_ID} className="mt-32 lg:mt-48">
      <div className="journal-grid">
        <div className="col-[content-start/content-end] lg:col-[5/span_5]">
          <ChapterHeader as="h2" id={TITLE_ID}>
            {PROJECTS_COPY.title}
          </ChapterHeader>
        </div>
      </div>

      {projects.map((project) => (
        <ProjectSpread key={project.id} project={project} />
      ))}

      <div className="journal-grid mt-16 lg:mt-24">
        <div className="col-[content-start/content-end] lg:col-[5/span_5]">
          <Button variant="text" href={ROUTES.projectArchive} icon={ArrowRight} iconPosition="end" className="whitespace-normal text-left">
            {PROJECTS_COPY.archiveLink}
          </Button>
        </div>
      </div>
    </section>
  );
}
