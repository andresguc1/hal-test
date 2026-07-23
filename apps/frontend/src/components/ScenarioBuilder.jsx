import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Users,
  Clock,
  AlertTriangle,
  Zap,
  TrendingUp,
  BarChart2,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Activity,
  Shield,
  Info,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Computes the stage array from the current profile + params.
 * Mirrors the backend _buildStages logic so the SVG chart is accurate.
 */
function computeStages(profile, params) {
  const p = params[profile] || {};

  switch (profile) {
    case "ramp": {
      const { initialVUs = 0, maxVUs = 20, rampTimeSec = 30, totalDurationSec = 90 } = p;
      const sustain = Math.max(1, totalDurationSec - rampTimeSec);
      const stages = [];
      if (initialVUs > 0) stages.push({ durationSec: 1, target: initialVUs });
      stages.push({ durationSec: rampTimeSec, target: maxVUs });
      if (sustain > 0) stages.push({ durationSec: sustain, target: maxVUs });
      return stages;
    }
    case "constant": {
      const { vus = 10, durationSec = 60 } = p;
      return [{ durationSec, target: vus }];
    }
    case "stress": {
      const { maxVUs = 50, durationSec = 120, stepCount = 4 } = p;
      const steps = Math.max(2, stepCount);
      const stepDur = Math.floor(durationSec / steps);
      const stages = [];
      for (let i = 1; i <= steps; i++) {
        const target = Math.ceil((maxVUs / steps) * i);
        const dur = i === steps ? durationSec - stepDur * (steps - 1) : stepDur;
        stages.push({ durationSec: dur, target });
      }
      return stages;
    }
    case "spike": {
      const {
        baseVUs = 5,
        peakVUs = 50,
        rampUpSec = 10,
        sustainSec = 20,
        cooldownSec = 20,
      } = p;
      return [
        { durationSec: rampUpSec, target: baseVUs },       // base hold → prepare
        { durationSec: 2, target: peakVUs },                // near-instant spike
        { durationSec: sustainSec, target: peakVUs },       // sustain at peak
        { durationSec: cooldownSec, target: baseVUs },      // cool down
      ];
    }
    case "soak": {
      const { vus = 10, durationMinutes = 30 } = p;
      return [{ durationSec: durationMinutes * 60, target: vus }];
    }
    case "baseline":
      return [{ durationSec: p.durationSec || 60, target: 1 }];
    case "custom":
      return p.stages || [
        { durationSec: 10, target: 5 },
        { durationSec: 30, target: 20 },
        { durationSec: 10, target: 0 },
      ];
    default:
      return [{ durationSec: 60, target: 10 }];
  }
}

/**
 * Converts stages to SVG polyline points string.
 * Stages define target VUs at end of each stage (linear interpolation from prev).
 */
function stagesToSvgPoints(stages, svgW = 280, svgH = 70, padding = 4) {
  if (!stages || stages.length === 0) return { line: "", fill: "" };

  const totalDur = stages.reduce((acc, s) => acc + (s.durationSec || 0), 0);
  const maxVU = Math.max(...stages.map((s) => s.target || 0), 1);

  const toX = (t) => padding + ((t / totalDur) * (svgW - padding * 2));
  const toY = (v) => padding + ((1 - v / maxVU) * (svgH - padding * 2));

  const pts = [];
  let elapsed = 0;
  let prevTarget = 0;

  // Start at 0 VUs
  pts.push([toX(0), toY(prevTarget)]);

  for (const stage of stages) {
    elapsed += stage.durationSec || 0;
    prevTarget = stage.target || 0;
    pts.push([toX(elapsed), toY(prevTarget)]);
  }

  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const fill = [
    ...pts,
    [toX(totalDur), svgH - padding],
    [toX(0), svgH - padding],
  ]
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  return { line, fill };
}

// ─── Profile definitions ────────────────────────────────────────────────────

const PROFILES = [
  {
    id: "ramp",
    label: "Ramp-Up",
    icon: TrendingUp,
    color: "emerald",
    tailwindActive: "bg-emerald-500/10 border-emerald-500 text-emerald-400",
    tailwindInactive: "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900",
    description: "Incrementa VUs gradualmente hasta el objetivo.",
    goal: "Detectar el punto de degradación",
  },
  {
    id: "constant",
    label: "Constant Load",
    icon: BarChart2,
    color: "blue",
    tailwindActive: "bg-blue-500/10 border-blue-500 text-blue-400",
    tailwindInactive: "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900",
    description: "Mantiene VUs fijos durante el periodo completo.",
    goal: "Validar estabilidad y memory leaks",
  },
  {
    id: "stress",
    label: "Stress Test",
    icon: AlertTriangle,
    color: "orange",
    tailwindActive: "bg-orange-500/10 border-orange-500 text-orange-400",
    tailwindInactive: "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900",
    description: "Escala en pasos hasta el colapso del sistema.",
    goal: "Descubrir el límite máximo absoluto",
  },
  {
    id: "spike",
    label: "Spike Test",
    icon: Zap,
    color: "yellow",
    tailwindActive: "bg-yellow-500/10 border-yellow-500 text-yellow-400",
    tailwindInactive: "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900",
    description: "Pico súbito de tráfico y recuperación.",
    goal: "Validar supervivencia ante eventos",
  },
  {
    id: "soak",
    label: "Soak / Endurance",
    icon: Clock,
    color: "purple",
    tailwindActive: "bg-purple-500/10 border-purple-500 text-purple-400",
    tailwindInactive: "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900",
    description: "Carga sostenida por tiempo prolongado.",
    goal: "Detectar degradación progresiva",
  },
];

// ─── Reusable slider input ──────────────────────────────────────────────────

const SliderInput = ({ label, value, min, max, step = 1, unit = "", accent = "blue", onChange, hint }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center text-xs font-medium text-slate-400">
      <span>{label}</span>
      <span className={`font-mono text-${accent}-400`}>{value}{unit}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`w-full accent-${accent}-500 cursor-pointer`}
    />
    {hint && <p className="text-[10px] text-slate-600">{hint}</p>}
  </div>
);

// ─── SVG Load Curve Chart ───────────────────────────────────────────────────

const LoadCurveChart = ({ stages, colorClass = "blue" }) => {
  const { line, fill } = useMemo(() => stagesToSvgPoints(stages, 280, 68, 4), [stages]);
  const totalDur = stages.reduce((acc, s) => acc + s.durationSec, 0);
  const maxVU = Math.max(...stages.map((s) => s.target), 1);

  const colorMap = {
    emerald: { stroke: "#10b981", fill: "#10b98120" },
    blue: { stroke: "#3b82f6", fill: "#3b82f620" },
    orange: { stroke: "#f97316", fill: "#f9731620" },
    yellow: { stroke: "#eab308", fill: "#eab30820" },
    purple: { stroke: "#a855f7", fill: "#a855f720" },
  };
  const col = colorMap[colorClass] || colorMap.blue;

  return (
    <div className="relative bg-slate-950/60 border border-slate-800/80 rounded-xl overflow-hidden">
      <div className="absolute top-2 left-3 flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
        <Users size={9} /> Proyección VUs
      </div>
      <div className="absolute top-2 right-3 text-[10px] font-mono text-slate-600">
        {maxVU} VUs · {totalDur >= 3600 ? `${(totalDur / 3600).toFixed(1)}h` : totalDur >= 60 ? `${(totalDur / 60).toFixed(0)}m` : `${totalDur}s`}
      </div>
      <svg
        viewBox="0 0 288 76"
        className="w-full h-24 mt-4"
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((r) => (
          <line
            key={r}
            x1={4}
            y1={4 + r * 68}
            x2={284}
            y2={4 + r * 68}
            stroke="#1e2535"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}
        {/* Fill area */}
        <polygon points={fill} fill={col.fill} />
        {/* Curve line */}
        <polyline
          points={line}
          fill="none"
          stroke={col.stroke}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

// ─── Profile-specific controls ──────────────────────────────────────────────

const RampControls = ({ params, setParam, accent }) => (
  <div className="grid grid-cols-2 gap-4">
    <SliderInput label="VUs Iniciales" value={params.initialVUs} min={0} max={params.maxVUs - 1} unit=" VUs" accent={accent} onChange={(v) => setParam("initialVUs", v)} hint="Usuarios al arranque (0 = desde cero)" />
    <SliderInput label="VUs Máximos" value={params.maxVUs} min={1} max={100} unit=" VUs" accent={accent} onChange={(v) => setParam("maxVUs", Math.max(v, params.initialVUs + 1))} />
    <SliderInput label="Tiempo de Rampa" value={params.rampTimeSec} min={5} max={params.totalDurationSec - 5} unit="s" accent={accent} onChange={(v) => setParam("rampTimeSec", v)} hint="Segundos para subir de inicial → máximo" />
    <SliderInput label="Duración Total" value={params.totalDurationSec} min={params.rampTimeSec + 5} max={300} step={5} unit="s" accent={accent} onChange={(v) => setParam("totalDurationSec", v)} />
  </div>
);

const ConstantControls = ({ params, setParam, accent }) => (
  <div className="grid grid-cols-2 gap-4">
    <SliderInput label="Usuarios Virtuales" value={params.vus} min={1} max={100} unit=" VUs" accent={accent} onChange={(v) => setParam("vus", v)} hint="Número fijo de VUs durante toda la prueba" />
    <SliderInput label="Duración Total" value={params.durationSec} min={10} max={300} step={10} unit="s" accent={accent} onChange={(v) => setParam("durationSec", v)} />
  </div>
);

const StressControls = ({ params, setParam, accent }) => (
  <div className="grid grid-cols-2 gap-4">
    <SliderInput label="VUs Máximos" value={params.maxVUs} min={5} max={100} unit=" VUs" accent={accent} onChange={(v) => setParam("maxVUs", v)} hint="Límite máximo del escalado" />
    <SliderInput label="Duración Total" value={params.durationSec} min={30} max={300} step={10} unit="s" accent={accent} onChange={(v) => setParam("durationSec", v)} />
    <SliderInput label="Número de Pasos" value={params.stepCount} min={2} max={8} unit="" accent={accent} onChange={(v) => setParam("stepCount", v)} hint="Escalones de incremento" />
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs font-medium text-slate-400">
        <span className="flex items-center gap-1"><Shield size={12} className="text-orange-400" /> Auto-Stop</span>
        <span className="font-mono text-orange-400">{params.stopAtErrorRate}%</span>
      </div>
      <input
        type="range"
        min={5}
        max={50}
        step={5}
        value={params.stopAtErrorRate}
        onChange={(e) => setParam("stopAtErrorRate", Number(e.target.value))}
        className="w-full accent-orange-500 cursor-pointer"
      />
      <p className="text-[10px] text-slate-600">Detiene automáticamente al superar esta tasa de error</p>
    </div>
  </div>
);

const SpikeControls = ({ params, setParam, accent }) => (
  <div className="grid grid-cols-2 gap-4">
    <SliderInput label="Carga Base" value={params.baseVUs} min={1} max={params.peakVUs - 1} unit=" VUs" accent={accent} onChange={(v) => setParam("baseVUs", v)} hint="VUs antes y después del pico" />
    <SliderInput label="Pico Máximo" value={params.peakVUs} min={params.baseVUs + 1} max={100} unit=" VUs" accent={accent} onChange={(v) => setParam("peakVUs", Math.max(v, params.baseVUs + 1))} />
    <SliderInput label="Tiempo de Subida" value={params.rampUpSec} min={2} max={60} unit="s" accent={accent} onChange={(v) => setParam("rampUpSec", v)} hint="Tiempo en base antes del pico" />
    <SliderInput label="Duración en Pico" value={params.sustainSec} min={5} max={120} step={5} unit="s" accent={accent} onChange={(v) => setParam("sustainSec", v)} />
    <SliderInput label="Tiempo de Enfriamiento" value={params.cooldownSec} min={5} max={120} step={5} unit="s" accent={accent} onChange={(v) => setParam("cooldownSec", v)} hint="Recuperación tras el pico" />
  </div>
);

const SoakControls = ({ params, setParam, accent }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <SliderInput label="Usuarios Virtuales" value={params.vus} min={1} max={50} unit=" VUs" accent={accent} onChange={(v) => setParam("vus", v)} />
      <SliderInput label="Duración" value={params.durationMinutes} min={5} max={60} step={5} unit=" min" accent={accent} onChange={(v) => setParam("durationMinutes", v)} />
    </div>
    <div className="flex items-start gap-2.5 bg-purple-500/5 border border-purple-500/20 rounded-xl p-3 text-[11px] text-purple-300/80">
      <Info size={14} className="text-purple-400 shrink-0 mt-0.5" />
      <span>
        El plan gratuito limita Soak a <strong>60 minutos</strong> para proteger los recursos compartidos de la nube.
        Pruebas de larga duración (8–24h) están disponibles en planes <strong>On-Premise</strong> y <strong>Enterprise</strong>.
      </span>
    </div>
  </div>
);

// ─── Custom Stage Editor ─────────────────────────────────────────────────────

const CustomStageEditor = ({ stages, onChange }) => {
  const addStage = () => onChange([...stages, { durationSec: 10, target: 10 }]);
  const updateStage = (i, field, val) => {
    const next = [...stages];
    next[i] = { ...next[i], [field]: Number(val) || 0 };
    onChange(next);
  };
  const removeStage = (i) => stages.length > 1 && onChange(stages.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold uppercase tracking-widest px-1">
        <span>Duración (seg)</span>
        <span>Target VUs</span>
      </div>
      <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
        <AnimatePresence>
          {stages.map((stage, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-2 bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800"
            >
              <Clock size={13} className="text-slate-500 shrink-0" />
              <input
                type="number"
                min="1"
                value={stage.durationSec}
                onChange={(e) => updateStage(i, "durationSec", e.target.value)}
                className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm text-slate-200 outline-none focus:border-blue-500"
              />
              <span className="text-slate-600 text-xs">s</span>
              <Users size={13} className="text-slate-500 shrink-0 ml-2" />
              <input
                type="number"
                min="0"
                value={stage.target}
                onChange={(e) => updateStage(i, "target", e.target.value)}
                className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm text-slate-200 outline-none focus:border-blue-500"
              />
              <span className="text-slate-600 text-xs">VUs</span>
              <button
                type="button"
                onClick={() => removeStage(i)}
                className="ml-auto p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <button
        type="button"
        onClick={addStage}
        className="w-full py-2 flex items-center justify-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 border-dashed rounded-xl transition-colors"
      >
        <Plus size={14} /> Añadir Fase
      </button>
    </div>
  );
};

// ─── Main ScenarioBuilder ───────────────────────────────────────────────────

const DEFAULT_PARAMS = {
  ramp:     { initialVUs: 0, maxVUs: 20, rampTimeSec: 30, totalDurationSec: 90 },
  constant: { vus: 10, durationSec: 60 },
  stress:   { maxVUs: 50, durationSec: 120, stepCount: 4, stopAtErrorRate: 15 },
  spike:    { baseVUs: 5, peakVUs: 50, rampUpSec: 10, sustainSec: 20, cooldownSec: 20 },
  soak:     { vus: 10, durationMinutes: 30 },
  baseline: { durationSec: 60 },
  custom:   { stages: [{ durationSec: 10, target: 5 }, { durationSec: 30, target: 20 }, { durationSec: 10, target: 0 }] },
};

const ScenarioBuilder = ({ onRun, flowName: _flowName, initialConfig }) => {
  const [activeProfile, setActiveProfile] = useState(
    initialConfig?.profile || "constant"
  );
  const [profileParams, setProfileParams] = useState(() => {
    const defaults = { ...DEFAULT_PARAMS };
    // Seed from initialConfig if provided
    if (initialConfig) {
      const { profile, virtualUsers, vus, duration, rampUp } = initialConfig;
      if (profile && defaults[profile]) {
        if (profile === "constant") {
          defaults.constant.vus = virtualUsers || vus || defaults.constant.vus;
          defaults.constant.durationSec = duration || defaults.constant.durationSec;
        } else if (profile === "ramp") {
          defaults.ramp.maxVUs = virtualUsers || vus || defaults.ramp.maxVUs;
          defaults.ramp.totalDurationSec = duration || defaults.ramp.totalDurationSec;
          defaults.ramp.rampTimeSec = rampUp || defaults.ramp.rampTimeSec;
        }
      }
    }
    return defaults;
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Sync with initialConfig changes
  React.useEffect(() => {
    if (initialConfig?.profile) {
      setActiveProfile(initialConfig.profile);
      if (initialConfig.profile === "constant") {
        setProfileParams((prev) => ({
          ...prev,
          constant: {
            ...prev.constant,
            vus: initialConfig.virtualUsers || initialConfig.vus || prev.constant.vus,
            durationSec: initialConfig.duration || prev.constant.durationSec,
          },
        }));
      }
    }
  }, [initialConfig]);

  const setParam = useCallback((profileKey, key, value) => {
    setProfileParams((prev) => ({
      ...prev,
      [profileKey]: { ...prev[profileKey], [key]: value },
    }));
  }, []);

  const stages = useMemo(
    () => computeStages(activeProfile, profileParams),
    [activeProfile, profileParams]
  );

  const totalDuration = useMemo(
    () => stages.reduce((acc, s) => acc + s.durationSec, 0),
    [stages]
  );
  const maxVUs = useMemo(
    () => Math.max(...stages.map((s) => s.target), 1),
    [stages]
  );

  const estimatedRamMb = maxVUs * 250;
  const isDangerous = estimatedRamMb > 4000;

  const activeProfileDef = PROFILES.find((p) => p.id === activeProfile);
  const accentColor = activeProfileDef?.color || "blue";

  const handleSubmit = (e) => {
    e.preventDefault();
    const p = profileParams[activeProfile];

    if (activeProfile === "custom") {
      onRun({ profile: "custom", stages: p.stages, vus: maxVUs, duration: totalDuration });
    } else if (activeProfile === "baseline") {
      onRun({ profile: "baseline", vus: 1, duration: p.durationSec });
    } else {
      // Send pre-computed stages + metadata for all standard profiles
      const config = {
        profile: activeProfile,
        stages,
        vus: maxVUs,
        duration: totalDuration,
      };
      if (activeProfile === "stress") {
        config.stopAtErrorRate = profileParams.stress.stopAtErrorRate;
      }
      onRun(config);
    }
  };

  return (
    <div className="w-full flex flex-col bg-slate-900/50 rounded-2xl">
      <form onSubmit={handleSubmit} className="space-y-5 flex flex-col">

        {/* Profile Selector */}
        <div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">
            Tipo de Prueba
          </div>
          <div className="grid grid-cols-5 gap-2">
            {PROFILES.map((p) => {
              const Icon = p.icon;
              const isActive = activeProfile === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActiveProfile(p.id)}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-center transition-all duration-200 ${
                    isActive ? p.tailwindActive : p.tailwindInactive
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-[11px] font-semibold leading-tight">{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Profile description strip */}
          {activeProfileDef && (
            <motion.div
              key={activeProfile}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/40 border border-slate-800/60 rounded-xl px-3 py-2"
            >
              <activeProfileDef.icon size={13} className={`text-${accentColor}-400 shrink-0`} />
              <span>{activeProfileDef.description}</span>
              <span className={`ml-auto shrink-0 text-${accentColor}-400 font-medium`}>
                🎯 {activeProfileDef.goal}
              </span>
            </motion.div>
          )}
        </div>

        {/* SVG Load Curve Chart */}
        <LoadCurveChart stages={stages} colorClass={accentColor} />

        {/* Dynamic Controls */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeProfile}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {activeProfile === "ramp" && (
              <RampControls
                params={profileParams.ramp}
                setParam={(k, v) => setParam("ramp", k, v)}
                accent="emerald"
              />
            )}
            {activeProfile === "constant" && (
              <ConstantControls
                params={profileParams.constant}
                setParam={(k, v) => setParam("constant", k, v)}
                accent="blue"
              />
            )}
            {activeProfile === "stress" && (
              <StressControls
                params={profileParams.stress}
                setParam={(k, v) => setParam("stress", k, v)}
                accent="orange"
              />
            )}
            {activeProfile === "spike" && (
              <SpikeControls
                params={profileParams.spike}
                setParam={(k, v) => setParam("spike", k, v)}
                accent="yellow"
              />
            )}
            {activeProfile === "soak" && (
              <SoakControls
                params={profileParams.soak}
                setParam={(k, v) => setParam("soak", k, v)}
                accent="purple"
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Advanced Section (Baseline + Custom) */}
        <div className="border-t border-slate-800/60 pt-3">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-2 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showAdvanced ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span className="font-semibold uppercase tracking-wider">Opciones Avanzadas</span>
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-3 overflow-hidden"
              >
                {/* Baseline */}
                <button
                  type="button"
                  onClick={() => setActiveProfile("baseline")}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    activeProfile === "baseline"
                      ? "bg-slate-500/10 border-slate-400 text-slate-200"
                      : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <Activity size={16} />
                  <div>
                    <p className="text-xs font-semibold">Baseline (1 VU)</p>
                    <p className="text-[10px] text-slate-500">Establece métricas de referencia con un solo usuario</p>
                  </div>
                </button>
                {activeProfile === "baseline" && (
                  <SliderInput
                    label="Duración"
                    value={profileParams.baseline.durationSec}
                    min={10}
                    max={300}
                    step={10}
                    unit="s"
                    accent="slate"
                    onChange={(v) => setParam("baseline", "durationSec", v)}
                  />
                )}

                {/* Custom stages */}
                <button
                  type="button"
                  onClick={() => setActiveProfile("custom")}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    activeProfile === "custom"
                      ? "bg-slate-500/10 border-slate-400 text-slate-200"
                      : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <BarChart2 size={16} />
                  <div>
                    <p className="text-xs font-semibold">Personalizado (Stages)</p>
                    <p className="text-[10px] text-slate-500">Define manualmente cada fase temporal y su objetivo de VUs</p>
                  </div>
                </button>
                {activeProfile === "custom" && (
                  <CustomStageEditor
                    stages={profileParams.custom.stages}
                    onChange={(s) => setParam("custom", "stages", s)}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Resource Warning */}
        <div
          className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-colors ${
            isDangerous
              ? "bg-red-950/30 border-red-900/50 text-red-200"
              : "bg-slate-800/30 border-slate-700/50 text-slate-400"
          }`}
        >
          <AlertTriangle
            size={15}
            className={isDangerous ? "text-red-400 shrink-0 mt-0.5" : "text-slate-500 shrink-0 mt-0.5"}
          />
          <div>
            <strong className={`block mb-0.5 text-xs ${isDangerous ? "text-red-300" : "text-slate-300"}`}>
              Estimación de Recursos
            </strong>
            Pico de {maxVUs} navegador{maxVUs !== 1 ? "es" : ""} headless. RAM ≈{" "}
            <strong className={isDangerous ? "text-red-400 font-mono" : "text-blue-400 font-mono"}>
              {(estimatedRamMb / 1024).toFixed(1)} GB
            </strong>
            {isDangerous && (
              <span className="block mt-1 font-semibold text-red-300">
                ⚠️ Riesgo de OOM. Reduzca los VUs máximos.
              </span>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className={`w-full flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold text-white rounded-xl transition-all shadow-lg bg-${accentColor}-600 hover:bg-${accentColor}-500 shadow-${accentColor}-500/20 hover:shadow-${accentColor}-500/40`}
        >
          <Zap size={16} fill="currentColor" /> Iniciar Prueba de Carga
        </button>
      </form>
    </div>
  );
};

export default ScenarioBuilder;
