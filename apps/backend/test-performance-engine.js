import { executionManager } from './services/ExecutionManager.js';
import './database/init.js';

async function runPerformanceTest() {
    console.log('🧪 Iniciando prueba de estrés local (Meta-testing)...');

    // Mock de un flujo básico para la prueba
    const mockFlow = {
        id: 'test-flow-perf-001',
        projectId: 'test-project-001',
        name: 'Stress Test Login Flow',
        nodes: [
            { id: 'node1', type: 'browser_launch' },
            { id: 'node2', type: 'page_goto', data: { url: 'https://example.com' } },
            { id: 'node3', type: 'browser_close' },
        ],
        edges: [
            { source: 'node1', target: 'node2' },
            { source: 'node2', target: 'node3' },
        ],
    };

    const config = {
        virtualUsers: 3, // Mantener bajo para la prueba en local
        duration: 10, // 10 segundos
        rampUp: 2,
        profile: 'constant',
        throttleStrategy: 'auto',
        maxConcurrentBrowsers: 2,
        headless: true,
    };

    try {
        console.log(`Configuración: ${config.virtualUsers} VUs durante ${config.duration}s`);

        // El ExecutionManager inicializará el WorkerPool (child_process) y lanzará los workers
        const summary = await executionManager.execute('performance', mockFlow, {
            performanceConfig: config,
        });

        console.log('\n✅ Prueba completada con éxito.');
        console.log('--- RESUMEN (HDR Histogram) ---');
        console.log(`Total Requests: ${summary.data.totalRequests}`);
        console.log(`Throughput:     ${summary.data.throughput} req/s`);
        console.log(`Error Rate:     ${summary.data.errorRate}%`);
        console.log(`Latency Avg:    ${summary.data.latency.avg} ms`);
        console.log(`Latency P95:    ${summary.data.latency.p95} ms`);
        console.log(`Latency P99:    ${summary.data.latency.p99} ms`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Error en la prueba:', err);
        process.exit(1);
    }
}

runPerformanceTest();
