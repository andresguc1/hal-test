const fs = require('fs');
let content = fs.readFileSync('apps/frontend/src/App.jsx', 'utf8');

const handleRunDatasetCode = `
  const handleRunDataset = React.useCallback(async (dataset, concurrency = 2) => {
    if (!currentFlowId) {
      toast.info(t("common.save_before_dataset", "Save the flow before running dataset."));
      return;
    }
    const toastId = toast.loading(t("common.dataset_processing", "Preparing dataset run..."));
    try {
      const result = await api.post("/runs/dataset-batch", {
        flowId: currentFlowId,
        projectId: currentProject?.id,
        dataset: dataset,
        variablesMapping: {},
        concurrency: concurrency,
      });
      if (result.success) {
        toast.dismiss(toastId);
        toast.success(t("common.dataset_started", { defaultValue: \`Dataset batch started with \${result.batchId ? "batch: " + result.batchId : "success"}\` }));
        setIsDatasetModalOpen(false);
      } else {
        toast.dismiss(toastId);
        toast.error(result.message || t("common.dataset_error"));
      }
    } catch (error) {
      toast.dismiss(toastId);
      console.error("[App] Dataset run failed:", error);
      toast.error(t("common.dataset_error", "Dataset run failed") + ": " + error.message);
    }
  }, [currentFlowId, currentProject?.id, toast, t]);
`;

// Insert after handleNavigateToNode
if (content.includes('const handleNavigateToNode = ')) {
  const insertIndex = content.indexOf('const handleRunDataset =');
  if (insertIndex === -1) {
    const target = '  const handleExecuteFlow = useCallback(async () => {';
    content = content.replace(target, handleRunDatasetCode + '\n' + target);
  }
}

fs.writeFileSync('apps/frontend/src/App.jsx', content);
