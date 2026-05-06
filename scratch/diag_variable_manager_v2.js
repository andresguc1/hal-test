import { variableManager } from '../apps/backend/services/VariableManager.js';

const realRunId = "real-uuid-123";
const fakeRunId = "node_conditional_456";

const variables = {
  "Login Steps (Library).result": {
    "status": "success",
    "data": { "success": true }
  }
};

// Seed into real run
variableManager.initRun(realRunId, variables);
// Ensure it's the active run
variableManager.lastRunId = realRunId;

console.log("--- ADVANCED DIAGNOSTIC START ---");

// Test 1: Normalization with (Library) suffix
console.log("\n[Test 1] Normalization with (Library) suffix");
const res1 = variableManager.get("Login Steps.status", realRunId);
console.log("Expected: success | Actual:", res1);

// Test 2: Fallback from fakeRunId to realRunId
console.log("\n[Test 2] Fallback from fakeRunId to active realRunId");
// fakeRunId has no scope yet
const res2 = variableManager.get("Login Steps.status", fakeRunId);
console.log("Expected: success | Actual:", res2);

// Test 3: Nested data with fallback
console.log("\n[Test 3] Nested data with fallback");
const res3 = variableManager.resolveValue("{{ Login Steps.data.success }}", fakeRunId);
console.log("Expected: true | Actual:", res3);

console.log("\n--- ADVANCED DIAGNOSTIC END ---");
