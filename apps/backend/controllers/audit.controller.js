import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { auditService } from '../services/AuditService.js';
import { emitFineTuningProgress } from '../socket.js';
import { STORAGE_DIR } from '../config/paths.js';

let isTrainingActive = false;

export const getAuditLogs = async (req, res) => {
    try {
        await auditService.ensureInitialized();
        const filePath = auditService.logFilePath;

        let logs = [];
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const lines = content.trim().split('\n');
            for (const line of lines) {
                if (line.trim()) {
                    logs.push(JSON.parse(line));
                }
            }
        } catch (readErr) {
            // File does not exist yet or empty
        }

        return res.status(200).json({
            success: true,
            logs,
        });
    } catch (error) {
        console.error('[AuditController] Error fetching audit logs:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

export const clearAuditLogs = async (req, res) => {
    try {
        await auditService.ensureInitialized();
        const filePath = auditService.logFilePath;

        try {
            await fs.writeFile(filePath, '', 'utf8');
        } catch (writeErr) {
            // Ignore if file doesn't exist
        }

        return res.status(200).json({
            success: true,
            message: 'Audit logs cleared successfully',
        });
    } catch (error) {
        console.error('[AuditController] Error clearing audit logs:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

export const startFineTuning = async (req, res) => {
    try {
        await auditService.ensureInitialized();
        const filePath = auditService.logFilePath;

        let logsCount = 0;
        try {
            const content = await fs.readFile(filePath, 'utf8');
            logsCount = content.trim().split('\n').filter(Boolean).length;
        } catch (readErr) {
            // File not found or empty
        }

        if (logsCount === 0) {
            return res.status(400).json({
                success: false,
                error: 'No hay datos de entrenamiento disponibles. Ejecuta primero algunos flujos con Fine-Tuning habilitado.',
            });
        }

        if (isTrainingActive) {
            return res.status(400).json({
                success: false,
                error: 'Ya hay un proceso de entrenamiento en ejecución. Por favor, espera a que termine.',
            });
        }

        const modelsDir = path.resolve(STORAGE_DIR, 'models');
        await fs.mkdir(modelsDir, { recursive: true });
        const modelOutputPath = path.join(modelsDir, 'fine_tuned_model.gguf');

        isTrainingActive = true;

        // Spawn python training process
        const scriptPath = path.resolve(STORAGE_DIR, '../scripts/local_train.py');
        const trainProcess = spawn('python3', [
            scriptPath,
            '--dataset',
            filePath,
            '--output',
            modelOutputPath,
        ]);

        let buffer = '';
        trainProcess.stdout.on('data', (data) => {
            buffer += data.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const progressUpdate = JSON.parse(line);
                    emitFineTuningProgress(progressUpdate);
                } catch (e) {
                    emitFineTuningProgress({
                        step: 'training',
                        progress: 50,
                        log: line.trim(),
                    });
                }
            }
        });

        trainProcess.stderr.on('data', (data) => {
            const msg = data.toString().trim();
            if (msg) {
                console.error(`[local_train.py stderr]: ${msg}`);
                emitFineTuningProgress({
                    step: 'error',
                    progress: 0,
                    log: `[ERROR] ${msg}`,
                });
            }
        });

        trainProcess.on('close', (code) => {
            isTrainingActive = false;
            if (code === 0) {
                emitFineTuningProgress({
                    step: 'export',
                    progress: 100,
                    log: `Modelo GGUF exportado correctamente en: ${modelOutputPath}`,
                    done: true,
                });
            } else {
                emitFineTuningProgress({
                    step: 'error',
                    progress: 0,
                    log: `El entrenamiento falló con código de salida ${code}`,
                    done: true,
                });
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Fine-tuning process started',
            totalSteps: logsCount,
        });
    } catch (error) {
        isTrainingActive = false;
        console.error('[AuditController] Error starting fine-tuning:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};
