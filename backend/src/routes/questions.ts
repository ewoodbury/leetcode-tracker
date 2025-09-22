import type { FastifyInstance } from 'fastify';
import { questionService } from '../services/questionService.js';
import { 
  CreateQuestionSchema, 
  UpdateQuestionSchema, 
  ReviewRequestSchema,
  QuestionFiltersSchema 
} from '../schemas/question.js';

export async function questionRoutes(fastify: FastifyInstance) {
  // GET /api/questions
  fastify.get('/questions', async (request) => {
    const filters = QuestionFiltersSchema.parse(request.query);
    return await questionService.getAllQuestions(filters);
  });

  // GET /api/questions/:id
  fastify.get('/questions/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const questionId = parseInt(id, 10);
    
    if (isNaN(questionId)) {
      return reply.code(400).send({ error: 'Invalid question ID' });
    }
    
    const question = await questionService.getQuestionById(questionId);
    
    if (!question) {
      return reply.code(404).send({ error: 'Question not found' });
    }
    
    return { question };
  });

  // POST /api/questions
  fastify.post('/questions', async (request, reply) => {
    try {
      const data = CreateQuestionSchema.parse(request.body);
      const question = await questionService.createQuestion(data);
      return reply.code(201).send({ question });
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        return reply.code(409).send({ error: error.message });
      }
      throw error;
    }
  });

  // PUT /api/questions/:id
  fastify.put('/questions/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const questionId = parseInt(id, 10);
      
      if (isNaN(questionId)) {
        return reply.code(400).send({ error: 'Invalid question ID' });
      }
      
      const data = UpdateQuestionSchema.parse(request.body);
      const question = await questionService.updateQuestion(questionId, data);
      return { question };
    } catch (error) {
      if (error instanceof Error && error.message === 'Question not found') {
        return reply.code(404).send({ error: error.message });
      }
      if (error instanceof Error && error.message.includes('already exists')) {
        return reply.code(409).send({ error: error.message });
      }
      throw error;
    }
  });

  // DELETE /api/questions/:id
  fastify.delete('/questions/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const questionId = parseInt(id, 10);
    
    if (isNaN(questionId)) {
      return reply.code(400).send({ error: 'Invalid question ID' });
    }
    
    const success = await questionService.deleteQuestion(questionId);
    
    if (!success) {
      return reply.code(404).send({ error: 'Question not found' });
    }
    
    return { success: true };
  });

  // POST /api/questions/:id/complete
  fastify.post('/questions/:id/complete', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const questionId = parseInt(id, 10);
      
      if (isNaN(questionId)) {
        return reply.code(400).send({ error: 'Invalid question ID' });
      }
      
      const reviewData = ReviewRequestSchema.parse(request.body);
      const question = await questionService.completeQuestion(questionId, reviewData);
      return { question };
    } catch (error) {
      if (error instanceof Error && error.message === 'Question not found') {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  // POST /api/questions/:id/review
  fastify.post('/questions/:id/review', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const questionId = parseInt(id, 10);
      
      if (isNaN(questionId)) {
        return reply.code(400).send({ error: 'Invalid question ID' });
      }
      
      const reviewData = ReviewRequestSchema.parse(request.body);
      const question = await questionService.reviewQuestion(questionId, reviewData);
      return { question };
    } catch (error) {
      if (error instanceof Error && error.message === 'Question not found') {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  // POST /api/questions/:id/reset
  fastify.post('/questions/:id/reset', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const questionId = parseInt(id, 10);
      
      if (isNaN(questionId)) {
        return reply.code(400).send({ error: 'Invalid question ID' });
      }
      
      const question = await questionService.resetQuestion(questionId);
      return { question };
    } catch (error) {
      if (error instanceof Error && error.message === 'Question not found') {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  // GET /api/questions/due
  fastify.get('/questions/due', async () => {
    return await questionService.getDueQuestions();
  });

  // POST /api/questions/refresh
  fastify.post('/questions/refresh', async () => {
    await questionService.refreshFromFile();
    return { message: 'Data refreshed from CSV file successfully' };
  });
}
