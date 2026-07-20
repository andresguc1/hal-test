import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback
} from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  LineSeries
} from 'lightweight-charts';
import type {
  RealTimeTelemetryChartRef,
  TelemetryCandlestickPoint,
  TelemetryLinePoint,
  LineSeriesConfig
} from './telemetryTypes';

export interface RealTimeTelemetryChartProps {
  /** Optional custom CSS height (default: 350px) */
  height?: number | string;
  /** Title header for the telemetry panel */
  title?: string;
  /** Custom extra line series configurations (e.g. Risk Index, CPU) */
  lineConfigs?: LineSeriesConfig[];
  /** Dark mode toggle (default: true) */
  darkMode?: boolean;
}

export const RealTimeTelemetryChart = forwardRef<
  RealTimeTelemetryChartRef,
  RealTimeTelemetryChartProps
>(({ height = 350, title = 'Real-Time Telemetry Observatory', lineConfigs = [], darkMode = true }, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineSeriesMapRef = useRef<Map<string, ISeriesApi<'Line'>>>(new Map());

  // Background and Grid Theme Colors
  const themeColors = darkMode
    ? {
        bg: '#0b0f19',
        text: '#94a3b8',
        grid: '#1e293b',
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#34d399',
        wickDownColor: '#f87171'
      }
    : {
        bg: '#ffffff',
        text: '#475569',
        grid: '#f1f5f9',
        upColor: '#059669',
        downColor: '#dc2626',
        borderUpColor: '#059669',
        borderDownColor: '#dc2626',
        wickUpColor: '#059669',
        wickDownColor: '#dc2626'
      };

  // 1. Imperative Ref Handles (No React Re-renders -> 60fps direct Canvas updates)
  const updateCandlestick = useCallback((point: TelemetryCandlestickPoint) => {
    if (candlestickSeriesRef.current) {
      try {
        candlestickSeriesRef.current.update(point);
      } catch (err) {
        console.warn('[RealTimeTelemetryChart] Candlestick update error:', err);
      }
    }
  }, []);

  const updateLineMetric = useCallback((seriesId: string, point: TelemetryLinePoint) => {
    const lineSeries = lineSeriesMapRef.current.get(seriesId);
    if (lineSeries) {
      try {
        lineSeries.update(point);
      } catch (err) {
        console.warn(`[RealTimeTelemetryChart] Line series "${seriesId}" update error:`, err);
      }
    }
  }, []);

  const setHistoricalData = useCallback(
    (candlesticks: TelemetryCandlestickPoint[], lines?: Record<string, TelemetryLinePoint[]>) => {
      if (candlestickSeriesRef.current && candlesticks.length > 0) {
        candlestickSeriesRef.current.setData(candlesticks);
      }
      if (lines) {
        Object.entries(lines).forEach(([seriesId, points]) => {
          const lineSeries = lineSeriesMapRef.current.get(seriesId);
          if (lineSeries && points.length > 0) {
            lineSeries.setData(points);
          }
        });
      }
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    },
    []
  );

  const clear = useCallback(() => {
    if (candlestickSeriesRef.current) {
      candlestickSeriesRef.current.setData([]);
    }
    lineSeriesMapRef.current.forEach((series) => series.setData([]));
  }, []);

  const fitContent = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, []);

  // Expose handles to parent components
  useImperativeHandle(
    ref,
    () => ({
      updateCandlestick,
      updateLineMetric,
      setHistoricalData,
      clear,
      fitContent
    }),
    [updateCandlestick, updateLineMetric, setHistoricalData, clear, fitContent]
  );

  // 2. Chart Initialization & Lifecycle Management
  useEffect(() => {
    if (!containerRef.current) return;

    // Create TradingView Chart Instance
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: typeof height === 'number' ? height : containerRef.current.clientHeight || 350,
      layout: {
        background: { type: ColorType.Solid, color: themeColors.bg },
        textColor: themeColors.text
      },
      grid: {
        vertLines: { color: themeColors.grid },
        horzLines: { color: themeColors.grid }
      },
      crosshair: {
        mode: CrosshairMode.Normal
      },
      leftPriceScale: {
        visible: true,
        borderColor: themeColors.grid
      },
      rightPriceScale: {
        visible: true,
        borderColor: themeColors.grid
      },
      timeScale: {
        borderColor: themeColors.grid,
        timeVisible: true,
        secondsVisible: true
      }
    });

    chartRef.current = chart;

    // Add Primary Candlestick Series (Execution Latency ms on Left Scale)
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: themeColors.upColor,
      downColor: themeColors.downColor,
      borderUpColor: themeColors.borderUpColor,
      borderDownColor: themeColors.borderDownColor,
      wickUpColor: themeColors.wickUpColor,
      wickDownColor: themeColors.wickDownColor,
      priceScaleId: 'left',
      title: 'Batch Latency (ms)'
    });
    candlestickSeriesRef.current = candlestickSeries;

    // Add Default Line Series for Security Risk Index (Right Scale 0-100)
    const defaultRiskSeries = chart.addSeries(LineSeries, {
      color: '#3b82f6',
      lineWidth: 2,
      priceScaleId: 'right',
      title: 'Security Risk Score'
    });
    lineSeriesMapRef.current.set('riskIndex', defaultRiskSeries);

    // Add Additional Custom Line Series if provided
    lineConfigs.forEach((cfg) => {
      if (cfg.id === 'riskIndex') return; // Skip default
      const series = chart.addSeries(LineSeries, {
        color: cfg.color || '#f59e0b',
        lineWidth: cfg.lineWidth || 2,
        priceScaleId: cfg.priceScaleId || 'right',
        title: cfg.name
      });
      lineSeriesMapRef.current.set(cfg.id, series);
    });

    // 3. Responsive ResizeObserver (Adapts to parent container width/height smoothly)
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height: containerH } = entries[0].contentRect;
      if (width > 0 && chartRef.current) {
        chartRef.current.applyOptions({
          width,
          height: typeof height === 'number' ? height : containerH || 350
        });
      }
    });

    resizeObserver.observe(containerRef.current);

    // 4. Strict Cleanup: Destroy Canvas instance on unmount to prevent WebGL/Memory leaks
    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candlestickSeriesRef.current = null;
        lineSeriesMapRef.current.clear();
      }
    };
  }, [height, darkMode, lineConfigs]);

  return (
    <div className="w-full flex flex-col rounded-xl border border-slate-800 bg-[#0b0f19] p-4 shadow-xl text-slate-200">
      {/* Header telemetry badge */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">{title}</h3>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded bg-emerald-500 inline-block" /> Latency (OHLC ms)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded bg-blue-500 inline-block" /> Risk Index
          </span>
        </div>
      </div>

      {/* Lightweight-charts Canvas Mount Target */}
      <div
        ref={containerRef}
        className="w-full rounded-lg overflow-hidden relative"
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      />
    </div>
  );
});

RealTimeTelemetryChart.displayName = 'RealTimeTelemetryChart';
