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
  HistogramSeries,
  LineSeries
} from 'lightweight-charts';
import type {
  RealTimeTelemetryChartRef,
  TelemetryBarPoint,
  TelemetryLinePoint,
  LineSeriesConfig
} from './telemetryTypes';

export interface RealTimeTelemetryChartProps {
  /** Optional custom CSS height (default: 350px) */
  height?: number | string;
  /** Title header for the telemetry panel */
  title?: string;
  /** Domain context: 'performance' | 'security' (controls secondary metrics & legends) */
  domain?: 'performance' | 'security';
  /** Label for the primary bar series (e.g. "Latencia (ms)" or "Alertas") */
  barTitle?: string;
  /** Custom extra line series configurations */
  lineConfigs?: LineSeriesConfig[];
  /** Dark mode toggle (default: true) */
  darkMode?: boolean;
}

export const RealTimeTelemetryChart = forwardRef<
  RealTimeTelemetryChartRef,
  RealTimeTelemetryChartProps
>(
  (
    {
      height = 350,
      title = 'Telemetría de Ejecución en Tiempo Real',
      domain = 'performance',
      barTitle,
      lineConfigs = [],
      darkMode = true
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const barSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    const lineSeriesMapRef = useRef<Map<string, ISeriesApi<'Line'>>>(new Map());

    const isSecurity = domain === 'security';
    const primaryBarTitle = barTitle || (isSecurity ? 'Alertas Detectadas' : 'Latencia (ms)');

    // Theme Palette
    const themeColors = darkMode
      ? {
          bg: '#0b0f19',
          text: '#94a3b8',
          grid: '#1e293b',
          barColor: isSecurity ? '#ef4444' : '#10b981',
          lineColor: isSecurity ? '#f59e0b' : '#3b82f6'
        }
      : {
          bg: '#ffffff',
          text: '#475569',
          grid: '#f1f5f9',
          barColor: isSecurity ? '#dc2626' : '#059669',
          lineColor: isSecurity ? '#d97706' : '#2563eb'
        };

    // 1. Imperative Ref Handlers for 60FPS Direct Canvas Updates
    const updateBar = useCallback((point: TelemetryBarPoint) => {
      if (barSeriesRef.current) {
        try {
          barSeriesRef.current.update(point);
        } catch (err) {
          console.warn('[RealTimeTelemetryChart] Bar update error:', err);
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
      (bars: TelemetryBarPoint[], lines?: Record<string, TelemetryLinePoint[]>) => {
        if (barSeriesRef.current && bars.length > 0) {
          barSeriesRef.current.setData(bars);
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
      if (barSeriesRef.current) {
        barSeriesRef.current.setData([]);
      }
      lineSeriesMapRef.current.forEach((series) => series.setData([]));
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
        fitContent
      }),
      [updateBar, updateLineMetric, setHistoricalData, clear, fitContent]
    );

    // 2. Chart Initialization and Canvas Setup
    useEffect(() => {
      if (!containerRef.current) return;

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
          visible: isSecurity || lineConfigs.length > 0,
          borderColor: themeColors.grid
        },
        timeScale: {
          borderColor: themeColors.grid,
          timeVisible: true,
          secondsVisible: true
        }
      });

      chartRef.current = chart;

      // Add Primary Histogram Bar Series (Latency or Security Alert Count)
      const barSeries = chart.addSeries(HistogramSeries, {
        color: themeColors.barColor,
        priceScaleId: 'left',
        title: primaryBarTitle
      });
      barSeriesRef.current = barSeries;

      // Add Domain-Specific Line Series:
      // SECURITY -> "Security Risk Score" on Right Scale
      if (isSecurity) {
        const riskSeries = chart.addSeries(LineSeries, {
          color: themeColors.lineColor,
          lineWidth: 2,
          priceScaleId: 'right',
          title: 'Índice de Riesgo CVSS'
        });
        lineSeriesMapRef.current.set('riskIndex', riskSeries);
      } else if (lineConfigs.length > 0) {
        // PERFORMANCE -> Custom line metrics (e.g. Throughput or VUs) if configured
        lineConfigs.forEach((cfg) => {
          const series = chart.addSeries(LineSeries, {
            color: cfg.color || '#3b82f6',
            lineWidth: cfg.lineWidth || 2,
            priceScaleId: cfg.priceScaleId || 'right',
            title: cfg.name
          });
          lineSeriesMapRef.current.set(cfg.id, series);
        });
      }

      // Hide TradingView Watermark / Logo Links completely via DOM cleanup
      const hideLogo = () => {
        if (!containerRef.current) return;
        const logoLinks = containerRef.current.querySelectorAll('a');
        logoLinks.forEach((link) => {
          link.style.setProperty('display', 'none', 'important');
          link.style.setProperty('visibility', 'hidden', 'important');
          link.style.setProperty('opacity', '0', 'important');
          link.style.setProperty('pointer-events', 'none', 'important');
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
            height: typeof height === 'number' ? height : containerH || 350
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
          barSeriesRef.current = null;
          lineSeriesMapRef.current.clear();
        }
      };
    }, [height, darkMode, domain, primaryBarTitle, isSecurity, lineConfigs, themeColors.barColor, themeColors.bg, themeColors.grid, themeColors.lineColor, themeColors.text]);

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

        {/* Header Badge */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`h-2.5 w-2.5 rounded-full animate-pulse ${
                isSecurity ? 'bg-red-500' : 'bg-emerald-500'
              }`}
            />
            <h3 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
              {title}
            </h3>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
            <span className="flex items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 rounded inline-block ${
                  isSecurity ? 'bg-red-500' : 'bg-emerald-500'
                }`}
              />{' '}
              {primaryBarTitle}
            </span>
            {isSecurity && (
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-amber-500 inline-block" /> Índice de Riesgo
              </span>
            )}
          </div>
        </div>

        {/* Chart Canvas Mount Container */}
        <div
          ref={containerRef}
          className="w-full rounded-lg overflow-hidden relative"
          style={{ height: typeof height === 'number' ? `${height}px` : height }}
        />
      </div>
    );
  }
);

RealTimeTelemetryChart.displayName = 'RealTimeTelemetryChart';
