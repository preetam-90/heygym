import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { GymsService } from './gyms.service';
import { isCodedError } from '../../lib/errors';
import {
  CreateGymInput,
  UpdateGymInput,
  CreateMembershipPlanInput,
  UpdateMembershipPlanInput,
  createGymSchema,
  updateGymSchema,
  gymIdSchema,
  gymPhotoIdSchema,
  gymPhotoUpdateSchema,
  gymFacilitySchema,
  gymHoursSchema,
  createMembershipPlanSchema,
  updateMembershipPlanSchema,
  gymsQuerySchema,
} from './gyms.schema';

function zodMessage(error: ZodError): string {
  const first = error.issues[0];
  if (!first) return 'Invalid input';
  const path = first.path.join('.');
  return path ? `${path}: ${first.message}` : first.message;
}

function handleError(error: unknown, reply: FastifyReply, fallbackCode: string, fallbackMsg: string) {
  if (isCodedError(error)) {
    return reply.status(error.statusCode).send({ success: false, error: { code: error.code, message: error.message } });
  }
  if (error instanceof ZodError) {
    return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: zodMessage(error) } });
  }
  return reply.status(400).send({
    success: false,
    error: { code: fallbackCode, message: error instanceof Error ? error.message : fallbackMsg },
  });
}

export class GymsController {
  constructor(private gymsService: GymsService) {}

  private forbidDirectStatus(body: unknown, reply: FastifyReply): boolean {
    if (typeof body === 'object' && body !== null && ('status' in body || 'slug' in body)) {
      void reply.status(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Status/slug cannot be set directly' },
      });
      return true;
    }
    return false;
  }

  async createGym(request: FastifyRequest<{ Body: CreateGymInput }>, reply: FastifyReply) {
    try {
      if (this.forbidDirectStatus(request.body, reply)) return reply;
      const parsed = createGymSchema.parse({ body: request.body ?? {} });
      const gym = await this.gymsService.createGym(request.user.id, parsed.body);
      return reply.status(201).send({ success: true, data: { gym } });
    } catch (error) {
      return handleError(error, reply, 'CREATE_ERROR', 'Failed to create gym');
    }
  }

  async getGymById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const viewer = request.user ?? null;
      const { id } = request.params;
      // Support slug or id in same param for backward compat
      let gym = await this.gymsService.getGymById(id, viewer);
      if (!gym) gym = await this.gymsService.getGymBySlug(id, viewer);
      if (!gym) return reply.status(404).send({ success: false, error: { code: 'GYM_NOT_FOUND', message: 'Gym not found' } });
      return reply.send({ success: true, data: { gym } });
    } catch {
      return reply.status(500).send({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to get gym' } });
    }
  }

  async getApprovedGyms(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = gymsQuerySchema.parse(request.query ?? {});
      const result = await this.gymsService.searchGyms(query);
      return reply.send({ success: true, data: result });
    } catch (error) {
      return handleError(error, reply, 'SERVER_ERROR', 'Failed to get gyms');
    }
  }

  async getMyGyms(request: FastifyRequest, reply: FastifyReply) {
    try {
      const gyms = await this.gymsService.getGymsByOwner(request.user.id);
      return reply.send({ success: true, data: { gyms } });
    } catch {
      return reply.status(500).send({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to get gyms' } });
    }
  }

  async updateGym(request: FastifyRequest<{ Params: { id: string }; Body: UpdateGymInput }>, reply: FastifyReply) {
    try {
      if (this.forbidDirectStatus(request.body, reply)) return reply;
      const parsedParams = gymIdSchema.parse({ params: request.params });
      const parsed = updateGymSchema.parse({ body: request.body ?? {} });
      const gym = await this.gymsService.updateGym(parsedParams.params.id, request.user.id, parsed.body);
      return reply.send({ success: true, data: { gym } });
    } catch (error) {
      return handleError(error, reply, 'UPDATE_ERROR', 'Failed to update gym');
    }
  }

  async deleteGym(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const parsed = gymIdSchema.parse({ params: request.params });
      const result = await this.gymsService.deleteGym(parsed.params.id, request.user.id);
      return reply.send({ success: true, data: result });
    } catch (error) {
      return handleError(error, reply, 'DELETE_ERROR', 'Failed to delete gym');
    }
  }

  async submitGym(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const parsed = gymIdSchema.parse({ params: request.params });
      const gym = await this.gymsService.submitGym(parsed.params.id, request.user.id);
      return reply.send({ success: true, data: { gym } });
    } catch (error) {
      return handleError(error, reply, 'SUBMIT_ERROR', 'Failed to submit gym');
    }
  }

  async listFacilities(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const facilities = await this.gymsService.listFacilities();
      return reply.send({ success: true, data: { facilities } });
    } catch {
      return reply.status(500).send({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to list facilities' } });
    }
  }

  async addFacility(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const parsedParams = gymIdSchema.parse({ params: request.params });
      const parsed = gymFacilitySchema.parse({ body: request.body ?? {} });
      const { facilityId, facilityIds, slug } = parsed.body;
      if (facilityIds && facilityIds.length > 0) {
        const gym = await this.gymsService.setGymFacilities(parsedParams.params.id, request.user.id, facilityIds);
        return reply.send({ success: true, data: { gym } });
      }
      const key = facilityId ?? slug;
      if (!key) return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'facilityId or slug required' } });
      const facility = await this.gymsService.addGymFacility(parsedParams.params.id, request.user.id, key);
      return reply.status(201).send({ success: true, data: { facility } });
    } catch (error) {
      return handleError(error, reply, 'CREATE_ERROR', 'Failed to add facility');
    }
  }

  async removeFacility(request: FastifyRequest<{ Params: { id: string; facilityId: string } }>, reply: FastifyReply) {
    try {
      const ownerId = request.user.id;
      const result = await this.gymsService.removeGymFacility(request.params.id, ownerId, request.params.facilityId);
      return reply.send({ success: true, data: result });
    } catch (error) {
      return handleError(error, reply, 'DELETE_ERROR', 'Failed to remove facility');
    }
  }

  async getHours(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const hours = await this.gymsService.getHours(request.params.id);
      return reply.send({ success: true, data: { hours } });
    } catch {
      return reply.status(500).send({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to get hours' } });
    }
  }

  async setHours(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const parsedParams = gymIdSchema.parse({ params: request.params });
      const parsed = gymHoursSchema.parse({ body: request.body ?? {} });
      const hours = await this.gymsService.setHours(parsedParams.params.id, request.user.id, parsed.body.hours);
      return reply.send({ success: true, data: { hours } });
    } catch (error) {
      return handleError(error, reply, 'UPDATE_ERROR', 'Failed to update hours');
    }
  }

  async uploadPhoto(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const parsed = gymIdSchema.parse({ params: request.params });
      const file = await request.file();
      if (!file) return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'No image file provided' } });
      const buffer = await file.toBuffer();
      const photo = await this.gymsService.uploadPhoto(parsed.params.id, request.user.id, buffer, file.mimetype, file.filename);
      return reply.status(201).send({ success: true, data: { photo } });
    } catch (error) {
      if (isCodedError(error)) return reply.status(error.statusCode).send({ success: false, error: { code: error.code, message: error.message } });
      const message = error instanceof Error ? error.message : 'Failed to upload photo';
      const tooLarge = /larger|exceed|fileSize|too big|limit/i.test(message);
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: tooLarge ? 'Image must be 5 MB or smaller' : message } });
    }
  }

  async deletePhoto(request: FastifyRequest<{ Params: { id: string; photoId: string } }>, reply: FastifyReply) {
    try {
      const parsed = gymPhotoIdSchema.parse({ params: request.params });
      const result = await this.gymsService.deletePhoto(parsed.params.id, request.user.id, parsed.params.photoId);
      return reply.send({ success: true, data: result });
    } catch (error) {
      return handleError(error, reply, 'DELETE_ERROR', 'Failed to delete photo');
    }
  }

  async setPrimaryPhoto(request: FastifyRequest<{ Params: { id: string; photoId: string } }>, reply: FastifyReply) {
    try {
      const parsed = gymPhotoIdSchema.parse({ params: request.params });
      const photo = await this.gymsService.setPrimaryPhoto(parsed.params.id, request.user.id, parsed.params.photoId);
      return reply.send({ success: true, data: { photo } });
    } catch (error) {
      return handleError(error, reply, 'UPDATE_ERROR', 'Failed to set primary photo');
    }
  }

  async updatePhoto(request: FastifyRequest<{ Params: { id: string; photoId: string } }>, reply: FastifyReply) {
    try {
      const parsedParams = gymPhotoIdSchema.parse({ params: request.params });
      const parsedBody = gymPhotoUpdateSchema.parse({ body: request.body ?? {}, params: request.params });
      const photo = await this.gymsService.updatePhoto(parsedParams.params.id, request.user.id, parsedParams.params.photoId, parsedBody.body);
      return reply.send({ success: true, data: { photo } });
    } catch (error) {
      return handleError(error, reply, 'UPDATE_ERROR', 'Failed to update photo');
    }
  }

  async createMembershipPlan(request: FastifyRequest<{ Params: { id: string }; Body: CreateMembershipPlanInput }>, reply: FastifyReply) {
    try {
      const parsed = createMembershipPlanSchema.parse({ body: request.body ?? {}, params: request.params });
      const plan = await this.gymsService.createMembershipPlan(parsed.params.id, request.user.id, parsed.body);
      return reply.status(201).send({ success: true, data: { plan } });
    } catch (error) {
      return handleError(error, reply, 'CREATE_ERROR', 'Failed to create plan');
    }
  }

  async getMembershipPlans(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const plans = await this.gymsService.getMembershipPlans(request.params.id);
      return reply.send({ success: true, data: { plans } });
    } catch {
      return reply.status(500).send({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to get plans' } });
    }
  }

  async updateMembershipPlan(request: FastifyRequest<{ Params: { id: string; planId: string }; Body: UpdateMembershipPlanInput }>, reply: FastifyReply) {
    try {
      const parsed = updateMembershipPlanSchema.parse({ body: request.body ?? {}, params: request.params });
      const plan = await this.gymsService.updateMembershipPlan(parsed.params.planId, parsed.params.id, request.user.id, parsed.body);
      return reply.send({ success: true, data: { plan } });
    } catch (error) {
      return handleError(error, reply, 'UPDATE_ERROR', 'Failed to update plan');
    }
  }

  async deleteMembershipPlan(request: FastifyRequest<{ Params: { id: string; planId: string } }>, reply: FastifyReply) {
    try {
      const result = await this.gymsService.deleteMembershipPlan(request.params.planId, request.params.id, request.user.id);
      return reply.send({ success: true, data: result });
    } catch (error) {
      return handleError(error, reply, 'DELETE_ERROR', 'Failed to delete plan');
    }
  }
}
