// ============================================================
// SLA Configuration
// ============================================================

/**
 * Default SLA hours based on complaint priority
 */
export const DEFAULT_SLA_HOURS: Record<string, number> = {
  LOW: 72,       // 3 days
  MEDIUM: 48,    // 2 days
  HIGH: 24,      // 1 day
  CRITICAL: 4,   // 4 hours
};

/**
 * SLA warning threshold percentage
 * When this % of SLA time has passed, trigger a warning
 */
export const SLA_WARNING_THRESHOLD = 0.75; // 75%

/**
 * SLA check interval in milliseconds
 */
export const SLA_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
