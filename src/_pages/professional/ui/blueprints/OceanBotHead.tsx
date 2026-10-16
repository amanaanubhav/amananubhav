import { Box, Edge, Label, Line, Note, Sheet, SignalPath, sheetId } from './parts';
import type { BlueprintProps } from './parts';

const CLASSES = 31;

const TITLE = "Diagram: OceanBot's classifier head";
const DESC =
  'A photo passes through a frozen InceptionV3 base, then a trained head: a Dense layer of 1024 units with ReLU and L2 regularisation of 0.001, Dropout of 0.4, and a Dense layer of 31 units with softmax, one per species. The 31 class cells are drawn evenly. Separately, field reports pass through 15 or more regular expressions that extract coordinates. The highlighted line is the photo\'s path.';

/** The 31-cell class strip as one path: its outline and the separators, vertical (landscape) or across (portrait). */
function classStrip(x: number, y: number, w: number, h: number, across: boolean): string {
  let d = `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
  const step = (across ? w : h) / CLASSES;
  for (let i = 1; i < CLASSES; i += 1) {
    const at = Math.round(((across ? x : y) + i * step) * 10) / 10;
    d += across ? `M${at} ${y}V${y + h}` : `M${x} ${at}H${x + w}`;
  }
  return d;
}

/** A layer of the head as a rounded bar (6-unit radius), as one path. */
function bar(x: number, y: number, w: number, h: number): string {
  const r = 6;
  return `M${x} ${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}Z`;
}

const STRIP_LANDSCAPE = { x: 1050, y: 220, w: 50, h: 330 } as const;
const STRIP_PORTRAIT = { x: 120, y: 810, w: 360, h: 40 } as const;
const CELLS_LANDSCAPE = classStrip(STRIP_LANDSCAPE.x, STRIP_LANDSCAPE.y, STRIP_LANDSCAPE.w, STRIP_LANDSCAPE.h, false);
const CELLS_PORTRAIT = classStrip(STRIP_PORTRAIT.x, STRIP_PORTRAIT.y, STRIP_PORTRAIT.w, STRIP_PORTRAIT.h, true);

/** 1200 × 900: the photo's path runs left to right through tall layer bars; the text lane runs along the bottom. */
function Landscape({ hatch }: { hatch: string }) {
  const s = STRIP_LANDSCAPE;
  return (
    <>
      <Note x={60} y={110}>
        Transfer learning: only the head is trained.
      </Note>

      {/* Photo with a simple fish outline. */}
      <Box x={60} y={300} w={170} h={170} label="" />
      <Line d="M98 385Q148 342 198 385Q148 428 98 385ZM98 385L74 366V404Z" pass="node" />
      <Label x={145} y={520}>
        photo
      </Label>

      {/* Frozen base. */}
      <Box x={300} y={250} w={260} h={270} label="InceptionV3" sub="frozen" hatch={hatch} />

      {/* The head: layers as tall bars. */}
      <Line d={bar(650, 220, 60, 330)} pass="node" />
      <Label x={680} y={600}>
        Dense 1024
      </Label>
      <Note x={680} y={640} anchor="middle" pass="node">
        ReLU, L2 0.001
      </Note>

      <Line d={bar(790, 220, 40, 330)} dashed="8 6" pass="node" />
      <Label x={810} y={190}>
        Dropout 0.4
      </Label>

      <Line d={bar(910, 220, 60, 330)} pass="node" />
      <Label x={940} y={600}>
        Dense 31
      </Label>
      <Note x={940} y={640} anchor="middle" pass="node">
        softmax
      </Note>

      {/* 31 classes, drawn evenly. */}
      <rect x={s.x} y={s.y} width={s.w} height={s.h} className="fill-ink" opacity={0.08} />
      <Line d={CELLS_LANDSCAPE} pass="node" tone="muted" />
      <Label x={1075} y={190}>
        31 species
      </Label>

      <SignalPath
        d="M232 385H290M562 385H640M712 385H780M832 385H900M972 385H1040"
        tips={[
          [300, 385, 'right'],
          [650, 385, 'right'],
          [790, 385, 'right'],
          [910, 385, 'right'],
          [1050, 385, 'right'],
        ]}
      />

      {/* Text lane (ink). */}
      <Box x={60} y={700} w={270} h={90} label="field report" />
      <Box x={420} y={700} w={240} h={90} label="15+ regex" />
      <Box x={760} y={700} w={260} h={90} label="coordinates" />
      <Edge d="M332 745H404" tips={[[420, 745, 'right']]} />
      <Edge d="M662 745H744" tips={[[760, 745, 'right']]} />
    </>
  );
}

/** 840 × 1120: the photo's path runs down through wide layer bars labelled on the right; the text lane closes the sheet. */
function Portrait({ hatch }: { hatch: string }) {
  const s = STRIP_PORTRAIT;
  return (
    <>
      <Note x={60} y={90}>
        Transfer learning: only the head is trained.
      </Note>

      {/* Photo with a simple fish outline. */}
      <Box x={220} y={130} w={160} h={130} label="" />
      <Line d="M253 195Q303 152 353 195Q303 238 253 195ZM253 195L229 176V214Z" pass="node" />
      <Label x={410} y={205} anchor="start">
        photo
      </Label>

      {/* Frozen base. */}
      <Box x={120} y={320} w={360} h={120} label="InceptionV3" sub="frozen" hatch={hatch} />

      {/* The head: layers as wide bars, labels to the right. */}
      <Line d={bar(120, 500, 360, 40)} pass="node" />
      <Label x={510} y={530} anchor="start">
        Dense 1024
      </Label>
      <Note x={510} y={568} pass="node">
        ReLU, L2 0.001
      </Note>

      <Line d={bar(120, 610, 360, 24)} dashed="8 6" pass="node" />
      <Label x={510} y={632} anchor="start">
        Dropout 0.4
      </Label>

      <Line d={bar(120, 700, 360, 40)} pass="node" />
      <Label x={510} y={730} anchor="start">
        Dense 31
      </Label>
      <Note x={510} y={768} pass="node">
        softmax
      </Note>

      {/* 31 classes, drawn evenly. */}
      <rect x={s.x} y={s.y} width={s.w} height={s.h} className="fill-ink" opacity={0.08} />
      <Line d={CELLS_PORTRAIT} pass="node" tone="muted" />
      <Label x={510} y={840} anchor="start">
        31 species
      </Label>

      <SignalPath
        d="M300 262V310M300 442V490M300 542V600M300 636V690M300 742V800"
        tips={[
          [300, 320, 'down'],
          [300, 500, 'down'],
          [300, 610, 'down'],
          [300, 700, 'down'],
          [300, 810, 'down'],
        ]}
      />

      {/* Text lane (ink). */}
      <Box x={40} y={930} w={250} h={100} label="report" sub="from the field" />
      <Box x={330} y={930} w={210} h={100} label="15+ regex" />
      <Box x={590} y={930} w={215} h={100} label="lat/lon" sub="coordinates" />
      <Edge d="M292 980H314" tips={[[330, 980, 'right']]} />
      <Edge d="M542 980H574" tips={[[590, 980, 'right']]} />
    </>
  );
}

/**
 * G-05e: OceanBot's head on a frozen InceptionV3 base: Dense 1024 ReLU, Dropout 0.4, Dense 31 softmax, L2 0.001
 * ([S-PROJ-OCEANBOT]). The 31-cell class strip is uniform until per-species results are published (Q-27).
 * A second, ink lane extracts coordinates from field reports with 15+ regular expressions.
 */
export function OceanBotHead({ className, variant = 'landscape' }: BlueprintProps) {
  const id = sheetId('bp-oceanbot', variant);
  const hatch = `${id}-hatch`;
  return (
    <Sheet
      id={id}
      variant={variant}
      className={className}
      title={TITLE}
      desc={DESC}
      defs={
        <pattern id={hatch} width={20} height={20} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0V20" style={{ stroke: 'var(--ink-contour)' }} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        </pattern>
      }
    >
      {variant === 'portrait' ? <Portrait hatch={hatch} /> : <Landscape hatch={hatch} />}
    </Sheet>
  );
}
