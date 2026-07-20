import type { UTCTimestamp, CandlestickData, LineData } from 'lightweight-charts';

/**
 * Custom Candlestick Data Point for aggregated execution batches (ms latency)
 */
export interface TelemetryCandlestickPoint extends CandlestickData<UTCTimestamp> {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
}

/**
 * Custom Line Data Point for continuous metrics (e.g. Risk Index, CPU load)
 */
export interface TelemetryLinePoint extends LineData<UTCTimestamp> {
  time: UTCTimestamp;
  value: number;
}

/**
 * Incoming Raw Telemetry Payload (e.g. from WebSocket or MetricsCollector)
 */
export interface RawTelemetryBatch {
  timestampMs?: number; // Epoch time in ms
  timestampSec?: number; // Epoch time in seconds
  // Candlestick execution metrics
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  // Line metrics
  riskIndex?: number;
  cpuUsage?: number;
  memoryUsage?: number;
}

/**
 * Configuration for extra Line Series dynamically added to the chart
 */
export interface LineSeriesConfig {
  id: string;
  name: string;
  color: string;
  priceScaleId?: 'left' | 'right';
  lineWidth?: number;
}

/**
 * Imperative Ref Handle exposed by RealTimeTelemetryChart
 */
export interface RealTimeTelemetryChartRef {
  /** Direct 60fps update for Candlestick execution batch */
  updateCandlestick: (point: TelemetryCandlestickPoint) => void;
  /** Direct 60fps update for a specific line metric (e.g. risk index) */
  updateLineMetric: (seriesId: string, point: TelemetryLinePoint) => void;
  /** Bulk set data for historical view initialization */
  setHistoricalData: (
    candlesticks: TelemetryCandlestickPoint[],
    lines?: Record<string, TelemetryLinePoint[]>
  ) => void;
  /** Reset chart series data */
  clear: () => void;
  /** Force refit content */
  fitContent: () => void;
}

/**
 * Helper to convert Epoch Milliseconds into lightweight-charts UTCTimestamp (seconds)
 */
export const toUTCTimestamp = (timeInMs: number): UTCTimestamp => {
  return Math.floor(timeInMs / 1000) as UTCTimestamp;
};

/**
 * Helper to normalize raw WebSocket payloads into valid Telemetry points
 */
export class TelemetryDataNormalizer {
  private lastTimestamp: UTCTimestamp = 0 as UTCTimestamp;

  /**
   * Guarantees strictly ascending UTCTimestamp required by lightweight-charts.
   * If a point arrives within the same second, returns null or micro-increments timestamp.
   */
  public ensureAscendingTimestamp(timeInMsOrSec: number): UTCTimestamp {
    let timestamp = (
      timeInMsOrSec > 1e11 ? Math.floor(timeInMsOrSec / 1000) : Math.floor(timeInMsOrSec)
    ) as UTCTimestamp;

    if (timestamp <= this.lastTimestamp) {
      timestamp = (this.lastTimestamp + 1) as UTCTimestamp;
    }

    this.lastTimestamp = timestamp;
    return timestamp;
  }

  public reset(): void {
    this.lastTimestamp = 0 as UTCTimestamp;
  }
}
