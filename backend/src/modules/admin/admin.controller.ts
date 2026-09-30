import { FastifyRequest, FastifyReply } from 'fastify';
import { AdminService } from './admin.service';
import { UpdateGymStatusInput } from './admin.schema';
import { isCodedError } from '../../lib/errors';

export class AdminController {
  constructor(private adminService: AdminService) {}

  async getUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const q = request.query as { page?: string; pageSize?: string; search?: string };
      const result = await this.adminService.getUsers(q.page ? parseInt(q.page, 10) : 1, q.pageSize ? parseInt(q.pageSize, 10) : 20, q.search);
      return reply.send({ success: true, data: result });
    } catch {
      return reply.status(500).send({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to get users' } });
    }
  }

  async getGyms(request: FastifyRequest, reply: FastifyReply) {
    try {
      const q = request.query as { page?: string; pageSize?: string; status?: string };
      const result = await this.adminService.getGyms(q.page ? parseInt(q.page, 10) : 1, q.pageSize ? parseInt(q.pageSize, 10) : 20, q.status);
      return reply.send({ success: true, data: result });
    } catch {
      return reply.status(500).send({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to get gyms' } });
    }
  }

  async getPendingGyms(request: FastifyRequest, reply: FastifyReply) {
    try {
      const q = request.query as { page?: string; pageSize?: string };
      const result = await this.adminService.getPendingGyms(q.page ? parseInt(q.page, 10) : 1, q.pageSize ? parseInt(q.pageSize, 10) : 20);
      return reply.send({ success: true, data: result });
    } catch {
      return reply.status(500).send({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to get pending gyms' } });
    }
  }

  async getGymById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const gym = await this.adminService.getGymById(request.params.id);
      return reply.send({ success: true, data: { gym } });
    } catch (error) {
      if (isCodedError(error)) return reply.status(error.statusCode).send({ success: false, error: { code: error.code, message: error.message } });
      return reply.status(500).send({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to get gym' } });
    }
  }

  private meta(request: FastifyRequest) {
    const actorId = (request as unknown as { user?: { id?: string } }).user?.id ?? null;
    return { actorId, ip: request.ip ?? null };
  }

  async approve(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const gym = await this.adminService.approveGym(request.params.id, this.meta(request));
      return reply.send({ success: true, data: { gym } });
    } catch (error) {
      return reply.status(400).send({ success: false, error: { code: 'UPDATE_ERROR', message: error instanceof Error ? error.message : 'Failed' } });
    }
  }

  async reject(request: FastifyRequest<{ Params: { id: string }; Body: { reason?: string } }>, reply: FastifyReply) {
    try {
      const gym = await this.adminService.rejectGym(request.params.id, (request.body as { reason?: string })?.reason ?? '', this.meta(request));
      return reply.send({ success: true, data: { gym } });
    } catch (error) {
      if (isCodedError(error)) return reply.status(error.statusCode).send({ success: false, error: { code: error.code, message: error.message } });
      return reply.status(400).send({ success: false, error: { code: 'UPDATE_ERROR', message: error instanceof Error ? error.message : 'Failed' } });
    }
  }

  async suspend(request: FastifyRequest<{ Params: { id: string }; Body: { reason?: string } }>, reply: FastifyReply) {
    try {
      const gym = await this.adminService.suspendGym(request.params.id, (request.body as { reason?: string })?.reason, this.meta(request));
      return reply.send({ success: true, data: { gym } });
    } catch (error) {
      return reply.status(400).send({ success: false, error: { code: 'UPDATE_ERROR', message: error instanceof Error ? error.message : 'Failed' } });
    }
  }

  async restore(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const gym = await this.adminService.restoreGym(request.params.id, this.meta(request));
      return reply.send({ success: true, data: { gym } });
    } catch (error) {
      return reply.status(400).send({ success: false, error: { code: 'UPDATE_ERROR', message: error instanceof Error ? error.message : 'Failed' } });
    }
  }

  async updateGymStatus(request: FastifyRequest<{ Params: { id: string }; Body: UpdateGymStatusInput }>, reply: FastifyReply) {
    try {
      const gym = await this.adminService.updateGymStatus(request.params.id, request.body, this.meta(request));
      return reply.send({ success: true, data: { gym } });
    } catch (error) {
      return reply.status(400).send({ success: false, error: { code: 'UPDATE_ERROR', message: error instanceof Error ? error.message : 'Failed to update gym status' } });
    }
  }

  async getStats(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await this.adminService.getStats();
      return reply.send({ success: true, data: { stats } });
    } catch {
      return reply.status(500).send({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to get stats' } });
    }
  }

  async listEnquiries(request: FastifyRequest, reply: FastifyReply) {
    try {
      const q = request.query as { page?: string; pageSize?: string };
      const result = await this.adminService.listEnquiries(q.page ? parseInt(q.page, 10) : 1, q.pageSize ? parseInt(q.pageSize, 10) : 20);
      return reply.send({ success: true, data: result });
    } catch {
      return reply.status(500).send({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed' } });
    }
  }
}
