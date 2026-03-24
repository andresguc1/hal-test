import { GraphValidator } from './apps/backend/services/GraphValidator.js';

const mockFlow = {
    nodes: [
        { id: '1', type: 'launch_browser' },
        { id: '2', type: 'open_url' },
        { id: '3', type: 'take_screenshot' }
    ],
    edges: [
        { id: 'e1', source: '1', target: '2' },
        { id: 'e2', source: '2', target: '3' }
    ]
};

console.log("== 1. Validating linear but missing close_browser ==");
const result = GraphValidator.validate(mockFlow);
console.log("Valid:", result.valid);
console.log("Errors:", result.errors);

console.log("\n== 2. Repairing flow ==");
const repairResult = GraphValidator.repair(mockFlow);
console.log("Fixed:", repairResult.fixed);
console.log("Repaired Flow Nodes:", JSON.stringify(repairResult.flow.nodes.map(n => n.type)));
console.log("Repaired Flow Edges:", JSON.stringify(repairResult.flow.edges));
