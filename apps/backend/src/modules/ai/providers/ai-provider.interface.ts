/**
 * AI Provider Interface
 * All AI providers must implement this interface.
 * This allows swapping providers (Gemini, OpenAI, etc.) without changing business logic.
 */

export interface ClassificationInput {
  title: string;
  description: string;
  imageUrl?: string;
}

export interface ClassificationResult {
  category: string;
  subcategory?: string;
  priority: string;
  suggestedDepartment?: string;
  suggestedSlaHours?: number;
  confidence: number;
  reasoning?: string;
}

export interface SummarizationInput {
  title: string;
  description: string;
  comments?: string[];
  resolution?: string;
}

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
}

export interface ImageAnalysisInput {
  imageUrl: string;
  context?: string;
}

export interface ImageAnalysisResult {
  detectedIssue: string;
  severity: string;
  confidence: number;
  description: string;
}

export interface EmbeddingResult {
  embedding: number[];
  model: string;
}

export interface AiProviderInterface {
  readonly name: string;

  classify(input: ClassificationInput): Promise<ClassificationResult>;
  summarize(input: SummarizationInput): Promise<SummaryResult>;
  analyzeImage(input: ImageAnalysisInput): Promise<ImageAnalysisResult>;
  generateEmbedding(text: string): Promise<EmbeddingResult>;
}
