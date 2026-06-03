import { initDb, Node, Flow } from '../apps/backend/database/init.js';

async function main() {
    await initDb();
    const nodeId = 'node_12375402-7d45-4dc6-b267-acbbc35da5d7';
    const node = await Node.findOne({ where: { nodeId } });
    if (!node) {
        console.log(`Node ${nodeId} not found in DB`);
        return;
    }
    console.log('--- NODE FOUND ---');
    console.log(JSON.stringify(node.toJSON(), null, 2));

    const flow = await Flow.findOne({ where: { id: node.flowId } });
    if (flow) {
        console.log('--- FLOW FOUND ---');
        console.log(JSON.stringify(flow.toJSON(), null, 2));
    }
}

main().catch(console.error);
