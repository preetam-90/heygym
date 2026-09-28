import { FastifyRequest, FastifyReply } from 'fastify';
import { UsersService } from './users.service';
import { UpdateProfileInput } from './users.schema';

export class UsersController {
  constructor(private usersService: UsersService) {}

  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = await this.usersService.getProfile((request.user as any).id);
      return reply.send({ success: true, data: { user } });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get profile' },
      });
    }
  }

  async updateProfile(request: FastifyRequest<{ Body: UpdateProfileInput }>, reply: FastifyReply) {
    try {
      // PATCH /me has no :id param — the authenticated user may only ever
      // update their own profile, taken from the verified token.
      const userId = (request.user as any).id;
      const user = await this.usersService.updateProfile(userId, request.body);
      return reply.send({ success: true, data: { user } });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        error: { code: 'UPDATE_ERROR', message: error instanceof Error ? error.message : 'Update failed' },
      });
    }
  }
}