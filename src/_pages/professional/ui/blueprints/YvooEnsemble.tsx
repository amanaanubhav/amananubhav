import { Box, Note, Sheet, SignalPath, sheetId } from './parts';
import type { BlueprintProps } from './parts';

const TITLE = "Diagram: YVOO's fraud-detection ensemble";
const DESC =
  'A loan application reaches a secured FastAPI endpoint, which builds its features. The features go to an XGBoost model and a logistic regression in parallel; the two scores are blended into a risk flag that returns to the caller. Both models were trained on synthesised behavioural data. The service is Dockerised and deployed on Render. The highlighted line is the request path.';

/** 1200 × 900: the request enters along the top, splits into the two models, and the flag returns on the left. */
function Landscape() {
  return (
    <>
      <Box x={50} y={140} w={250} label="application" />
      <Box x={380} y={140} label="FastAPI" sub="secured" />
      <Box x={660} y={140} label="features" />
      <Box x={520} y={380} label="XGBoost" />
      <Box x={820} y={380} label="logistic" sub="regression" />
      <Box x={660} y={600} label="blend" />
      <Box x={370} y={600} w={210} label="risk flag" />

      <Note x={760} y={752} anchor="middle">
        both trained on synthesised behavioural data
      </Note>

      <SignalPath
        d="M302 190H370M582 190H650M760 242V310H620V370M760 310H920V370M620 482V540M920 482V540M620 540H920M760 540V590M658 650H590M368 650H180V250"
        tips={[
          [380, 190, 'right'],
          [660, 190, 'right'],
          [620, 380, 'down'],
          [920, 380, 'down'],
          [760, 600, 'down'],
          [580, 650, 'left'],
          [180, 240, 'up'],
        ]}
      />
    </>
  );
}

/** 840 × 1120: the request runs down the middle and splits; the flag returns up the left side to the caller. */
function Portrait() {
  return (
    <>
      <Box x={360} y={70} w={280} label="application" />
      <Box x={380} y={250} w={240} h={110} label="FastAPI" sub="secured" />
      <Box x={380} y={440} w={240} label="features" />
      <Box x={220} y={620} w={240} label="XGBoost" />
      <Box x={540} y={620} w={240} h={110} label="logistic" sub="regression" />
      <Box x={380} y={810} w={240} label="blend" />
      <Box x={60} y={810} w={240} label="risk flag" />

      <Note x={440} y={980} anchor="middle">
        both trained on
      </Note>
      <Note x={440} y={1024} anchor="middle">
        synthesised behavioural data
      </Note>

      <SignalPath
        d="M500 172V240M500 362V430M500 542V580H340V610M500 580H660V610M340 722V770M660 732V770M340 770H660M500 770V800M378 860H310M180 808V120H350"
        tips={[
          [500, 250, 'down'],
          [500, 440, 'down'],
          [340, 620, 'down'],
          [660, 620, 'down'],
          [500, 810, 'down'],
          [300, 860, 'left'],
          [360, 120, 'right'],
        ]}
      />
    </>
  );
}

/**
 * G-05f: YVOO. A loan application reaches a secured FastAPI endpoint; features feed an XGBoost model and a
 * logistic regression in parallel; their blend becomes the risk flag that returns to the caller. Both models were
 * trained on synthesised behavioural data ([S-PROJ-YVOO]). Accuracy figures stay off the diagram until Q-28.
 */
export function YvooEnsemble({ className, variant = 'landscape' }: BlueprintProps) {
  return (
    <Sheet id={sheetId('bp-yvoo', variant)} variant={variant} className={className} title={TITLE} desc={DESC}>
      {variant === 'portrait' ? <Portrait /> : <Landscape />}
    </Sheet>
  );
}
