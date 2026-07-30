import { describe, it, expect, beforeEach } from "vitest";
import { useLogStore, normalizeMode } from "./LogContext";
import { useExecutionStore } from "../stores/useExecutionStore";

describe("Execution Log Stream Filtering & Isolation Rules", () => {
  beforeEach(() => {
    useLogStore.getState().clearLogs();
    useExecutionStore.getState().resetExecution();
  });

  describe("normalizeMode", () => {
    it("should normalize automatización/quality mode synonyms to 'calidad'", () => {
      expect(normalizeMode("calidad")).toBe("calidad");
      expect(normalizeMode("automatizacion")).toBe("calidad");
      expect(normalizeMode("automation")).toBe("calidad");
      expect(normalizeMode("quality")).toBe("calidad");
      expect(normalizeMode(null)).toBe("calidad");
    });

    it("should normalize performance mode synonyms to 'performance'", () => {
      expect(normalizeMode("performance")).toBe("performance");
      expect(normalizeMode("perf")).toBe("performance");
    });

    it("should normalize seguridad mode synonyms to 'seguridad'", () => {
      expect(normalizeMode("seguridad")).toBe("seguridad");
      expect(normalizeMode("security")).toBe("seguridad");
      expect(normalizeMode("sec")).toBe("seguridad");
    });
  });

  describe("Stream Isolation & Strict Filtering", () => {
    it("Rule 1: If Automatización is running, ONLY automatización logs are shown and security/performance are hidden", () => {
      useExecutionStore.getState().setMode("calidad");

      // Add logs for all 3 streams
      useLogStore
        .getState()
        .addLog("Automation step 1", "info", null, "calidad");
      useLogStore
        .getState()
        .addLog("Performance CPU high", "warning", null, "performance");
      useLogStore
        .getState()
        .addLog("Security SQL injection attempt", "error", null, "seguridad");

      const state = useLogStore.getState();

      // Check stream isolation buffers
      expect(state.logsByMode.calidad).toHaveLength(1);
      expect(state.logsByMode.performance).toHaveLength(1);
      expect(state.logsByMode.seguridad).toHaveLength(1);

      // Check displayed logs for active execution mode (calidad/automatización)
      expect(state.logs).toHaveLength(1);
      expect(state.logs[0].message).toBe("Automation step 1");
      expect(state.logs.some((l) => l.mode === "performance")).toBe(false);
      expect(state.logs.some((l) => l.mode === "seguridad")).toBe(false);
    });

    it("Rule 2: If Performance is running, ONLY performance logs are shown and security/automatización are hidden", () => {
      useExecutionStore.getState().setMode("performance");

      useLogStore
        .getState()
        .addLog("Automation step 1", "info", null, "calidad");
      useLogStore
        .getState()
        .addLog("VUs scale to 100", "info", null, "performance");
      useLogStore
        .getState()
        .addLog("Security XSS detected", "error", null, "seguridad");

      // Sync active mode logs
      useLogStore.getState().syncActiveModeLogs("performance");
      const state = useLogStore.getState();

      expect(state.logs).toHaveLength(1);
      expect(state.logs[0].message).toBe("VUs scale to 100");
      expect(state.logs.some((l) => l.mode === "calidad")).toBe(false);
      expect(state.logs.some((l) => l.mode === "seguridad")).toBe(false);
    });

    it("Rule 3: If Seguridad is running, ONLY security logs are shown and performance/automatización are hidden", () => {
      useExecutionStore.getState().setMode("seguridad");

      useLogStore
        .getState()
        .addLog("Automation step 1", "info", null, "calidad");
      useLogStore
        .getState()
        .addLog("P95 latency 120ms", "info", null, "performance");
      useLogStore
        .getState()
        .addLog("CVSS 9.8 Critical Vulnerability", "error", null, "seguridad");

      useLogStore.getState().syncActiveModeLogs("seguridad");
      const state = useLogStore.getState();

      expect(state.logs).toHaveLength(1);
      expect(state.logs[0].message).toBe("CVSS 9.8 Critical Vulnerability");
      expect(state.logs.some((l) => l.mode === "calidad")).toBe(false);
      expect(state.logs.some((l) => l.mode === "performance")).toBe(false);
    });

    it("Buffer Latency Requirement: Buffer isolation prevents crosstalk and limits stream size to 100 items", () => {
      useExecutionStore.getState().setMode("calidad");

      for (let i = 0; i < 150; i++) {
        useLogStore.getState().addLog(`Auto Log ${i}`, "info", null, "calidad");
        useLogStore
          .getState()
          .addLog(`Perf Log ${i}`, "info", null, "performance");
      }

      const state = useLogStore.getState();
      expect(state.logsByMode.calidad).toHaveLength(100);
      expect(state.logsByMode.performance).toHaveLength(100);
      expect(state.logsByMode.calidad[0].message).toBe("Auto Log 50");
      expect(state.logs).toHaveLength(100);
      expect(state.logs.every((l) => l.mode === "calidad")).toBe(true);
    });
  });
});
