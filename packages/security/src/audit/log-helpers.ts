import type { AuditEvent } from '../types.js';

export type { AuditEvent };

/**
 * Build a structured audit-log entry per FR-LD (append-only ledger).
 *
 * - Stamps `timestamp` to now in ISO-8601 if the caller didn't supply one
 *   (override is allowed for backfill / event-sourcing replay).
 * - Required fields (`actorId`, `action`, `entityType`, `entityId`) are
 *   enforced by the input type; runtime guards catch empty strings since the
 *   TypeScript constraint doesn't catch `''`.
 * - Does NOT persist — caller writes to their append-only store.
 *
 * Consumer pattern:
 *   const evt = buildAuditEvent({ actorId, action: 'pote.archive', entityType: 'pote', entityId, before, after });
 *   await ledger.append(evt);
 */
export function buildAuditEvent(
  input: Partial<AuditEvent> &
    Pick<AuditEvent, 'actorId' | 'action' | 'entityType' | 'entityId'>
): AuditEvent {
  const { actorId, action, entityType, entityId } = input;

  if (!actorId || typeof actorId !== 'string') {
    throw new Error('buildAuditEvent: actorId is required');
  }
  if (!action || typeof action !== 'string') {
    throw new Error('buildAuditEvent: action is required');
  }
  if (!entityType || typeof entityType !== 'string') {
    throw new Error('buildAuditEvent: entityType is required');
  }
  if (!entityId || typeof entityId !== 'string') {
    throw new Error('buildAuditEvent: entityId is required');
  }

  const event: AuditEvent = {
    timestamp: input.timestamp ?? new Date().toISOString(),
    actorId,
    action,
    entityType,
    entityId,
  };

  if (input.before !== undefined) event.before = input.before;
  if (input.after !== undefined) event.after = input.after;
  if (input.ip !== undefined) event.ip = input.ip;
  if (input.userAgent !== undefined) event.userAgent = input.userAgent;

  return event;
}
