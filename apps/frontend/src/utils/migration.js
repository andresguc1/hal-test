import { projectManager } from "./ProjectManager";
import { storageManager } from "./storageManager";
import { logger } from "./logger";

export async function migrateFromLegacy() {
  try {
    // Check if already migrated
    const isMigrated = localStorage.getItem("hal_migrated");
    if (isMigrated) {
      return null;
    }

    // 1. Read legacy data
    const oldFlow = storageManager.get("flow");

    // If no legacy data, just mark as migrated and return
    if (!oldFlow || !oldFlow.nodes || oldFlow.nodes.length === 0) {
      localStorage.setItem("hal_migrated", "true");
      return null;
    }

    logger.info("Starting migration from legacy storage...", null, "Migration");

    // 2. Create new project
    const project = await projectManager.createProject(
      "Migrated Project",
      "Auto-migrated from legacy storage",
    );

    // 3. Create flow with legacy data
    const flow = await projectManager.createFlow(project.id, "Main Flow");

    await projectManager.updateFlow(project.id, flow.id, {
      nodes: oldFlow.nodes || [],
      edges: oldFlow.edges || [],
      viewport: oldFlow.viewport || { x: 0, y: 0, zoom: 1 },
    });

    // 4. Clear legacy data
    // We keep it for safety for now, or we could remove it.
    // Let's rename it to backup just in case.
    const backupKey = `flow_backup_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(oldFlow));
    storageManager.remove("flow");

    // 5. Mark as completed
    localStorage.setItem("hal_migrated", "true");

    logger.info(
      "Migration completed successfully",
      { projectId: project.id },
      "Migration",
    );

    return project;
  } catch (error) {
    logger.error("Migration failed", error, "Migration");
    throw error;
  }
}
