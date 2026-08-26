// ============================================================
// Application-wide constants
// ============================================================

export const APP_NAME = 'CivicOps';
export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

// Pagination defaults
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// File upload limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_ATTACHMENTS_PER_COMPLAINT = 5;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf'];
export const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

// Rate limiting
export const RATE_LIMIT_SHORT = { ttl: 1000, limit: 3 };
export const RATE_LIMIT_MEDIUM = { ttl: 10000, limit: 20 };
export const RATE_LIMIT_LONG = { ttl: 60000, limit: 100 };
export const RATE_LIMIT_AUTH = { ttl: 60000, limit: 5 };

// Token expiry
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';
export const SESSION_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

// Cache TTLs (in seconds)
export const CACHE_TTL = {
  SHORT: 60,           // 1 minute
  MEDIUM: 300,         // 5 minutes
  LONG: 3600,          // 1 hour
  GEOGRAPHY: 3600,     // 1 hour - zones/circles/wards rarely change
  DEPARTMENTS: 3600,   // 1 hour
  DASHBOARD: 120,      // 2 minutes
  USER_PERMISSIONS: 300, // 5 minutes
};

// Webhook
export const WEBHOOK_MAX_RETRIES = 5;
export const WEBHOOK_TIMEOUT_MS = 30000;
export const WEBHOOK_SIGNATURE_HEADER = 'x-civicops-signature';
export const WEBHOOK_TIMESTAMP_HEADER = 'x-civicops-timestamp';

// Queue job names
export const JOB_NAMES = {
  AI_CLASSIFY: 'ai:classify',
  AI_SUMMARIZE: 'ai:summarize',
  AI_ANALYZE_IMAGE: 'ai:analyze-image',
  WEBHOOK_DELIVER: 'webhook:deliver',
  EMAIL_SEND: 'email:send',
  NOTIFICATION_SEND: 'notification:send',
  REPORT_GENERATE: 'report:generate',
  IMAGE_PROCESS: 'image:process',
  SLA_CHECK: 'sla:check',
};
