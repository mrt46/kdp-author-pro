
export type ChapterStatus = 'empty' | 'writing' | 'auditing' | 'completed' | 'error' | 'revising';

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
  legalAudits: any[];
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

export type AppState = 'dashboard' | 'editor' | 'preview' | 'strategy' | 'illustrations' | 'orchestrator' | 'legal-audit' | 'marketing' | 'lore-bible' | 'export-lab' | 'book-config' | 'book-refactorer';

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