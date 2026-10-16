import { Box, Edge, Label, Line, Note, Sheet, SignalPath, sheetId } from './parts';
import type { BlueprintProps } from './parts';

const TITLE = 'Diagram: Accolades ingestion pipeline';
const DESC =
  'JSON records from many sources are sanitised and upserted by a TypeScript pipeline. A unique constraint, drawn as a gate, lets each listing through once and stops duplicates. Listings land in a normalised Supabase PostgreSQL schema, are rendered on the server by Next.js 14, and each listing page carries schema.org Event JSON-LD. The highlighted line is one record\'s path.';

/** Rows (top edges) of the three source records, 56 units tall, at x 60 to 200 in both layouts. */
const RECORDS_LANDSCAPE: readonly number[] = [112, 192, 272];
const RECORDS_PORTRAIT: readonly number[] = [90, 170, 250];

/** A small JSON sheet: a ground-filled card with a drawn outline and a "json" label. */
function Record({ y }: { y: number }) {
  return (
    <g>
      <rect x={60} y={y} width={140} height={56} rx={4} className="fill-ground" />
      <Line
        d={`M64 ${y}H196Q200 ${y} 200 ${y + 4}V${y + 52}Q200 ${y + 56} 196 ${y + 56}H64Q60 ${y + 56} 60 ${y + 52}V${y + 4}Q60 ${y} 64 ${y}Z`}
        pass="node"
      />
      <Label x={130} y={y + 38} pass="node">
        json
      </Label>
    </g>
  );
}

/** 1200 × 900: records enter from the left; the gate stands across the path; the listing returns along the bottom. */
function Landscape() {
  return (
    <>
      {/* Source records: three small sheets, two joining in ink, one carrying the highlighted path. */}
      {RECORDS_LANDSCAPE.map((y) => (
        <Record key={y} y={y} />
      ))}
      <Edge d="M200 140H250V200H286" tips={[[300, 200, 'right']]} />
      <Edge d="M200 300H250V240H286" tips={[[300, 240, 'right']]} />
      <Note x={60} y={370}>
        records from many sites
      </Note>

      <Box x={300} y={170} label="sanitise" />
      <Box x={580} y={170} label="upsert" />

      {/* The gate: the unique constraint. */}
      <g>
        <rect x={872} y={120} width={16} height={84} className="fill-ground" />
        <rect x={872} y={236} width={16} height={84} className="fill-ground" />
        <Line d="M872 120H888V204H872ZM872 236H888V320H872Z" pass="node" />
        <Label x={880} y={100}>
          unique
        </Label>
      </g>

      {/* A duplicate meets the gate and stops. */}
      <Edge d="M782 262H842" dashed />
      <Line d="M852 252L864 272M864 252L852 272" />
      <Note x={1010} y={356} anchor="end">
        duplicates stop
      </Note>
      <Note x={1010} y={400} anchor="end">
        at the unique constraint
      </Note>

      <Box x={920} y={480} w={240} label="PostgreSQL" sub="Supabase" />
      <Box x={505} y={480} w={290} label="Next.js 14" sub="server-rendered" />
      <Box x={60} y={480} w={300} label="listing" sub="Event JSON-LD" />

      <SignalPath
        d="M202 220H290M502 220H570M782 220H1040V470M918 530H805M503 530H370"
        tips={[
          [300, 220, 'right'],
          [580, 220, 'right'],
          [1040, 480, 'down'],
          [795, 530, 'left'],
          [360, 530, 'left'],
        ]}
      />
      <Note x={210} y={640} anchor="middle">
        eligible for rich results
      </Note>
    </>
  );
}

/** 840 × 1120: the record runs down the middle through the gate; the listing ends at the bottom left. */
function Portrait() {
  return (
    <>
      {RECORDS_PORTRAIT.map((y) => (
        <Record key={y} y={y} />
      ))}
      <Edge d="M200 118H250V170H304" tips={[[320, 170, 'right']]} />
      <Edge d="M200 278H250V230H304" tips={[[320, 230, 'right']]} />
      <Note x={60} y={350}>
        records from
      </Note>
      <Note x={60} y={394}>
        many sites
      </Note>

      <Box x={320} y={150} w={260} label="sanitise" />
      <Box x={320} y={370} w={260} label="upsert" />

      {/* The gate: the unique constraint, lying across the path, with a gap where one record passes. */}
      <g>
        <rect x={370} y={552} width={64} height={16} className="fill-ground" />
        <rect x={466} y={552} width={64} height={16} className="fill-ground" />
        <Line d="M370 552H434V568H370ZM466 552H530V568H466Z" pass="node" />
        <Label x={550} y={570} anchor="start">
          unique
        </Label>
      </g>

      {/* A duplicate meets the gate and stops. */}
      <Edge d="M390 472V512" dashed />
      <Line d="M380 522L400 542M400 522L380 542" />
      <Note x={356} y={512} anchor="end">
        duplicates stop
      </Note>
      <Note x={356} y={556} anchor="end">
        at the unique
      </Note>
      <Note x={356} y={600} anchor="end">
        constraint
      </Note>

      <Box x={320} y={640} w={260} h={110} label="PostgreSQL" sub="Supabase" />
      <Box x={460} y={840} w={300} h={110} label="Next.js 14" sub="server-rendered" />
      <Box x={60} y={840} w={280} h={110} label="listing" sub="Event JSON-LD" />

      <SignalPath
        d="M202 198H310M450 252V360M450 472V630M450 752V795H610V830M458 895H354"
        tips={[
          [320, 198, 'right'],
          [450, 370, 'down'],
          [450, 640, 'down'],
          [610, 840, 'down'],
          [340, 895, 'left'],
        ]}
      />
      <Note x={200} y={1000} anchor="middle">
        eligible for rich results
      </Note>
    </>
  );
}

/**
 * G-05d: Accolades ingestion. JSON records are sanitised and upserted by a TypeScript pipeline; the unique
 * constraint is drawn as a gate that lets a listing through once and stops its duplicate; PostgreSQL feeds the
 * server-rendered Next.js 14 pages with schema.org Event JSON-LD ([S-PROJ-ACCOLADES] approach).
 */
export function AccoladesIngestion({ className, variant = 'landscape' }: BlueprintProps) {
  return (
    <Sheet id={sheetId('bp-accolades', variant)} variant={variant} className={className} title={TITLE} desc={DESC}>
      {variant === 'portrait' ? <Portrait /> : <Landscape />}
    </Sheet>
  );
}
