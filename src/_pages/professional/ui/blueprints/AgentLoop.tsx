import { Box, Edge, Note, Sheet, SignalPath, sheetId } from './parts';
import type { BlueprintProps } from './parts';

const TITLE = 'Diagram: how I structure an AI agent';
const DESC =
  "Six parts: input, model, tools, memory, decision and action. Input goes to the model; the model reads context from memory and calls tools; the model's decision triggers an action; the action's result is fed back into memory for the next turn. The highlighted line is the request path: input, model, decision, action. How I structure agents in general; Atlys specifics are not public.";

/** 1200 × 900: the request path runs left to right along the top; memory and tools sit under the model. */
function Landscape() {
  return (
    <>
      {/* Supporting edges (ink): context, tool calls, and the feedback loop. */}
      <Edge d="M540 288V452" tips={[[540, 270, 'up'], [540, 470, 'down']]} />
      <Note x={526} y={388} anchor="end">
        context
      </Note>
      <Edge d="M670 288V452" tips={[[670, 270, 'up'], [670, 470, 'down']]} />
      <Note x={684} y={388}>
        call
      </Note>
      <Edge d="M1040 570V700H480V588" tips={[[480, 570, 'up']]} dashed />
      <Note x={760} y={684} anchor="middle">
        result fed back
      </Note>

      {/* Nodes. */}
      <Box x={60} y={170} label="input" />
      <Box x={500} y={170} label="model" sub="LLM" />
      <Box x={940} y={170} label="decision" />
      <Box x={380} y={470} label="memory" />
      <Box x={640} y={470} label="tools" />
      <Box x={940} y={470} label="action" />
      <Note x={60} y={316} pass="node">
        a message or document
      </Note>

      {/* The request path. */}
      <SignalPath
        d="M262 220H490M702 220H930M1040 272V460"
        tips={[
          [500, 220, 'right'],
          [940, 220, 'right'],
          [1040, 470, 'down'],
        ]}
      />
    </>
  );
}

/** 840 × 1120: the request path runs down the left column; tools and memory sit in the right column. */
function Portrait() {
  // Drawn from y 90 to 920; shifted to sit in the middle of the 1120-unit sheet.
  return (
    <g transform="translate(0 55)">
      {/* Supporting edges (ink): tool calls, context, and the feedback loop. */}
      <Edge d="M356 350H464" tips={[[340, 350, 'left'], [480, 350, 'right']]} />
      <Note x={410} y={334} anchor="middle">
        call
      </Note>
      <Edge d="M356 420H620V504" tips={[[340, 420, 'left'], [620, 520, 'down']]} />
      <Note x={480} y={456} anchor="middle">
        context
      </Note>
      <Edge d="M342 870H620V636" tips={[[620, 620, 'up']]} dashed />
      <Note x={480} y={910} anchor="middle">
        result fed back
      </Note>

      {/* Nodes. */}
      <Box x={60} y={90} w={280} label="input" />
      <Note x={370} y={150} pass="node">
        a message or document
      </Note>
      <Box x={60} y={290} w={280} h={160} label="model" sub="LLM" />
      <Box x={480} y={300} w={280} label="tools" />
      <Box x={480} y={520} w={280} label="memory" />
      <Box x={60} y={560} w={280} label="decision" />
      <Box x={60} y={820} w={280} label="action" />

      {/* The request path. */}
      <SignalPath
        d="M200 192V280M200 452V550M200 662V810"
        tips={[
          [200, 290, 'down'],
          [200, 560, 'down'],
          [200, 820, 'down'],
        ]}
      />
    </g>
  );
}

/**
 * G-05a: how I structure an AI agent (hero plate M-PRO-AGENT-01). Input reaches the model, which reads context from
 * memory and calls tools; the model's decision triggers an action, and the action's result is fed back into memory.
 * The request path (signal) runs input → model → decision → action. Generic by design: Atlys specifics are not public
 * (that line is the plate caption, HERO_COPY.plateCaption).
 */
export function AgentLoop({ className, variant = 'landscape' }: BlueprintProps) {
  return (
    <Sheet id={sheetId('bp-agent', variant)} variant={variant} className={className} title={TITLE} desc={DESC}>
      {variant === 'portrait' ? <Portrait /> : <Landscape />}
    </Sheet>
  );
}
