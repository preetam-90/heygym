import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { GymsService } from './gyms.service';
import {
  CreateGymInput,
  UpdateGymInput,
  CreateMembershipPlanInput,
  UpdateMembershipPlanInput,
  createGymSchema,
  updateGymSchema,
  gymIdSchema,
  gymPhotoIdSchema,
} from './gyms.schema';

function isCodedError(error: unknown): error is Error & { statusCode: number; code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as { statusCode?: unknown }).statusCode === 'number' &&
    typeof (error as { code?: unknown }).code === 'string'
  );
}

function zodMessage(error: ZodError): string {
  const first = error.issues[0];
  if (!first) return 'Invalid input';
  const path = first.path.join('.');
  return path ? `${path}: ${first.message}` : first.message;
}

export class GymsController {
  constructor(private gymsService: GymsService) {}

  private forbidDirectStatus(body: unknown, reply: FastifyReply): boolean {
    if (typeof body === 'object' && body !== null && 'status' in body) {
      void reply.status(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Status cannot be set directly' },
      });
      return true;
    }
    return false;
  }

  async createGym(request: FastifyRequest<{ Body: CreateGymInput }>, reply: FastifyReply) {
    try {
      if (this.forbidDirectStatus(request.body, reply)) return reply;
      const parsed = createGymSchema.parse({ body: request.body ?? {} });
      const ownerId = (request.user as any).id;
      const gym = await this.gymsService.createGym(ownerId, parsed.body);
      return reply.status(201).send({ success: true, data: { gym } });
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: zodMessage(error) },
        });
      }
      return reply.status(400).send({
        success: false,
        error: { code: 'CREATE_ERROR', message: error instanceof Error ? error.message : 'Failed to create gym' },
      });
    }
  }

  async getGymById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const viewer = (request as unknown as { user?: { id: string; role: string } }).user ?? null;
      const gym = await this.gymsService.getGymById(request.params.id, viewer);
      if (!gym) {
        return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Gym not found' } });
      }
      return reply.send({ success: true, data: { gym } });
    } catch (error) {
      return reply.status(500).send({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to get gym' } });
    }
  }

  async getApprovedGyms(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const gyms = await this.gymsService.getApprovedGyms();
      return reply.send({ success: true, data: { gyms } });
    } catch (error) {
      return reply.status(500).send({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to get gyms' } });
    }
  }

  async getMyGyms(request: FastifyRequest, reply: FastifyReply) {
    try {
      const ownerId = (request.user as any).id;
      const gyms = await this.gymsService.getGymsByOwner(ownerId);
      return reply.send({ success: true, data: { gyms } });
    } catch (error) {
      return reply.status(500).send({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to get gyms' } });
    }
  }

  async updateGym(request: FastifyRequest<{ Params: { id: string }; Body: UpdateGymInput }>, reply: FastifyReply) {
    try {
      if (this.forbidDirectStatus(request.body, reply)) return reply;
      const parsedParams = gymIdSchema.parse({ params: request.params });
      const parsed = updateGymSchema.parse({ body: request.body ?? {} });
      const ownerId = (request.user as any).id;
      const gym = await this.gymsService.updateGym(parsedParams.params.id, ownerId, parsed.body);
      return reply.send({ success: true, data: { gym } });
    } catch (error) {
      if (isCodedError(error)) {
        return reply.status(error.statusCode).send({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      if (error instanceof ZodError) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: zodMessage(error) },
        });
      }
      return reply.status(400).send({
        success: false,
        error: { code: 'UPDATE_ERROR', message: error instanceof Error ? error.message : 'Failed to update gym' },
      });
    }
  }

  async submitGym(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const parsed = gymIdSchema.parse({ params: request.params });
      const ownerId = (request.user as any).id;
      const gym = await this.gymsService.submitGym(parsed.params.id, ownerId);
      return reply.send({ success: true, data: { gym } });
    } catch (error) {
      if (isCodedError(error)) {
        return reply.status(error.statusCode).send({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      if (error instanceof ZodError) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: zodMessage(error) },
        });
      }
      return reply.status(400).send({
        success: false,
        error: { code: 'SUBMIT_ERROR', message: error instanceof Error ? error.message : 'Failed to submit gym' },
      });
    }
  }

  async uploadPhoto(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const parsed = gymIdSchema.parse({ params: request.params });
      const ownerId = (request.user as any).id;
      const file = await request.file();
      if (!file) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'No image file provided' },
        });
      }
      const buffer = await file.toBuffer();
      const photo = await this.gymsService.uploadPhoto(
        parsed.params.id,
        ownerId,
        buffer,
        file.mimetype,
        file.filename,
      );
      return reply.status(201).send({ success: true, data: { photo } });
    } catch (error) {
      if (isCodedError(error)) {
        return reply.status(error.statusCode).send({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      if (error instanceof ZodError) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: zodMessage(error) },
        });
      }
      const message = error instanceof Error ? error.message : 'Failed to upload photo';
      const tooLarge = /larger|exceed|fileSize|too big|limit/i.test(message);
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: tooLarge ? 'Image must be 5 MB or smaller' : message },
      });
    }
  }

  async deletePhoto(request: FastifyRequest<{ Params: { id: string; photoId: string } }>, reply: FastifyReply) {
    try {
      const parsed = gymPhotoIdSchema.parse({ params: request.params });
      const ownerId = (request.user as any).id;
      const result = await this.gymsService.deletePhoto(parsed.params.id, ownerId, parsed.params.photoId);
      return reply.send({ success: true, data: result });
    } catch (error) {
      if (isCodedError(error)) {
        return reply.status(error.statusCode).send({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      if (error instanceof ZodError) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: zodMessage(error) },
        });
      }
      return reply.status(400).send({
        success: false,
        error: { code: 'DELETE_ERROR', message: error instanceof Error ? error.message : 'Failed to delete photo' },
      });
    }
  }

  async setPrimaryPhoto(request: FastifyRequest<{ Params: { id: string; photoId: string } }>, reply: FastifyReply) {
    try {
      const parsed = gymPhotoIdSchema.parse({ params: request.params });
      const ownerId = (request.user as any).id;
      const photo = await this.gymsService.setPrimaryPhoto(parsed.params.id, ownerId, parsed.params.photoId);
      return reply.send({ success: true, data: { photo } });
    } catch (error) {
      if (isCodedError(error)) {
        return reply.status(error.statusCode).send({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      if (error instanceof ZodError) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: zodMessage(error) },
        });
      }
      return reply.status(400).send({
        success: false,
        error: { code: 'UPDATE_ERROR', message: error instanceof Error ? error.message : 'Failed to set primary photo' },
      });
    }
  }

  async createMembershipPlan(request: FastifyRequest<{ Params: { id: string }; Body: CreateMembershipPlanInput }>, reply: FastifyReply) {
    try {
      const ownerId = (request.user as any).id;
      const plan = await this.gymsService.createMembershipPlan(request.params.id, ownerId, request.body);
      return reply.status(201).send({ success: true, data: { plan } });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        error: { code: 'CREATE_ERROR', message: error instanceof Error ? error.message : 'Failed to create plan' },
      });
    }
  }

  async getMembershipPlans(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const plans = await this.gymsService.getMembershipPlans(request.params.id);
      return reply.send({ success: true, data: { plans } });
    } catch (error) {
      return reply.status(500).send({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to get plans' } });
    }
  }

  async updateMembershipPlan(request: FastifyRequest<{ Params: { id: string; planId: string }; Body: UpdateMembershipPlanInput }>, reply: FastifyReply) {
    try {
      const ownerId = (request.user as any).id;
      const plan = await this.gymsService.updateMembershipPlan(request.params.planId, request.params.id, ownerId, request.body);
      return reply.send({ success: true, data: { plan } });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        error: { code: 'UPDATE_ERROR', message: error instanceof Error ? error.message : 'Failed to update plan' },
      });
    }
  }

  async deleteMembershipPlan(request: FastifyRequest<{ Params: { id: string; planId: string } }>, reply: FastifyReply) {
    try {
      const ownerId = (request.user as any).id;
      const result = await this.gymsService.deleteMembershipPlan(request.params.planId, request.params.id, ownerId);
      return reply.send({ success: true, data: result });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        error: { code: 'DELETE_ERROR', message: error instanceof Error ? error.message : 'Failed to delete plan' },
      });
    }
  }
}
