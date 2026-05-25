import { Flow, Node } from '../database/init.js';

async function main() {
    try {
        console.log('--- FETCHING FLOWS & NODES ---');
        const flows = await Flow.findAll({
            order: [['updatedAt', 'DESC']],
        });

        console.log(`Found ${flows.length} flows:`);
        for (const flow of flows) {
            console.log(`\nFlow ID: ${flow.id}`);
            console.log(`  Name: ${flow.name}`);

            // Fetch nodes
            const nodes = await Node.findAll({
                where: { flowId: flow.id },
            });
            console.log(`  Nodes (${nodes.length}):`);
            nodes.forEach((n) => {
                const data = typeof n.data === 'string' ? JSON.parse(n.data) : n.data;
                console.log(
                    `    - [${n.type}] id="${n.nodeId}" label="${data?.label || data?.customLabel || 'No Label'}" techName="${data?.technicalName || ''}"`,
                );
            });
        }
    } catch (err) {
        console.error('Error running script:', err);
    }
}

main().then(() => process.exit(0));
