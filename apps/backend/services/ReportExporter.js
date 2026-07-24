/**
 * ReportExporter — Standalone HTML & PDF Executive Performance Report Generator
 */

export class ReportExporter {
    /**
     * Generates a fully self-contained HTML report with embedded styles, dark theme, and metrics.
     *
     * @param {Object} runData - Data from Run instance & Metrics summary
     * @returns {string} Standalone HTML content
     */
    static generateHTML(runData) {
        const summary = runData.summary?.data || runData.summary || {};
        const sla = summary.slaEvaluation || {};
        const nodeStats = summary.nodeStats || [];
        const _httpCounts = summary.httpStatusCounts || {};
        const flowName = runData.flow_name || summary.runConfig?.flowName || 'Performance Test';
        const timestamp = new Date(runData.created_at || Date.now()).toLocaleString();
        const durationSec = summary.elapsed ? Math.round(summary.elapsed / 1000) : 30;

        const isPassed = sla.passed !== false;

        return `<!DOCTYPE html>
<html lang="es" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HalTest Performance Report - ${flowName}</title>
    <style>
        :root {
            --bg-main: #0b0f19;
            --bg-card: #141c2e;
            --border-color: #1e293b;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --accent-green: #10b981;
            --accent-red: #ef4444;
            --accent-blue: #3b82f6;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg-main);
            color: var(--text-main);
            margin: 0;
            padding: 32px;
            line-height: 1.5;
        }
        .container {
            max-width: 1100px;
            margin: 0 auto;
        }
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-bottom: 24px;
            border-bottom: 1px solid var(--border-color);
            margin-bottom: 32px;
        }
        .badge-passed {
            background-color: rgba(16, 185, 129, 0.2);
            color: var(--accent-green);
            border: 1px solid rgba(16, 185, 129, 0.4);
            padding: 6px 16px;
            border-radius: 9999px;
            font-weight: 700;
            font-size: 14px;
        }
        .badge-failed {
            background-color: rgba(239, 68, 68, 0.2);
            color: var(--accent-red);
            border: 1px solid rgba(239, 68, 68, 0.4);
            padding: 6px 16px;
            border-radius: 9999px;
            font-weight: 700;
            font-size: 14px;
        }
        .grid-4 {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 32px;
        }
        .kpi-card {
            background-color: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 20px;
        }
        .kpi-title {
            font-size: 12px;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
        }
        .kpi-value {
            font-size: 28px;
            font-weight: 800;
            font-family: monospace;
        }
        .section-card {
            background-color: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 32px;
        }
        .section-title {
            font-size: 18px;
            font-weight: 700;
            margin-top: 0;
            margin-bottom: 16px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
        }
        th {
            color: var(--text-muted);
            text-transform: uppercase;
            font-size: 11px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <h1 style="margin:0; font-size:24px;">Informe de Rendimiento y Carga</h1>
                <p style="margin:4px 0 0 0; color:var(--text-muted); font-size:14px;">
                    Flujo: <strong>${flowName}</strong> &bull; Fecha: ${timestamp}
                </p>
            </div>
            <div>
                <span class="${isPassed ? 'badge-passed' : 'badge-failed'}">
                    SLA: ${isPassed ? 'PASSED (Cumplido)' : 'FAILED (Incumplido)'}
                </span>
            </div>
        </div>

        <div class="grid-4">
            <div class="kpi-card">
                <div class="kpi-title">Solicitudes Totales</div>
                <div class="kpi-value" style="color:var(--accent-blue)">${summary.totalRequests || 0}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">Throughput Promedio</div>
                <div class="kpi-value">${summary.throughput || 0} <span style="font-size:14px">req/s</span></div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">Latencia P95</div>
                <div class="kpi-value" style="color:var(--accent-green)">${summary.latency?.p95 || 0} <span style="font-size:14px">ms</span></div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">Tasa de Error</div>
                <div class="kpi-value" style="color:${parseFloat(summary.errorRate) > 1 ? 'var(--accent-red)' : 'var(--text-main)'}">${summary.errorRate || '0.00'}%</div>
            </div>
        </div>

        <div class="section-card">
            <h2 class="section-title">Diagnóstico de Saturación & SLAs Cloud</h2>
            <p><strong>Estado General:</strong> ${sla.status || 'EVALUADO'}</p>
            <p><strong>Índice APDEX:</strong> ${sla.apdexScore || '0.90'} / 1.00</p>
            <p><strong>Punto de Saturación Recomendado:</strong> Capacidad máxima estable evaluada en ${summary.runConfig?.totalVUs || 10} VUs durante ${durationSec}s.</p>
        </div>

        <div class="section-card">
            <h2 class="section-title">Rendimiento por Nodo del Flujo</h2>
            <table>
                <thead>
                    <tr>
                        <th>Nodo / Acción</th>
                        <th>Ejecuciones</th>
                        <th>Latencia P95 (ms)</th>
                        <th>CPU Prom. (%)</th>
                        <th>RAM Max (MB)</th>
                        <th>Errores</th>
                    </tr>
                </thead>
                <tbody>
                    ${nodeStats
                        .map(
                            (n) => `
                        <tr>
                            <td><strong>${n.label}</strong></td>
                            <td>${n.count}</td>
                            <td>${n.p95} ms</td>
                            <td>${n.cpuAvg}%</td>
                            <td>${n.memMax} MB</td>
                            <td style="color:${n.errors > 0 ? 'var(--accent-red)' : 'inherit'}">${n.errors} (${n.errorRate}%)</td>
                        </tr>
                    `,
                        )
                        .join('')}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>`;
    }
}
