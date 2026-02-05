import { 
  AIProvider, 
  ModelConfig, 
  AIUsageMetrics, 
  UnifiedAIResponse, 
  AIError,
  BookMetadata,
  ModelAssignment,
  AIProfile
} from "../types";
import { MODEL_REGISTRY, DEFAULT_ASSIGNMENTS, IMAGE_MODEL_PRICING } from "./aiRegistry";
import { GoogleGenAI } from "@google/genai";

class OrchestratorService {
  private apiKeys: Partial<Record<AIProvider, string>> = {};
  private usageHistory: AIUsageMetrics[] = [];
  private currentAssignments: ModelAssignment = {
    outline: 'Reasoning',
    writing: 'Creative',
    auditing: 'Reasoning'
  };

  constructor() {
    this.refreshApiKeys();
    this.loadUsage();
  }

  public refreshApiKeys() {
    // Önce .env'den yükle
    this.apiKeys = {
      google: (process.env.GEMINI_API_KEY || process.env.API_KEY) as string,
      openai: process.env.OPENAI_API_KEY as string,
      anthropic: process.env.ANTHROPIC_API_KEY as string,
      deepseek: process.env.DEEPSEEK_API_KEY as string,
      meta: process.env.META_API_KEY as string,
      "fal-ai": process.env.FAL_AI_KEY as string,
      replicate: process.env.REPLICATE_API_TOKEN as string,
    };

    // Sonra LocalStorage'dan (varsa) üzerine yaz
    try {
      const savedKeys = localStorage.getItem('kdp_api_keys');
      if (savedKeys) {
        const parsed = JSON.parse(savedKeys);
        this.apiKeys = { ...this.apiKeys, ...parsed };
      }
    } catch (e) {
      console.error("Failed to load API keys from localStorage", e);
    }
  }

  public setAssignments(assignments: ModelAssignment) {
    this.currentAssignments = assignments;
  }

  private hasKey(provider: AIProvider): boolean {
    return !!this.apiKeys[provider];
  }

  private mapProfileToModel(profile: AIProfile, taskType: keyof typeof DEFAULT_ASSIGNMENTS): string {
    const profileMap: Record<AIProfile, Record<string, string>> = {
      Reasoning: {
        OUTLINE: 'deepseek-r1',
        WRITING: 'claude-4.5-sonnet',
        AUDIT: 'deepseek-r1'
      },
      Creative: {
        OUTLINE: 'gpt-5.2',
        WRITING: 'claude-4.5-sonnet',
        AUDIT: 'gpt-5.2'
      },
      Balanced: {
        OUTLINE: 'gpt-4o',
        WRITING: 'gpt-4o',
        AUDIT: 'gpt-4o'
      },
      Turbo: {
        OUTLINE: 'gemini-2.5-flash',
        WRITING: 'gemini-2.5-flash',
        AUDIT: 'gemini-2.0-flash-lite'
      }
    };

    return profileMap[profile]?.[taskType] || DEFAULT_ASSIGNMENTS[taskType];
  }

  private resolveModel(preferredModelId: string | undefined, taskType: keyof typeof DEFAULT_ASSIGNMENTS): ModelConfig {
    let modelId = preferredModelId;
    
    if (!modelId) {
      const profile = taskType === 'OUTLINE' ? this.currentAssignments.outline :
                      taskType === 'WRITING' ? this.currentAssignments.writing :
                      this.currentAssignments.auditing;
      modelId = this.mapProfileToModel(profile, taskType);
    }

    let model = MODEL_REGISTRY[modelId] || MODEL_REGISTRY[DEFAULT_ASSIGNMENTS[taskType]];

    if (this.hasKey(model.provider)) {
      return model;
    }

    // Fallback: Key'i olan ilk uygun modeli bul
    console.warn(`API key missing for ${model.provider}. Searching for fallback...`);
    
    // Öncelik sırası: Google (her zaman var sayıyoruz), DeepSeek, OpenAI
    const fallbacks: AIProvider[] = ['google', 'deepseek', 'openai', 'anthropic'];
    for (const provider of fallbacks) {
      if (this.hasKey(provider)) {
        const fallbackModel = Object.values(MODEL_REGISTRY).find(m => m.provider === provider && m.capabilities.includes('text'));
        if (fallbackModel) return fallbackModel;
      }
    }

    return model; // Hiçbiri yoksa orijinali döndür (hata API katmanında yakalanacak)
  }

  /**
   * Universal AI çağrısı. Hata yönetimi ve retry mekanizması içerir.
   */
  public async request<T>(
    taskType: keyof typeof DEFAULT_ASSIGNMENTS,
    prompt: string,
    options: { modelId?: string; systemInstruction?: string; isJson?: boolean; schema?: any } = {},
    retryCount = 0
  ): Promise<UnifiedAIResponse<T>> {
    const model = this.resolveModel(options.modelId || DEFAULT_ASSIGNMENTS[taskType], taskType);
    
    try {
      let response: UnifiedAIResponse<T>;

      // Burada provider'a göre ilgili servise yönlendirme yapılacak
      switch (model.provider) {
        case 'google':
          response = await this.callGemini<T>(model, prompt, options);
          break;
        case 'openai':
        case 'deepseek':
          response = await this.callOpenAI<T>(model, prompt, options);
          break;
        case 'anthropic':
          response = await this.callAnthropic<T>(model, prompt, options);
          break;
        case 'fal-ai':
           // Fal.ai genellikle görsel üretimi içindir, ancak text-to-image promptu buraya gelebilir
           // Şimdilik görsel üretimi ayrı bir metodla ele alınacak, burası placeholder
           throw new Error("Fal.ai text generation not supported. Use generateImage.");
        default:
          throw new Error(`Provider ${model.provider} not yet fully implemented in Orchestrator.`);
      }

      this.trackUsage(response.usage);
      return response;

    } catch (error: any) {
      const aiError = this.parseError(model.provider, error);
      
      if (aiError.isRetryable && retryCount < 3) {
        const delay = aiError.retryAfter || Math.pow(2, retryCount) * 1000;
        console.log(`Retrying ${model.id} in ${delay}ms... (Attempt ${retryCount + 1})`);
        await new Promise(res => setTimeout(res, delay));
        return this.request(taskType, prompt, options, retryCount + 1);
      }

      throw aiError;
    }
  }

  private async callGemini<T>(model: ModelConfig, prompt: string, options: any): Promise<UnifiedAIResponse<T>> {
    const apiKey = this.apiKeys.google;
    if (!apiKey) throw new Error("Google API Key is not configured.");

    const ai = new GoogleGenAI({ apiKey });
    const config: any = { systemInstruction: options.systemInstruction, temperature: 0.7 };

    if (options.isJson) {
      config.responseMimeType = "application/json";
      if (options.schema) config.responseSchema = options.schema;
    }

    if (model.maxOutputTokens) {
      config.maxOutputTokens = model.maxOutputTokens;
    }

    const response = await ai.models.generateContent({
      model: model.id,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config,
    });

    const text = response.text || "";
    let content: T;

    if (options.isJson) {
      try {
        const jsonContent = text.includes("```json") ? text.split("```json")[1].split("```")[0].trim() : text.trim();
        content = JSON.parse(jsonContent);
      } catch (e) {
        console.error("Failed to parse JSON response from Gemini", text);
        throw new Error("Invalid JSON response from Gemini API.");
      }
    } else {
      content = text as unknown as T;
    }

    const usageMetadata = response.usageMetadata;

    return {
      content,
      usage: {
        promptTokens: usageMetadata?.promptTokenCount || 0,
        completionTokens: usageMetadata?.candidatesTokenCount || 0,
        totalCost: 0, // trackUsage hesaplayacak
        modelId: model.id,
        provider: 'google',
        timestamp: Date.now()
      }
    };
  }

  private async callOpenAI<T>(model: ModelConfig, prompt: string, options: any): Promise<UnifiedAIResponse<T>> {
    const apiKey = this.apiKeys[model.provider];
    const baseUrl = model.provider === 'openai' ? 'https://api.openai.com/v1' : 'https://api.deepseek.com';
    
    const body: any = {
      model: model.id,
      messages: [
        { role: 'system', content: options.systemInstruction || "" },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    };

    if (options.isJson) {
      body.response_format = { type: 'json_object' };
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI/DeepSeek Error: ${response.status} - ${JSON.stringify(errData)}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;

    if (options.isJson) {
      try {
        content = JSON.parse(content);
      } catch (e) {
        console.error("Failed to parse JSON response from OpenAI", content);
      }
    }

    return {
      content: content as T,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalCost: 0,
        modelId: model.id,
        provider: model.provider,
        timestamp: Date.now()
      }
    };
  }

  private async callAnthropic<T>(model: ModelConfig, prompt: string, options: any): Promise<UnifiedAIResponse<T>> {
    const apiKey = this.apiKeys.anthropic;
    
    const body: any = {
      model: model.id,
      max_tokens: model.maxOutputTokens || 4096,
      system: options.systemInstruction || "",
      messages: [
        { role: 'user', content: prompt }
      ]
    };

    // Anthropic specific JSON enforcement if needed
    if (options.isJson) {
      body.messages[0].content += "\n\nIMPORTANT: Respond ONLY with a valid JSON object.";
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey!,
        'anthropic-version': '2023-06-01',
        'dangerously-allow-browser': 'true' // Caution: For client-side demo only
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`Anthropic Error: ${response.status} - ${JSON.stringify(errData)}`);
    }

    const data = await response.json();
    let content = data.content[0].text;

    if (options.isJson) {
      try {
        // Simple extraction in case they added markdown backticks
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) content = jsonMatch[0];
        content = JSON.parse(content);
      } catch (e) {
        console.error("Failed to parse JSON response from Anthropic", content);
      }
    }

    return {
      content: content as T,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalCost: 0,
        modelId: model.id,
        provider: 'anthropic',
        timestamp: Date.now()
      }
    };
  }

  public async generateImage(prompt: string, modelId: string = "flux-1.1-pro"): Promise<string> {
    const model = MODEL_REGISTRY[modelId];
    if (!model || model.provider !== 'fal-ai') throw new Error("Invalid image model");

    // Görsel üretimi için özelleşmiş çağrı
    const imageUrl = await this.callFalAI(model, prompt);
    
    // Usage kaydı
    this.trackUsage({
      promptTokens: 0,
      completionTokens: 0,
      totalCost: 0, // trackUsage içinde sabit fiyatla hesaplanacak
      modelId: model.id,
      provider: 'fal-ai',
      timestamp: Date.now()
    });

    return imageUrl;
  }

  private async callFalAI(model: ModelConfig, prompt: string): Promise<string> {
    const apiKey = this.apiKeys["fal-ai"];
    if (!apiKey) throw new Error("Fal.ai API Key is not configured.");

    // Fal.ai Flux Pro endpoint (örnek)
    const response = await fetch(`https://fal.run/fal-ai/${model.id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        image_size: "landscape_16_9", // Varsayılan boyut
        num_inference_steps: 28,
        guidance_scale: 3.5,
        sync_mode: true // Sonucu beklemek için
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Fal.ai Error: ${response.status} - ${JSON.stringify(err)}`);
    }

    const data = await response.json();
    // Fal.ai genellikle { images: [{ url: "..." }] } döner
    if (data.images && data.images.length > 0) {
      return data.images[0].url;
    }
    
    throw new Error("No image URL in Fal.ai response");
  }

  private trackUsage(metrics: AIUsageMetrics) {
    this.usageHistory.push(metrics);
    // Maliyeti hesapla
    const config = MODEL_REGISTRY[metrics.modelId];
    if (config) {
      if (config.inputCostPer1M === 0 && config.capabilities.includes('image')) {
        metrics.totalCost = (IMAGE_MODEL_PRICING[metrics.modelId] || 0); // Görsel modeller için sabit fiyat
      } else {
        metrics.totalCost = (metrics.promptTokens / 1000000) * config.inputCostPer1M + 
                           (metrics.completionTokens / 1000000) * config.outputCostPer1M;
      }
    }
    this.saveUsage();
    window.dispatchEvent(new CustomEvent('ai-usage-updated', { detail: this.getUsageReport() }));
  }

  private saveUsage() {
    try {
      localStorage.setItem('kdp_ai_usage', JSON.stringify(this.usageHistory));
    } catch (e) {
      console.error("Failed to save usage to localStorage", e);
    }
  }

  private loadUsage() {
    try {
      const saved = localStorage.getItem('kdp_ai_usage');
      if (saved) {
        this.usageHistory = JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load usage from localStorage", e);
    }
  }

  private parseError(provider: AIProvider, error: any): AIError {
    // API'dan dönen hata kodlarını normalize et
    const message = error.message || "Unknown AI Error";
    let isRetryable = false;
    let retryAfter = 0;

    if (message.includes("429") || message.includes("Rate limit")) {
      isRetryable = true;
      retryAfter = 5000;
    } else if (message.includes("500") || message.includes("503")) {
      isRetryable = true;
    }

    return { provider, code: "AI_ERROR", message, isRetryable, retryAfter };
  }

  public getUsageReport() {
    const totalCost = this.usageHistory.reduce((sum, u) => sum + u.totalCost, 0);
    return {
      totalCost,
      count: this.usageHistory.length,
      history: this.usageHistory
    };
  }
}

export const orchestratorService = new OrchestratorService();
