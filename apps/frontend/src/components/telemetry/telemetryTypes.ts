import type { UTCTimestamp, HistogramData, LineData } from 'lightweight-charts';

/**
 * Custom Histogram Bar Data Point for execution latency or batch counts (ms or count)
 */
export interface TelemetryBarPoint extends HistogramData<UTCTimestamp> {
  time: UTCTimestamp;
  value: number;
  color?: string;
  label?: string;
  nodeId?: string;
}

/**
 * Custom Line Data Point for continuous metrics (e.g. Risk Index, Throughput, CPU load)
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
  value?: number;
  throughput?: number;
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
  /** Direct 60fps update for Bar/Histogram execution point */
  updateBar: (point: TelemetryBarPoint) => void;
  /** Direct 60fps update for a specific line metric */
  updateLineMetric: (seriesId: string, point: TelemetryLinePoint) => void;
  /** Bulk set data for historical view initialization */
  setHistoricalData: (
    bars: TelemetryBarPoint[],
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
   * If a point arrives within the same second, returns micro-incremented timestamp.
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

export const PROFILE_LABELS: Record<string, string> = {
  // ── 5 standard profiles ─────────────────────────────────────────────
  ramp:     '📈 Ramp-Up (Incremento Gradual)',
  constant: '📊 Constant Load (Carga Constante)',
  stress:   '⚡ Stress Test (Prueba de Estrés)',
  spike:    '⚡ Spike Test (Prueba de Pico)',
  soak:     '⏱ Soak / Endurance (Resistencia)',
  // ── Advanced ────────────────────────────────────────────────────────
  baseline: '🔵 Baseline (1 VU)',
  custom:   '🛠 Personalizado (Stages)',
  // ── Legacy / compatibility ───────────────────────────────────────────
  load:      '📈 Ramp-Up (Incremento Gradual)',
  endurance: '⏱ Soak / Endurance (Resistencia)',
  capacity:  '📈 Capacity (Capacidad Máxima)',
  profiling: '🔍 Diagnóstico (1 VU)',
};

export const PROFILE_COLORS: Record<string, string> = {
  // ── 5 standard profiles (matches ScenarioBuilder colors) ────────────
  ramp:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  constant: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  stress:   'bg-orange-500/10 text-orange-400 border-orange-500/30',
  spike:    'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  soak:     'bg-purple-500/10 text-purple-400 border-purple-500/30',
  // ── Advanced ────────────────────────────────────────────────────────
  baseline: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  custom:   'bg-slate-500/10 text-slate-300 border-slate-500/30',
  // ── Legacy / compatibility ───────────────────────────────────────────
  load:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  endurance: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  capacity:  'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  profiling: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
};

export const getProfileInfo = (rawProfile?: string) => {
  const key = String(rawProfile || 'constant').toLowerCase();
  const label = PROFILE_LABELS[key] ?? PROFILE_LABELS.constant;
  const color = PROFILE_COLORS[key] ?? PROFILE_COLORS.constant;
  return { key, label, color };
};

