import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useState,
  useMemo,
} from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  AreaSeries,
} from "lightweight-charts";
import type {
  RealTimeTelemetryChartRef,
  TelemetryBarPoint,
  TelemetryLinePoint,
  LineSeriesConfig,
} from "./telemetryTypes";

export interface RealTimeTelemetryChartProps {
  /** Optional custom CSS height (default: 350px) */
  height?: number | string;
  /** Title header for the telemetry panel */
  title?: string;
  /** Domain context: 'performance' | 'security' (controls secondary metrics & legends) */
  domain?: "performance" | "security";
  /** Label for the primary bar series (e.g. "Latencia (ms)" or "Alertas") */
  barTitle?: string;
  /** Custom extra line series configurations */
  lineConfigs?: LineSeriesConfig[];
  /** Dark mode toggle (default: true) */
  darkMode?: boolean;
  /** Default primary series display mode ('line' | 'area' | 'bar') */
  defaultChartMode?: "line" | "area" | "bar";
}

export const RealTimeTelemetryChart = forwardRef<
  RealTimeTelemetryChartRef,
  RealTimeTelemetryChartProps
>(
  (
    {
      height = 350,
      title = "Telemetría de Ejecución en Tiempo Real",
      domain = "performance",
      barTitle,
      lineConfigs = [],
      darkMode = true,
      defaultChartMode,
    },
    ref,
  ) => {
    const [chartMode, setChartMode] = useState<"line" | "area" | "bar">(
      defaultChartMode || (domain === "performance" ? "line" : "bar"),
    );
    const containerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const primarySeriesRef = useRef<ISeriesApi<any> | null>(null);
    const lineSeriesMapRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());

    // Persistent data store so canvas recreation never loses dataset
    const lastBarsRef = useRef<TelemetryBarPoint[]>([]);
    const lastLinesRef = useRef<Record<string, TelemetryLinePoint[]>>({});

    const [nodeBadges, setNodeBadges] = useState<TelemetryBarPoint[]>([]);
    const [hoverInfo, setHoverInfo] = useState<{
      label: string;
      value: number;
      color?: string;
      nodeId?: string;
    } | null>(null);

    const isSecurity = domain === "security";
    const primaryBarTitle =
      barTitle || (isSecurity ? "Alertas Detectadas" : "Latencia (ms)");

    // Theme Palette (Memoized to prevent chart teardown on re-renders)
    const themeColors = useMemo(
      () =>
        darkMode
          ? {
              bg: "#0b0f19",
              text: "#94a3b8",
              grid: "#1e293b",
              barColor: isSecurity ? "#ef4444" : "#10b981",
              lineColor: isSecurity ? "#f59e0b" : "#3b82f6",
            }
          : {
              bg: "#ffffff",
              text: "#475569",
              grid: "#f1f5f9",
              barColor: isSecurity ? "#dc2626" : "#059669",
              lineColor: isSecurity ? "#d97706" : "#2563eb",
            },
      [darkMode, isSecurity],
    );

    // 1. Imperative Ref Handlers for 60FPS Direct Canvas Updates
    const updateBar = useCallback((point: TelemetryBarPoint) => {
      lastBarsRef.current = [...lastBarsRef.current, point];
      if (primarySeriesRef.current) {
        try {
          primarySeriesRef.current.update(point);
          if (
            (point.label || point.nodeId) &&
            !point.label?.startsWith("Muestreo #") &&
            !point.label?.startsWith("Punto #")
          ) {
            setNodeBadges((prev) => {
              const filtered = prev.filter(
                (p) =>
                  (p.nodeId && p.nodeId !== point.nodeId) ||
                  (p.label && p.label !== point.label),
              );
              return [...filtered, point];
            });
          }
        } catch (err) {
          console.warn("[RealTimeTelemetryChart] Bar update error:", err);
        }
      }
    }, []);

    const updateLineMetric = useCallback(
      (seriesId: string, point: TelemetryLinePoint) => {
        const currentPoints = lastLinesRef.current[seriesId] || [];
        lastLinesRef.current[seriesId] = [...currentPoints, point];
        const lineSeries = lineSeriesMapRef.current.get(seriesId);
        if (lineSeries) {
          try {
            lineSeries.update(point);
          } catch (err) {
            console.warn(
              `[RealTimeTelemetryChart] Line series "${seriesId}" update error:`,
              err,
            );
          }
        }
      },
      [],
    );

    const setHistoricalData = useCallback(
      (
        bars: TelemetryBarPoint[],
        lines?: Record<string, TelemetryLinePoint[]>,
      ) => {
        lastBarsRef.current = bars;
        if (lines) lastLinesRef.current = lines;

        if (primarySeriesRef.current) {
          primarySeriesRef.current.setData(bars);
          const nodeMap = new Map<string, TelemetryBarPoint>();
          bars.forEach((b) => {
            if (
              (b.nodeId || b.label) &&
              !b.label?.startsWith("Muestreo #") &&
              !b.label?.startsWith("Punto #")
            ) {
              const key = b.nodeId || b.label;
              if (key) nodeMap.set(key, b);
            }
          });
          setNodeBadges(Array.from(nodeMap.values()));
        }
        if (lines) {
          Object.entries(lines).forEach(([seriesId, points]) => {
            const lineSeries = lineSeriesMapRef.current.get(seriesId);
            if (lineSeries) {
              lineSeries.setData(points);
            }
          });
        }
        if (chartRef.current) {
          chartRef.current.timeScale().fitContent();
        }
      },
      [],
    );

    const clear = useCallback(() => {
      lastBarsRef.current = [];
      lastLinesRef.current = {};
      if (primarySeriesRef.current) {
        primarySeriesRef.current.setData([]);
      }
      lineSeriesMapRef.current.forEach((series) => series.setData([]));
      setNodeBadges([]);
      setHoverInfo(null);
    }, []);

    const fitContent = useCallback(() => {
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        updateBar,
        updateLineMetric,
        setHistoricalData,
        clear,
        fitContent,
      }),
      [updateBar, updateLineMetric, setHistoricalData, clear, fitContent],
    );

    // 2. Chart Initialization and Canvas Setup
    useEffect(() => {
      if (!containerRef.current) return;

      const chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height:
          typeof height === "number"
            ? height
            : containerRef.current.clientHeight || 350,
        layout: {
          background: { type: ColorType.Solid, color: themeColors.bg },
          textColor: themeColors.text,
        },
        grid: {
          vertLines: { color: themeColors.grid },
          horzLines: { color: themeColors.grid },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
        },
        leftPriceScale: {
          visible: true,
          borderColor: themeColors.grid,
        },
        rightPriceScale: {
          visible: isSecurity || lineConfigs.length > 0,
          borderColor: themeColors.grid,
        },
        timeScale: {
          borderColor: themeColors.grid,
          timeVisible: true,
          secondsVisible: true,
        },
      });

      chartRef.current = chart;

      // Add Primary Series based on chartMode (Area, Line, or Bar/Histogram)
      let primarySeries: ISeriesApi<any>;
      if (chartMode === "area") {
        primarySeries = chart.addSeries(AreaSeries, {
          lineColor: themeColors.barColor,
          topColor: isSecurity
            ? "rgba(239, 68, 68, 0.4)"
            : "rgba(16, 185, 129, 0.35)",
          bottomColor: "rgba(16, 185, 129, 0.02)",
          priceScaleId: "left",
          title: primaryBarTitle,
          lineWidth: 2,
        });
      } else if (chartMode === "line") {
        primarySeries = chart.addSeries(LineSeries, {
          color: themeColors.barColor,
          priceScaleId: "left",
          title: primaryBarTitle,
          lineWidth: 3,
        });
      } else {
        primarySeries = chart.addSeries(HistogramSeries, {
          color: themeColors.barColor,
          priceScaleId: "left",
          title: primaryBarTitle,
        });
      }
      primarySeriesRef.current = primarySeries;

      // Populate existing stored bars if chart is recreated
      if (lastBarsRef.current.length > 0) {
        primarySeries.setData(lastBarsRef.current);
      }

      // Add Domain-Specific Line Series:
      if (isSecurity) {
        const riskSeries = chart.addSeries(LineSeries, {
          color: themeColors.lineColor,
          lineWidth: 2,
          priceScaleId: "right",
          title: "Índice de Riesgo CVSS",
        });
        lineSeriesMapRef.current.set("riskIndex", riskSeries);
        if (lastLinesRef.current["riskIndex"]) {
          riskSeries.setData(lastLinesRef.current["riskIndex"]);
        }
      } else if (lineConfigs.length > 0) {
        lineConfigs.forEach((cfg) => {
          const series = chart.addSeries(LineSeries, {
            color: cfg.color || "#3b82f6",
            lineWidth: cfg.lineWidth || 2,
            priceScaleId: cfg.priceScaleId || "right",
            title: cfg.name,
          });
          lineSeriesMapRef.current.set(cfg.id, series);
          if (lastLinesRef.current[cfg.id]) {
            series.setData(lastLinesRef.current[cfg.id]);
          }
        });
      }

      if (lastBarsRef.current.length > 0) {
        chart.timeScale().fitContent();
      }

      // Add Crosshair movement listener to display interactive node label tooltip
      chart.subscribeCrosshairMove((param) => {
        if (!param.time || !param.seriesData || param.seriesData.size === 0) {
          setHoverInfo(null);
          return;
        }
        const data = param.seriesData.get(primarySeries) as
          | TelemetryBarPoint
          | undefined;
        if (data) {
          setHoverInfo({
            label: data.label || "Nodo",
            value: data.value,
            color: data.color || (isSecurity ? "#ef4444" : "#10b981"),
            nodeId: data.nodeId,
          });
        } else {
          setHoverInfo(null);
        }
      });

      // Hide TradingView Watermark / Logo Links completely via DOM cleanup
      const hideLogo = () => {
        if (!containerRef.current) return;
        const logoLinks = containerRef.current.querySelectorAll("a");
        logoLinks.forEach((link) => {
          link.style.setProperty("display", "none", "important");
          link.style.setProperty("visibility", "hidden", "important");
          link.style.setProperty("opacity", "0", "important");
          link.style.setProperty("pointer-events", "none", "important");
        });
      };

      hideLogo();
      const logoInterval = setInterval(hideLogo, 100);

      // Responsive ResizeObserver
      const resizeObserver = new ResizeObserver((entries) => {
        if (!entries || entries.length === 0) return;
        const { width, height: containerH } = entries[0].contentRect;
        if (width > 0 && chartRef.current) {
          chartRef.current.applyOptions({
            width,
            height: typeof height === "number" ? height : containerH || 350,
          });
          hideLogo();
        }
      });

      resizeObserver.observe(containerRef.current);

      return () => {
        clearInterval(logoInterval);
        resizeObserver.disconnect();
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
          primarySeriesRef.current = null;
          lineSeriesMapRef.current.clear();
        }
      };
    }, [
      height,
      domain,
      primaryBarTitle,
      isSecurity,
      lineConfigs,
      themeColors,
      chartMode,
    ]);

    return (
      <div className="w-full flex flex-col rounded-xl border border-slate-800 bg-[#0b0f19] p-4 shadow-xl text-slate-200 relative overflow-hidden">
        {/* CSS Rule to hide any residual TradingView logo elements */}
        <style>{`
          div[ref] a,
          a[href*="tradingview"],
          .tv-lightweight-charts-watermark,
          #tv-attr-logo {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
        `}</style>

        {/* Header Badge & Controls */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`h-2.5 w-2.5 rounded-full animate-pulse ${
                isSecurity ? "bg-red-500" : "bg-emerald-500"
              }`}
            />
            <h3 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
              {title}
            </h3>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
            {/* Chart Type Selector */}
            <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-[10px] font-semibold">
              <button
                type="button"
                onClick={() => setChartMode("line")}
                className={`px-2 py-0.5 rounded transition-all ${
                  chartMode === "line"
                    ? isSecurity
                      ? "bg-red-500/20 text-red-400 font-bold border border-red-500/40"
                      : "bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Línea
              </button>
              <button
                type="button"
                onClick={() => setChartMode("area")}
                className={`px-2 py-0.5 rounded transition-all ${
                  chartMode === "area"
                    ? isSecurity
                      ? "bg-red-500/20 text-red-400 font-bold border border-red-500/40"
                      : "bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Área
              </button>
              <button
                type="button"
                onClick={() => setChartMode("bar")}
                className={`px-2 py-0.5 rounded transition-all ${
                  chartMode === "bar"
                    ? isSecurity
                      ? "bg-red-500/20 text-red-400 font-bold border border-red-500/40"
                      : "bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Barras
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
            <span className="flex items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 rounded inline-block ${
                  isSecurity ? "bg-red-500" : "bg-emerald-500"
                }`}
              />{" "}
              {primaryBarTitle}
            </span>
            {isSecurity && (
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-amber-500 inline-block" />{" "}
                Índice de Riesgo
              </span>
            )}
          </div>
        </div>

        {/* Floating Tooltip for Hovered Node */}
        {hoverInfo && (
          <div className="absolute top-12 left-6 z-20 bg-slate-900/95 border border-slate-700/80 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-2xl text-xs flex items-center gap-2 font-mono pointer-events-none">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: hoverInfo.color || "#10b981" }}
            />
            <span className="font-bold text-slate-100">{hoverInfo.label}</span>
            {hoverInfo.nodeId && (
              <span className="text-[10px] text-slate-400 font-normal">
                ({hoverInfo.nodeId})
              </span>
            )}
            <span
              className={`font-bold ml-1 font-mono ${isSecurity ? "text-red-400" : "text-emerald-400"}`}
            >
              {hoverInfo.value} {isSecurity ? "alertas" : "ms"}
            </span>
          </div>
        )}

        {/* Chart Canvas Mount Container */}
        <div
          ref={containerRef}
          className="w-full rounded-lg overflow-hidden relative"
          style={{
            height: typeof height === "number" ? `${height}px` : height,
          }}
        />

        {/* Node Identification Badges Legend */}
        {nodeBadges.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-2">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Identificación de Nodos del Flujo:
            </div>
            <div className="max-h-24 overflow-y-auto custom-scrollbar flex flex-wrap items-center gap-2 pr-1">
              {nodeBadges.map((badge, i) => (
                <div
                  key={badge.nodeId || badge.label || i}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800/90 flex items-center gap-1.5 text-xs font-mono shadow-sm hover:border-slate-700 transition-colors shrink-0"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: badge.color || "#10b981" }}
                  />
                  <span className="font-semibold text-slate-200">
                    {badge.label}
                  </span>
                  <span className="text-slate-400 font-bold text-[11px] ml-0.5">
                    {badge.value}ms
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  },
);

RealTimeTelemetryChart.displayName = "RealTimeTelemetryChart";
