import { Box, Edge, Note, Sheet, SignalPath, sheetId } from './parts';
import type { BlueprintProps } from './parts';

const TITLE = 'Diagram: The Trav Story pipeline';
const DESC =
  "A traveller's brief goes to the Next.js app, then to a FastAPI and LangChain service. The service retrieves passages from a vector database of the platform's own travel data and asks the LLM. The itinerary is stored in Supabase PostgreSQL and rendered back to the traveller on the server. Each part runs as its own service, shipped with Docker and GitHub workflows. The highlighted line is the request path.";

/** 1200 × 900: the request runs left to right; the itinerary returns along the bottom. */
function Landscape() {
  return (
    <>
      {/* Retrieval (ink). */}
      <Edge d="M730 288V422" tips={[[730, 270, 'up'], [730, 440, 'down']]} />
      <Note x={746} y={366}>
        retrieve
      </Note>

      <Box x={50} y={170} w={220} label="traveller" />
      <Box x={340} y={170} label="Next.js" />
      <Box x={620} y={170} w={220} label="FastAPI" sub="LangChain" />
      <Box x={940} y={170} label="LLM" />
      <Box x={620} y={440} w={220} label="vector DB" sub="travel data" />
      <Box x={900} y={630} w={240} label="PostgreSQL" sub="Supabase" />
      <Note x={160} y={316} anchor="middle" pass="node">
        the brief
      </Note>

      <SignalPath
        d="M272 220H330M542 220H610M842 220H930M1040 272V620M898 680H440V280"
        tips={[
          [340, 220, 'right'],
          [620, 220, 'right'],
          [940, 220, 'right'],
          [1040, 630, 'down'],
          [440, 270, 'up'],
        ]}
      />
      <Note x={670} y={726} anchor="middle">
        itinerary, server-rendered
      </Note>
    </>
  );
}

/** 840 × 1120: the request runs down the left column; the itinerary returns up the right edge to Next.js. */
function Portrait() {
  // Drawn from y 80 to 920; shifted to sit in the middle of the 1120-unit sheet.
  return (
    <g transform="translate(0 60)">
      {/* Retrieval (ink). */}
      <Edge d="M356 615H444" tips={[[340, 615, 'left'], [460, 615, 'right']]} />
      <Note x={400} y={540} anchor="middle">
        retrieve
      </Note>

      <Box x={60} y={80} w={280} label="traveller" />
      <Note x={216} y={260} pass="node">
        the brief
      </Note>
      <Box x={60} y={320} w={280} label="Next.js" />
      <Box x={60} y={560} w={280} h={110} label="FastAPI" sub="LangChain" />
      <Box x={460} y={560} w={280} h={110} label="vector DB" sub="travel data" />
      <Box x={60} y={810} w={280} label="LLM" />
      <Box x={460} y={810} w={280} h={110} label="PostgreSQL" sub="Supabase" />

      <SignalPath
        d="M200 182V310M200 422V550M200 672V800M342 860H450M742 865H790V370H352"
        tips={[
          [200, 320, 'down'],
          [200, 560, 'down'],
          [200, 810, 'down'],
          [460, 860, 'right'],
          [340, 370, 'left'],
        ]}
      />
      <Note x={566} y={306} anchor="middle">
        itinerary,
      </Note>
      <Note x={566} y={350} anchor="middle">
        server-rendered
      </Note>
    </g>
  );
}

/**
 * G-05c: The Trav Story. A traveller's brief goes through the Next.js app to the FastAPI and LangChain service,
 * which retrieves passages from the vector database of the platform's own travel data, asks the LLM, stores the
 * itinerary in Supabase PostgreSQL and renders it back on the server ([S-PROJ-TRAVSTORY] approach; no invented numbers).
 */
export function TravStoryPipeline({ className, variant = 'landscape' }: BlueprintProps) {
  return (
    <Sheet id={sheetId('bp-travstory', variant)} variant={variant} className={className} title={TITLE} desc={DESC}>
      {variant === 'portrait' ? <Portrait /> : <Landscape />}
    </Sheet>
  );
}
