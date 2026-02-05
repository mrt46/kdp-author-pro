import { ModelConfig } from "../types";

export const MODEL_REGISTRY: Record<string, ModelConfig> = {
  // --- OPENAI (GPT-5 & GPT-4 Families) ---
  "gpt-5.2": {
    id: "gpt-5.2",
    provider: "openai",
    tier: "standard",
    inputCostPer1M: 1.75,
    outputCostPer1M: 14.00,
    contextWindow: 128000,
    maxOutputTokens: 16384,
    capabilities: ["text", "json"]
  },
  "gpt-5-mini": {
    id: "gpt-5-mini",
    provider: "openai",
    tier: "economy",
    inputCostPer1M: 0.25,
    outputCostPer1M: 2.00,
    contextWindow: 128000,
    maxOutputTokens: 16384,
    capabilities: ["text", "json"]
  },
  "gpt-4o": {
    id: "gpt-4o",
    provider: "openai",
    tier: "standard",
    inputCostPer1M: 2.50,
    outputCostPer1M: 10.00,
    contextWindow: 128000,
    maxOutputTokens: 4096,
    capabilities: ["text", "json"]
  },

  // --- ANTHROPIC (Claude 4.5 Family) ---
  "claude-4.5-sonnet": {
    id: "claude-4.5-sonnet",
    provider: "anthropic",
    tier: "premium",
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    contextWindow: 200000,
    maxOutputTokens: 8192,
    capabilities: ["text", "json"]
  },
  "claude-4.5-haiku": {
    id: "claude-4.5-haiku",
    provider: "anthropic",
    tier: "economy",
    inputCostPer1M: 1.00,
    outputCostPer1M: 5.00,
    contextWindow: 200000,
    maxOutputTokens: 4096,
    capabilities: ["text", "json"]
  },

  // --- GOOGLE (Gemini 2.5 Family) ---
  "gemini-2.5-flash": {
    id: "gemini-2.5-flash",
    provider: "google",
    tier: "economy",
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    capabilities: ["text", "json", "image", "audio"]
  },
  "gemini-2.0-flash-lite": {
    id: "gemini-2.0-flash-lite",
    provider: "google",
    tier: "economy",
    inputCostPer1M: 0.075,
    outputCostPer1M: 0.30,
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    capabilities: ["text", "json"]
  },

  // --- DEEPSEEK (V3 & R1) ---
  "deepseek-v3": {
    id: "deepseek-v3",
    provider: "deepseek",
    tier: "economy",
    inputCostPer1M: 0.27,
    outputCostPer1M: 1.10,
    contextWindow: 64000,
    maxOutputTokens: 8192,
    capabilities: ["text", "json"]
  },
  "deepseek-r1": {
    id: "deepseek-r1",
    provider: "deepseek",
    tier: "standard",
    inputCostPer1M: 0.55,
    outputCostPer1M: 2.19,
    contextWindow: 128000,
    maxOutputTokens: 16384,
    capabilities: ["text", "reasoning"]
  },

  // --- META (Llama 4) ---
  "llama-4-scout": {
    id: "llama-4-scout",
    provider: "meta",
    tier: "standard",
    inputCostPer1M: 0.20,
    outputCostPer1M: 0.40,
    contextWindow: 10000000, // 10M context!
    maxOutputTokens: 16384,
    capabilities: ["text"]
  },

  // --- IMAGE MODELS ---
  "flux-1.1-pro": {
    id: "flux-1.1-pro",
    provider: "fal-ai",
    tier: "premium",
    inputCostPer1M: 0, 
    outputCostPer1M: 0, 
    contextWindow: 0,
    maxOutputTokens: 0,
    capabilities: ["image"]
  }
};

// Fixed cost for image models (per image)
export const IMAGE_MODEL_PRICING: Record<string, number> = {
  "flux-1.1-pro": 0.04,
  "dalle-3": 0.04,
  "flux-schnell": 0.003
};

export const DEFAULT_ASSIGNMENTS = {
  OUTLINE: "deepseek-r1",
  WRITING: "claude-4.5-sonnet",
  AUDIT: "gemini-2.5-flash",
  IMAGE: "flux-1.1-pro",
  LEGAL: "gpt-4o"
};
