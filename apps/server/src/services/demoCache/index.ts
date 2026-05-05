// Demo cache layer entry point. Exposes the recorder, replay, fixtures
// loader, and SWR cache used by the finale demo path. The data layer
// is filesystem + in-process LRU — zero external infra. Run
// `pnpm demo:warm` to populate.

export { recordDiagnose, type RecordedRun } from "./recorder.js";
export { replayDiagnose, hasRecording, listRecordings } from "./replay.js";
export { swrCache, withSwr } from "./swr.js";
export {
  cacheRoot,
  recordingsDir,
  subgraphCacheDir,
  fixturesPath,
  readFixture,
  writeFixture,
  type DemoFixture,
} from "./paths.js";
