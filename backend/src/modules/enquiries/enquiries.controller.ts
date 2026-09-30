import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { EnquiriesService } from './enquiries.service';
import { isCodedError } from '../../lib/errors';
import { createEnquirySchema, updateEnquirySchema } from './enquiries.schema';

export class EnquiriesController {
  constructor(private svc: EnquiriesService) {}

  async create(request: FastifyRequest<{ Params: { gymId: string } }>, reply: FastifyReply) {
    try {
      const parsed = createEnquirySchema.parse({ body: request.body ?? {}, params: request.params });
      const enquiry = await this.svc.createEnquiry(parsed.params.gymId, request.user.id, parsed.body.message);
      return reply.status(201).send({ success: true, data: { enquiry } });
    } catch (error) {
      if (isCodedError(error)) return reply.status(error.statusCode).send({ success: false, error: { code: error.code, message: error.message } });
      if (error instanceof ZodError) return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: error.issues[0]?.message ?? 'Invalid input' } });
      return reply.status(400).send({ success: false, error: { code: 'CREATE_ERROR', message: 'Failed to create enquiry' } });
    }
  }

  async listOwnerEnquiries(request: FastifyRequest, reply: FastifyReply) {
    try {
      const q = request.query as { page?: string; pageSize?: string; status?: string; gymId?: string };
      const result = await this.svc.listOwnerEnquiries(request.user.id, {
        page: q.page ? parseInt(q.page, 10) : 1,
        pageSize: q.pageSize ? parseInt(q.pageSize, 10) : 20,
        status: q.status,
        gymId: q.gymId,
      });
      return reply.send({ success: true, data: result });
    } catch {
      return reply.status(500).send({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to list enquiries' } });
    }
  }

  async getOwnerEnquiry(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const enquiry = await this.svc.getOwnerEnquiry(request.params.id, request.user.id);
      // Mark as READ on view if NEW
      if (enquiry.status === 'NEW') {
        await this.svc.updateOwnerEnquiry(enquiry.id, request.user.id, { status: 'READ' }).catch(() => null);
      }
      return reply.send({ success: true, data: { enquiry } });
    } catch (error) {
      if (isCodedError(error)) return reply.status(error.statusCode).send({ success: false, error: { code: error.code, message: error.message } });
      return reply.status(500).send({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to get enquiry' } });
    }
  }

  async updateOwnerEnquiry(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const parsed = updateEnquirySchema.parse({ body: request.body ?? {} });
      const enquiry = await this.svc.updateOwnerEnquiry(request.params.id, request.user.id, parsed.body);
      return reply.send({ success: true, data: { enquiry } });
    } catch (error) {
      if (isCodedError(error)) return reply.status(error.statusCode).send({ success: false, error: { code: error.code, message: error.message } });
      if (error instanceof ZodError) return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } });
      return reply.status(400).send({ success: false, error: { code: 'UPDATE_ERROR', message: 'Failed to update enquiry' } });
    }
  }

  async listMine(request: FastifyRequest, reply: FastifyReply) {
    try {
      const q = request.query as { page?: string; pageSize?: string };
      const result = await this.svc.listUserEnquiries(request.user.id, q.page ? parseInt(q.page, 10) : 1, q.pageSize ? parseInt(q.pageSize, 10) : 20);
      return reply.send({ success: true, data: result });
    } catch {
      return reply.status(500).send({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to list enquiries' } });
    }
  }
}
