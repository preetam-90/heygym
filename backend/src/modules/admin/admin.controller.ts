import { FastifyRequest, FastifyReply } from 'fastify';
import { AdminService } from './admin.service';
import { UpdateGymStatusInput } from './admin.schema';

export class AdminController {
  constructor(private adminService: AdminService) {}

  async getUsers(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const users = await this.adminService.getUsers();
      return reply.send({ success: true, data: { users } });
    } catch (error) {
      return reply.status(500).send({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to get users' } });
    }
  }

  async getGyms(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const gyms = await this.adminService.getGyms();
      return reply.send({ success: true, data: { gyms } });
    } catch (error) {
      return reply.status(500).send({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to get gyms' } });
    }
  }

  async updateGymStatus(request: FastifyRequest<{ Params: { id: string }; Body: UpdateGymStatusInput }>, reply: FastifyReply) {
    try {
      const gym = await this.adminService.updateGymStatus(request.params.id, request.body);
      return reply.send({ success: true, data: { gym } });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        error: { code: 'UPDATE_ERROR', message: error instanceof Error ? error.message : 'Failed to update gym status' },
      });
    }
  }

  async getStats(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await this.adminService.getStats();
      return reply.send({ success: true, data: { stats } });
    } catch (error) {
      return reply.status(500).send({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to get stats' } });
    }
  }
}