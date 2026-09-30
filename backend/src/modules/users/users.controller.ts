import { FastifyRequest, FastifyReply } from 'fastify';
import { UsersService } from './users.service';
import { UpdateProfileInput } from './users.schema';
import { isCodedError } from '../../lib/errors';

export class UsersController {
  constructor(private usersService: UsersService) {}

  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = await this.usersService.getProfile(request.user.id);
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
      const userId = request.user.id;
      const user = await this.usersService.updateProfile(userId, request.body);
      return reply.send({ success: true, data: { user } });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        error: { code: 'UPDATE_ERROR', message: error instanceof Error ? error.message : 'Update failed' },
      });
    }
  }

  async uploadAvatar(request: FastifyRequest, reply: FastifyReply) {
    try {
      const file = await request.file();
      if (!file) return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'No image file provided' } });
      const buffer = await file.toBuffer();
      const user = await this.usersService.setAvatar(request.user.id, buffer, file.mimetype, file.filename);
      return reply.send({ success: true, data: { user } });
    } catch (error) {
      if (isCodedError(error)) return reply.status(error.statusCode).send({ success: false, error: { code: error.code, message: error.message } });
      const message = error instanceof Error ? error.message : 'Failed to upload avatar';
      const tooLarge = /larger|exceed|fileSize|too big|limit/i.test(message);
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: tooLarge ? 'Image must be 5 MB or smaller' : message } });
    }
  }
}