import { useTranslation } from "react-i18next";
import ConfirmDialog from "@/components/ui-custom/ConfirmDialog";

/**
 * BULK DELETE CONFIRMATION
 * Shows the impact (project/flow counts) before permanently deleting.
 */
export default function BulkDeleteConfirm({
  isOpen,
  projectCount = 0,
  flowCount = 0,
  onConfirm,
  onCancel,
  requireTyping = false,
}) {
  const { t } = useTranslation();

  const description = requireTyping
    ? t(
        "bulk_delete.typed_description",
        "You are about to permanently delete {{count}} project(s) containing {{flows}} flows. This cannot be undone. Type DELETE to confirm.",
        { count: projectCount, flows: flowCount },
      )
    : t(
        "bulk_delete.description",
        "You are about to permanently delete {{count}} project(s) containing {{flows}} flows. This will delete all flows, nodes, and connections. This action cannot be undone.",
        { count: projectCount, flows: flowCount },
      );

  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={t("bulk_delete.title", "Delete projects")}
      description={description}
      confirmLabel={t("bulk_delete.confirm", "Delete projects")}
      variant="destructive"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
