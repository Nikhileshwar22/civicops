import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAiProvider } from './providers/openai.provider';
import {
  AiProviderInterface,
  ClassificationInput,
  ClassificationResult,
  SummarizationInput,
  SummaryResult,
  ImageAnalysisInput,
  ImageAnalysisResult,
  EmbeddingResult,
} from './providers/ai-provider.interface';

/**
 * AI Gateway - Provider Abstraction Layer
 * Routes AI requests to the configured provider.
 * Switching providers requires only changing AI_PROVIDER env variable.
 */
@Injectable()
export class AiGateway {
  private readonly logger = new Logger(AiGateway.name);
  private readonly provider: AiProviderInterface;

  constructor(
    private configService: ConfigService,
    private geminiProvider: GeminiProvider,
    private openAiProvider: OpenAiProvider,
  ) {
    const providerName = this.configService.get('AI_PROVIDER', 'gemini');
    this.provider = providerName === 'openai' ? this.openAiProvider : this.geminiProvider;
    this.logger.log(`AI Gateway initialized with provider: ${this.provider.name}`);
  }

  async classify(input: ClassificationInput): Promise<ClassificationResult> {
    const startTime = Date.now();
    const result = await this.provider.classify(input);
    this.logger.debug(`Classification took ${Date.now() - startTime}ms`);
    return result;
  }

  async summarize(input: SummarizationInput): Promise<SummaryResult> {
    const startTime = Date.now();
    const result = await this.provider.summarize(input);
    this.logger.debug(`Summarization took ${Date.now() - startTime}ms`);
    return result;
  }

  async analyzeImage(input: ImageAnalysisInput): Promise<ImageAnalysisResult> {
    const startTime = Date.now();
    const result = await this.provider.analyzeImage(input);
    this.logger.debug(`Image analysis took ${Date.now() - startTime}ms`);
    return result;
  }

  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    return this.provider.generateEmbedding(text);
  }

  getProviderName(): string {
    return this.provider.name;
  }
}
