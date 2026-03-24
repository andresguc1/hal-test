export class GraphValidator {
  /**
   * Validates a flow structure against strict quality rules.
   * @param {Object} flow - The flow object containing { nodes: Array, edges: Array }
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  static validate(flow) {
    if (!flow) return { valid: false, errors: ["Flow object is empty"] };

    const nodes = flow.nodes || [];
    const edges = flow.edges || [];
    const errors = [];

    console.log(
      "[GraphValidator] Node types in flow:",
      nodes.map((n) => `ID: ${n.id}, Type: ${n.type}`),
    );

    // 1. Uniqueness / Singleton Rules
    const launches = nodes.filter(
      (n) => n.type === "launch_browser" || n.data?.type === "launch_browser",
    );
    const closes = nodes.filter(
      (n) => n.type === "close_browser" || n.data?.type === "close_browser",
    );

    if (launches.length === 0) {
      errors.push("Missing mandatory 'launch_browser' node.");
    } else if (launches.length > 1) {
      errors.push(
        "More than one 'launch_browser' node detected. Only 1 is allowed per flow.",
      );
    }

    if (closes.length === 0) {
      errors.push("Missing mandatory 'close_browser' node.");
    } else if (closes.length > 1) {
      errors.push(
        "More than one 'close_browser' node detected. Only 1 is allowed per flow.",
      );
    }

    // Index nodes for fast lookup
    const nodeMap = new Map();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    // Build Adjacency List for graph traversal
    const adj = new Map();
    const inDegree = new Map();
    nodes.forEach((n) => {
      adj.set(n.id, []);
      inDegree.set(n.id, 0);
    });

    const edgeErrors = [];
    edges.forEach((e) => {
      if (!nodeMap.has(e.source)) {
        edgeErrors.push(`Edge references invalid source node: ${e.source}`);
        return;
      }
      if (!nodeMap.has(e.target)) {
        edgeErrors.push(`Edge references invalid target node: ${e.target}`);
        return;
      }
      adj.get(e.source).push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    });

    if (edgeErrors.length > 0) {
      return { valid: false, errors: [...errors, ...edgeErrors] };
    }

    // 2. Connectivity and Path Verification
    if (launches.length === 1) {
      const root = launches[0];
      const visited = new Set();
      const queue = [root.id];

      while (queue.length > 0) {
        const curr = queue.shift();
        if (!visited.has(curr)) {
          visited.add(curr);
          const neighbors = adj.get(curr) || [];
          queue.push(...neighbors);
        }
      }

      if (visited.size < nodes.length) {
        errors.push(
          "Found unreachable nodes. All nodes must be connected to the main flow.",
        );
      }
    }

    // 3. Structural Sequence and Hierarchy edge rules
    edges.forEach((e) => {
      const sourceNode = nodeMap.get(e.source);
      if (sourceNode && sourceNode.type === "close_browser") {
        errors.push(
          "'close_browser' must be the final node. It cannot have outgoing edges.",
        );
      }
    });

    // 4. Evidence Constraint
    const screenshots = nodes.filter(
      (n) => n.type === "take_screenshot" || n.data?.type === "take_screenshot",
    );
    if (screenshots.length === 0) {
      errors.push(
        "Flujo incompleto: missing a screenshot node to guarantee execution evidence.",
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Attempts to auto-repair non-critical violations (e.g. missing close_browser).
   * @param {Object} flow
   * @returns {Object} { fixed: boolean, flow: Object }
   */
  static repair(flow) {
    const { valid } = this.validate(flow);
    if (valid) return { fixed: false, flow };

    const nodes = [...(flow.nodes || [])];
    const edges = [...(flow.edges || [])];

    const launches = nodes.filter((n) => n.type === "launch_browser");
    const closes = nodes.filter((n) => n.type === "close_browser");

    if (launches.length === 1 && closes.length === 0 && nodes.length > 0) {
      const lastNodeId = `node_auto_close_${Date.now()}`;
      nodes.push({
        id: lastNodeId,
        type: "close_browser",
        data: { label: "Close Browser" },
        position: { x: nodes.length * 250, y: 150 },
      });

      const outDegree = new Map();
      nodes.forEach((n) => outDegree.set(n.id, 0));
      edges.forEach((e) =>
        outDegree.set(e.source, (outDegree.get(e.source) || 0) + 1),
      );

      let isolatedEndNode = null;
      for (const [nodeId, count] of outDegree.entries()) {
        if (count === 0 && nodeId !== lastNodeId) {
          isolatedEndNode = nodeId;
          break;
        }
      }

      if (isolatedEndNode) {
        edges.push({
          id: `edge_auto_close_${Date.now()}`,
          source: isolatedEndNode,
          target: lastNodeId,
        });
      }

      return { fixed: true, flow: { nodes, edges } };
    }

    return { fixed: false, flow };
  }
}
