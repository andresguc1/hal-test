export const MVP_LIMITS = {
  MAX_FLOWS_PER_PROJECT: 10,
  MAX_NODES_PER_FLOW: 100,
  MAX_EDGES_PER_FLOW: 200,
  MAX_VERSIONS_PER_PROJECT: 50,
  MAX_PROJECT_SIZE_MB: 10,
  MAX_PROJECTS: 20, // Límite total de proyectos
};

export function validateProject(project) {
  if (
    project.flows &&
    project.flows.length > MVP_LIMITS.MAX_FLOWS_PER_PROJECT
  ) {
    throw new Error(
      `Maximum ${MVP_LIMITS.MAX_FLOWS_PER_PROJECT} flows per project`,
    );
  }

  // Validar tamaño
  const sizeBytes = new Blob([JSON.stringify(project)]).size;
  const sizeMB = sizeBytes / (1024 * 1024);

  if (sizeMB > MVP_LIMITS.MAX_PROJECT_SIZE_MB) {
    throw new Error(`Project size exceeds ${MVP_LIMITS.MAX_PROJECT_SIZE_MB}MB`);
  }

  return true;
}

export function validateFlow(flow) {
  if (flow.nodes && flow.nodes.length > MVP_LIMITS.MAX_NODES_PER_FLOW) {
    throw new Error(`Maximum ${MVP_LIMITS.MAX_NODES_PER_FLOW} nodes per flow`);
  }

  if (flow.edges && flow.edges.length > MVP_LIMITS.MAX_EDGES_PER_FLOW) {
    throw new Error(`Maximum ${MVP_LIMITS.MAX_EDGES_PER_FLOW} edges per flow`);
  }

  return true;
}
