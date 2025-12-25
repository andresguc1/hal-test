/**
 * Utility Functions for ReactFlow Optimization
 * Provides debounce, throttle, and other performance utilities
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {boolean} [immediate=false] - If true, trigger on leading edge instead of trailing
 * @returns {Function} Debounced function with cancel method
 *
 * @example
 * const debouncedSave = debounce(() => saveFlow(), 2000);
 * debouncedSave(); // Will execute after 2s of no calls
 * debouncedSave.cancel(); // Cancel pending execution
 */
export function debounce(func, wait, immediate = false) {
  let timeout;

  const debounced = function executedFunction(...args) {
    const context = this;

    const later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    const callNow = immediate && !timeout;

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func.apply(context, args);
  };

  debounced.cancel = function () {
    clearTimeout(timeout);
    timeout = null;
  };

  return debounced;
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds.
 *
 * @param {Function} func - The function to throttle
 * @param {number} wait - The number of milliseconds to throttle invocations to
 * @returns {Function} Throttled function
 *
 * @example
 * const throttledScroll = throttle(() => handleScroll(), 100);
 * window.addEventListener('scroll', throttledScroll);
 */
export function throttle(func, wait) {
  let inThrottle;

  return function executedFunction(...args) {
    const context = this;

    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, wait);
    }
  };
}

/**
 * Detects if adding a new edge would create a cycle in the graph
 *
 * @param {object} newConnection - The new connection to test
 * @param {string} newConnection.source - Source node id
 * @param {string} newConnection.target - Target node id
 * @param {Array} nodes - Current nodes array
 * @param {Array} edges - Current edges array
 * @returns {boolean} True if adding the edge would create a cycle
 *
 * @example
 * if (wouldCreateCycle(connection, nodes, edges)) {
 *   alert('Cannot create cycle');
 *   return;
 * }
 */
export function wouldCreateCycle(newConnection, nodes, edges) {
  // Create adjacency list including the new edge
  const adj = {};

  nodes.forEach((node) => {
    adj[node.id] = [];
  });

  // Add existing edges
  edges.forEach((edge) => {
    if (adj[edge.source]) {
      adj[edge.source].push(edge.target);
    }
  });

  // Add the new edge
  if (adj[newConnection.source]) {
    adj[newConnection.source].push(newConnection.target);
  }

  // DFS to detect cycle
  const visited = new Set();
  const recStack = new Set();

  function hasCycleDFS(nodeId) {
    if (!visited.has(nodeId)) {
      visited.add(nodeId);
      recStack.add(nodeId);

      const neighbors = adj[nodeId] || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor) && hasCycleDFS(neighbor)) {
          return true;
        } else if (recStack.has(neighbor)) {
          return true;
        }
      }
    }

    recStack.delete(nodeId);
    return false;
  }

  // Check from the source node
  return hasCycleDFS(newConnection.source);
}

/**
 * Safely parses JSON with error handling
 *
 * @param {string} jsonString - JSON string to parse
 * @param {*} [defaultValue=null] - Default value if parsing fails
 * @returns {*} Parsed object or default value
 */
export function safeJSONParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn("Failed to parse JSON:", error);
    return defaultValue;
  }
}

/**
 * Safely stringifies object to JSON with error handling
 *
 * @param {*} obj - Object to stringify
 * @param {string} [defaultValue='{}'] - Default value if stringification fails
 * @returns {string} JSON string or default value
 */
export function safeJSONStringify(obj, defaultValue = "{}") {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.warn("Failed to stringify object:", error);
    return defaultValue;
  }
}

/**
 * Generates a unique ID
 * @returns {string} Unique identifier
 */
export function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clamps a number between min and max values
 *
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Formats bytes to human readable string
 *
 * @param {number} bytes - Number of bytes
 * @param {number} [decimals=2] - Number of decimal places
 * @returns {string} Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Deep clone an object (simple implementation)
 * For complex objects with functions, use structuredClone or a library
 *
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== "object") return obj;

  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.warn("Deep clone failed, returning original:", error);
    return obj;
  }
}

/**
 * Identifies connected components (independent flows) in the graph.
 * Uses BFS to traverse the graph and group connected nodes.
 *
 * @param {Array} nodes - List of all nodes
 * @param {Array} edges - List of all edges
 * @returns {Array<Array>} Array of node arrays, where each inner array represents a connected component
 */
export function getConnectedComponents(nodes, edges) {
  if (!nodes || nodes.length === 0) return [];

  const visited = new Set();
  const components = [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Build adjacency list (undirected for component detection)
  const adj = new Map();
  nodes.forEach((n) => adj.set(n.id, []));

  edges.forEach((e) => {
    if (adj.has(e.source) && adj.has(e.target)) {
      adj.get(e.source).push(e.target);
      adj.get(e.target).push(e.source);
    }
  });

  // Iterate through all nodes to find components
  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      const component = [];
      const queue = [node.id];
      visited.add(node.id);

      while (queue.length > 0) {
        const currentId = queue.shift();
        const currentNode = nodeMap.get(currentId);
        if (currentNode) {
          component.push(currentNode);
        }

        const neighbors = adj.get(currentId) || [];
        neighbors.forEach((neighborId) => {
          if (!visited.has(neighborId)) {
            visited.add(neighborId);
            queue.push(neighborId);
          }
        });
      }

      if (component.length > 0) {
        components.push(component);
      }
    }
  });

  return components;
}
