import fs from 'fs/promises';
import path from 'path';
import { STORAGE_RUNS_DIR } from '../../config/paths.js';
import { Run, StepResult } from '../../database/init.js';

class ReportExporter {
    /**
     * Generates a self-contained HTML report for a specific run.
     * @param {string} runId
     * @returns {Promise<string>} Path to the generated HTML file
     */
    async generateSingleFileReport(runId) {
        try {
            const run = await Run.findByPk(runId, {
                include: [{ model: StepResult, as: 'steps' }],
            });

            if (!run) throw new Error('Run not found');

            const runDir = path.join(STORAGE_RUNS_DIR, runId);
            const exportPath = path.join(runDir, `report_${runId.slice(0, 8)}.html`);

            // 1. Prepare Data (Base64 screenshots if they exist)
            const stepsWithBase64 = await Promise.all(
                run.steps.map(async (step) => {
                    let base64 = null;
                    if (step.screenshot_path) {
                        try {
                            // Find the actual file on disk
                            // StepResult stores storage/runs/... but we need the absolute path
                            const fileName = path.basename(step.screenshot_path);
                            const fullPath = path.join(runDir, fileName);
                            const buffer = await fs.readFile(fullPath);
                            base64 = `data:image/png;base64,${buffer.toString('base64')}`;
                        } catch (e) {
                            console.warn(`[Exporter] Could not embed screenshot: ${e.message}`);
                        }
                    }
                    return {
                        ...step.toJSON(),
                        screenshot_base64: base64,
                    };
                }),
            );

            const reportData = {
                ...run.toJSON(),
                steps: stepsWithBase64,
            };

            // 2. Build the HTML Template
            const html = this.getTemplate(reportData);

            await fs.writeFile(exportPath, html);
            console.log(`[Exporter] Portable report generated at: ${exportPath}`);

            return exportPath;
        } catch (error) {
            console.error('[Exporter] Failed to generate report:', error);
            throw error;
        }
    }

    getTemplate(data) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HalTest Intelligent Report | ${data.flow_name}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=JetBrains+Mono&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #0f172a; color: #f1f5f9; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .glass { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.05); }
        .glow-success { box-shadow: 0 0 20px rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2); }
        .glow-failed { box-shadow: 0 0 20px rgba(244, 63, 94, 0.1); border-color: rgba(244, 63, 94, 0.2); }
        .glow-healed { box-shadow: 0 0 20px rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.2); }
    </style>
</head>
<body class="p-8">
    <div class="max-w-6xl mx-auto space-y-8">
        <!-- HEADER -->
        <header class="flex items-center justify-between border-b border-white/10 pb-6">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-2xl">🤖</div>
                <div>
                    <h1 class="text-xs font-bold uppercase tracking-widest text-indigo-400">HALTEST INTELLIGENT REPORT</h1>
                    <div class="text-2xl font-black italic uppercase">${data.flow_name}</div>
                </div>
            </div>
            <div class="text-right">
                <div class="text-[10px] font-bold text-slate-500 uppercase">Execution Status</div>
                <div class="px-3 py-1 rounded-full text-xs font-bold uppercase border ${data.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}">
                    ${data.status}
                </div>
            </div>
        </header>

        <!-- KPI GRID -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="glass p-4 rounded-xl">
                 <div class="text-[10px] font-bold text-slate-500 uppercase">Duration</div>
                 <div class="text-xl font-bold font-mono">${(data.duration_ms / 1000).toFixed(2)}s</div>
            </div>
            <div class="glass p-4 rounded-xl">
                 <div class="text-[10px] font-bold text-slate-500 uppercase">Steps</div>
                 <div class="text-xl font-bold font-mono">${data.steps.length}</div>
            </div>
            <div class="glass p-4 rounded-xl">
                 <div class="text-[10px] font-bold text-slate-500 uppercase">Healed</div>
                 <div class="text-xl font-bold font-mono text-amber-400">${data.total_healed || 0} 🩹</div>
            </div>
            <div class="glass p-4 rounded-xl">
                 <div class="text-[10px] font-bold text-slate-500 uppercase">Browser</div>
                 <div class="text-[10px] font-mono mt-1 opacity-70">${data.browser_version || 'Unknown'}</div>
            </div>
        </div>

        <!-- TIMELINE -->
        <section class="space-y-6">
            <h2 class="text-sm font-bold uppercase tracking-widest text-slate-400">Execution Timeline & Evidence</h2>
            
            <div class="space-y-4">
                ${data.steps
                    .map(
                        (step, idx) => `
                    <div class="glass p-6 rounded-2xl border transition-all hover:border-white/10 ${step.status === 'failed' ? 'glow-failed' : step.status === 'healed' ? 'glow-healed' : 'glow-success'}">
                        <div class="flex items-start justify-between gap-6">
                            <div class="flex-1 space-y-4">
                                <div class="flex items-center gap-3">
                                    <span class="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold">${idx + 1}</span>
                                    <span class="text-xs font-bold uppercase tracking-wider">${step.node_type}</span>
                                    <span class="text-[10px] font-mono opacity-40">#${step.node_id.slice(0, 8)}</span>
                                </div>
                                
                                ${
                                    step.ai_diagnosis
                                        ? `
                                    <div class="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-[11px] italic text-indigo-300">
                                        <span class="font-bold border-b border-indigo-300/20 block mb-1">AI Diagnosis:</span>
                                        ${step.ai_diagnosis}
                                    </div>
                                `
                                        : ''
                                }

                                ${
                                    step.error
                                        ? `
                                    <div class="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[10px] font-mono text-rose-300">
                                        ${step.error}
                                    </div>
                                `
                                        : ''
                                }

                                <div class="flex gap-4">
                                    <div class="flex-1">
                                        <div class="text-[9px] uppercase font-black text-slate-600 mb-1">Input Data</div>
                                        <pre class="bg-black/40 p-2 rounded text-[9px] font-mono text-slate-400 overflow-x-auto">${JSON.stringify(step.input_data, null, 2)}</pre>
                                    </div>
                                    <div class="flex-1">
                                        <div class="text-[9px] uppercase font-black text-slate-600 mb-1">Output Data</div>
                                        <pre class="bg-black/40 p-2 rounded text-[9px] font-mono text-slate-400 overflow-x-auto">${JSON.stringify(step.output_data, null, 2)}</pre>
                                    </div>
                                </div>
                            </div>

                            ${
                                step.screenshot_base64
                                    ? `
                                <div class="w-80 shrink-0">
                                    <div class="text-[9px] uppercase font-black text-slate-600 mb-2">Visual Capture</div>
                                    <img src="${step.screenshot_base64}" class="w-full rounded-lg border border-white/10 shadow-lg" alt="Evidence">
                                </div>
                            `
                                    : ''
                            }
                        </div>
                    </div>
                `,
                    )
                    .join('')}
            </div>
        </section>

        <footer class="pt-20 pb-10 text-center text-slate-600 text-[10px] font-bold tracking-widest uppercase">
            Generated by HalTest Artificial Intelligence Reporting Engine
        </footer>
    </div>
</body>
</html>
        `;
    }
}

export const reportExporter = new ReportExporter();
