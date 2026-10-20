import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { buildNodeMetaRows } from "@/utils/nodeMetaRows";
import {
  resolveAnchorBox,
  resolveTooltipPosition,
} from "@/utils/tooltipPosition";
import CanvasNodeTooltip, { CanvasNodeInfoOverlay } from "./NodeTooltip";

describe("buildNodeMetaRows", () => {
  it("returns empty rows when no configuration", () => {
    expect(buildNodeMetaRows("click", {}, {})).toEqual([]);
  });

  it("shows selector from configuration", () => {
    const rows = buildNodeMetaRows("click", { selector: "#submit-btn" }, {});
    expect(rows.some((r) => r.text === "#submit-btn")).toBe(true);
  });

  it("shows url for open_url nodes", () => {
    const rows = buildNodeMetaRows(
      "open_url",
      { url: "https://example.com/dashboard" },
      {},
    );
    expect(rows.some((r) => r.text === "https://example.com/dashboard")).toBe(
      true,
    );
  });

  it("shows text value for type_text nodes", () => {
    const rows = buildNodeMetaRows(
      "type_text",
      { selector: "#username", text: "hello" },
      {},
    );
    expect(rows.some((r) => r.text === "hello")).toBe(true);
  });

  it("shows branch labels for conditional nodes", () => {
    const rows = buildNodeMetaRows(
      "conditional",
      { branches: [{ id: "true", label: "Yes" }, { id: "false" }] },
      {},
    );
    expect(rows.some((r) => r.text === "branches: Yes · false")).toBe(true);
  });

  it("shows node count for composite nodes", () => {
    const rows = buildNodeMetaRows("component", {}, { nodeCount: 5 });
    expect(rows.some((r) => r.text === "5 node(s) inside")).toBe(true);
  });

  it("does not add node count for non-composite nodes", () => {
    const rows = buildNodeMetaRows("click", {}, { nodeCount: 5 });
    expect(rows.some((r) => r.text.includes("node(s) inside"))).toBe(false);
  });

  it("shows flowId for component nodes", () => {
    const rows = buildNodeMetaRows("component", {}, { flowId: "flow-abc" });
    expect(rows.some((r) => r.text === "flow-abc")).toBe(true);
  });

  it("shows mode for loop nodes", () => {
    const rows = buildNodeMetaRows("loop", { mode: "while" }, {});
    expect(rows.some((r) => r.text === "mode: while")).toBe(true);
  });
});

describe("resolveAnchorBox", () => {
  it("accepts a bare DOMRect (what the canvas hands over)", () => {
    expect(
      resolveAnchorBox({
        left: 824,
        right: 1056,
        top: 380,
        width: 232,
        height: 115,
        x: 824,
        y: 380,
      }),
    ).toEqual({ left: 824, right: 1056, top: 380 });
  });

  it("accepts a {rect} wrapper", () => {
    expect(resolveAnchorBox({ rect: { left: 10, right: 40, top: 5 } })).toEqual(
      { left: 10, right: 40, top: 5 },
    );
  });

  it("treats a low-zoom cursor point as a zero-width box", () => {
    expect(resolveAnchorBox({ x: 400, y: 120, compact: true })).toEqual({
      left: 400,
      right: 400,
      top: 120,
    });
  });

  it("returns zeros without an anchor", () => {
    expect(resolveAnchorBox(null)).toEqual({ left: 0, right: 0, top: 0 });
  });
});

describe("resolveTooltipPosition", () => {
  const viewport = { viewportWidth: 1600, viewportHeight: 900 };

  it("places the tooltip beside the node, not on top of it", () => {
    const anchor = { left: 824, right: 1056, top: 380 };
    const { left, top } = resolveTooltipPosition({
      anchor,
      tipWidth: 290,
      ...viewport,
    });

    expect(left).toBe(anchor.right + 12); // to the right of the node
    expect(left).toBeGreaterThanOrEqual(anchor.right); // never overlaps it
    expect(top).toBe(anchor.top);
  });

  it("flips to the left when the right edge would overflow", () => {
    const anchor = { left: 1400, right: 1600, top: 100 };
    const { left } = resolveTooltipPosition({
      anchor,
      tipWidth: 290,
      ...viewport,
    });

    expect(left + 290).toBeLessThanOrEqual(anchor.left);
    expect(left).toBe(anchor.left - 12 - 290);
  });

  it("keeps the tooltip on screen when neither side fits", () => {
    const { left } = resolveTooltipPosition({
      anchor: { left: 0, right: 100, top: 40 },
      tipWidth: 290,
      viewportWidth: 400,
      viewportHeight: 900,
    });

    expect(left).toBeGreaterThanOrEqual(8);
    expect(left + 290).toBeLessThanOrEqual(400 - 8);
  });

  it("positions from a cursor point in low-zoom mode", () => {
    const { left, top } = resolveTooltipPosition({
      anchor: { x: 400, y: 120, compact: true },
      tipWidth: 180,
      ...viewport,
    });

    expect(left).toBe(412);
    expect(top).toBe(120);
  });

  it("clamps the vertical offset into the viewport", () => {
    expect(
      resolveTooltipPosition({
        anchor: { left: 0, right: 0, top: -50 },
        tipWidth: 290,
        ...viewport,
      }).top,
    ).toBe(6);

    expect(
      resolveTooltipPosition({
        anchor: { left: 0, right: 0, top: 5000 },
        tipWidth: 290,
        ...viewport,
      }).top,
    ).toBe(900 - 40);
  });
});

describe("CanvasNodeInfoOverlay rendering", () => {
  const anchorRect = { left: 100, right: 300, top: 50 };
  const infoNode = {
    id: "n1",
    data: { configuration: { selector: "#submit-btn" } },
    nodeKey: "click",
  };

  const render = () =>
    renderToStaticMarkup(
      <CanvasNodeInfoOverlay
        infoNode={infoNode}
        anchorRect={anchorRect}
        onClose={() => {}}
        zoom={1}
        cursorPos={null}
      />,
    );

  it("positions itself beside the anchor rect", () => {
    // Regression: the overlay passed a bare DOMRect while the tooltip read
    // `anchor.rect`, so it fell back to the node origin and covered it —
    // swallowing clicks meant for the node underneath.
    const markup = render();
    const tipLeft = Number(markup.match(/left:([\d.]+)px/)?.[1] ?? Number.NaN);

    expect(Number.isFinite(tipLeft)).toBe(true);
    expect(tipLeft).toBeGreaterThanOrEqual(anchorRect.right);
    expect(tipLeft + 290).toBeLessThanOrEqual(window.innerWidth - 8);
  });

  it("never re-enables pointer events except on the close button", () => {
    const doc = new DOMParser().parseFromString(render(), "text/html");
    const bubble = doc.querySelector('[role="tooltip"]');
    const closeButton = doc.querySelector(
      'button[aria-label="Close node info"]',
    );

    expect(bubble.className).toContain("pointer-events-none");
    expect(bubble.className).not.toContain("pointer-events-auto");
    expect(closeButton.className).toContain("pointer-events-auto");
  });
});

describe("CanvasNodeTooltip", () => {
  it("renders nothing without an anchor", () => {
    expect(renderToStaticMarkup(<CanvasNodeTooltip anchor={null} />)).toBe("");
  });
});
