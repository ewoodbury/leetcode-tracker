# LeetCode Tracker Backend - Architecture Design Document

## System Overview

This document provides detailed technical specifications for implementing a TypeScript/Node.js backend for the LeetCode Tracker application, focusing on simplicity, maintainability, and quick development iteration.

## Architecture Diagram

```
┌─────────────────┐    HTTP/REST     ┌──────────────────┐
│   Frontend      │ ◄──────────────► │    Backend       │
│   (React+TS)    │    localhost     │   (Node+TS)      │
│   Port: 5173    │     :3001        │   Port: 3001     │
└─────────────────┘                  └──────────────────┘
                                              │
                                              ▼
                                     ┌──────────────────┐
                                     │   File System    │
                                     │                  │
                                     │ ┌──────────────┐ │
                                     │ │questions.csv │ │
                                     │ └──────────────┘ │
                                     │ ┌──────────────┐ │
                                     │ │backup/       │ │
                                     │ │  ├─backup1   │ │
                                     │ │  ├─backup2   │ │
                                     │ │  └─...       │ │
                                     │ └──────────────┘ │
                                     └──────────────────┘
```

## Technology Stack Details

### Core Dependencies

```json
{
  "dependencies": {
    "fastify": "^4.24.3",           // Web framework
    "@fastify/cors": "^8.4.0",     // CORS support
    "zod": "^3.22.4",               // Schema validation
    "csv-parser": "^3.0.0",        // CSV reading
    "csv-writer": "^1.6.0",        // CSV writing
    "date-fns": "^2.30.0"          // Date utilities
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "tsx": "^4.6.0",               // TypeScript execution
    "nodemon": "^3.0.2",           // Development hot reload
    "vitest": "^1.0.0",            // Testing framework
    "@types/csv-parser": "^3.0.0"
  }
}
```

### Project Structure

```
backend/
├── src/
│   ├── routes/
│   │   ├── questions.ts          # Question CRUD routes
│   │   ├── stats.ts             # Statistics routes
│   │   └── health.ts            # Health check
│   ├── services/
│   │   ├── questionService.ts    # Business logic layer
│   │   ├── csvService.ts        # CSV file operations
│   │   └── backupService.ts     # Backup management
│   ├── schemas/
│   │   ├── question.ts          # Zod validation schemas
│   │   └── api.ts               # API request/response schemas
│   ├── types/
│   │   └── index.ts             # Shared TypeScript types
│   ├── utils/
│   │   ├── spacedRepetition.ts  # Algorithm implementation
│   │   ├── fileUtils.ts         # File system utilities
│   │   └── validation.ts        # Custom validators
│   ├── middleware/
│   │   ├── errorHandler.ts      # Global error handling
│   │   └── requestLogger.ts     # Request logging
│   ├── config/
│   │   └── index.ts             # Configuration management
│   └── server.ts                # Application entry point
├── data/
│   ├── questions.csv            # Primary data file
│   └── backup/                  # Automatic backups
│       ├── questions_2024-01-15_10-30-00.csv
│       └── questions_2024-01-15_11-15-00.csv
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── scripts/
│   ├── migrate-data.ts          # Data migration utilities
│   └── seed-data.ts             # Development data seeding
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Detailed Implementation Specifications

### 1. Server Configuration (server.ts)

```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { questionRoutes } from './routes/questions';
import { statsRoutes } from './routes/stats';
import { healthRoutes } from './routes/health';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config';

export async function buildServer() {
  const fastify = Fastify({
    logger: config.isDevelopment ? {
      transport: {
        target: 'pino-pretty',
        options: { colorize: true }
      }
    } : true
  });

  // Register CORS
  await fastify.register(cors, {
    origin: config.allowedOrigins,
    credentials: true
  });

  // Register error handler
  fastify.setErrorHandler(errorHandler);

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

if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}
```

### 2. Configuration Management (config/index.ts)

```typescript
import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('localhost'),
  DATA_DIR: z.string().default('./data'),
  BACKUP_RETENTION_DAYS: z.coerce.number().default(30),
  MAX_BACKUP_FILES: z.coerce.number().default(10),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
});

const env = configSchema.parse(process.env);

export const config = {
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  port: env.PORT,
  host: env.HOST,
  dataDir: env.DATA_DIR,
  backupRetentionDays: env.BACKUP_RETENTION_DAYS,
  maxBackupFiles: env.MAX_BACKUP_FILES,
  allowedOrigins: env.CORS_ORIGINS.split(','),
  
  // Derived paths
  csvPath: `${env.DATA_DIR}/questions.csv`,
  backupDir: `${env.DATA_DIR}/backup`,
} as const;
```

### 3. Data Validation Schemas (schemas/question.ts)

```typescript
import { z } from 'zod';

export const QuestionStatusSchema = z.enum([
  'not_started',
  'completed', 
  'under_review',
  'needs_attention'
]);

export const DifficultySchema = z.enum(['easy', 'medium', 'hard']);

export const QuestionSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  leetcodeUrl: z.string().url().refine(
    (url) => url.includes('leetcode.com/problems/'),
    { message: 'Must be a valid LeetCode problem URL' }
  ),
  status: QuestionStatusSchema,
  firstCompleted: z.string().datetime().optional(),
  lastReviewed: z.string().datetime().optional(),
  nextReview: z.string().datetime().optional(),
  reviewCount: z.number().int().min(0),
  difficultyHistory: z.array(DifficultySchema),
  notes: z.string().max(1000).default('')
});

export const CreateQuestionSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  leetcodeUrl: z.string().url().refine(
    (url) => url.includes('leetcode.com/problems/'),
    { message: 'Must be a valid LeetCode problem URL' }
  ),
  notes: z.string().max(1000).optional()
});

export const UpdateQuestionSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(100).optional(),
  leetcodeUrl: z.string().url().refine(
    (url) => url.includes('leetcode.com/problems/'),
    { message: 'Must be a valid LeetCode problem URL' }
  ).optional(),
  notes: z.string().max(1000).optional()
});

export const ReviewRequestSchema = z.object({
  difficulty: DifficultySchema,
  notes: z.string().max(1000).optional()
});

export const QuestionFiltersSchema = z.object({
  category: z.string().optional(),
  status: QuestionStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});
```

### 4. CSV Service Implementation (services/csvService.ts)

```typescript
import { promises as fs } from 'fs';
import { createReadStream, createWriteStream } from 'fs';
import csv from 'csv-parser';
import createCsvWriter from 'csv-writer';
import { config } from '../config';
import { backupService } from './backupService';
import type { Question } from '../types';

export class CSVService {
  private readonly csvPath = config.csvPath;
  private readonly headers = [
    'id', 'name', 'category', 'leetcode_url', 'status',
    'first_completed', 'last_reviewed', 'next_review',
    'review_count', 'difficulty_history', 'notes'
  ];

  async readQuestions(): Promise<Question[]> {
    try {
      await fs.access(this.csvPath);
    } catch {
      // File doesn't exist, return empty array
      return [];
    }

    return new Promise((resolve, reject) => {
      const questions: Question[] = [];
      
      createReadStream(this.csvPath)
        .pipe(csv())
        .on('data', (row) => {
          try {
            const question = this.parseCSVRow(row);
            questions.push(question);
          } catch (error) {
            console.warn('Skipping malformed row:', row, error);
          }
        })
        .on('end', () => resolve(questions))
        .on('error', reject);
    });
  }

  async writeQuestions(questions: Question[]): Promise<void> {
    // Create backup before writing
    await backupService.createBackup();

    // Ensure data directory exists
    await fs.mkdir(config.dataDir, { recursive: true });

    const csvWriter = createCsvWriter.createObjectCsvWriter({
      path: this.csvPath,
      header: this.headers.map(field => ({ id: field, title: field }))
    });

    const records = questions.map(question => this.questionToCSVRow(question));
    await csvWriter.writeRecords(records);
  }

  private parseCSVRow(row: any): Question {
    return {
      id: parseInt(row.id, 10),
      name: row.name || '',
      category: row.category || '',
      leetcodeUrl: row.leetcode_url || '',
      status: row.status || 'not_started',
      firstCompleted: row.first_completed || undefined,
      lastReviewed: row.last_reviewed || undefined,
      nextReview: row.next_review || undefined,
      reviewCount: parseInt(row.review_count, 10) || 0,
      difficultyHistory: row.difficulty_history 
        ? row.difficulty_history.split(',').filter(Boolean)
        : [],
      notes: row.notes || ''
    };
  }

  private questionToCSVRow(question: Question): Record<string, any> {
    return {
      id: question.id,
      name: question.name,
      category: question.category,
      leetcode_url: question.leetcodeUrl,
      status: question.status,
      first_completed: question.firstCompleted || '',
      last_reviewed: question.lastReviewed || '',
      next_review: question.nextReview || '',
      review_count: question.reviewCount,
      difficulty_history: question.difficultyHistory.join(','),
      notes: question.notes
    };
  }
}

export const csvService = new CSVService();
```

### 5. Question Service (services/questionService.ts)

```typescript
import { csvService } from './csvService';
import { spacedRepetitionService } from '../utils/spacedRepetition';
import type { Question, CreateQuestionRequest, UpdateQuestionRequest, ReviewRequest } from '../types';

export class QuestionService {
  private questions: Question[] = [];
  private nextId = 1;

  async initialize(): Promise<void> {
    this.questions = await csvService.readQuestions();
    this.nextId = Math.max(...this.questions.map(q => q.id), 0) + 1;
  }

  async getAllQuestions(filters?: {
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ questions: Question[]; total: number; page: number }> {
    let filtered = [...this.questions];

    if (filters?.category) {
      filtered = filtered.filter(q => 
        q.category.toLowerCase().includes(filters.category!.toLowerCase())
      );
    }

    if (filters?.status) {
      filtered = filtered.filter(q => q.status === filters.status);
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      questions: filtered.slice(startIndex, endIndex),
      total: filtered.length,
      page
    };
  }

  async getQuestionById(id: number): Promise<Question | null> {
    return this.questions.find(q => q.id === id) || null;
  }

  async createQuestion(data: CreateQuestionRequest): Promise<Question> {
    // Check for duplicate URLs
    const existingQuestion = this.questions.find(q => q.leetcodeUrl === data.leetcodeUrl);
    if (existingQuestion) {
      throw new Error('Question with this URL already exists');
    }

    const question: Question = {
      id: this.nextId++,
      name: data.name,
      category: data.category,
      leetcodeUrl: data.leetcodeUrl,
      status: 'not_started',
      reviewCount: 0,
      difficultyHistory: [],
      notes: data.notes || ''
    };

    this.questions.push(question);
    await this.saveQuestions();
    return question;
  }

  async updateQuestion(id: number, data: UpdateQuestionRequest): Promise<Question> {
    const questionIndex = this.questions.findIndex(q => q.id === id);
    if (questionIndex === -1) {
      throw new Error('Question not found');
    }

    // Check for duplicate URLs if URL is being updated
    if (data.leetcodeUrl) {
      const existingQuestion = this.questions.find(q => 
        q.leetcodeUrl === data.leetcodeUrl && q.id !== id
      );
      if (existingQuestion) {
        throw new Error('Question with this URL already exists');
      }
    }

    const updatedQuestion = {
      ...this.questions[questionIndex],
      ...data
    };

    this.questions[questionIndex] = updatedQuestion;
    await this.saveQuestions();
    return updatedQuestion;
  }

  async deleteQuestion(id: number): Promise<boolean> {
    const questionIndex = this.questions.findIndex(q => q.id === id);
    if (questionIndex === -1) {
      return false;
    }

    this.questions.splice(questionIndex, 1);
    await this.saveQuestions();
    return true;
  }

  async completeQuestion(id: number, reviewData: ReviewRequest): Promise<Question> {
    const question = await this.getQuestionById(id);
    if (!question) {
      throw new Error('Question not found');
    }

    const now = new Date().toISOString();
    const nextReview = spacedRepetitionService.calculateNextReview(0, reviewData.difficulty);

    const updatedQuestion: Question = {
      ...question,
      status: 'under_review',
      firstCompleted: question.firstCompleted || now,
      lastReviewed: now,
      nextReview: nextReview.toISOString(),
      reviewCount: 1,
      difficultyHistory: [reviewData.difficulty],
      notes: reviewData.notes || question.notes
    };

    const questionIndex = this.questions.findIndex(q => q.id === id);
    this.questions[questionIndex] = updatedQuestion;
    await this.saveQuestions();
    return updatedQuestion;
  }

  async reviewQuestion(id: number, reviewData: ReviewRequest): Promise<Question> {
    const question = await this.getQuestionById(id);
    if (!question) {
      throw new Error('Question not found');
    }

    const now = new Date().toISOString();
    const nextReview = spacedRepetitionService.calculateNextReview(
      question.reviewCount, 
      reviewData.difficulty
    );

    const newStatus = reviewData.difficulty === 'hard' ? 'needs_attention' : 'under_review';

    const updatedQuestion: Question = {
      ...question,
      status: newStatus,
      lastReviewed: now,
      nextReview: nextReview.toISOString(),
      reviewCount: question.reviewCount + 1,
      difficultyHistory: [...question.difficultyHistory, reviewData.difficulty],
      notes: reviewData.notes || question.notes
    };

    const questionIndex = this.questions.findIndex(q => q.id === id);
    this.questions[questionIndex] = updatedQuestion;
    await this.saveQuestions();
    return updatedQuestion;
  }

  async getDueQuestions(): Promise<{ questions: Question[]; overdue: Question[] }> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const dueQuestions = this.questions.filter(q => {
      if (!q.nextReview) return false;
      const reviewDate = new Date(q.nextReview);
      const reviewDateOnly = new Date(reviewDate.getFullYear(), reviewDate.getMonth(), reviewDate.getDate());
      return reviewDateOnly <= today;
    });

    const overdue = dueQuestions.filter(q => {
      const reviewDate = new Date(q.nextReview!);
      const reviewDateOnly = new Date(reviewDate.getFullYear(), reviewDate.getMonth(), reviewDate.getDate());
      return reviewDateOnly < today;
    });

    const dueToday = dueQuestions.filter(q => {
      const reviewDate = new Date(q.nextReview!);
      const reviewDateOnly = new Date(reviewDate.getFullYear(), reviewDate.getMonth(), reviewDate.getDate());
      return reviewDateOnly.getTime() === today.getTime();
    });

    return {
      questions: dueToday,
      overdue
    };
  }

  getStats(): {
    totalQuestions: number;
    completed: number;
    inReview: number;
    dueToday: number;
    overdue: number;
    completedThisWeek: number;
    reviewedThisWeek: number;
  } {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const completed = this.questions.filter(q => 
      q.status === 'completed' || q.status === 'under_review'
    ).length;

    const inReview = this.questions.filter(q => q.status === 'under_review').length;

    const { questions: dueToday, overdue } = this.getDueQuestions();

    const completedThisWeek = this.questions.filter(q => 
      q.firstCompleted && new Date(q.firstCompleted) >= weekAgo
    ).length;

    const reviewedThisWeek = this.questions.filter(q => 
      q.lastReviewed && new Date(q.lastReviewed) >= weekAgo
    ).length;

    return {
      totalQuestions: this.questions.length,
      completed,
      inReview,
      dueToday: dueToday.length,
      overdue: overdue.length,
      completedThisWeek,
      reviewedThisWeek
    };
  }

  private async saveQuestions(): Promise<void> {
    await csvService.writeQuestions(this.questions);
  }
}

export const questionService = new QuestionService();
```

### 6. API Routes (routes/questions.ts)

```typescript
import type { FastifyInstance } from 'fastify';
import { questionService } from '../services/questionService';
import { 
  CreateQuestionSchema, 
  UpdateQuestionSchema, 
  ReviewRequestSchema,
  QuestionFiltersSchema 
} from '../schemas/question';

export async function questionRoutes(fastify: FastifyInstance) {
  // Initialize service
  await questionService.initialize();

  // GET /api/questions
  fastify.get('/questions', {
    schema: {
      querystring: QuestionFiltersSchema
    }
  }, async (request) => {
    const filters = request.query as any;
    return await questionService.getAllQuestions(filters);
  });

  // GET /api/questions/:id
  fastify.get('/questions/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: number };
    const question = await questionService.getQuestionById(id);
    
    if (!question) {
      return reply.code(404).send({ error: 'Question not found' });
    }
    
    return { question };
  });

  // POST /api/questions
  fastify.post('/questions', {
    schema: {
      body: CreateQuestionSchema
    }
  }, async (request, reply) => {
    try {
      const data = request.body as any;
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
  fastify.put('/questions/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        },
        required: ['id']
      },
      body: UpdateQuestionSchema
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: number };
      const data = request.body as any;
      const question = await questionService.updateQuestion(id, data);
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
  fastify.delete('/questions/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: number };
    const success = await questionService.deleteQuestion(id);
    
    if (!success) {
      return reply.code(404).send({ error: 'Question not found' });
    }
    
    return { success: true };
  });

  // POST /api/questions/:id/complete
  fastify.post('/questions/:id/complete', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        },
        required: ['id']
      },
      body: ReviewRequestSchema
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: number };
      const reviewData = request.body as any;
      const question = await questionService.completeQuestion(id, reviewData);
      return { question };
    } catch (error) {
      if (error instanceof Error && error.message === 'Question not found') {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  // POST /api/questions/:id/review
  fastify.post('/questions/:id/review', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        },
        required: ['id']
      },
      body: ReviewRequestSchema
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: number };
      const reviewData = request.body as any;
      const question = await questionService.reviewQuestion(id, reviewData);
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
}
```

## Performance Considerations

### Memory Management
- **In-memory caching**: Questions loaded once on startup, updated in memory
- **Lazy loading**: Consider implementing if dataset grows beyond 1000 questions
- **Memory monitoring**: Log memory usage in development

### File I/O Optimization
- **Atomic writes**: Use temporary files and atomic rename operations
- **Batched operations**: Group multiple updates into single write operation
- **Async operations**: All file operations are non-blocking

### Response Time Targets
- **API endpoints**: <50ms for most operations
- **File operations**: <100ms for read/write
- **Startup time**: <200ms cold start

## Error Handling Strategy

### HTTP Error Codes
- `400` - Bad Request (validation errors)
- `404` - Not Found (question doesn't exist)
- `409` - Conflict (duplicate URL)
- `422` - Unprocessable Entity (business logic errors)
- `500` - Internal Server Error (unexpected errors)

### Error Response Format
```typescript
{
  error: string;           // Human-readable error message
  code?: string;          // Machine-readable error code
  details?: any;          // Additional error context
  timestamp: string;      // ISO timestamp
  path: string;           // Request path
}
```

### Logging Strategy
- **Development**: Pretty-printed logs with full context
- **Production**: Structured JSON logs
- **Error tracking**: Log all errors with stack traces
- **Request logging**: Log all API requests with timing

## Testing Strategy

### Unit Tests
- Service layer methods
- Utility functions (spaced repetition, validation)
- CSV parsing/serialization

### Integration Tests
- API endpoint functionality
- File system operations
- Error handling scenarios

### Test Data Management
- Fixture files for test data
- In-memory test database
- Isolated test environment

## Deployment Considerations

### Environment Configuration
```bash
# .env.example
NODE_ENV=development
PORT=3001
HOST=localhost
DATA_DIR=./data
BACKUP_RETENTION_DAYS=30
MAX_BACKUP_FILES=10
CORS_ORIGINS=http://localhost:5173
```

### Build Process
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "tsx watch src/server.ts",
    "test": "vitest",
    "lint": "eslint src",
    "type-check": "tsc --noEmit"
  }
}
```

### Monitoring
- Health check endpoint (`/api/health`)
- Process memory and CPU monitoring
- File system space monitoring
- Backup success/failure tracking

This architecture provides a solid foundation for the backend implementation while maintaining simplicity and focusing on the core requirements of data persistence and reliability.
