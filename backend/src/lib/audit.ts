import { prisma } from './prisma';

export interface AuditEntry {
  actorId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  reason?: string | null;
  ip?: string | null;
  metadata?: Record<string, unknown> | null;
}

/** Minimal structural type so both PrismaClient and transaction clients work. */
interface AuditWriter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  auditLog: { create: (args: any) => Promise<any> };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminAction: { create: (args: any) => Promise<any> };
}

/**
 * Append-only audit write (create only — no update/delete exists anywhere).
 * Dual-writes to legacy AuditLog and canonical AdminAction for compatibility.
 */
export async function writeAudit(entry: AuditEntry, db: AuditWriter = prisma) {
  const base = {
    actorId: entry.actorId ?? null,
    action: entry.action,
    targetType: entry.targetType ?? null,
    targetId: entry.targetId ?? null,
    reason: entry.reason ?? null,
    ip: entry.ip ?? null,
  };
  const [log] = await Promise.all([
    db.auditLog.create({ data: base }),
    db.adminAction
      .create({ data: { ...base, metadata: entry.metadata ?? undefined } })
      .catch(() => null),
  ]);
  return log;
}
