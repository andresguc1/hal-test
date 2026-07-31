import { initDb, Run } from '../apps/backend/database/init.js';

async function test() {
  try {
    await initDb({ alter: false });
    console.log("Database initialized. Fetching runs...");
    const runs = await Run.findAll({
      order: [['started_at', 'DESC']],
      limit: 30,
    });
    console.log("Success! Found runs count:", runs.length);
  } catch (err) {
    console.error("Run.findAll ERROR:", err);
  }
}

test();
