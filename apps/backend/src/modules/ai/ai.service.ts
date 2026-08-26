import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/database/prisma.service';
import { AiGateway } from './ai.gateway';
import { CurrentUserData } from '@/common/decorators/current-user.decorator';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly aiGateway: AiGateway,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Classify a complaint using AI
   */
  async classifyComplaint(complaintId: string, user: CurrentUserData) {
    const complaint = await this.prisma.complaint.findFirst({
      where: { id: complaintId, tenantId: user.tenantId },
    });

    if (!complaint) throw new Error('Complaint not found');

    const startTime = Date.now();
    const result = await this.aiGateway.classify({
      title: complaint.title,
      description: complaint.description,
    });

    // Store classification result
    await this.prisma.aiClassification.upsert({
      where: { complaintId },
      create: {
        complaintId,
        category: result.category,
        subcategory: result.subcategory,
        priority: result.priority,
        suggestedDepartment: result.suggestedDepartment,
        suggestedSlaHours: result.suggestedSlaHours,
        confidence: result.confidence,
        reasoning: result.reasoning,
        modelUsed: this.aiGateway.getProviderName(),
        processingTimeMs: Date.now() - startTime,
      },
      update: {
        category: result.category,
        subcategory: result.subcategory,
        priority: result.priority,
        suggestedDepartment: result.suggestedDepartment,
        suggestedSlaHours: result.suggestedSlaHours,
        confidence: result.confidence,
        reasoning: result.reasoning,
        modelUsed: this.aiGateway.getProviderName(),
        processingTimeMs: Date.now() - startTime,
      },
    });

    this.eventEmitter.emit('ai.classification.completed', {
      complaintId,
      tenantId: user.tenantId,
      result,
    });

    return result;
  }

  /**
   * Summarize a complaint
   */
  async summarizeComplaint(complaintId: string, user: CurrentUserData) {
    const complaint = await this.prisma.complaint.findFirst({
      where: { id: complaintId, tenantId: user.tenantId },
      include: {
        comments: { select: { content: true } },
      },
    });

    if (!complaint) throw new Error('Complaint not found');

    const startTime = Date.now();
    const result = await this.aiGateway.summarize({
      title: complaint.title,
      description: complaint.description,
      comments: complaint.comments.map((c) => c.content),
      resolution: complaint.resolution || undefined,
    });

    // Store summary
    await this.prisma.aiSummary.create({
      data: {
        complaintId,
        summary: result.summary,
        keyPoints: result.keyPoints,
        modelUsed: this.aiGateway.getProviderName(),
        processingTimeMs: Date.now() - startTime,
      },
    });

    return result;
  }

  /**
   * Analyze an image
   */
  async analyzeImage(imageUrl: string, context: string, user: CurrentUserData) {
    const startTime = Date.now();
    const result = await this.aiGateway.analyzeImage({ imageUrl, context });

    // Store analysis
    await this.prisma.aiAnalysis.create({
      data: {
        tenantId: user.tenantId,
        analysisType: 'IMAGE',
        inputData: { imageUrl, context },
        result: result as any,
        modelUsed: this.aiGateway.getProviderName(),
        confidence: result.confidence,
        processingTimeMs: Date.now() - startTime,
      },
    });

    return result;
  }

  /**
   * Get AI provider info
   */
  getInfo() {
    return {
      provider: this.aiGateway.getProviderName(),
      features: ['classification', 'summarization', 'image-analysis', 'embeddings', 'assistant'],
    };
  }

  /**
   * Citizen AI Assistant - answers questions using controlled tools.
   * The AI does NOT get raw DB access; it uses scoped queries that respect
   * the user's tenant and ownership.
   */
  async assistant(message: string, user: CurrentUserData) {
    const lower = message.toLowerCase();

    // Tool: complaint status lookup (scoped to the user's own complaints)
    if (lower.includes('status') || lower.includes('my complaint') || lower.includes('track')) {
      const complaints = await this.prisma.complaint.findMany({
        where: { tenantId: user.tenantId, citizenId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { complaintNumber: true, title: true, status: true, createdAt: true },
      });

      if (complaints.length === 0) {
        return {
          reply: "You haven't filed any complaints yet. You can report a civic issue from the 'New Complaint' page.",
          suggestions: ['How do I report garbage?', 'What categories can I report?'],
        };
      }

      const lines = complaints
        .map((c) => `• ${c.complaintNumber} — "${c.title}": ${c.status.replace('_', ' ')}`)
        .join('\n');
      return {
        reply: `Here are your recent complaints and their status:\n${lines}`,
        suggestions: ['How long does resolution take?', 'How do I reopen a complaint?'],
      };
    }

    // Tool: how to report
    if (lower.includes('how') && (lower.includes('report') || lower.includes('file') || lower.includes('raise'))) {
      return {
        reply:
          "To report a civic issue:\n1. Go to 'New Complaint'\n2. Pick a category (Garbage, Potholes, Water, etc.)\n3. Add a title and detailed description\n4. Optionally add your location and photos\n5. Submit — you'll get a complaint number to track it.",
        suggestions: ['What is the status of my complaint?', 'What categories can I report?'],
      };
    }

    // Tool: categories
    if (lower.includes('categor') || lower.includes('what can i report') || lower.includes('types')) {
      return {
        reply:
          'You can report: Garbage/Waste, Road Damage, Potholes, Drainage/Sewage, Water Leakage, Street Lights, Illegal Dumping, Public Sanitation, Parks & Gardens, and Other civic issues.',
        suggestions: ['How do I report garbage?', 'What is the status of my complaint?'],
      };
    }

    // Tool: SLA / resolution time
    if (lower.includes('how long') || lower.includes('sla') || lower.includes('resolution time') || lower.includes('when will')) {
      return {
        reply:
          'Resolution time depends on priority: Critical issues target 4 hours, High priority 24 hours, Medium 48 hours, and Low priority 72 hours. Your ward officer assigns a field worker who resolves it within the SLA.',
        suggestions: ['What is the status of my complaint?'],
      };
    }

    // Default fallback
    return {
      reply:
        "I'm the CivicOps assistant. I can help you report civic issues, track your complaints, and answer questions about categories and resolution times. What would you like to know?",
      suggestions: [
        'How do I report a civic issue?',
        'What is the status of my complaint?',
        'What categories can I report?',
        'How long does resolution take?',
      ],
    };
  }
}
