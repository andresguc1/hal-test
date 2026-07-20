# Guía de Integración: Telemetría en Tiempo Real con WebSockets y Lightweight Charts

Esta guía documenta la integración de `RealTimeTelemetryChart` con los eventos de WebSocket (`execution-status`, `security-alert`, `metrics-batch`) en HalTest.

---

## 🚀 Ejemplos de Uso en Componentes (React)

```tsx
import React, { useRef, useEffect } from "react";
import { RealTimeTelemetryChart } from "./telemetry/RealTimeTelemetryChart";
import type { RealTimeTelemetryChartRef } from "./telemetry/telemetryTypes";
import { TelemetryDataNormalizer } from "./telemetry/telemetryTypes";
import { useHaltestSocket } from "../hooks/useHaltestSocket";

export const TelemetryObservatory: React.FC = () => {
  const chartRef = useRef<RealTimeTelemetryChartRef | null>(null);
  const normalizerRef = useRef(new TelemetryDataNormalizer());
  const { socket } = useHaltestSocket();

  useEffect(() => {
    if (!socket) return;

    // 1. Manejo de ráfagas de latencia de ejecución (Candlestick: OHLC)
    const handleExecutionBatch = (batch: {
      timestamp: number;
      open: number;
      high: number;
      low: number;
      close: number;
    }) => {
      if (!chartRef.current) return;

      const time = normalizerRef.current.ensureAscendingTimestamp(
        batch.timestamp,
      );

      // Actualización directa del Canvas (0 re-renders de React, 60fps)
      chartRef.current.updateCandlestick({
        time,
        open: batch.open,
        high: batch.high,
        low: batch.low,
        close: batch.close,
      });
    };

    // 2. Manejo de métrica continua (ej. Índice de Riesgo de Seguridad o Carga CPU)
    const handleSecurityAlert = (alert: {
      timestamp?: number;
      cvssScore?: number;
    }) => {
      if (!chartRef.current) return;

      const time = normalizerRef.current.ensureAscendingTimestamp(
        alert.timestamp || Date.now(),
      );
      const riskValue = alert.cvssScore ? alert.cvssScore * 10 : 25;

      chartRef.current.updateLineMetric("riskIndex", {
        time,
        value: riskValue,
      });
    };

    socket.on("hal:execution-batch", handleExecutionBatch);
    socket.on("hal:security-alert", handleSecurityAlert);

    return () => {
      socket.off("hal:execution-batch", handleExecutionBatch);
      socket.off("hal:security-alert", handleSecurityAlert);
    };
  }, [socket]);

  return (
    <div className="p-6">
      <RealTimeTelemetryChart
        ref={chartRef}
        height={400}
        title="HalTest Telemetry Observatory"
      />
    </div>
  );
};
```

---

## ⚡ Garantías de Rendimiento a 60 FPS

1. **Sin Re-renders React**: El componente no utiliza estado interno (`useState`) para los puntos de datos. Todas las inserciones se realizan directamente a través de `chartRef.current.updateCandlestick(...)` y `chartRef.current.updateLineMetric(...)`.
2. **Normalización de Timestamps**: `TelemetryDataNormalizer` asegura la secuencia cronológica ascendente estricta (`UTCTimestamp`) que evita colisiones o excepciones en la librería.
3. **Limpieza Automática**: El desmontaje destruye limpiamente el canvas llamando a `chart.remove()`, protegiendo la GPU y la memoria de fugas de contexto WebGL.
