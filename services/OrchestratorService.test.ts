import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orchestratorService } from './OrchestratorService';
import { MODEL_REGISTRY, DEFAULT_ASSIGNMENTS } from './aiRegistry';

// Mock the entire @google/genai module
vi.mock('@google/genai', () => {
  const generateContentMock = vi.fn().mockResolvedValue({
    text: '{"success": true}',
    usageMetadata: {
      promptTokenCount: 1000000,
      candidatesTokenCount: 1000000
    }
  });

  return {
    GoogleGenAI: vi.fn().mockImplementation(function() {
      return {
        models: {
          generateContent: generateContentMock
        },
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: generateContentMock
        })
      };
    }),
    Type: {},
    Modality: {}
  };
});

describe('OrchestratorService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
    
    // Reset env variables for testing
    vi.stubEnv('API_KEY', 'test-google-key');
    vi.stubEnv('GEMINI_API_KEY', 'test-google-key');
    vi.stubEnv('OPENAI_API_KEY', '');
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    
    orchestratorService.refreshApiKeys();
    
    // Reset usageHistory (private field)
    // @ts-ignore
    orchestratorService.usageHistory = [];
  });

  it('should resolve to default model and parse JSON if requested', async () => {
    const result = await orchestratorService.request('AUDIT', 'test prompt', { isJson: true });
    expect(result.usage.provider).toBe('google');
    expect(result.usage.modelId).toBe(DEFAULT_ASSIGNMENTS.AUDIT);
    expect(result.content).toEqual({ success: true });
  });

  it('should fallback to google if preferred model key is missing', async () => {
    const result = await orchestratorService.request('WRITING', 'test prompt');
    expect(result.usage.provider).toBe('google');
    
    const googleModel = Object.values(MODEL_REGISTRY).find(m => m.provider === 'google' && m.capabilities.includes('text'));
    expect(result.usage.modelId).toBe(googleModel?.id);
  });

  it('should track usage and update report', async () => {
    const result = await orchestratorService.request('AUDIT', 'test prompt');
    expect(result.usage.promptTokens).toBe(1000000);
    
    const report = orchestratorService.getUsageReport();
    expect(report.count).toBe(1);
    expect(report.history[0].modelId).toBe(DEFAULT_ASSIGNMENTS.AUDIT);
    expect(report.totalCost).toBeGreaterThan(0);
  });

  it('should handle retryable errors with backoff', async () => {
    const { GoogleGenAI } = await import('@google/genai');
    // @ts-ignore
    const instance = new GoogleGenAI();
    const generateContentMock = instance.models.generateContent;
    
    generateContentMock
      .mockRejectedValueOnce(new Error('Rate limit 429'))
      .mockResolvedValueOnce({
        text: '{"success": true}',
        usageMetadata: { promptTokenCount: 500, candidatesTokenCount: 500 }
      });

    const requestPromise = orchestratorService.request('AUDIT', 'test prompt', { isJson: true });
    await vi.runAllTimersAsync();

    const result = await requestPromise;
    expect(result.content).toEqual({ success: true });
    expect(generateContentMock).toHaveBeenCalledTimes(2);
  });
});
