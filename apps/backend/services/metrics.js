// services/metrics.js
// Prometheus-compatible metrics collector

const metrics = {
    // Counters
    httpRequestsTotal: new Map(),
    httpRequestDurationMs: [],
    activeConnections: 0,
    browserSessionsActive: 0,
    flowExecutionsTotal: new Map(),
    flowExecutionDurationMs: [],
    flowExecutionErrors: new Map(),
    databaseQueriesTotal: 0,
    databaseQueryDurationMs: [],
    cacheHits: 0,
    cacheMisses: 0,
    errorsTotal: new Map(),

    // Gauges
    memoryUsage: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0,
    },

    // Histograms (stored as arrays for simplicity, in production use proper histogram)
    httpRequestDurations: [],
    flowExecutionDurations: [],
    dbQueryDurations: [],
};

const MAX_HISTOGRAM_SAMPLES = 1000;

function recordHttpRequest(method, path, statusCode, durationMs) {
    const key = `${method}:${path}:${statusCode}`;
    const count = metrics.httpRequestsTotal.get(key) || 0;
    metrics.httpRequestsTotal.set(key, count + 1);

    metrics.httpRequestDurations.push(durationMs);
    if (metrics.httpRequestDurations.length > MAX_HISTOGRAM_SAMPLES) {
        metrics.httpRequestDurations.shift();
    }
}

function recordFlowExecution(flowId, status, durationMs) {
    const key = `${flowId}:${status}`;
    const count = metrics.flowExecutionsTotal.get(key) || 0;
    metrics.flowExecutionsTotal.set(key, count + 1);

    metrics.flowExecutionDurations.push(durationMs);
    if (metrics.flowExecutionDurations.length > MAX_HISTOGRAM_SAMPLES) {
        metrics.flowExecutionDurations.shift();
    }
}

function recordDbQuery(durationMs) {
    metrics.databaseQueriesTotal++;
    metrics.dbQueryDurations.push(durationMs);
    if (metrics.dbQueryDurations.length > MAX_HISTOGRAM_SAMPLES) {
        metrics.dbQueryDurations.shift();
    }
}

function recordError(type, message) {
    const key = `${type}:${message.substring(0, 100)}`;
    const count = metrics.errorsTotal.get(key) || 0;
    metrics.errorsTotal.set(key, count + 1);
}

function updateMemoryUsage() {
    const mem = process.memoryUsage();
    metrics.memoryUsage = {
        heapUsed: mem.heapUsed,
        heapTotal: mem.heapTotal,
        external: mem.external,
        rss: mem.rss,
    };
}

function getPercentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
}

function formatPrometheus() {
    updateMemoryUsage();

    const lines = [];

    // HTTP Requests Total
    lines.push('# HELP http_requests_total Total number of HTTP requests');
    lines.push('# TYPE http_requests_total counter');
    for (const [key, value] of metrics.httpRequestsTotal) {
        const [method, path, status] = key.split(':');
        lines.push(
            `http_requests_total{method="${method}",path="${path}",status="${status}"} ${value}`,
        );
    }

    // HTTP Request Duration
    if (metrics.httpRequestDurations.length > 0) {
        lines.push('# HELP http_request_duration_ms HTTP request duration in milliseconds');
        lines.push('# TYPE http_request_duration_ms summary');
        lines.push(
            `http_request_duration_ms_sum ${metrics.httpRequestDurations.reduce((a, b) => a + b, 0)}`,
        );
        lines.push(`http_request_duration_ms_count ${metrics.httpRequestDurations.length}`);
        lines.push(
            `http_request_duration_ms{quantile="0.5"} ${getPercentile(metrics.httpRequestDurations, 50)}`,
        );
        lines.push(
            `http_request_duration_ms{quantile="0.9"} ${getPercentile(metrics.httpRequestDurations, 90)}`,
        );
        lines.push(
            `http_request_duration_ms{quantile="0.99"} ${getPercentile(metrics.httpRequestDurations, 99)}`,
        );
    }

    // Flow Executions
    lines.push('# HELP flow_executions_total Total number of flow executions');
    lines.push('# TYPE flow_executions_total counter');
    for (const [key, value] of metrics.flowExecutionsTotal) {
        const [flowId, status] = key.split(':');
        lines.push(`flow_executions_total{flow_id="${flowId}",status="${status}"} ${value}`);
    }

    // Flow Execution Duration
    if (metrics.flowExecutionDurations.length > 0) {
        lines.push('# HELP flow_execution_duration_ms Flow execution duration in milliseconds');
        lines.push('# TYPE flow_execution_duration_ms summary');
        lines.push(
            `flow_execution_duration_ms_sum ${metrics.flowExecutionDurations.reduce((a, b) => a + b, 0)}`,
        );
        lines.push(`flow_execution_duration_ms_count ${metrics.flowExecutionDurations.length}`);
        lines.push(
            `flow_execution_duration_ms{quantile="0.5"} ${getPercentile(metrics.flowExecutionDurations, 50)}`,
        );
        lines.push(
            `flow_execution_duration_ms{quantile="0.9"} ${getPercentile(metrics.flowExecutionDurations, 90)}`,
        );
    }

    // Database
    lines.push('# HELP database_queries_total Total number of database queries');
    lines.push('# TYPE database_queries_total counter');
    lines.push(`database_queries_total ${metrics.databaseQueriesTotal}`);

    if (metrics.dbQueryDurations.length > 0) {
        lines.push('# HELP database_query_duration_ms Database query duration in milliseconds');
        lines.push('# TYPE database_query_duration_ms summary');
        lines.push(
            `database_query_duration_ms_sum ${metrics.dbQueryDurations.reduce((a, b) => a + b, 0)}`,
        );
        lines.push(`database_query_duration_ms_count ${metrics.dbQueryDurations.length}`);
        lines.push(
            `database_query_duration_ms{quantile="0.5"} ${getPercentile(metrics.dbQueryDurations, 50)}`,
        );
        lines.push(
            `database_query_duration_ms{quantile="0.9"} ${getPercentile(metrics.dbQueryDurations, 90)}`,
        );
    }

    // Memory
    lines.push('# HELP process_memory_bytes Memory usage in bytes');
    lines.push('# TYPE process_memory_bytes gauge');
    lines.push(`process_memory_bytes{type="heap_used"} ${metrics.memoryUsage.heapUsed}`);
    lines.push(`process_memory_bytes{type="heap_total"} ${metrics.memoryUsage.heapTotal}`);
    lines.push(`process_memory_bytes{type="external"} ${metrics.memoryUsage.external}`);
    lines.push(`process_memory_bytes{type="rss"} ${metrics.memoryUsage.rss}`);

    // Errors
    lines.push('# HELP application_errors_total Total number of application errors');
    lines.push('# TYPE application_errors_total counter');
    for (const [key, value] of metrics.errorsTotal) {
        const [type, message] = key.split(':');
        lines.push(
            `application_errors_total{type="${type}",message="${message.replace(/"/g, '\\"')}"} ${value}`,
        );
    }

    // Active connections
    lines.push('# HELP active_connections Current active connections');
    lines.push('# TYPE active_connections gauge');
    lines.push(`active_connections ${metrics.activeConnections}`);

    // Browser sessions
    lines.push('# HELP browser_sessions_active Current active browser sessions');
    lines.push('# TYPE browser_sessions_active gauge');
    lines.push(`browser_sessions_active ${metrics.browserSessionsActive}`);

    // Cache
    lines.push('# HELP cache_hits_total Total cache hits');
    lines.push('# TYPE cache_hits_total counter');
    lines.push(`cache_hits_total ${metrics.cacheHits}`);

    lines.push('# HELP cache_misses_total Total cache misses');
    lines.push('# TYPE cache_misses_total counter');
    lines.push(`cache_misses_total ${metrics.cacheMisses}`);

    return lines.join('\n') + '\n';
}

function reset() {
    metrics.httpRequestsTotal.clear();
    metrics.httpRequestDurations.length = 0;
    metrics.activeConnections = 0;
    metrics.browserSessionsActive = 0;
    metrics.flowExecutionsTotal.clear();
    metrics.flowExecutionDurations.length = 0;
    metrics.flowExecutionErrors.clear();
    metrics.databaseQueriesTotal = 0;
    metrics.dbQueryDurations.length = 0;
    metrics.cacheHits = 0;
    metrics.cacheMisses = 0;
    metrics.errorsTotal.clear();
    metrics.httpRequestDurations.length = 0;
    metrics.flowExecutionDurations.length = 0;
    metrics.dbQueryDurations.length = 0;
}

export const metricsCollector = {
    recordHttpRequest: recordHttpRequest,
    recordFlowExecution: recordFlowExecution,
    recordDbQuery: recordDbQuery,
    recordError: recordError,
    updateMemoryUsage: updateMemoryUsage,
    formatPrometheus: formatPrometheus,
    reset: reset,
    getMetrics: () => ({ ...metrics }),
};

export default metricsCollector;
