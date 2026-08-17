import fs from 'fs';
import path from 'path';
import { STORAGE_DIR } from '../config/paths.js';

const PROJECTS_DIR = path.join(STORAGE_DIR, 'projects');

/**
 * ProjectStorageService
 * Manages the on-disk file-based storage for HalTest projects.
 * All projects live under ~/.haltest/projects/{project-id}/
 */
class ProjectStorageService {
    constructor() {
        this._ensureProjectsDir();
    }

    _ensureProjectsDir() {
        if (!fs.existsSync(PROJECTS_DIR)) {
            fs.mkdirSync(PROJECTS_DIR, { recursive: true });
        }
    }

    /**
     * Returns the root directory for a project on disk.
     */
    getProjectDir(projectId) {
        return path.join(PROJECTS_DIR, projectId);
    }

    /**
     * Returns the path for a specific file within a project.
     */
    getFilePath(projectId, relativePath) {
        const resolved = path.resolve(this.getProjectDir(projectId), relativePath);
        const projectDir = this.getProjectDir(projectId);

        if (!resolved.startsWith(projectDir)) {
            throw new Error(`Path traversal detected: ${relativePath}`);
        }

        return resolved;
    }

    // ── Project CRUD ──────────────────────────────────────────

    /**
     * Creates the directory structure for a new project.
     * Returns the initial project.json content.
     */
    async createProject(projectData) {
        const projectDir = this.getProjectDir(projectData.id);

        if (fs.existsSync(projectDir)) {
            throw new Error(`Project ${projectData.id} already exists on disk`);
        }

        const dirs = ['', 'flows', 'pages', 'components', 'test-suites', 'fixtures'];

        for (const dir of dirs) {
            fs.mkdirSync(path.join(projectDir, dir), { recursive: true });
        }

        const projectJson = {
            $schema: 'https://haltest.dev/schemas/project-v2.json',
            id: projectData.id,
            name: projectData.name,
            version: '2.0.0',
            description: projectData.description || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            config: {
                defaultBrowser: 'chromium',
                auth: { provider: 'none' },
                ai: { defaultProvider: 'ollama' },
                ...projectData.config,
            },
            plugins: projectData.plugins || [],
            flows: [],
            pages: [],
            components: [],
            testSuites: [],
        };

        await this._writeJson(projectDir, 'project.json', projectJson);
        return projectJson;
    }

    /**
     * Loads a project from disk.
     */
    async loadProject(projectId) {
        const projectDir = this.getProjectDir(projectId);
        const projectJsonPath = path.join(projectDir, 'project.json');

        if (!fs.existsSync(projectJsonPath)) {
            throw new Error(`Project ${projectId} not found on disk`);
        }

        return this._readJson(projectDir, 'project.json');
    }

    /**
     * Updates a project's project.json.
     */
    async updateProject(projectId, updates) {
        const project = await this.loadProject(projectId);
        const updated = {
            ...project,
            ...updates,
            id: project.id,
            updatedAt: new Date().toISOString(),
        };

        const projectDir = this.getProjectDir(projectId);
        await this._writeJson(projectDir, 'project.json', updated);
        return updated;
    }

    /**
     * Deletes a project and all its files from disk.
     */
    async deleteProject(projectId) {
        const projectDir = this.getProjectDir(projectId);
        if (fs.existsSync(projectDir)) {
            fs.rmSync(projectDir, { recursive: true, force: true });
        }
    }

    /**
     * Lists all projects on disk.
     */
    async listProjects() {
        this._ensureProjectsDir();
        const entries = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true });
        const projects = [];

        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            const jsonPath = path.join(PROJECTS_DIR, entry.name, 'project.json');
            if (fs.existsSync(jsonPath)) {
                try {
                    const project = await this._readJson(
                        PROJECTS_DIR,
                        `${entry.name}/project.json`,
                    );
                    projects.push(project);
                } catch {
                    console.warn(`[ProjectStorage] Skipping corrupted project: ${entry.name}`);
                }
            }
        }

        return projects;
    }

    // ── File Reference Management ─────────────────────────────

    /**
     * Adds a file reference to a project's index (flows, pages, components, testSuites).
     */
    async addFileRef(projectId, category, ref, order) {
        const project = await this.loadProject(projectId);
        if (!project[category]) {
            throw new Error(`Invalid category: ${category}`);
        }

        const exists = project[category].some((f) => f.ref === ref);
        if (!exists) {
            project[category].push({ ref, order: order ?? project[category].length });
            project[category].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            project.updatedAt = new Date().toISOString();
            await this._writeJson(this.getProjectDir(projectId), 'project.json', project);
        }

        return project;
    }

    /**
     * Removes a file reference from a project's index.
     */
    async removeFileRef(projectId, category, ref) {
        const project = await this.loadProject(projectId);
        if (!project[category]) return project;

        project[category] = project[category].filter((f) => f.ref !== ref);
        project.updatedAt = new Date().toISOString();
        await this._writeJson(this.getProjectDir(projectId), 'project.json', project);
        return project;
    }

    // ── Atomic File I/O ───────────────────────────────────────

    /**
     * Writes a JSON file with atomic write (write to .tmp then rename).
     */
    async _writeJson(baseDir, relativePath, data) {
        const filePath = path.join(baseDir, relativePath);
        const dir = path.dirname(filePath);
        const tmpPath = `${filePath}.tmp`;

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
        fs.renameSync(tmpPath, filePath);
    }

    /**
     * Reads and parses a JSON file.
     */
    async _readJson(baseDir, relativePath) {
        const filePath = path.join(baseDir, relativePath);
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    }

    /**
     * Checks if a file exists on disk.
     */
    fileExists(projectId, relativePath) {
        return fs.existsSync(this.getFilePath(projectId, relativePath));
    }

    /**
     * Lists files in a project subdirectory.
     */
    listFiles(projectId, subDir) {
        const dirPath = this.getFilePath(projectId, subDir);
        if (!fs.existsSync(dirPath)) return [];

        return fs.readdirSync(dirPath).filter((f) => f.endsWith('.json'));
    }

    /**
     * Writes an arbitrary JSON file within the project directory.
     */
    async writeFile(projectId, relativePath, data) {
        const projectDir = this.getProjectDir(projectId);
        await this._writeJson(projectDir, relativePath, data);
    }

    /**
     * Reads an arbitrary JSON file from the project directory.
     */
    async readFile(projectId, relativePath) {
        const projectDir = this.getProjectDir(projectId);
        return this._readJson(projectDir, relativePath);
    }

    /**
     * Deletes a file from the project directory.
     */
    deleteFile(projectId, relativePath) {
        const filePath = this.getFilePath(projectId, relativePath);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
}

export const projectStorageService = new ProjectStorageService();
export default projectStorageService;
