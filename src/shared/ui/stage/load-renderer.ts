/**
 * The one import site of the three/R3F renderer chunk (load-in-3d §10, P4). StageCanvas's next/dynamic,
 * preloadStage and the pre-hydration kick (early-kick.ts) all go through it, so the bundler emits one renderer
 * chunk and the browser fetches it once. A leaf: it imports nothing else, so a caller pulls in no stage module.
 */
export const loadRenderer = () => import('./StageRenderer');
