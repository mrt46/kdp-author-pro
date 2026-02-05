import { describe, it, expect, vi, beforeEach } from 'vitest';
import { geminiService } from './geminiService';

// Define the mock outside to access it in tests
const generateContentMock = vi.fn();

// Mock the @google/genai module
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(function() {
      return {
        models: {
          generateContent: generateContentMock
        }
      };
    }),
    Type: {
      OBJECT: 'OBJECT',
      ARRAY: 'ARRAY',
      STRING: 'STRING',
      BOOLEAN: 'BOOLEAN',
      NUMBER: 'NUMBER'
    },
    Modality: {
      AUDIO: 'AUDIO'
    }
  };
});

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('API_KEY', 'test-api-key');
    
    // Default mock response
    generateContentMock.mockResolvedValue({
      text: '{"success": true}',
      usageMetadata: {
        promptTokenCount: 10,
        candidatesTokenCount: 20
      }
    });
  });

  describe('writeChapter', () => {
    it('should call GoogleGenAI with correct prompts', async () => {
      generateContentMock.mockResolvedValue({
        text: 'Written chapter content'
      });

      const chapter = { title: 'Chapter 1', description: 'Hero starts journey' };
      const metadata = { language: 'Turkish', tone: 'Epic' };
      const activeLore = [];

      const result = await geminiService.writeChapter(chapter as any, metadata as any, activeLore as any);

      expect(generateContentMock).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-3-flash-preview',
          config: expect.objectContaining({
            systemInstruction: expect.stringContaining('Language: Turkish'),
          })
        })
      );
      expect(result).toBe('Written chapter content');
    });
  });

  describe('refactorChapter', () => {
    it('should handle expansion factor and custom instructions', async () => {
      generateContentMock.mockResolvedValue({
        text: 'Expanded and refactored content'
      });

      const originalContent = 'Short text';
      const metadata = { language: 'Turkish', tone: 'Professional' };
      const analysis = { 
        currentTone: 'Boring', 
        suggestedActions: [{ id: '1', label: 'Action A' }] 
      };
      const activeLore = [];

      const result = await geminiService.refactorChapter(
        originalContent,
        metadata as any,
        activeLore as any,
        analysis as any,
        ['1'],
        'Make it better',
        2.5
      );

      expect(generateContentMock).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            systemInstruction: expect.stringContaining('Expand the content by approximately 2.5 times'),
            maxOutputTokens: expect.any(Number)
          })
        })
      );
      expect(result).toBe('Expanded and refactored content');
    });
  });

  describe('auditChapter', () => {
    it('should call GoogleGenAI with AUDIT task and correct schema', async () => {
      const mockAuditResult = { isPass: true, score: 95, feedback: 'Perfect consistency' };
      generateContentMock.mockResolvedValue({
        text: JSON.stringify(mockAuditResult)
      });

      const content = 'Chapter text';
      const activeLore = [];

      const result = await geminiService.auditChapter(content, activeLore as any);

      expect(generateContentMock).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-3-pro-preview',
          config: expect.objectContaining({
            responseMimeType: 'application/json'
          })
        })
      );
      expect(result).toEqual(mockAuditResult);
    });
  });

  describe('extractLore', () => {
    it('should extract structured lore entries from content', async () => {
      const mockLore = [
        { name: 'Character A', category: 'character', description: 'Desc A' },
        { name: 'Location B', category: 'location', description: 'Desc B' }
      ];
      generateContentMock.mockResolvedValue({
        text: JSON.stringify(mockLore)
      });

      const result = await geminiService.extractLore('Story content about A and B');

      expect(result).toEqual(mockLore);
      expect(generateContentMock).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            responseSchema: expect.objectContaining({
              items: expect.objectContaining({
                required: expect.arrayContaining(['name', 'category', 'description'])
              })
            })
          })
        })
      );
    });
  });

  describe('diagnose', () => {
    it('should provide fix instructions for failures', async () => {
      generateContentMock.mockResolvedValue({
        text: JSON.stringify({ fixInstruction: 'Add more description to Character X' })
      });

      const result = await geminiService.diagnose('Inconsistency', 'Character X was missing');

      expect(result).toBe('Add more description to Character X');
      expect(generateContentMock).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.arrayContaining([
            expect.objectContaining({
              parts: expect.arrayContaining([
                expect.objectContaining({ text: expect.stringContaining('Inconsistency') })
              ])
            })
          ])
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle markdown blocks in JSON response gracefully', async () => {
      generateContentMock.mockResolvedValue({
        text: '```json\n{"isPass": true, "score": 100, "feedback": "OK"}\n```'
      });

      const result = await geminiService.auditChapter('text', []);
      expect(result.isPass).toBe(true);
    });

    it('should handle empty lore list in retrieveRelevantLore', async () => {
      const result = await geminiService.retrieveRelevantLore('Goal', []);
      expect(result).toEqual([]);
      expect(generateContentMock).not.toHaveBeenCalled();
    });
  });
});
