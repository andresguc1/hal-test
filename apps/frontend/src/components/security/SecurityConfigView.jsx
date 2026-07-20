import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Sliders,
  CheckSquare,
  Square,
  Play,
  Lock,
  Globe,
  FileCode,
  AlertTriangle,
} from "lucide-react";

export default function SecurityConfigView({ onStartAudit, isRunning, flowName }) {
  const [intensity, setIntensity] = useState("standard"); // 'quick' | 'standard' | 'deep'
  const [options, setOptions] = useState({
    headerAudit: true,
    cspValidation: true,
    cookieAttributes: true,
    inputSanitization: true,
    sensitiveDataCheck: true,
    corsWildcardCheck: true,
    mixedContentScan: true,
  });

  const toggleOption = (key) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLaunch = () => {
    if (onStartAudit) {
      onStartAudit({
        intensity,
        securityConfig: options,
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950/40 via-slate-900/80 to-slate-900/40 border border-red-500/20 rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Shield size={160} className="text-red-500" />
        </div>

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-semibold uppercase tracking-wider">
            <Shield size={14} />
            <span>Configuración de Auditoría DAST</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Parámetros de Seguridad: <span className="text-red-400">{flowName || "Flujo Activo"}</span>
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl">
            Ajusta los vectores de ataque pasivo y comprobaciones de cumplimiento de calidad (Quality Gate) antes de iniciar el escaneo de seguridad.
          </p>
        </div>
      </div>

      {/* Intensity Profile Cards */}
      <div className="space-y-3">
        <label className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center space-x-2">
          <Sliders size={14} className="text-red-400" />
          <span>Perfil de Agresividad de Auditoría</span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => setIntensity("quick")}
            className={`p-4 rounded-xl border text-left transition-all ${
              intensity === "quick"
                ? "bg-slate-900 border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.15)] text-slate-100"
                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="font-bold text-sm text-slate-200 mb-1 flex items-center justify-between">
              <span>Rápido (Quality Gate)</span>
              {intensity === "quick" && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
            </div>
            <p className="text-xs text-slate-400">
              Escaneo pasivo de cabeceras HTTP (CSP, HSTS, XFO) y transmisión de contraseñas.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setIntensity("standard")}
            className={`p-4 rounded-xl border text-left transition-all ${
              intensity === "standard"
                ? "bg-slate-900 border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.15)] text-slate-100"
                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="font-bold text-sm text-slate-200 mb-1 flex items-center justify-between">
              <span>Estándar (Recomendado)</span>
              {intensity === "standard" && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
            </div>
            <p className="text-xs text-slate-400">
              Verificación completa de políticas OWASP, atributos de cookies, CORS y sanitización de inputs.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setIntensity("deep")}
            className={`p-4 rounded-xl border text-left transition-all ${
              intensity === "deep"
                ? "bg-slate-900 border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.15)] text-slate-100"
                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="font-bold text-sm text-slate-200 mb-1 flex items-center justify-between">
              <span>Profundo (Exhaustivo)</span>
              {intensity === "deep" && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
            </div>
            <p className="text-xs text-slate-400">
              Auditoría intensiva incluyendo trampas DOM inline, inyección de payloads y fuga de PII.
            </p>
          </button>
        </div>
      </div>

      {/* Rules Toggles Grid */}
      <div className="space-y-3">
        <label className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center space-x-2">
          <Lock size={14} className="text-red-400" />
          <span>Vectores de Inspección Activos</span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              key: "headerAudit",
              title: "Cabeceras de Seguridad HTTP",
              desc: "Validación de HSTS, X-Frame-Options y X-Content-Type-Options.",
              icon: Globe,
            },
            {
              key: "cspValidation",
              title: "Content Security Policy (CSP)",
              desc: "Detección de directivas inseguras ('unsafe-inline', 'unsafe-eval').",
              icon: FileCode,
            },
            {
              key: "cookieAttributes",
              title: "Atributos de Cookies (Secure/HttpOnly/SameSite)",
              desc: "Verificación de protección contra ataques CSRF y robo de sesión.",
              icon: Lock,
            },
            {
              key: "inputSanitization",
              title: "Sanitización de Inputs & XSS",
              desc: "Inspección de eventos inline en DOM y enlaces 'javascript:'.",
              icon: AlertTriangle,
            },
            {
              key: "sensitiveDataCheck",
              title: "Fuga de Datos Sensibles (PII/Credenciales)",
              desc: "Monitoreo de almacenamiento de passwords y respuestas de API.",
              icon: Shield,
            },
            {
              key: "corsWildcardCheck",
              title: "Permisos CORS Excesivos",
              desc: "Alerta si 'Access-Control-Allow-Origin' utiliza wildcards con credenciales.",
              icon: Globe,
            },
          ].map((item) => {
            const Icon = item.icon;
            const isChecked = options[item.key];
            return (
              <div
                key={item.key}
                onClick={() => toggleOption(item.key)}
                className={`p-4 rounded-xl border cursor-pointer flex items-start space-x-3 transition-all ${
                  isChecked
                    ? "bg-slate-900/80 border-slate-700 text-slate-200"
                    : "bg-slate-950/40 border-slate-900 text-slate-500 hover:border-slate-800"
                }`}
              >
                <div className="mt-0.5">
                  {isChecked ? (
                    <CheckSquare size={18} className="text-red-400" />
                  ) : (
                    <Square size={18} className="text-slate-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold flex items-center space-x-2">
                    <Icon size={14} className={isChecked ? "text-red-400" : "text-slate-600"} />
                    <span>{item.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action CTA */}
      <div className="pt-4 flex justify-end">
        <button
          type="button"
          disabled={isRunning}
          onClick={handleLaunch}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-semibold text-sm shadow-[0_0_20px_rgba(225,29,72,0.3)] disabled:opacity-50 flex items-center space-x-2 transition-all"
        >
          <Play size={16} fill="currentColor" />
          <span>{isRunning ? "Auditoría en Curso..." : "Iniciar Auditoría de Seguridad"}</span>
        </button>
      </div>
    </div>
  );
}
