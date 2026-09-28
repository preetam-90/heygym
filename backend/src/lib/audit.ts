import { prisma } from './prisma';

export interface AuditEntry {
  actorId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  reason?: string | null;
  ip?: string | null;
}

/** Minimal structural type so both PrismaClient and transaction clients work. */
interface AuditLogWriter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  auditLog: { create: (args: any) => Promise<any> };
}

/**
 * Append-only audit write (create only — no update/delete exists anywhere).
 */
export async function writeAudit(entry: AuditEntry, db: AuditLogWriter = prisma) {
  return db.auditLog.create({
    data: {
      actorId: entry.actorId ?? null,
      action: entry.action,
      targetType: entry.targetType ?? null,
      targetId: entry.targetId ?? null,
      reason: entry.reason ?? null,
      ip: entry.ip ?? null,
    },
  });
}
