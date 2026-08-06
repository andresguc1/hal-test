import React, { useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Info,
  Plus,
  Trash2,
  GripVertical,
  Type,
  MousePointerClick,
  CheckSquare,
  FileUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const FIELD_TYPES = [
  { value: "text", label: "Texto", icon: Type },
  { value: "select", label: "Selector (Dropdown)", icon: MousePointerClick },
  { value: "checkbox", label: "Checkbox", icon: CheckSquare },
  { value: "radio", label: "Radio Button", icon: CheckSquare },
  { value: "file", label: "File Upload", icon: FileUp },
];

const SortableFieldItem = ({
  id,
  field: f,
  index,
  updateField,
  removeField,
  pickingField,
  onStartPick,
  onCancelPick,
  t,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : 1,
    position: "relative",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "px-3 py-2.5 bg-[#0f172a]/60 border border-indigo-500/15 hover:border-indigo-500/30 rounded-xl space-y-2 relative group/field transition-all",
        isDragging && "shadow-xl border-indigo-500/50 bg-[#1e293b]",
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex flex-col items-center gap-1 shrink-0 cursor-grab active:cursor-grabbing px-1 hover:bg-slate-800 rounded py-1 transition-colors"
          {...attributes}
          {...listeners}
        >
          <GripVertical
            size={14}
            className="text-slate-600 group-hover/field:text-indigo-400 transition-colors"
          />
          <span className="text-[8px] font-mono text-slate-500">
            {index + 1}
          </span>
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <select
              value={f.type || "text"}
              onChange={(e) => updateField(index, "type", e.target.value)}
              className="bg-[#0b1222] border border-slate-700 text-slate-200 text-xs rounded-md px-2 py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none w-1/3"
            >
              {FIELD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <div className="flex-1 flex gap-1 relative">
              <input
                type="text"
                value={f.selector || ""}
                onChange={(e) => updateField(index, "selector", e.target.value)}
                placeholder="CSS/XPath Selector"
                className="flex-1 bg-[#0b1222] border border-slate-700 text-slate-200 text-xs rounded-md px-2 py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none min-w-0"
              />
              <button
                type="button"
                onClick={() => {
                  const fieldPath = `fields.${index}.selector`;
                  if (pickingField === fieldPath) {
                    onCancelPick?.();
                  } else {
                    onStartPick?.(fieldPath);
                  }
                }}
                title={t("common.pick", "Pick")}
                className={cn(
                  "px-2 flex items-center justify-center rounded-md transition-colors shrink-0",
                  pickingField === `fields.${index}.selector`
                    ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                    : "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30",
                )}
              >
                <MousePointerClick size={12} />
              </button>
            </div>
          </div>
          <input
            type="text"
            value={f.value || ""}
            onChange={(e) => updateField(index, "value", e.target.value)}
            placeholder="Value or {{variable}}"
            className="w-full bg-[#0b1222] border border-slate-700 text-slate-200 text-xs rounded-md px-2 py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => removeField(index)}
          className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors shrink-0"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};

const FormFillEditor = React.memo(
  ({ value, onChange, onStartPick, onCancelPick, pickingField }) => {
    const { t } = useTranslation();

    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 5, // Requires 5px movement before dragging starts (allows clicks on elements inside)
        },
      }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      }),
    );

    const fields = useMemo(() => {
      try {
        return Array.isArray(value)
          ? value
          : typeof value === "string"
            ? JSON.parse(value)
            : [];
      } catch {
        return [];
      }
    }, [value]);

    const updateField = useCallback(
      (index, key, val) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], [key]: val };
        onChange(newFields);
      },
      [fields, onChange],
    );

    const addField = useCallback(() => {
      const id = `field_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      onChange([
        ...fields,
        { id, type: "text", selector: "", value: "", delay: 0 },
      ]);
    }, [fields, onChange]);

    const removeField = useCallback(
      (index) => {
        const newFields = [...fields];
        newFields.splice(index, 1);
        onChange(newFields);
      },
      [fields, onChange],
    );

    const handleDragEnd = useCallback(
      (event) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
          const oldIndex = fields.findIndex((f) => f.id === active.id);
          const newIndex = fields.findIndex((f) => f.id === over.id);

          const newFields = arrayMove(fields, oldIndex, newIndex);
          onChange(newFields);
        }
      },
      [fields, onChange],
    );

    return (
      <div className="space-y-3 mt-2 mb-2">
        <div className="flex justify-between items-center">
          <label className="text-[11px] uppercase tracking-[0.2em] font-black text-indigo-400 ml-1 flex items-center gap-2">
            {t("nodes.config.form_fields", "Form Fields")}
            {fields.length > 0 && (
              <span className="text-[9px] bg-indigo-500/10 text-indigo-400/70 px-1.5 py-0.5 rounded-full">
                {fields.length}
              </span>
            )}
          </label>
          <div className="group relative">
            <Info
              size={14}
              className="text-slate-500 hover:text-indigo-400 cursor-help transition-colors"
            />
            <div className="absolute right-0 bottom-full mb-2 w-56 p-3 bg-slate-900 border border-slate-700 rounded-lg text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl space-y-1">
              <p className="font-bold text-indigo-400">How it works</p>
              <p>
                Fields are filled sequentially. Variables like {"{{var}}"} will
                be resolved at runtime.
              </p>
            </div>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {fields.map((f, index) => (
                <SortableFieldItem
                  key={f.id}
                  id={f.id}
                  field={f}
                  index={index}
                  updateField={updateField}
                  removeField={removeField}
                  pickingField={pickingField}
                  onStartPick={onStartPick}
                  onCancelPick={onCancelPick}
                  t={t}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <button
          type="button"
          onClick={addField}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-indigo-500/30 rounded-xl text-[10px] font-bold text-indigo-400/80 uppercase tracking-wider hover:bg-indigo-500/10 hover:border-indigo-500/50 hover:text-indigo-400 transition-all"
        >
          <Plus size={14} /> Add Field
        </button>
      </div>
    );
  },
);

FormFillEditor.displayName = "FormFillEditor";
export default FormFillEditor;
