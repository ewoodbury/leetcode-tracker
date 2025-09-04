import Fastify from 'fastify';
import cors from '@fastify/cors';
import { questionRoutes } from './routes/questions.js';
import { statsRoutes } from './routes/stats.js';
import { healthRoutes } from './routes/health.js';
import { questionService } from './services/questionService.js';
import { config } from './config/index.js';

export async function buildServer() {
  const fastify = Fastify({
    logger: config.isDevelopment
  });

  // Register CORS
  await fastify.register(cors, {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl requests, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Allow any localhost origin in development
      if (config.isDevelopment && origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      
      // Check against configured origins
      if (config.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    const statusCode = error.statusCode || 500;
    
    if (statusCode >= 500) {
      fastify.log.error(error);
    } else {
      fastify.log.info(error);
    }

    reply.status(statusCode).send({
      error: error.message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url
    });
  });

  // Initialize services
  await questionService.initialize();

  // Register routes
  await fastify.register(questionRoutes, { prefix: '/api' });
  await fastify.register(statsRoutes, { prefix: '/api' });
  await fastify.register(healthRoutes, { prefix: '/api' });

  return fastify;
}

async function start() {
  try {
    const server = await buildServer();
    await server.listen({ 
      port: config.port, 
      host: config.host 
    });
    console.log(`🚀 Server running at http://${config.host}:${config.port}`);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

// Only start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}
