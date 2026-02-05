
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { BookMetadata, Chapter, ProjectStrategy, LoreEntry, DetectedChapter, LaunchKit } from "../types";
import { orchestratorService } from "./OrchestratorService";

export interface MarketSuggestion {
  title: string;
  niche: string;
  reason: string;
  profitabilityScore: number;
  competitionLevel: string;
  targetAudience: string;
  isViralOnSocialMedia?: boolean;
  globalTrendScore?: number;
}

export interface RefactorAnalysis {
  title: string;
  summary: string;
  detectedNiche: string;
  currentTone: string;
  estimatedChapters: number;
  suggestedActions: { id: string; label: string; description: string }[];
  detectedChapters?: DetectedChapter[]; // Yeni eklendi
}

const AGENT_PROMPTS = {
  DIRECTOR: `You are the KDP Production Director. Design professional book architecture.`,
  VECTOR_RETRIEVER: `You are a Semantic Search Engine. Given a chapter goal and a list of Lore, identify the 5 most relevant entries.`,
  WRITER: (tone: string, language: string, activeLore: LoreEntry[], fixInstruction?: string) => `You are an elite KDP Author. 
  Language: ${language}. Tone: ${tone}. 
  ACTIVE MEMORY (Vector Retrieved): ${JSON.stringify(activeLore)}.
  Write FULL prose. Maintain strict consistency with the active memory.
  ${fixInstruction ? `CRITICAL REVISION DIRECTIVE: Your previous attempt failed. Address the following issues explicitly and without deviation: "${fixInstruction}". Ensure all previous errors are resolved.` : ""}
  `,
  AUDITOR: `You are a Senior Editor & Consistency Checker. Compare the text with the Lore Bible. Flag any contradictions.`,
  WORLD_ARCHITECT: `Extract structured Lore (characters, rules, locations). Identify relationships between entities.`,
  SYSTEM_ANALYST: `You are a highly skilled AI System Analyst. Your task is to diagnose failures in content generation and provide precise, actionable, and unambiguous instructions to the 'Writer' or 'Revision Specialist' agent to rectify the errors.
  When a content audit fails, you receive a 'Reason' (the type of failure) and 'Feedback' (details from the auditor). Your output MUST be a specific, direct instruction for the writing agent on *how to fix the content* to pass the audit. Do not just restate the problem; provide a clear path to resolution. For example, if consistency failed, specify which lore entries were violated and how to integrate them. If content was too short, instruct on specific areas to expand.`,
  REVISION_SPECIALIST: (language: string, tone: string, actions: string, expansion: number, customInstruction: string, activeLore: LoreEntry[], fixInstruction?: string) => `You are an expert Revision Specialist for KDP books.
  Language: ${language}. Original Tone: ${tone}.
  Goal: Refactor the provided text based on the following instructions:
  Selected Strategies: ${actions}.
  Custom Instruction: ${customInstruction}.
  Expand the content by approximately ${expansion} times the original word count, while maintaining quality and coherence.
  ACTIVE MEMORY (for consistency): ${JSON.stringify(activeLore)}.
  ${fixInstruction ? `CRITICAL REVISION DIRECTIVE: Your previous attempt failed. Address the following issues explicitly and without deviation: "${fixInstruction}". Ensure all previous errors are resolved.` : ""}
  Focus on enhancing description, character development, world-building, and narrative depth as per the instructions.
  Ensure the revised output is a coherent, flowing prose in markdown format, suitable for a book chapter. Do not include any conversational filler.`
};

async function callAI<T>(model: string, systemInstruction: string, userPrompt: string, isJson = true, schema?: any, maxOutputTokens?: number, thinkingBudget?: number): Promise<T> {
  // Artık orchestratorService üzerinden çağrı yapıyoruz
  try {
    const response = await orchestratorService.request<T>(
      'WRITING', // Default task type, tüm gemini çağrıları için
      userPrompt,
      {
        modelId: model,
        systemInstruction,
        isJson,
        schema
      }
    );
    return response.content;
  } catch (error) {
    console.error(`AI Call Failed [${model}]:`, error);
    throw error;
  }
}

export const geminiService = {
  // Vector DB Simulation: Semantic Retrieval
  async retrieveRelevantLore(chapterGoal: string, fullLore: LoreEntry[]): Promise<LoreEntry[]> {
    if (fullLore.length === 0) return [];
    const schema = {
      type: Type.OBJECT,
      properties: {
        relevantIds: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    };
    const res = await callAI<{relevantIds: string[]}>("gemini-2.5-flash", AGENT_PROMPTS.VECTOR_RETRIEVER, `Chapter Goal: ${chapterGoal}\n\nAvailable Lore Bible: ${JSON.stringify(fullLore)}`, true, schema);
    return fullLore.filter(l => res.relevantIds.includes(l.id));
  },

  async writeChapter(chapter: Partial<Chapter>, metadata: BookMetadata, activeLore: LoreEntry[], fixInstruction?: string): Promise<string> {
    const userPrompt = `Write Chapter: "${chapter.title}". Goal: ${chapter.description}.`;
    return callAI("gemini-2.5-flash", AGENT_PROMPTS.WRITER(metadata.tone || "Creative", metadata.language, activeLore, fixInstruction), userPrompt, false);
  },

  // New method for refactoring chapters
  async refactorChapter(
    chapterContent: string, 
    metadata: BookMetadata, 
    activeLore: LoreEntry[], 
    analysis: RefactorAnalysis, 
    selectedActionIds: string[], 
    customInstruction: string, 
    expansionFactor: number, 
    fixInstruction?: string
  ): Promise<string> {
    const selectedActionsLabels = analysis.suggestedActions
      .filter(a => selectedActionIds.includes(a.id))
      .map(a => a.label)
      .join(', ');

    const actionText = selectedActionIds.length > 0 
      ? selectedActionsLabels 
      : 'Genel Revizyon ve İyileştirme';

    const systemInstruction = AGENT_PROMPTS.REVISION_SPECIALIST(
      metadata.language, 
      metadata.tone || analysis.currentTone, 
      actionText, 
      expansionFactor, 
      customInstruction,
      activeLore,
      fixInstruction
    );

    const baseInputTokens = Math.ceil(chapterContent.length / 4); // Very rough token estimate
    // Allocate maxOutputTokens considering expansion factor and a buffer
    // For gemini-2.5-flash, a safe thinking budget is 500-1000 tokens
    const thinkingBudget = 750; 
    // Increased buffer for maxOutputTokens to ensure enough room for expansion
    const maxOutputTokens = Math.ceil(baseInputTokens * expansionFactor * 2) + thinkingBudget + 1000; // 2x buffer + 1000 for safety


    const userPrompt = `Original Content for Revision: """\n${chapterContent}\n"""`;
    
    return callAI("gemini-2.5-flash", systemInstruction, userPrompt, false, undefined, maxOutputTokens, thinkingBudget);
  },

  async auditChapter(content: string, activeLore: LoreEntry[]): Promise<{ isPass: boolean; score: number; feedback: string }> {
    const schema = {
      type: Type.OBJECT,
      properties: {
        isPass: { type: Type.BOOLEAN },
        score: { type: Type.NUMBER },
        feedback: { type: Type.STRING }
      },
      required: ["isPass", "score", "feedback"]
    };
    const prompt = `Text: ${content.slice(0, 10000)}\n\nActive Lore to Check Against: ${JSON.stringify(activeLore)}`;
    return callAI("gemini-2.5-flash", AGENT_PROMPTS.AUDITOR, prompt, true, schema);
  },

  async extractLore(content: string): Promise<LoreEntry[]> {
    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING, enum: ["character", "location", "item", "event", "rule"] },
          description: { type: Type.STRING },
          traits: { type: Type.ARRAY, items: { type: Type.STRING } },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          relationships: { type: Type.STRING }
        },
        required: ["name", "category", "description"]
      }
    };
    return callAI("gemini-2.5-flash", AGENT_PROMPTS.WORLD_ARCHITECT, content.slice(0, 10000), true, schema);
  },

  async generateOutline(title: string, strategy: ProjectStrategy, language: string, length: string): Promise<Partial<Chapter>[]> {
    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING }
        }
      }
    };
    return callAI("gemini-2.5-flash", AGENT_PROMPTS.DIRECTOR, `Outline "${title}" in ${language}.`, true, schema);
  },

  async performMarketAnalysis(niche: string, language: string): Promise<ProjectStrategy> {
    const schema = {
      type: Type.OBJECT,
      properties: {
        marketAnalysis: { type: Type.STRING },
        seoKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        genre: { type: Type.TYPE_UNSPECIFIED }, // Use TYPE_UNSPECIFIED if no specific string enum needed, or a string.
        pricingStrategy: { type: Type.OBJECT, properties: { suggestedPrice: { type: Type.NUMBER }, reasoning: { type: Type.STRING } } }
      }
    };
    return callAI("gemini-2.5-flash", "SEO Expert", `KDP niche: ${niche}`, true, schema);
  },

  async diagnose(error: string, feedback: string): Promise<string> {
    const schema = {
      type: Type.OBJECT, properties: { fixInstruction: { type: Type.STRING } }
    };
    const res = await callAI<{fixInstruction: string}>("gemini-2.5-flash", AGENT_PROMPTS.SYSTEM_ANALYST, `Reason for failure: "${error}". Detailed feedback from auditor: "${feedback}". Based on this, provide a concise, actionable, and specific instruction for the writing agent to correct the content and pass the audit. Focus on *how* to fix it.`, true, schema);
    return res.fixInstruction;
  },

  async discoverTrendingNiches(language: string): Promise<MarketSuggestion[]> {
    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          niche: { type: Type.STRING },
          reason: { type: Type.STRING },
          profitabilityScore: { type: Type.NUMBER },
          competitionLevel: { type: Type.STRING },
          targetAudience: { type: Type.STRING },
          isViralOnSocialMedia: { type: Type.BOOLEAN },
          globalTrendScore: { type: Type.NUMBER }
        },
        required: ["title", "niche", "profitabilityScore"]
      }
    };
    return callAI<MarketSuggestion[]>("gemini-2.5-flash", "Market Researcher", `Trending KDP niches for ${language}`, true, schema);
  },

  // Method to analyze an imported book for refactoring
  async analyzeImportedBook(content: string, language: string): Promise<RefactorAnalysis> {
    const schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        summary: { type: Type.STRING },
        detectedNiche: { type: Type.STRING },
        currentTone: { type: Type.STRING },
        estimatedChapters: { type: Type.NUMBER },
        suggestedActions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              label: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["id", "label", "description"]
          }
        },
        detectedChapters: { // Yeni eklendi
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
            },
            required: ["title", "content"]
          },
        }
      },
      required: ["title", "summary", "detectedNiche", "currentTone", "estimatedChapters", "suggestedActions"]
    };
    // Prompt'u güncelleyerek AI'dan bölüm tespiti istendi
    const prompt = `Analyze this book in ${language}. Provide a title, summary, detected niche, current tone, and an estimation of how many chapters it contains. Crucially, also attempt to identify the existing chapter divisions within the text. For each detected chapter, extract its estimated title and its full content. If no clear chapter divisions are found, return the entire content as a single detected chapter. Only detect chapters if they are clearly delimited by headings like "Chapter X", "Bölüm Y", or distinct section titles, or by significant structural breaks (e.g., several blank lines followed by a new section title). Respond in JSON based on the provided schema.\n\nBook Content: ${content.slice(0, 5000)}`;
    return callAI<RefactorAnalysis>("gemini-2.5-flash", "Senior Book Analyst", prompt, true, schema);
  },

  async generateAudio(text: string): Promise<string | undefined> {
    const apiKey = orchestratorService.getApiKey('google');
    if (!apiKey) throw new Error("Google API Key is not configured.");

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  },

  async connectVoiceCoach(callbacks: any, language: string): Promise<any> {
    const apiKey = orchestratorService.getApiKey('google');
    if (!apiKey) throw new Error("Google API Key is not configured.");

    const ai = new GoogleGenAI({ apiKey });
    return ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction: `You are a friendly writing coach helping a writer in ${language}.`,
      }
    });
  },

  async generateSEOKeywords(title: string, description: string, language: string): Promise<{ backendKeywords: string[]; competitorGaps: string[] }> {
    const schema = {
      type: Type.OBJECT,
      properties: {
        backendKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        competitorGaps: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["backendKeywords", "competitorGaps"]
    };
    const prompt = `You are an Amazon KDP SEO expert. Generate exactly 7 high-value backend keywords for the following book.\n\nTitle: "${title}"\nDescription: "${description}"\nLanguage: ${language}\n\nReturn 7 backend keywords in the "backendKeywords" array and 3 competitor gap opportunities in "competitorGaps".`;
    return callAI("gemini-2.5-flash", "Amazon KDP SEO Specialist", prompt, true, schema);
  },

  async runLegalAudit(fullContent: string, title: string): Promise<{ riskLevel: 'low' | 'medium' | 'high'; findings: string }> {
    const schema = {
      type: Type.OBJECT,
      properties: {
        riskLevel: { type: Type.STRING, enum: ["low", "medium", "high"] },
        findings: { type: Type.STRING }
      },
      required: ["riskLevel", "findings"]
    };
    const prompt = `You are a legal compliance advisor specializing in Amazon KDP publishing. Analyze the following manuscript for:\n1. Potential trademark or copyright violations (generic terms vs registered marks)\n2. KDP Content Policy violations (hate speech, violence, sexual content guidelines)\n3. Factual accuracy risks that could lead to legal liability\n4. Any brand name misuse\n\nTitle: "${title}"\nManuscript excerpt (first 8000 chars): "${fullContent.slice(0, 8000)}"\n\nProvide a risk level (low/medium/high) and detailed findings with specific recommendations.`;
    return callAI("gemini-2.5-flash", "KDP Legal Compliance Agent", prompt, true, schema);
  },

  async suggestTrailerPrompt(title: string, description: string): Promise<string> {
    const schema = {
      type: Type.OBJECT,
      properties: {
        prompt: { type: Type.STRING }
      },
      required: ["prompt"]
    };
    const res = await callAI<{ prompt: string }>("gemini-2.5-flash", "Cinematic Trailer Director", `Create a vivid, atmospheric cinematic trailer prompt for the book:\nTitle: "${title}"\nDescription: "${description}"\n\nThe prompt should describe a 5-10 second cinematic scene that captures the essence of the book. Include lighting, mood, camera angle, and visual details.`, true, schema);
    return res.prompt;
  },

  async generateLaunchKit(title: string, description: string, language: string): Promise<LaunchKit> {
    const schema = {
      type: Type.OBJECT,
      properties: {
        instagram: { type: Type.ARRAY, items: { type: Type.STRING } },
        twitter: { type: Type.ARRAY, items: { type: Type.STRING } },
        email: { type: Type.STRING }
      },
      required: ["instagram", "twitter", "email"]
    };
    const prompt = `You are a social media marketing expert for book launches. Create a launch kit for the following book in ${language}:\n\nTitle: "${title}"\nDescription: "${description}"\n\nGenerate:\n- 3 Instagram post captions (with relevant hashtags)\n- 3 Twitter/X thread starter posts\n- 1 launch email template\n\nMake the content engaging, platform-appropriate, and focused on driving book sales on Amazon KDP.`;
    return callAI("gemini-2.5-flash", "Book Launch Marketing Agent", prompt, true, schema);
  }
};