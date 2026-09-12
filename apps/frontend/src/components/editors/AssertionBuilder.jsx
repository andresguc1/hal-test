import React, { useMemo, useCallback } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, AlertCircle, HelpCircle } from "lucide-react";
import VariableInput from "../VariableInput";

const ASSERTION_TYPES = [
    { value: "existence", label: "Existence", description: "Verify element exists or not", icon: "🔍" },
    { value: "visibility", label: "Visibility", description: "Verify element is visible or hidden", icon: "👁️" },
    { value: "text", label: "Text Content", description: "Verify element text content", icon: "📝" },
    { value: "count", label: "Element Count", description: "Verify number of matching elements", icon: "🔢" },
    { value: "attribute", label: "Attribute", description: "Verify HTML attribute value", icon: "🏷️" },
    { value: "value", label: "Input Value", description: "Verify form input/select value", icon: "📥" },
    { value: "state", label: "Element State", description: "Verify enabled/disabled/checked/etc.", icon: "⚙️" },
    { value: "css_property", label: "CSS Property", description: "Verify computed CSS property", icon: "🎨" },
    { value: "page", label: "Page (URL/Title)", description: "Verify page URL or title", icon: "🌐" },
];

const OPERATORS_BY_TYPE = {
    existence: [
        { value: "exists", label: "Exists" },
        { value: "not_exists", label: "Does Not Exist" },
    ],
    visibility: [
        { value: "visible", label: "Is Visible" },
        { value: "hidden", label: "Is Hidden" },
    ],
    text: [
        { value: "equals", label: "Equals" },
        { value: "not_equals", label: "Does Not Equal" },
        { value: "contains", label: "Contains" },
        { value: "not_contains", label: "Does Not Contain" },
        { value: "empty", label: "Is Empty" },
        { value: "not_empty", label: "Is Not Empty" },
        { value: "regex", label: "Matches Regex" },
        { value: "not_regex", label: "Does Not Match Regex" },
    ],
    count: [
        { value: "equals", label: "Equals" },
        { value: "not_equals", label: "Does Not Equal" },
        { value: "greater_than", label: "Greater Than" },
        { value: "less_than", label: "Less Than" },
        { value: "greater_or_equal", label: "Greater or Equal" },
        { value: "less_or_equal", label: "Less or Equal" },
        { value: "between", label: "Between (min/max)" },
    ],
    attribute: [
        { value: "equals", label: "Equals" },
        { value: "not_equals", label: "Does Not Equal" },
        { value: "contains", label: "Contains" },
        { value: "not_contains", label: "Does Not Contain" },
        { value: "empty", label: "Is Empty/Missing" },
        { value: "not_empty", label: "Is Not Empty" },
        { value: "regex", label: "Matches Regex" },
        { value: "not_regex", label: "Does Not Match Regex" },
    ],
    value: [
        { value: "equals", label: "Equals" },
        { value: "not_equals", label: "Does Not Equal" },
        { value: "contains", label: "Contains" },
        { value: "not_contains", label: "Does Not Contain" },
        { value: "empty", label: "Is Empty" },
        { value: "not_empty", label: "Is Not Empty" },
        { value: "regex", label: "Matches Regex" },
        { value: "not_regex", label: "Does Not Match Regex" },
    ],
    state: [
        { value: "enabled", label: "Enabled" },
        { value: "disabled", label: "Disabled" },
        { value: "checked", label: "Checked" },
        { value: "unchecked", label: "Unchecked" },
        { value: "selected", label: "Selected" },
        { value: "not_selected", label: "Not Selected" },
        { value: "focused", label: "Focused" },
        { value: "not_focused", label: "Not Focused" },
        { value: "readonly", label: "Readonly" },
        { value: "not_readonly", label: "Not Readonly" },
        { value: "required", label: "Required" },
        { value: "not_required", label: "Not Required" },
    ],
    css_property: [
        { value: "equals", label: "Equals" },
        { value: "not_equals", label: "Does Not Equal" },
        { value: "contains", label: "Contains" },
        { value: "not_contains", label: "Does Not Contain" },
        { value: "regex", label: "Matches Regex" },
        { value: "not_regex", label: "Does Not Match Regex" },
    ],
    page: [
        { value: "url_equals", label: "URL Equals" },
        { value: "url_not_equals", label: "URL Does Not Equal" },
        { value: "url_contains", label: "URL Contains" },
        { value: "url_not_contains", label: "URL Does Not Contain" },
        { value: "url_regex", label: "URL Matches Regex" },
        { value: "url_not_regex", label: "URL Does Not Match Regex" },
        { value: "title_equals", label: "Title Equals" },
        { value: "title_not_equals", label: "Title Does Not Equal" },
        { value: "title_contains", label: "Title Contains" },
        { value: "title_not_contains", label: "Title Does Not Contain" },
        { value: "title_regex", label: "Title Matches Regex" },
        { value: "title_not_regex", label: "Title Does Not Match Regex" },
    ],
};

const OPERATORS_NO_VALUE = ["empty", "not_empty", "exists", "not_exists"];

const OPERATORS_MIN_MAX = ["between"];

function AssertionRow({
    assertion,
    index,
    onUpdate,
    onRemove,
    onMove,
    onTypeChange,
    variablesMap,
    availableVariablePaths,
    t,
}) {
    const type = assertion.type || "existence";
    const operators = OPERATORS_BY_TYPE[type] || OPERATORS_BY_TYPE.existence;
    const operator = assertion.operator || operators[0].value;
    const needsValue = !OPERATORS_NO_VALUE.includes(operator);
    const needsMinMax = OPERATORS_MIN_MAX.includes(operator);
    const needsAttribute = type === "attribute";
    const needsCssProperty = type === "css_property";
    const needsCaseSensitive = ["text", "attribute", "value", "css_property", "page"].includes(type);
    const needsRegex = ["text", "attribute", "value", "css_property", "page"].includes(type);

    return (
        <div className="px-3 py-3 bg-[#0f172a]/60 border border-indigo-500/15 hover:border-indigo-500/30 rounded-xl space-y-3 relative group/field transition-all">
            <div className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-1 shrink-0">
                    <ArrowUp
                        size={12}
                        className="text-slate-600 hover:text-indigo-400 cursor-pointer transition-colors"
                        onClick={() => onMove(index, -1)}
                        disabled={index === 0}
                        aria-label={t("common.move_up", "Move up")}
                    />
                    <span className="text-[8px] font-mono text-slate-500">{index + 1}</span>
                    <ArrowDown
                        size={12}
                        className="text-slate-600 hover:text-indigo-400 cursor-pointer transition-colors"
                        onClick={() => onMove(index, 1)}
                        aria-label={t("common.move_down", "Move down")}
                    />
                </div>

                <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex flex-wrap gap-2">
                        <select
                            value={type}
                            onChange={(e) => onTypeChange(index, e.target.value)}
                            className="bg-[#0b1222] border border-slate-700 text-slate-200 text-xs rounded-md px-2 py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none w-full sm:w-40"
                        >
                            {ASSERTION_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.icon} {t.label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={operator}
                            onChange={(e) => onUpdate(index, "operator", e.target.value)}
                            className="bg-[#0b1222] border border-slate-700 text-slate-200 text-xs rounded-md px-2 py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none w-full sm:w-40"
                        >
                            {operators.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {(needsAttribute || needsCssProperty) && (
                        <div className="flex gap-2">
                            <VariableInput
                                value={assertion[needsAttribute ? "attribute" : "cssProperty"] || ""}
                                type="text"
                                variables={variablesMap}
                                suggestions={availableVariablePaths}
                                onChange={(val) => onUpdate(index, needsAttribute ? "attribute" : "cssProperty", val)}
                                placeholder={t(needsAttribute ? "nodes.placeholders.attributeName" : "nodes.placeholders.cssProperty")}
                                className="w-full sm:w-48 px-3 py-2 text-xs font-mono"
                            />
                            <span className="text-[10px] text-slate-500 self-center px-2">
                                {needsAttribute ? t("nodes.fields.attributeName") : t("nodes.fields.cssProperty")}
                            </span>
                        </div>
                    )}

                    {needsValue && !needsMinMax && (
                        <div className="flex gap-2">
                            <VariableInput
                                value={assertion.expected ?? ""}
                                type="text"
                                variables={variablesMap}
                                suggestions={availableVariablePaths}
                                onChange={(val) => onUpdate(index, "expected", val)}
                                placeholder={t("nodes.placeholders.expected")}
                                className="flex-1 min-w-0 px-3 py-2 text-xs font-mono"
                            />
                            <span className="text-[10px] text-slate-500 self-center px-2">
                                {t("nodes.fields.expected")}
                            </span>
                        </div>
                    )}

                    {needsMinMax && (
                        <div className="flex gap-2">
                            <VariableInput
                                value={assertion.min ?? ""}
                                type="number"
                                variables={variablesMap}
                                suggestions={availableVariablePaths}
                                onChange={(val) => onUpdate(index, "min", val)}
                                placeholder={t("nodes.placeholders.min")}
                                className="w-32 px-3 py-2 text-xs font-mono"
                            />
                            <span className="text-[10px] text-slate-500 self-center px-2">{t("nodes.fields.min")}</span>
                            <VariableInput
                                value={assertion.max ?? ""}
                                type="number"
                                variables={variablesMap}
                                suggestions={availableVariablePaths}
                                onChange={(val) => onUpdate(index, "max", val)}
                                placeholder={t("nodes.placeholders.max")}
                                className="w-32 px-3 py-2 text-xs font-mono"
                            />
                            <span className="text-[10px] text-slate-500 self-center px-2">{t("nodes.fields.max")}</span>
                        </div>
                    )}

                    {needsCaseSensitive && (
                        <div className="flex flex-wrap gap-4 pt-1">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={assertion.caseSensitive === true}
                                    onChange={(e) => onUpdate(index, "caseSensitive", e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                                />
                                <span className="text-[10px] text-slate-400">{t("nodes.fields.caseSensitive")}</span>
                            </label>
                            {needsRegex && (
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={assertion.regex === true}
                                        onChange={(e) => onUpdate(index, "regex", e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                                    />
                                    <span className="text-[10px] text-slate-400">{t("nodes.fields.regex")}</span>
                                </label>
                            )}
                            {assertion.regex && (
                                <VariableInput
                                    value={assertion.regexFlags || ""}
                                    type="text"
                                    variables={variablesMap}
                                    suggestions={availableVariablePaths}
                                    onChange={(val) => onUpdate(index, "regexFlags", val)}
                                    placeholder={t("nodes.placeholders.regexFlags")}
                                    className="w-32 px-3 py-2 text-xs font-mono"
                                />
                            )}
                        </div>
                    )}

                    {assertion.type === "page" && assertion.operator && assertion.operator.startsWith("title_") && (
                        <div className="text-[10px] text-indigo-400/80 flex items-center gap-1">
                            <HelpCircle size={10} />
                            <span>{t("nodes.hints.page_title", "Uses page.title() — no element selector needed")}</span>
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    aria-label={t("common.remove", "Remove assertion")}
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}

export function AssertionBuilder({
    value,
    onChange,
    variablesMap = {},
    availableVariablePaths = [],
    t,
}) {
    const assertions = useMemo(() => Array.isArray(value) ? value : [], [value]);

    const handleAdd = useCallback(() => {
        onChange([...assertions, { type: "existence", operator: "exists" }]);
    }, [assertions, onChange]);

    const handleRemove = useCallback((index) => {
        onChange(assertions.filter((_, i) => i !== index));
    }, [assertions, onChange]);

    const handleUpdate = useCallback((index, key, val) => {
        onChange(
            assertions.map((a, i) => (i === index ? { ...a, [key]: val } : a))
        );
    }, [assertions, onChange]);

    // Type + operator are always switched together. Doing it in a single
    // onChange avoids stale-closure bugs where the second onUpdate() call
    // overwrote the first and left the type stuck on the previous value.
    const handleTypeChange = useCallback((index, newType) => {
        const newOperators = OPERATORS_BY_TYPE[newType] || OPERATORS_BY_TYPE.existence;
        onChange(
            assertions.map((a, i) => {
                if (i !== index) return a;
                const next = { ...a, type: newType, operator: newOperators[0].value };
                if (newType !== "attribute") delete next.attribute;
                if (newType !== "css_property") delete next.cssProperty;
                return next;
            })
        );
    }, [assertions, onChange]);

    const handleMove = useCallback((index, direction) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= assertions.length) return;
        const newAssertions = [...assertions];
        [newAssertions[index], newAssertions[newIndex]] = [newAssertions[newIndex], newAssertions[index]];
        onChange(newAssertions);
    }, [assertions, onChange]);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-2">
                    <span>{t("nodes.fields.assertions")}</span>
                    {assertions.length > 0 && (
                        <span className="px-2 py-0.5 text-[9px] font-mono bg-indigo-500/20 text-indigo-400 rounded border border-indigo-500/20">
                            {assertions.length}
                        </span>
                    )}
                </label>
                <button
                    type="button"
                    onClick={handleAdd}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all"
                >
                    <Plus size={12} />
                    <span>{t("common.add", "Add assertion")}</span>
                </button>
            </div>

            {assertions.length === 0 ? (
                <div className="p-6 rounded-xl border-2 border-dashed border-slate-700/50 bg-slate-950/30 text-center">
                    <AlertCircle size={24} className="mx-auto text-slate-600 mb-2" />
                    <p className="text-sm text-slate-500 mb-3">{t("nodes.placeholders.assertions")}</p>
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all"
                    >
                        <Plus size={12} />
                        <span>{t("common.add_first", "Add first assertion")}</span>
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {assertions.map((assertion, index) => (
                        <AssertionRow
                            key={index}
                            assertion={assertion}
                            index={index}
                            onUpdate={handleUpdate}
                            onRemove={handleRemove}
                            onMove={handleMove}
                            onTypeChange={handleTypeChange}
                            variablesMap={variablesMap}
                            availableVariablePaths={availableVariablePaths}
                            t={t}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default AssertionBuilder;