import { variableManager } from '../apps/backend/services/VariableManager.js';

const runId = "test-run";
const variables = {
  "Login Steps.result": {
    "status": "success",
    "data": {
      "success": true,
      "healedNodes": [],
      "error": null,
      "_dataSource": "persisted"
    }
  },
  "Login Steps": {
    "status": "success",
    "data": {
      "success": true,
      "healedNodes": [],
      "error": null,
      "_dataSource": "persisted"
    }
  }
};

variableManager.initRun(runId, variables);

console.log("--- DIAGNOSTIC START ---");
console.log("Input Variable:", "{{ Login Steps.status }}");

const resolved = variableManager.resolveValue("{{ Login Steps.status }}", runId);
console.log("Resolved Value:", resolved);
console.log("Type:", typeof resolved);

const condition = {
  left: "{{ Login Steps.status }}",
  operator: "==",
  right: "success"
};

const result = variableManager.evaluateCondition(condition, runId);
console.log("Condition Result:", result);

console.log("--- NESTED DATA TEST ---");
const nested = variableManager.resolveValue("{{ Login Steps.data.success }}", runId);
console.log("Nested Data Success:", nested);

console.log("--- DIAGNOSTIC END ---");
