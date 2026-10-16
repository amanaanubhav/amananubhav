import { Box, Edge, Line, Note, Sheet, SignalPath, sheetId } from './parts';
import type { BlueprintProps } from './parts';

const TILE = 50;

/** The 3 × 3 tile grid a leaf photo is cut into, as one path, with its top-left corner at (x, y). */
function tileGrid(x: number, y: number): string {
  let d = `M${x} ${y}h${TILE * 3}v${TILE * 3}h${-TILE * 3}Z`;
  for (let i = 1; i < 3; i += 1) {
    d += `M${x + i * TILE} ${y}v${TILE * 3}M${x} ${y + i * TILE}h${TILE * 3}`;
  }
  return d;
}

const TILES_LANDSCAPE = { x: 320, y: 155 } as const;
const TILES_PORTRAIT = { x: 145, y: 450 } as const;

const TITLE = "Diagram: KANAD's two models, illustrative";
const DESC =
  'Illustrative. A leaf photo is cut into tiles and a convolutional neural network classifies each tile by disease. Separately, a recurrent LSTM network reads a weather time series and forecasts water need to schedule irrigation. The highlighted line is the leaf photo\'s path.';

/** 1200 × 900: two lanes, left to right; the leaf lane on top, the weather lane below. */
function Landscape() {
  const t = TILES_LANDSCAPE;
  return (
    <>
      <Note x={60} y={96}>
        Two models: one reads the leaf, one reads the weather.
      </Note>

      {/* Lane 1: leaf → tiles → CNN → disease (the request path). */}
      <Line d="M70 300C70 200 150 140 240 150C240 250 170 310 70 300Z" pass="node" />
      <Line d="M70 300Q150 232 240 150M120 262L112 222M156 230L176 250M150 236L140 196M190 196L208 214" pass="node" tone="muted" />
      <Note x={155} y={350} anchor="middle" pass="node">
        leaf photo
      </Note>
      <rect x={t.x + TILE} y={t.y + TILE} width={TILE} height={TILE} className="fill-ink" opacity={0.12} />
      <Line d={tileGrid(t.x, t.y)} pass="node" />
      <Note x={t.x + TILE * 1.5} y={350} anchor="middle" pass="node">
        tiles
      </Note>
      <Box x={560} y={180} label="CNN" />
      <Box x={860} y={180} w={280} label="disease" sub="per tile" />

      <SignalPath
        d="M248 230H310M472 230H550M762 230H850"
        tips={[
          [320, 230, 'right'],
          [560, 230, 'right'],
          [860, 230, 'right'],
        ]}
      />

      {/* Lane 2: weather series → LSTM → irrigation (ink). */}
      <Line d="M60 650H300M60 650V520" tone="strong" />
      <Line d="M60 610L90 590L120 616L150 570L180 596L210 552L240 578L270 540L300 560" pass="node" />
      <Note x={180} y={700} anchor="middle" pass="node">
        weather series
      </Note>
      <Box x={400} y={540} label="LSTM" />
      <Edge d="M470 540C470 486 530 486 530 528" tips={[[530, 540, 'down']]} />
      <Note x={500} y={474} anchor="middle">
        recurrent
      </Note>
      <Box x={720} y={540} w={300} label="irrigation" sub="when to water" />
      <Edge d="M302 590H386" tips={[[400, 590, 'right']]} />
      <Edge d="M602 590H706" tips={[[720, 590, 'right']]} />
    </>
  );
}

/** 840 × 1120: two lanes, top to bottom; the leaf lane on the left, the weather lane on the right. */
function Portrait() {
  const t = TILES_PORTRAIT;
  return (
    <>
      <Note x={60} y={90}>
        Two models: one reads the leaf,
      </Note>
      <Note x={60} y={130}>
        one reads the weather.
      </Note>

      {/* Lane 1: leaf → tiles → CNN → disease (the request path). */}
      <Line d="M135 345C135 245 215 185 305 195C305 295 235 355 135 345Z" pass="node" />
      <Line d="M135 345Q215 277 305 195M185 307L177 267M221 275L241 295M215 281L205 241M255 241L273 259" pass="node" tone="muted" />
      <Note x={234} y={404} pass="node">
        leaf photo
      </Note>
      <rect x={t.x + TILE} y={t.y + TILE} width={TILE} height={TILE} className="fill-ink" opacity={0.12} />
      <Line d={tileGrid(t.x, t.y)} pass="node" />
      <Note x={t.x + TILE * 3 + 16} y={t.y + TILE * 1.5 + 9} pass="node">
        tiles
      </Note>
      <Box x={120} y={680} label="CNN" />
      <Box x={80} y={880} w={280} h={110} label="disease" sub="per tile" />

      <SignalPath
        d="M220 352V440M220 602V670M220 782V870"
        tips={[
          [220, 450, 'down'],
          [220, 680, 'down'],
          [220, 880, 'down'],
        ]}
      />

      {/* Lane 2: weather series → LSTM → irrigation (ink). */}
      <Line d="M500 380H740M500 380V250" tone="strong" />
      <Line d="M500 340L530 320L560 346L590 300L620 326L650 282L680 308L710 270L740 290" pass="node" />
      <Note x={620} y={430} anchor="middle" pass="node">
        weather series
      </Note>
      <Box x={520} y={520} label="LSTM" />
      <Edge d="M520 550C468 550 468 600 504 600" tips={[[520, 600, 'right']]} />
      <Note x={474} y={642} anchor="end">
        recurrent
      </Note>
      <Box x={480} y={760} w={300} h={110} label="irrigation" sub="when to water" />
      <Edge d="M620 452V504" tips={[[620, 520, 'down']]} />
      <Edge d="M620 622V744" tips={[[620, 760, 'down']]} />
    </>
  );
}

/**
 * G-05g: KANAD, illustrative. A leaf photo is cut into tiles that a CNN classifies by disease (the request path);
 * a separate LSTM reads a weather series to schedule irrigation ([S-PROJ-KANAD]; inputs, crops and dataset are
 * still to be confirmed, Q-29, so nothing here is specific).
 */
export function KanadPipeline({ className, variant = 'landscape' }: BlueprintProps) {
  return (
    <Sheet id={sheetId('bp-kanad', variant)} variant={variant} className={className} title={TITLE} desc={DESC}>
      {variant === 'portrait' ? <Portrait /> : <Landscape />}
    </Sheet>
  );
}
