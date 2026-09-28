/**
 * X7 — in-page ELK via elkjs's published path (`elk.bundled.js` imports and
 * auto-spawns its own GWT web worker from a blob, so the main thread stays
 * idle during layout). Proven here with a longtask observer.
 */
import ELK from "elkjs/lib/elk.bundled.js";

const elk = new ELK();
export const layout = (graph) => elk.layout(graph);
