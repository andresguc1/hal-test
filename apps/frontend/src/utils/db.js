import Dexie from "dexie";

export const db = new Dexie("HalTestDB");

db.version(1).stores({
  projects: "id, name, createdAt, updatedAt",
  flows: "id, projectId, name, createdAt",
  versions: "id, projectId, timestamp",
});
