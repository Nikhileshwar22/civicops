# Webhooks

## Overview

CivicOps provides a webhook system for external integrations. Tenant admins can configure webhook endpoints to receive real-time event notifications.

## Supported Events

| Event | Trigger |
|-------|---------|
| `complaint.created` | New complaint submitted |
| `complaint.assigned` | Complaint assigned to officer/worker |
| `complaint.in_progress` | Work started on complaint |
| `complaint.resolved` | Complaint marked as resolved |
| `complaint.closed` | Complaint closed |
| `complaint.reopened` | Closed complaint reopened |
| `ai.classification.completed` | AI classification result ready |
| `sla.warning` | SLA approaching deadline |
| `sla.breached` | SLA deadline exceeded |

## Delivery

- **Transport**: HTTP POST to configured URL
- **Format**: JSON payload
- **Timeout**: 30 seconds
- **Retries**: 5 attempts with exponential backoff (2s, 4s, 8s, 16s, 32s)
- **Processing**: Async via BullMQ (never blocks API)

## Security

### HMAC Signature

Every webhook delivery includes an HMAC-SHA256 signature:

```
X-CivicOps-Signature: sha256=<hmac_hex>
X-CivicOps-Timestamp: <unix_timestamp>
X-CivicOps-Event: <event_name>
```

### Verification (receiver side)

```javascript
const crypto = require('crypto');

function verifySignature(payload, timestamp, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${JSON.stringify(payload)}`)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expected}`)
  );
}
```

## Payload Structure

```json
{
  "id": "delivery-uuid",
  "event": "complaint.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "tenantId": "tenant-uuid",
  "data": {
    "complaintId": "complaint-uuid",
    "complaintNumber": "CMP-2401-00001",
    "category": "POTHOLES",
    "priority": "HIGH",
    "status": "RECEIVED"
  }
}
```
