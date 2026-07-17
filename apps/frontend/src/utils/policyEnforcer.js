/**
 * Policy Enforcer - Static Analysis Engine (Visual Linter Mode)
 * Audits the topology and node configurations of the canvas in real-time.
 * Inspired by Scantrix & Playwright/SDET best practices.
 */

/**
 * Runs policy checks on the current list of nodes and edges.
 * @param {Array} nodes - React Flow nodes
 * @param {Array} edges - React Flow edges
 * @returns {Object} map of nodeId -> Array of warning objects
 */
export function runPolicyEnforcer(nodes, edges) {
  if (!Array.isArray(nodes)) return {};
  const edgesList = Array.isArray(edges) ? edges : [];

  const warningsMap = {};

  // Exclude collaboration/annotation nodes from the execution flow graph
  const activeNodes = nodes.filter((n) => {
    const type = n.type || n.data?.type;
    return type !== "sticky_note" && type !== "discussion";
  });
  const activeNodeIds = new Set(activeNodes.map((n) => n.id));

  // Filter edges to only include connections between active nodes
  const activeEdges = edgesList.filter(
    (e) => activeNodeIds.has(e.source) && activeNodeIds.has(e.target),
  );

  // 1. Build Adjacency List for reachability/assertion checks
  const adjacency = {};
  const outDegree = {};

  activeNodes.forEach((n) => {
    adjacency[n.id] = [];
    outDegree[n.id] = 0;
  });

  activeEdges.forEach((e) => {
    if (adjacency[e.source]) {
      adjacency[e.source].push(e.target);
    }
    if (outDegree[e.source] !== undefined) {
      outDegree[e.source]++;
    }
  });

  // Helper: check if node has no outgoing connections in active graph
  const isTerminal = (nodeId) => {
    return !adjacency[nodeId] || adjacency[nodeId].length === 0;
  };

  // Helper: check if node is a validation node
  const isValidationNode = (node) => {
    const type = node.type || node.data?.type;
    return (
      type === "validate_semantic" ||
      type === "run_tests" ||
      type === "find_element" ||
      type === "wait_visible" ||
      type === "wait_for_element" ||
      type === "wait_network_match" ||
      type === "wait_conditional"
    );
  };

  // Helper: check if node is a safe termination (doesn't warrant dead end warning, but isn't validation)
  const isSafeTerminalNode = (node) => {
    const type = node.type || node.data?.type;
    return (
      type === "output" ||
      type === "close_browser" ||
      type === "fail_flow" ||
      type === "cleanup_state" ||
      type === "close_context"
    );
  };

  // 2. Compute Downstream Validation Reachability (DFS with memoization)
  const canReachValidation = {};

  const checkReachability = (nodeId, visited = new Set()) => {
    if (canReachValidation[nodeId] !== undefined) {
      return canReachValidation[nodeId];
    }

    const node = activeNodes.find((n) => n.id === nodeId);
    if (!node) {
      return false;
    }

    // A validation node satisfies reachability for itself and ancestors
    if (isValidationNode(node)) {
      canReachValidation[nodeId] = true;
      return true;
    }

    visited.add(nodeId);
    let reachable = false;
    const neighbors = adjacency[nodeId] || [];

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (checkReachability(neighbor, visited)) {
          reachable = true;
          break;
        }
      }
    }
    visited.delete(nodeId);

    canReachValidation[nodeId] = reachable;
    return reachable;
  };

  // Pre-calculate reachability for all nodes
  activeNodes.forEach((n) => {
    checkReachability(n.id);
  });

  // Helper: check if a validation node exists upstream of this node
  const hasValidationUpstream = (nodeId) => {
    const visited = new Set();
    const queue = [nodeId];

    // Build reverse adjacency list (incoming connections)
    const incoming = {};
    activeNodes.forEach((n) => {
      incoming[n.id] = [];
    });
    activeEdges.forEach((e) => {
      if (incoming[e.target]) {
        incoming[e.target].push(e.source);
      }
    });

    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      visited.add(current);

      const nodeObj = activeNodes.find((n) => n.id === current);
      if (nodeObj && isValidationNode(nodeObj)) {
        return true;
      }

      const parents = incoming[current] || [];
      for (const parent of parents) {
        if (!visited.has(parent)) {
          queue.push(parent);
        }
      }
    }
    return false;
  };

  // 3. Evaluate each node against policy rules
  activeNodes.forEach((node) => {
    const nodeWarnings = [];
    const config = node.data?.configuration || {};
    const nodeType = node.type || node.data?.type;

    // --- RULE 1: Hardcoded Wait/Timeout Anti-pattern ---
    const isPauseNode = nodeType === "pause";
    if (isPauseNode) {
      const duration = config.duration;
      // If duration is defined and does not contain "{{", it is hardcoded.
      const isHardcoded =
        duration !== undefined &&
        duration !== null &&
        duration !== "" &&
        !String(duration).includes("{{");

      if (isHardcoded) {
        nodeWarnings.push({
          rule: "hardcoded_wait",
          severity: "warning",
          message: `Hardcoded pause duration of ${duration}ms detected.`,
          educationalGuide: {
            title: "Wait-Timeout Anti-Pattern",
            why: "Fixed delays (e.g. page.waitForTimeout()) cause flaky tests and slower build times. If a system under test loads faster, time is wasted; if it loads slower, the test fails unexpectedly.",
            remediation:
              "Avoid pause nodes entirely. Replace them with dynamic event-based waits (e.g., Wait for Element, Wait Visible, or Wait for Network Match) or parameterize timeouts using variables.",
            badCode: `// Bad: Arbitrary hardcoded sleep\nawait page.waitForTimeout(${duration});`,
            goodCode: `// Good: Wait for dynamic state to complete\nawait page.locator('.modal-success').waitFor({ state: 'visible' });`,
          },
        });
      }
    } else {
      // Check for hardcoded numeric fields in other nodes (timeout, delay, idleTime, etc.)
      const timeoutFields = [
        "timeout",
        "duration",
        "delay",
        "idleTime",
        "delayBetweenIterations",
        "slowMo",
      ];
      for (const field of timeoutFields) {
        const value = config[field];
        if (value !== undefined && value !== null && value !== "") {
          const isNumeric = !isNaN(Number(value)) && typeof value !== "boolean";
          const isTemplated = String(value).includes("{{");

          if (isNumeric && !isTemplated) {
            nodeWarnings.push({
              rule: "hardcoded_timeout",
              severity: "warning",
              message: `Hardcoded '${field}' of ${value}ms detected.`,
              educationalGuide: {
                title: "Hardcoded Timeout Parameter",
                why: "Hardcoding timeout values prevents tests from adapting dynamically to slow environments (like shared CI runners or staging servers).",
                remediation:
                  "Parameterize the timeout parameter with variables (e.g., `{{TIMEOUT_DEFAULT}}`) so it can be managed globally or overwritten at run-time.",
                badCode: `// Bad: Hardcoded timeout parameter\nawait page.click('.btn', { timeout: ${value} });`,
                goodCode: `// Good: Reference environment variable or variable hook\nawait page.click('.btn', { timeout: env.TIMEOUT_LONG || 30000 });`,
              },
            });
            break; // only report one timeout issue per node to prevent clutter
          }
        }
      }
    }

    // --- RULE 2: Dynamic CSS / XPath Selectors ---
    const selectorFields = ["selector", "sourceSelector", "targetSelector"];
    for (const field of selectorFields) {
      const sel = config[field] || node.data?.[field];
      if (sel && typeof sel === "string") {
        let isBrittle = false;
        let reason = "";

        // Heuristics for brittle selectors:
        const divDepth = (sel.match(/\bdiv\b/gi) || []).length;
        const nthChildDepth = (sel.match(/:nth-child/g) || []).length;

        if (divDepth >= 3) {
          isBrittle = true;
          reason = "brittle structure (3+ nested tag divisions)";
        } else if (nthChildDepth >= 2) {
          isBrittle = true;
          reason = "structural index dependencies (multiple nth-child calls)";
        } else if (sel.startsWith("/html/body")) {
          isBrittle = true;
          reason = "absolute XPath selector";
        } else if (
          /ember\d+|(_ngcontent-)|(react-)|(-[a-f0-9]{8,})/i.test(sel)
        ) {
          isBrittle = true;
          reason = "auto-generated framework ID or class hash";
        }

        if (isBrittle) {
          nodeWarnings.push({
            rule: "brittle_selector",
            severity: "warning",
            message: `Brittle selector in '${field}': "${sel}" (${reason}).`,
            educationalGuide: {
              title: "Brittle & Dynamic Selector Anti-Pattern",
              why: "Modern UI frameworks generate class hashes dynamically and update DOM hierarchies frequently. Selecting elements by rigid structural paths or transient hashes breaks tests upon minor updates.",
              remediation:
                "Locate elements using stable attributes (e.g. data-testid), accessible ARIA attributes (roles/labels), or semantic selectors.",
              badCode: `// Bad: Highly brittle tag path or auto-generated hashes\nawait page.locator('div > div > div:nth-child(2) > .react-a5f1').click();`,
              goodCode: `// Good: Stable custom test identifier\nawait page.locator('[data-testid="submit-button"]').click();`,
            },
          });
          break; // only report one selector warning per node
        }
      }
    }

    // --- RULE 3: Strict Mode Violations (Broad Selectors) ---
    const actionTypes = [
      "click",
      "type_text",
      "select_option",
      "hover",
      "submit_form",
    ];
    if (actionTypes.includes(nodeType)) {
      const sel = config.selector || node.data?.selector;
      if (sel && typeof sel === "string") {
        // Very broad selectors (single tag names or generic single class names)
        const isBroadTag = /^(button|input|select|textarea|a|div|span)$/i.test(
          sel.trim(),
        );
        const isBroadClass =
          /^\.(btn|link|form-control|input-field|submit|active)$/i.test(
            sel.trim(),
          );

        if (isBroadTag || isBroadClass) {
          nodeWarnings.push({
            rule: "strict_mode_violation",
            severity: "warning",
            message: `Generic selector "${sel}" may cause Strict Mode violations.`,
            educationalGuide: {
              title: "Strict Mode Selector Warning",
              why: "Playwright actions enforce Strict Mode. If a locator matches more than one element on the page, any action (click, type, etc.) will immediately throw a Strictness Violation error.",
              remediation:
                "Qualify your selector using unique parent scopes, stable attributes, or context functions to ensure it resolves to a unique element.",
              badCode: `// Bad: Ambiguous tag target\nawait page.click('button');`,
              goodCode: `// Good: Target uniquely within a specific form\nawait page.click('#login-form button[type="submit"]');`,
            },
          });
        }
      }
    }

    // --- RULE 4: Assertion Verification (Unasserted & Dead End Paths) ---
    if (isTerminal(node.id)) {
      if (isSafeTerminalNode(node)) {
        // If it's a safe terminal node but the path leading to it doesn't contain any validation
        if (!hasValidationUpstream(node.id)) {
          nodeWarnings.push({
            rule: "unasserted_path",
            severity: "warning",
            message:
              "Unasserted Path: This path does not lead to any validation or assertion node.",
            educationalGuide: {
              title: "Unasserted Execution Path",
              why: "All execution pathways in an automation test should lead to a verification step. Actions without assertions do not confirm correctness of side-effects.",
              remediation:
                "Ensure this branch eventually connects to a validation node (e.g., Validate Semantic) downstream.",
              badCode: `// Bad: Navigation path without assertion\nawait page.goto('/reports');\nawait page.click('#download-pdf');`,
              goodCode: `// Good: Validate the resulting download state\nawait page.goto('/reports');\nawait page.click('#download-pdf');\nconst download = await downloadPromise;\nassert(download.suggestedFilename() === 'report.pdf');`,
            },
          });
        }
      } else if (!isValidationNode(node) && nodeType !== "input") {
        // If it's a dead end (no outgoing edges) and is NOT a validation or safe ending node
        nodeWarnings.push({
          rule: "dead_end_path",
          severity: "warning",
          message:
            "Dead End Path: This node is a terminal action but does not validate state.",
          educationalGuide: {
            title: "Missing Downstream Assertion",
            why: "A test path should terminate in an assertion. Without validations, tests pass silently even if the application displays incorrect data or errors, creating false confidence.",
            remediation:
              "Add a validation node (e.g. Validate Semantic) at the end of this branch to assert the expected result of previous actions.",
            badCode: `// Bad: Flow stops after user interaction\nawait page.click('#save-changes');`,
            goodCode: `// Good: Flow verifies confirmation is visible\nawait page.click('#save-changes');\nawait expect(page.locator('.toast-success')).toBeVisible();`,
          },
        });
      }
    }

    // Add warnings to the mapping if any checks failed
    if (nodeWarnings.length > 0) {
      warningsMap[node.id] = nodeWarnings;
    }
  });

  return warningsMap;
}
