import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getModelCacheKey,
  readModelsCache,
  writeModelsCache,
  clearModelsCache,
  fetchDiscoveredModels,
} from "./useModelDiscovery";
import { api } from "../utils/api";

vi.mock("../utils/api", () => ({
  api: { post: vi.fn() },
}));

describe("useModelDiscovery helpers", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("getModelCacheKey combines provider and baseUrl", () => {
    expect(getModelCacheKey("ollama", "http://127.0.0.1:11434")).toBe(
      "ollama|http://127.0.0.1:11434",
    );
  });

  it("writes and reads the models cache per provider|baseUrl", () => {
    writeModelsCache("ollama", "http://127.0.0.1:11434", [{ id: "gemma3:2b" }]);
    expect(readModelsCache("ollama", "http://127.0.0.1:11434")).toEqual([
      { id: "gemma3:2b" },
    ]);
    expect(readModelsCache("openai", "https://api.openai.com")).toBeNull();
  });

  it("clears the models cache for a specific provider|baseUrl", () => {
    writeModelsCache("ollama", "x", [{ id: "gemma3:2b" }]);
    clearModelsCache("ollama", "x");
    expect(readModelsCache("ollama", "x")).toBeNull();
  });

  it("readModelsCache tolerates corrupted localStorage", () => {
    localStorage.setItem("hal_ai_models_cache", "{not-json");
    expect(readModelsCache("ollama", "x")).toBeNull();
  });

  it("fetchDiscoveredModels posts to /ai/discover-models", async () => {
    api.post.mockResolvedValue({ state: "SUCCESS", models: [{ id: "gpt-4o-mini" }] });
    const res = await fetchDiscoveredModels({
      provider: "openai",
      apiKey: "sk-test",
      baseUrl: "https://api.openai.com",
    });
    expect(api.post).toHaveBeenCalledWith("/ai/discover-models", {
      provider: "openai",
      apiKey: "sk-test",
      baseUrl: "https://api.openai.com",
    });
    expect(res.state).toBe("SUCCESS");
  });
});