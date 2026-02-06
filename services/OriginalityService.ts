import {
  Book,
  OriginalityIssue,
  OriginalityScanResult,
  AIDetectionMetrics,
} from '../types';

/**
 * Originality Guardian Service
 * 3-Phase plagiarism and AI detection system
 */
class OriginalityService {
  /**
   * Phase 1: Internal Consistency Check
   * Detects duplicate paragraphs and repetitive phrasing within the book
   */
  private async checkInternalConsistency(book: Book): Promise<{
    score: number;
    issues: OriginalityIssue[];
  }> {
    const issues: OriginalityIssue[] = [];
    const paragraphs: Map<string, { chapterId: string; chapterTitle: string; index: number; text: string }[]> = new Map();

    // Extract all paragraphs
    book.chapters.forEach((chapter) => {
      const chapterParagraphs = chapter.content
        .split(/\n\n+/)
        .filter((p) => p.trim().length > 50); // Only paragraphs >50 chars

      chapterParagraphs.forEach((text, index) => {
        const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
        const hash = this.simpleHash(normalized);

        if (!paragraphs.has(hash)) {
          paragraphs.set(hash, []);
        }

        paragraphs.get(hash)!.push({
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          index,
          text,
        });
      });
    });

    // Find duplicates
    paragraphs.forEach((locations, hash) => {
      if (locations.length > 1) {
        // Exact duplicate found
        const first = locations[0];
        locations.slice(1).forEach((dup) => {
          issues.push({
            id: crypto.randomUUID(),
            chapterId: dup.chapterId,
            chapterTitle: dup.chapterTitle,
            paragraphIndex: dup.index,
            text: dup.text.slice(0, 200) + '...',
            issueType: 'duplicate',
            severity: 'high',
            details: `Duplicate of paragraph in "${first.chapterTitle}"`,
            matchPercentage: 100,
            autoFixSuggestion: 'Consider paraphrasing or removing this repetition.',
          });
        });
      }
    });

    // Check for near-duplicates (75%+ similarity)
    const allParagraphsArray = Array.from(paragraphs.values()).flat();
    for (let i = 0; i < allParagraphsArray.length; i++) {
      for (let j = i + 1; j < allParagraphsArray.length; j++) {
        const similarity = this.calculateSimilarity(
          allParagraphsArray[i].text,
          allParagraphsArray[j].text
        );

        if (similarity > 0.75 && similarity < 1.0) {
          issues.push({
            id: crypto.randomUUID(),
            chapterId: allParagraphsArray[j].chapterId,
            chapterTitle: allParagraphsArray[j].chapterTitle,
            paragraphIndex: allParagraphsArray[j].index,
            text: allParagraphsArray[j].text.slice(0, 200) + '...',
            issueType: 'duplicate',
            severity: 'medium',
            details: `${Math.round(similarity * 100)}% similar to paragraph in "${allParagraphsArray[i].chapterTitle}"`,
            matchPercentage: Math.round(similarity * 100),
            autoFixSuggestion: 'Consider rephrasing to increase diversity.',
          });
        }
      }
    }

    const score = Math.max(0, 100 - issues.length * 5);
    return { score, issues };
  }

  /**
   * Phase 2: External Similarity Scan
   * Checks against Google Books API and web sources
   */
  private async checkExternalSimilarity(book: Book): Promise<{
    score: number;
    issues: OriginalityIssue[];
    scannedSources: string[];
  }> {
    const issues: OriginalityIssue[] = [];
    const scannedSources: string[] = [];

    // Extract key phrases (5-10 words) from each chapter
    for (const chapter of book.chapters) {
      const phrases = this.extractKeyPhrases(chapter.content);

      // Check top 3 phrases per chapter
      for (const phrase of phrases.slice(0, 3)) {
        try {
          // Google Books API check (free tier)
          const googleBooksResult = await this.searchGoogleBooks(phrase);

          if (googleBooksResult.matchFound) {
            issues.push({
              id: crypto.randomUUID(),
              chapterId: chapter.id,
              chapterTitle: chapter.title,
              paragraphIndex: 0,
              text: phrase,
              issueType: 'external-match',
              severity: googleBooksResult.matchPercentage > 80 ? 'high' : 'medium',
              details: `Found in: "${googleBooksResult.source}"`,
              matchPercentage: googleBooksResult.matchPercentage,
              matchSource: googleBooksResult.source,
              autoFixSuggestion: 'Consider paraphrasing this section to ensure originality.',
            });

            scannedSources.push(googleBooksResult.source);
          }
        } catch (error) {
          console.error('External scan error:', error);
        }
      }
    }

    const score = Math.max(0, 100 - issues.length * 10);
    return { score, issues, scannedSources };
  }

  /**
   * Phase 3: AI Detection
   * Analyzes perplexity, burstiness, and other AI signatures
   */
  private async detectAISignature(book: Book): Promise<{
    score: number;
    issues: OriginalityIssue[];
    metrics: AIDetectionMetrics;
  }> {
    const issues: OriginalityIssue[] = [];

    // Combine all chapter content
    const fullText = book.chapters.map((ch) => ch.content).join('\n\n');

    // Calculate AI detection metrics
    const metrics: AIDetectionMetrics = {
      perplexity: this.calculatePerplexity(fullText),
      burstiness: this.calculateBurstiness(fullText),
      vocabularyDiversity: this.calculateVocabularyDiversity(fullText),
      clicheDensity: this.calculateClicheDensity(fullText),
      overallRisk: 'low',
    };

    // Determine overall risk
    const aiScore =
      metrics.perplexity * 0.3 +
      metrics.burstiness * 0.3 +
      metrics.vocabularyDiversity * 0.2 +
      (100 - metrics.clicheDensity) * 0.2;

    if (aiScore < 40) {
      metrics.overallRisk = 'high';
    } else if (aiScore < 70) {
      metrics.overallRisk = 'medium';
    }

    // Flag chapters with high AI signature
    book.chapters.forEach((chapter) => {
      const chapterScore =
        this.calculatePerplexity(chapter.content) * 0.4 +
        this.calculateBurstiness(chapter.content) * 0.4 +
        this.calculateVocabularyDiversity(chapter.content) * 0.2;

      if (chapterScore < 50) {
        issues.push({
          id: crypto.randomUUID(),
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          paragraphIndex: 0,
          text: chapter.content.slice(0, 200) + '...',
          issueType: 'ai-signature',
          severity: chapterScore < 30 ? 'high' : 'medium',
          details: `High AI signature detected (score: ${Math.round(chapterScore)}/100)`,
          matchPercentage: Math.round(100 - chapterScore),
          autoFixSuggestion:
            'Add personal examples, vary sentence structure, or use more creative language.',
        });
      }
    });

    const score = Math.round(aiScore);
    return { score, issues, metrics };
  }

  /**
   * Main scan method - runs all 3 phases
   */
  public async scanBook(book: Book, phases: {
    internal: boolean;
    external: boolean;
    aiDetection: boolean;
  } = { internal: true, external: true, aiDetection: false }): Promise<OriginalityScanResult> {
    console.log(`[OriginalityGuardian] Starting scan for book: ${book.metadata.title}`);

    const allIssues: OriginalityIssue[] = [];
    let scannedSources: string[] = [];
    let internalScore = 100;
    let externalScore = 100;
    let aiDetectionScore = 100;

    // Phase 1: Internal
    if (phases.internal) {
      console.log('[OriginalityGuardian] Phase 1: Internal consistency check...');
      const internal = await this.checkInternalConsistency(book);
      internalScore = internal.score;
      allIssues.push(...internal.issues);
    }

    // Phase 2: External
    if (phases.external) {
      console.log('[OriginalityGuardian] Phase 2: External similarity scan...');
      const external = await this.checkExternalSimilarity(book);
      externalScore = external.score;
      allIssues.push(...external.issues);
      scannedSources = external.scannedSources;
    }

    // Phase 3: AI Detection
    if (phases.aiDetection) {
      console.log('[OriginalityGuardian] Phase 3: AI signature detection...');
      const aiDetection = await this.detectAISignature(book);
      aiDetectionScore = aiDetection.score;
      allIssues.push(...aiDetection.issues);
    }

    // Calculate overall score
    const overallScore = Math.round(
      (internalScore + externalScore + aiDetectionScore) / 3
    );

    // Determine status
    let status: 'safe' | 'review-required' | 'unsafe' = 'safe';
    if (overallScore < 60) {
      status = 'unsafe';
    } else if (overallScore < 80) {
      status = 'review-required';
    }

    const result: OriginalityScanResult = {
      id: crypto.randomUUID(),
      bookId: book.id,
      timestamp: Date.now(),
      overallScore,
      internalScore,
      externalScore,
      aiDetectionScore,
      issues: allIssues,
      status,
      scannedSources,
    };

    console.log(`[OriginalityGuardian] Scan complete. Score: ${overallScore}/100, Status: ${status}`);
    return result;
  }

  // Helper Methods

  private simpleHash(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    const set1 = new Set(words1);
    const set2 = new Set(words2);

    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size; // Jaccard similarity
  }

  private extractKeyPhrases(text: string): string[] {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 20);
    return sentences.map((s) => s.trim()).filter((s) => s.split(/\s+/).length >= 5);
  }

  private async searchGoogleBooks(phrase: string): Promise<{
    matchFound: boolean;
    matchPercentage: number;
    source: string;
  }> {
    // Google Books API integration (mock for now)
    // In production, use: https://www.googleapis.com/books/v1/volumes?q={phrase}

    // For now, return random results for demo
    const isMatch = Math.random() < 0.1; // 10% chance of match for testing
    return {
      matchFound: isMatch,
      matchPercentage: isMatch ? Math.floor(Math.random() * 30) + 60 : 0,
      source: isMatch ? 'Sample Book Title (Google Books)' : '',
    };
  }

  private calculatePerplexity(text: string): number {
    // Simple perplexity approximation (higher = more human-like)
    const words = text.split(/\s+/);
    const uniqueWords = new Set(words);
    const ratio = uniqueWords.size / words.length;

    // Higher vocabulary diversity = higher perplexity
    return Math.min(100, ratio * 200);
  }

  private calculateBurstiness(text: string): number {
    // Measure sentence length variance (higher = more human-like)
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const lengths = sentences.map((s) => s.split(/\s+/).length);

    if (lengths.length < 2) return 50;

    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance =
      lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) /
      lengths.length;

    const stdDev = Math.sqrt(variance);

    // Normalize to 0-100 scale
    return Math.min(100, (stdDev / mean) * 100);
  }

  private calculateVocabularyDiversity(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);

    // Type-Token Ratio (TTR)
    const ttr = uniqueWords.size / words.length;

    // Normalize to 0-100
    return Math.min(100, ttr * 150);
  }

  private calculateClicheDensity(text: string): number {
    // Common AI clichés
    const cliches = [
      'delve',
      'tapestry',
      'landscape',
      'realm',
      'nuanced',
      'multifaceted',
      'paradigm',
      'leverage',
      'synergy',
      'holistic',
      'robust',
      'innovative',
      'cutting-edge',
      'state-of-the-art',
    ];

    const words = text.toLowerCase().split(/\s+/);
    const clicheCount = words.filter((w) => cliches.includes(w)).length;

    // Return density as percentage
    return Math.min(100, (clicheCount / words.length) * 1000);
  }
}

export const originalityService = new OriginalityService();
