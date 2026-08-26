import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  provider: process.env.AI_PROVIDER || 'gemini', // gemini | openai
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-pro',
  geminiVisionModel: process.env.GEMINI_VISION_MODEL || 'gemini-pro-vision',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4',
  openaiVisionModel: process.env.OPENAI_VISION_MODEL || 'gpt-4-vision-preview',
  embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-004',
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2048', 10),
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.3'),
}));
