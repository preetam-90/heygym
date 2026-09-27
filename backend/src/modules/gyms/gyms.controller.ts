import { FastifyRequest, FastifyReply } from 'fastify';
import { GymsService } from './gyms.service';
import { CreateGymInput, UpdateGymInput, CreateMembershipPlanInput, UpdateMembershipPlanInput } from './gyms.schema';

export class GymsController {
  constructor(private gymsService: GymsService) {}

  async createGym(request: FastifyRequest<{ Body: CreateGymInput }>, reply: FastifyReply) {
    try {
      const ownerId = (request.user as any).id;
      const gym = await this.gymsService.createGym(ownerId, request.body);
      return reply.status(201).send({ success: true, data: { gym } });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        error: { code: 'CREATE_ERROR', message: error instanceof Error ? error.message : 'Failed to create gym' },
      });
    }
  }

  async getGymById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const gym = await this.gymsService.getGymById(request.params.id);
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
      const ownerId = (request.user as any).id;
      const gym = await this.gymsService.updateGym(request.params.id, ownerId, request.body);
      return reply.send({ success: true, data: { gym } });
    } catch (error) {
      return reply.status(400).send({
        success: false,
        error: { code: 'UPDATE_ERROR', message: error instanceof Error ? error.message : 'Failed to update gym' },
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
}