import type { FastifyInstance } from 'fastify';
import { questionService } from '../services/questionService.js';

export async function statsRoutes(fastify: FastifyInstance) {
  // GET /api/stats
  fastify.get('/stats', async () => {
    return questionService.getStats();
  });
}
