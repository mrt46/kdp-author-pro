
export type ChapterStatus = 'empty' | 'writing' | 'auditing' | 'completed' | 'error' | 'revising';

// AI Orchestrator Types
export type AIProvider = 'google' | 'openai' | 'anthropic' | 'deepseek' | 'meta' | 'fal-ai' | 'replicate';

export interface ModelConfig {
  id: string;
  provider: AIProvider;
  tier: 'economy' | 'standard' | 'premium';
  inputCostPer1M: number;
  outputCostPer1M: number;
  contextWindow: number;
  maxOutputTokens: number;
  capabilities: ('text' | 'json' | 'image' | 'audio' | 'reasoning')[];
}

export interface AIUsageMetrics {
  promptTokens: number;
  completionTokens: number;
  totalCost: number;
  modelId: string;
  provider: AIProvider;
  timestamp: number;
  bookId?: string; // Track which book this usage belongs to
  chapterId?: string; // Track which chapter
  agent?: string; // Track which agent (Writer, Auditor, etc.)
  duration?: number; // Call duration in ms
}

export interface UnifiedAIResponse<T> {
  content: T;
  usage: AIUsageMetrics;
}

export interface AIError {
  provider: AIProvider;
  code: string;
  message: string;
  isRetryable: boolean;
  retryAfter?: number;
}

export interface LoreEntry {
  id: string;
  name: string;
  category: 'character' | 'location' | 'item' | 'event' | 'rule';
  description: string;
  traits: string[];
  relationships?: string;
  isNew?: boolean; 
  // Structured Memory fields
  relatedEntryIds?: string[];
  semanticHash?: string; // Vektör aramayı simüle etmek için
  tags: string[];
}

export interface TelemetryMetrics {
  actionLevel: number; 
  boredomLevel: number; 
  loreConsistency: number; 
  kdpCompliance: number; 
  activeAgent: 'Director' | 'Writer' | 'Auditor' | 'World Architect' | 'Legal' | 'Idle' | 'System Analyst' | 'SEO Analyst' | 'Vector Retriever' | 'Revision Specialist';
  lastIntervention?: string;
}

export interface Chapter {
  id: string;
  title: string;
  description?: string;
  content: string;
  wordCount: number;
  status: ChapterStatus;
  auditNotes?: string;
  failureDiagnosis?: string;
}

export interface ProjectStrategy {
  niche: string;
  genre: string;
  targetAudience: string;
  pageCountGoal: number;
  marketAnalysis: string;
  seoKeywords: string[];
  suggestedChapters?: Partial<Chapter>[];
  pricingStrategy?: {
    suggestedPrice: number;
    reasoning: string;
  };
  backendKeywords?: string[];
  sources?: any[];
  competitorGaps?: string[];
}

export interface AuthorPersona {
  penName: string;
  bio: string;
  expertise: string[];
}

export interface Illustration {
  id: string;
  url: string;
  prompt: string;
  type: 'cover' | 'a-plus';
}

export interface VideoTrailer {
  id: string;
  videoUrl: string;
  prompt: string;
}

export interface LaunchKit {
  instagram: string[];
  twitter: string[];
  email: string;
}

export interface Book {
  id: string;
  metadata: BookMetadata;
  chapters: Chapter[];
  illustrations: Illustration[];
  trailers: VideoTrailer[];
  loreBible: LoreEntry[];
  audits: any[];
  legalAudits: LegalAudit[];
  originalityScans: OriginalityScanResult[];
  createdAt: number;
  updatedAt: number;
}

export interface BookMetadata {
  title: string;
  subtitle: string;
  description: string;
  keywords: string[];
  categories: string[];
  targetAudience: string;
  language: string;
  strategy?: ProjectStrategy;
  tone?: string;
  targetLength?: 'short' | 'standard' | 'long';
  authorPersona?: AuthorPersona;
}

export type AppState = 'dashboard' | 'editor' | 'preview' | 'strategy' | 'illustrations' | 'orchestrator' | 'legal-audit' | 'marketing' | 'lore-bible' | 'export-lab' | 'book-config' | 'book-refactorer' | 'book-library' | 'cost-dashboard' | 'originality-check' | 'review-dashboard';

export interface AgentLog {
  id: string;
  timestamp: number;
  agent: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'critical';
  details?: string;
}

export type AIProfile = 'Reasoning' | 'Creative' | 'Balanced' | 'Turbo';

export interface ModelAssignment {
  outline: AIProfile;
  writing: AIProfile;
  auditing: AIProfile;
}

export interface ExportSettings {
  format: 'pdf' | 'epub';
  paperSize: 'a4' | 'letter' | '6x9';
  margins: 'narrow' | 'normal' | 'wide';
}

export interface DetectedChapter {
  title: string;
  content: string;
}

export interface LegalAudit {
  id: string;
  riskLevel: 'low' | 'medium' | 'high';
  findings: string;
  timestamp: number;
}

// Originality Guardian Types
export interface OriginalityIssue {
  id: string;
  chapterId: string;
  chapterTitle: string;
  paragraphIndex: number;
  text: string;
  issueType: 'duplicate' | 'external-match' | 'ai-signature';
  severity: 'low' | 'medium' | 'high';
  details: string;
  matchPercentage?: number;
  matchSource?: string;
  autoFixSuggestion?: string;
}

export interface OriginalityScanResult {
  id: string;
  bookId: string;
  timestamp: number;
  overallScore: number; // 0-100
  internalScore: number; // 0-100
  externalScore: number; // 0-100
  aiDetectionScore: number; // 0-100
  issues: OriginalityIssue[];
  status: 'safe' | 'review-required' | 'unsafe';
  scannedSources: string[];
}

export interface AIDetectionMetrics {
  perplexity: number;
  burstiness: number;
  vocabularyDiversity: number;
  clicheDensity: number;
  overallRisk: 'low' | 'medium' | 'high';
}