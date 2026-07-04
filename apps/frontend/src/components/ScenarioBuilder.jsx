import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Activity,
  Users,
  Clock,
  AlertTriangle,
  ChevronRight,
  X,
  Plus,
  Trash2,
  Zap,
  TrendingUp,
  BarChart2,
} from "lucide-react";

const ScenarioBuilder = ({ onRun, flowName }) => {
  const [profile, setProfile] = useState("constant");
  const [vus, setVus] = useState(5);
  const [duration, setDuration] = useState(30);
  const [rampUp, setRampUp] = useState(10);

  // For custom stages
  const [stages, setStages] = useState([
    { durationSec: 10, target: 5 },
    { durationSec: 30, target: 20 },
    { durationSec: 10, target: 0 },
  ]);

  // Derived values for visualization and limits
  const { totalDuration, maxVUs, chartData } = useMemo(() => {
    let maxVUs = 0;
    let totalDuration = 0;
    let chartData = [];

    if (profile === "custom") {
      maxVUs = Math.max(...stages.map((s) => s.target), 1);
      totalDuration = stages.reduce((acc, s) => acc + s.durationSec, 0);

      let timeAccum = 0;
      stages.forEach((s) => {
        chartData.push({ time: timeAccum, vus: s.target, stage: s });
        timeAccum += s.durationSec;
      });
      chartData.push({
        time: timeAccum,
        vus: stages[stages.length - 1]?.target || 0,
      });
    } else {
      maxVUs = profile === "baseline" ? 1 : vus;
      totalDuration = duration;

      if (
        profile === "constant" ||
        profile === "endurance" ||
        profile === "baseline"
      ) {
        chartData = [
          { time: 0, vus: maxVUs },
          { time: duration, vus: maxVUs },
        ];
      } else if (profile === "spike") {
        const low = maxVUs * 0.1;
        chartData = [
          { time: 0, vus: low },
          { time: duration * 0.3, vus: low },
          { time: duration * 0.3, vus: maxVUs },
          { time: duration * 0.5, vus: maxVUs },
          { time: duration * 0.5, vus: low },
          { time: duration, vus: low },
        ];
      } else if (profile === "ramp" || profile === "load") {
        chartData = [
          { time: 0, vus: 0 },
          { time: rampUp, vus: maxVUs },
          { time: duration, vus: maxVUs },
        ];
      } else if (profile === "stress") {
        const step = maxVUs / 4;
        const durStep = duration / 4;
        chartData = [
          { time: 0, vus: step },
          { time: durStep, vus: step },
          { time: durStep, vus: step * 2 },
          { time: durStep * 2, vus: step * 2 },
          { time: durStep * 2, vus: step * 3 },
          { time: durStep * 3, vus: step * 3 },
          { time: durStep * 3, vus: maxVUs },
          { time: duration, vus: maxVUs },
        ];
      } else if (profile === "capacity") {
        chartData = [
          { time: 0, vus: 0 },
          { time: duration, vus: maxVUs },
        ];
      }
    }

    return { totalDuration, maxVUs, chartData };
  }, [profile, vus, duration, rampUp, stages]);

  const estimatedRamMb = maxVUs * 250;
  const isDangerous = estimatedRamMb > 4000;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (profile === "custom") {
      onRun({ profile: "custom", stages });
    } else {
      onRun({ vus, duration, profile, rampUp });
    }
  };

  const addStage = () =>
    setStages([...stages, { durationSec: 10, target: maxVUs }]);
  const updateStage = (index, field, value) => {
    const newStages = [...stages];
    newStages[index][field] = Number(value) || 0;
    setStages(newStages);
  };
  const removeStage = (index) => {
    if (stages.length > 1) {
      setStages(stages.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="w-full flex flex-col relative overflow-hidden bg-slate-900/50 rounded-2xl">
      <form onSubmit={handleSubmit} className="space-y-6 flex flex-col">
        {/* Profile Selector */}
        <div>
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-3">
            Perfil de Carga
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { id: "baseline", icon: Activity, label: "Baseline" },
              { id: "ramp", icon: TrendingUp, label: "Load" },
              { id: "stress", icon: AlertTriangle, label: "Stress" },
              { id: "spike", icon: Zap, label: "Spike" },
              { id: "endurance", icon: Clock, label: "Endurance" },
              { id: "capacity", icon: Users, label: "Capacity" },
              { id: "constant", icon: BarChart2, label: "Constant" },
              { id: "custom", icon: Activity, label: "Custom" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProfile(p.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${profile === p.id ? "bg-blue-500/10 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]" : "bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700"}`}
              >
                <p.icon size={20} className="mb-2" />
                <span className="text-xs font-medium">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chart Preview */}
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden h-40 flex items-end">
          <div className="absolute top-3 left-4 text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
            <Users size={12} /> Proyección de VUs
          </div>
          <div className="absolute inset-0 pt-10 pb-4 px-4 flex items-end justify-between pointer-events-none">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pt-10 pb-4 px-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-full border-t border-slate-800/50 border-dashed"
                />
              ))}
            </div>
          </div>
          {/* Bars Visualization */}
          <div className="relative w-full h-full pt-6 flex items-end gap-[2px]">
            {chartData.slice(0, -1).map((point, i) => {
              const nextPoint = chartData[i + 1];
              const segmentDuration = nextPoint.time - point.time;
              const widthPercent = (segmentDuration / totalDuration) * 100;
              // For simple bars, we just show average or step target
              const heightPercent = Math.min(
                100,
                (nextPoint.vus / (maxVUs || 1)) * 100,
              );

              if (widthPercent <= 0) return null;
              return (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercent}%` }}
                  className="bg-blue-500/40 border-t-2 border-blue-400/80 rounded-t-sm"
                  style={{ width: `${widthPercent}%` }}
                />
              );
            })}
          </div>
        </div>

        {/* Dynamic Controls */}
        <div className="space-y-5">
          {profile !== "custom" ? (
            <div className="grid grid-cols-2 gap-6">
              {profile !== "baseline" && (
                <div className="space-y-2">
                  <label className="flex justify-between text-sm font-medium text-slate-300">
                    <span className="flex items-center gap-2">
                      <Users size={16} className="text-slate-400" /> Max VUs
                    </span>
                    <span className="text-blue-400 font-mono">{vus}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={vus}
                    onChange={(e) => setVus(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
              )}
              <div
                className="space-y-2"
                style={profile === "baseline" ? { gridColumn: "span 2" } : {}}
              >
                <label className="flex justify-between text-sm font-medium text-slate-300">
                  <span className="flex items-center gap-2">
                    <Clock size={16} className="text-slate-400" /> Total
                    Duration (s)
                  </span>
                  <span className="text-blue-400 font-mono">{duration}s</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="300"
                  step="10"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
              {profile === "ramp" && (
                <div className="space-y-2 col-span-2">
                  <label className="flex justify-between text-sm font-medium text-slate-300">
                    <span className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-slate-400" /> Ramp
                      Up Time (s)
                    </span>
                    <span className="text-blue-400 font-mono">{rampUp}s</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max={duration}
                    step="1"
                    value={rampUp}
                    onChange={(e) => setRampUp(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-widest px-2">
                <span>Fases Temporales (Stages)</span>
                <span>Target VUs</span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                <AnimatePresence>
                  {stages.map((stage, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center gap-3 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800"
                    >
                      <div className="flex-1 flex items-center gap-2">
                        <Clock size={14} className="text-slate-500" />
                        <input
                          type="number"
                          min="1"
                          value={stage.durationSec}
                          onChange={(e) =>
                            updateStage(i, "durationSec", e.target.value)
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-blue-500 transition-colors"
                        />
                        <span className="text-slate-500 text-sm">sec</span>
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <Users size={14} className="text-slate-500" />
                        <input
                          type="number"
                          min="0"
                          value={stage.target}
                          onChange={(e) =>
                            updateStage(i, "target", e.target.value)
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-blue-500 transition-colors"
                        />
                        <span className="text-slate-500 text-sm">VUs</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeStage(i)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <button
                type="button"
                onClick={addStage}
                className="w-full py-2.5 flex items-center justify-center gap-2 text-sm text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 border-dashed rounded-xl transition-colors"
              >
                <Plus size={16} /> Añadir Fase Temporal
              </button>
            </div>
          )}
        </div>

        {/* Resource Warning */}
        <div
          className={`p-4 rounded-xl border ${isDangerous ? "bg-red-950/30 border-red-900/50 text-red-200" : "bg-slate-800/30 border-slate-700/50 text-slate-300"} text-xs flex items-start gap-3 transition-colors`}
        >
          <AlertTriangle
            size={18}
            className={
              isDangerous ? "text-red-400 shrink-0" : "text-slate-400 shrink-0"
            }
          />
          <div>
            <strong
              className={`block mb-1 text-sm ${isDangerous ? "text-red-300" : "text-slate-200"}`}
            >
              Estimación de Recursos
            </strong>
            Se lanzarán un pico de hasta {maxVUs} navegadores Headless aislados.
            Consumo de memoria RAM estimado:{" "}
            <strong
              className={
                isDangerous
                  ? "text-red-400 font-mono text-sm"
                  : "text-blue-400 font-mono text-sm"
              }
            >
              ~{(estimatedRamMb / 1024).toFixed(1)} GB
            </strong>
            .
            {isDangerous && (
              <span className="block mt-2 font-semibold text-red-300">
                ⚠️ Advertencia: Riesgo crítico de colapso del sistema (OOM).
                Ajuste los VUs.
              </span>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 mt-4"
        >
          <Zap size={18} /> Iniciar Prueba de Carga
        </button>
      </form>
    </div>
  );
};

export default ScenarioBuilder;
