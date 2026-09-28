import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

/**
 * Build a preHandler that validates request `body` (and optionally
 * `params`/`query`) against a Zod schema.
 *
 * On failure responds 400 with the shared `{ success, error }` envelope
 * and the first user-friendly validation message — never raw internals.
 */
export function validate<TBody extends z.ZodTypeAny>(bodySchema: TBody) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    // Treat a missing body as {} so cookie-based flows (e.g. refresh via
    // httpOnly cookie) still validate instead of crashing.
    const parsed = bodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? 'Invalid request data';
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message,
        },
      });
    }
    request.body = parsed.data;
  };
}
