# AI Architecture

## Overview

CivicOps integrates AI capabilities through a provider-abstracted gateway pattern. Business logic never directly calls AI providers.

## Architecture

```
Controller
  → Service
    → AI Gateway
      → Provider Adapter
        → Gemini / OpenAI / etc.
```

## Provider Abstraction

```typescript
interface AiProvider {
  classify(input: ClassificationInput): Promise<ClassificationResult>;
  summarize(input: SummarizationInput): Promise<SummaryResult>;
  analyzeImage(input: ImageInput): Promise<ImageAnalysisResult>;
  generateEmbedding(input: string): Promise<number[]>;
}
```

Switching providers requires only changing the `AI_PROVIDER` environment variable.

## Features

### 1. Complaint Classification
- Input: Citizen description text
- Output: Category, subcategory, priority, suggested department, confidence score
- Processing: Async via BullMQ queue

### 2. Image Analysis
- Input: Complaint photo
- Output: Detected issue, severity, confidence
- Use cases: Pothole detection, garbage identification, damage assessment

### 3. Complaint Summary
- Input: Description + comments + officer notes + resolution
- Output: Concise summary with key points
- Used for: Officer dashboards, reports

### 4. Citizen AI Assistant
- Tool-calling pattern (AI calls backend services through authorized tools)
- Same RBAC/scope rules apply
- Cannot access other tenants' data

### 5. AI Analytics
- Generates insights from database metrics
- Trend analysis, hotspot detection
- Database is source of truth (AI does not invent statistics)

## RAG (Retrieval-Augmented Generation)

```
Document Upload
  → Text Extraction
    → Chunking (512 tokens)
      → Embedding Generation
        → pgvector Storage
          → Similarity Search at query time
            → Context injection into AI prompt
```

- Tenant-isolated: Each tenant's documents are separate
- Vector storage: PostgreSQL + pgvector extension
- Embedding model: Configurable (default: text-embedding-004)
