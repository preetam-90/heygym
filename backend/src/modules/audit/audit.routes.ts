import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../lib/prisma';

interface AuditLogQuery {
  search?: string;
  action?: string;
  actorId?: string;
  page?: string;
  pageSize?: string;
}

export const auditRoutes: FastifyPluginAsync = async (fastify) => {
  // Append-only log: list endpoint only. No update/delete routes exist.
  fastify.route({
    method: 'GET',
    url: '/audit-logs',
    preHandler: [fastify.authenticate, fastify.requireRole('ADMIN'), fastify.requirePermission('audit.view')],
    handler: async (request: FastifyRequest<{ Querystring: AuditLogQuery }>, reply: FastifyReply) => {
      try {
        const { search, action, actorId } = request.query;
        const page = Math.max(1, parseInt(request.query.page ?? '1', 10) || 1);
        const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? '20', 10) || 20));

        const where: Record<string, unknown> = {};
        if (action) where.action = action;
        if (actorId) where.actorId = actorId;
        if (search) {
          where.OR = [
            { action: { contains: search, mode: 'insensitive' } },
            { targetType: { contains: search, mode: 'insensitive' } },
            { targetId: { contains: search, mode: 'insensitive' } },
            { reason: { contains: search, mode: 'insensitive' } },
          ];
        }

        const [total, logs] = await Promise.all([
          prisma.auditLog.count({ where }),
          prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
          }),
        ]);

        return reply.send({
          success: true,
          data: { logs, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } },
        });
      } catch (error) {
        return reply.status(500).send({
          success: false,
          error: { code: 'SERVER_ERROR', message: 'Failed to fetch audit logs' },
        });
      }
    },
  });
};
