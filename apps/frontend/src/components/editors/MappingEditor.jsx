import React from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Trash2, Plus } from "lucide-react";

const MappingEditor = ({
  value,
  onChange,
  label,
  parentKey = "parentVar",
  childKey = "childVar",
}) => {
  const { t } = useTranslation();
  const mappings = Array.isArray(value) ? value : [];

  const updateMapping = (index, field, val) => {
    const newMappings = [...mappings];
    newMappings[index] = { ...newMappings[index], [field]: val };
    onChange(newMappings);
  };

  const addMapping = () => {
    onChange([...mappings, { [parentKey]: "", [childKey]: "" }]);
  };

  const removeMapping = (index) => {
    const newMappings = [...mappings];
    newMappings.splice(index, 1);
    onChange(newMappings);
  };

  return (
    <div className="space-y-3 mt-4 mb-2">
      <div className="flex justify-between items-center px-1">
        <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">
          {label}
        </label>
        <span className="text-[9px] text-slate-600 font-medium">
          PARENT → CHILD
        </span>
      </div>
      <div className="space-y-2">
        {mappings.map((m, index) => (
          <div
            key={`mapping-${index}`}
            className="flex items-center gap-2 p-2.5 bg-[#0f172a]/40 rounded-xl border border-white/5 group hover:border-white/10 transition-all shadow-sm"
          >
            <div className="flex-1 space-y-1">
              <input
                type="text"
                placeholder={t(
                  "nodes.placeholders.parent_variable",
                  "Var Padre",
                )}
                value={m[parentKey]}
                onChange={(e) =>
                  updateMapping(index, parentKey, e.target.value)
                }
                className="w-full bg-transparent border-none text-[10px] font-bold text-white focus:ring-0 p-0 placeholder:text-slate-700"
              />
            </div>
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white/5 shrink-0">
              <ArrowRight size={10} className="text-slate-500" />
            </div>
            <div className="flex-1 space-y-1">
              <input
                type="text"
                placeholder={t("nodes.placeholders.child_variable", "Var Hija")}
                value={m[childKey]}
                onChange={(e) => updateMapping(index, childKey, e.target.value)}
                className="w-full bg-transparent border-none text-[10px] font-bold text-sky-400 focus:ring-0 p-0 placeholder:text-slate-700"
              />
            </div>
            <button
              onClick={() => removeMapping(index)}
              className="p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 rounded-lg"
              title={t("common.remove", "Eliminar")}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        {mappings.length === 0 && (
          <div className="text-center py-4 border border-dashed border-slate-800 rounded-xl text-slate-600 text-[10px] bg-black/5">
            {t("nodes.config.no_mappings", "Sin mapeos definidos")}
          </div>
        )}
      </div>
      <button
        onClick={addMapping}
        className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-dashed border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-center gap-2 mt-1 transition-all active:scale-[0.98]"
      >
        <Plus size={12} />
        {t("nodes.config.add_mapping", "Agregar Mapeo")}
      </button>
    </div>
  );
};

export default MappingEditor;
