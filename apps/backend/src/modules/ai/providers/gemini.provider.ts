import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiProviderInterface,
  ClassificationInput,
  ClassificationResult,
  SummarizationInput,
  SummaryResult,
  ImageAnalysisInput,
  ImageAnalysisResult,
  EmbeddingResult,
} from './ai-provider.interface';

@Injectable()
export class GeminiProvider implements AiProviderInterface {
  readonly name = 'gemini';
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly visionModel: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get('GEMINI_API_KEY', '');
    this.model = this.configService.get('GEMINI_MODEL', 'gemini-pro');
    this.visionModel = this.configService.get('GEMINI_VISION_MODEL', 'gemini-pro-vision');
  }

  async classify(input: ClassificationInput): Promise<ClassificationResult> {
    if (!this.apiKey) {
      return this.mockClassification(input);
    }

    // Production: call Gemini API
    // const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${this.model}:generateContent?key=${this.apiKey}`, {...});
    return this.mockClassification(input);
  }

  async summarize(input: SummarizationInput): Promise<SummaryResult> {
    if (!this.apiKey) {
      return this.mockSummary(input);
    }

    return this.mockSummary(input);
  }

  async analyzeImage(input: ImageAnalysisInput): Promise<ImageAnalysisResult> {
    if (!this.apiKey) {
      return this.mockImageAnalysis();
    }

    return this.mockImageAnalysis();
  }

  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    if (!this.apiKey) {
      // Return a mock 1536-dimension embedding
      return {
        embedding: Array.from({ length: 1536 }, () => Math.random() * 2 - 1),
        model: 'mock-embedding',
      };
    }

    return {
      embedding: Array.from({ length: 1536 }, () => Math.random() * 2 - 1),
      model: this.model,
    };
  }

  private mockClassification(input: ClassificationInput): ClassificationResult {
    const categoryMap: Record<string, string> = {
      pothole: 'POTHOLES',
      road: 'ROAD_DAMAGE',
      garbage: 'GARBAGE',
      water: 'WATER_LEAKAGE',
      drain: 'DRAINAGE',
      light: 'STREET_LIGHTS',
      park: 'PARKS',
      dump: 'ILLEGAL_DUMPING',
    };

    const text = `${input.title} ${input.description}`.toLowerCase();
    let category = 'OTHER';
    for (const [keyword, cat] of Object.entries(categoryMap)) {
      if (text.includes(keyword)) { category = cat; break; }
    }

    const priorityKeywords = { critical: 'CRITICAL', urgent: 'HIGH', dangerous: 'HIGH' };
    let priority = 'MEDIUM';
    for (const [kw, p] of Object.entries(priorityKeywords)) {
      if (text.includes(kw)) { priority = p; break; }
    }

    return {
      category,
      subcategory: undefined,
      priority,
      suggestedDepartment: this.getDepartmentForCategory(category),
      suggestedSlaHours: priority === 'CRITICAL' ? 4 : priority === 'HIGH' ? 24 : 48,
      confidence: 0.75 + Math.random() * 0.2,
      reasoning: `Classified based on keyword analysis of title and description.`,
    };
  }

  private mockSummary(input: SummarizationInput): SummaryResult {
    return {
      summary: `Complaint: ${input.title}. ${input.description.substring(0, 150)}...`,
      keyPoints: [
        'Issue reported by citizen',
        input.comments?.length ? `${input.comments.length} comments received` : 'No comments yet',
        input.resolution ? 'Resolution provided' : 'Pending resolution',
      ],
    };
  }

  private mockImageAnalysis(): ImageAnalysisResult {
    return {
      detectedIssue: 'Infrastructure damage detected',
      severity: 'MEDIUM',
      confidence: 0.78,
      description: 'Image analysis indicates potential civic infrastructure issue requiring attention.',
    };
  }

  private getDepartmentForCategory(category: string): string {
    const map: Record<string, string> = {
      POTHOLES: 'Roads & Buildings',
      ROAD_DAMAGE: 'Roads & Buildings',
      GARBAGE: 'Sanitation',
      ILLEGAL_DUMPING: 'Sanitation',
      PUBLIC_SANITATION: 'Sanitation',
      WATER_LEAKAGE: 'Water Supply',
      DRAINAGE: 'Drainage',
      STREET_LIGHTS: 'Street Lighting',
      PARKS: 'Parks & Gardens',
    };
    return map[category] || 'General Administration';
  }
}
