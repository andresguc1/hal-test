import React from "react";

/**
 * MiniSparkline — lightweight SVG sparkline chart
 * @param {Array<{passed:number, failed:number, total:number, label:string}>} data
 * @param {number} width
 * @param {number} height
 * @param {boolean} showTooltip
 */
export default function MiniSparkline({
  data = [],
  width = 180,
  height = 40,
  showBars = false,
}) {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.total || 0), 1);
  const barWidth = Math.floor((width - (data.length - 1) * 3) / data.length);

  if (showBars) {
    // Bar chart variant (used in overview)
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
      >
        {data.map((d, i) => {
          const x = i * (barWidth + 3);
          const passedH = Math.round((d.passed / maxVal) * (height - 2));
          const failedH = Math.round((d.failed / maxVal) * (height - 2));
          return (
            <g key={i} transform={`translate(${x}, 0)`}>
              {/* Failed segment (bottom) */}
              {d.failed > 0 && (
                <rect
                  x={0}
                  y={height - failedH}
                  width={barWidth}
                  height={failedH}
                  rx={2}
                  fill="hsl(0 84% 60% / 0.7)"
                />
              )}
              {/* Passed segment (above failed) */}
              {d.passed > 0 && (
                <rect
                  x={0}
                  y={height - failedH - passedH}
                  width={barWidth}
                  height={passedH}
                  rx={2}
                  fill="hsl(142 71% 45% / 0.8)"
                />
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  // Line chart variant
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - Math.round(((d.total || 0) / maxVal) * (height - 4)) - 2;
    return [x, y];
  });

  const pathD = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ");

  const areaD = [
    ...points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`),
    `L ${width} ${height}`,
    `L 0 ${height}`,
    "Z",
  ].join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#spark-grad)" />
      <path
        d={pathD}
        fill="none"
        stroke="hsl(217 91% 60%)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
