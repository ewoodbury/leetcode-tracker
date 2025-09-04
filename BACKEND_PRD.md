# LeetCode Tracker Backend - Product Requirements Document

## Executive Summary

Transform the existing client-side LeetCode tracker into a full-stack application with persistent data storage, improved reliability, and better user experience. The backend will provide REST APIs for data management while maintaining the simplicity and lightweight nature of the current application.

## Current State Analysis

**Existing Architecture:**
- Frontend: React + TypeScript + Vite
- Data Storage: Local CSV file manipulation
- Deployment: Localhost only

**Current Limitations:**
- Data persistence relies on file system access (browser limitations)
- No data validation on server side
- Risk of data corruption with concurrent edits
- No backup/recovery mechanism
- Cannot serve multiple users or sessions
- Limited to single browser/device usage

## Technology Stack Comparison

### Option 1: TypeScript/Node.js (RECOMMENDED)
**Framework Options:**
- **Express.js**: Minimal, fast, widely adopted
- **Fastify**: High performance, modern, excellent TypeScript support
- **Hono**: Ultra-lightweight, edge-ready, great DX

**Pros:**
- Consistent language across frontend/backend
- Shared type definitions between client and server
- Excellent ecosystem for web APIs
- Fast development iteration
- Minimal context switching

**Cons:**
- Single-threaded (though adequate for this use case)
- Slightly higher memory usage than compiled languages

**Recommended Stack:** Node.js + Fastify + TypeScript
- **Why Fastify**: Modern, excellent TypeScript support, built-in validation, minimal boilerplate
- **Startup time**: ~100-200ms
- **Memory footprint**: ~30-50MB

### Option 2: Python
**Framework Options:**
- **FastAPI**: Modern, automatic API docs, excellent performance
- **Flask**: Minimal, flexible, quick to prototype

**Pros:**
- Excellent for data processing and CSV manipulation
- Rich ecosystem (pandas for CSV handling)
- You have extensive experience
- Great for rapid prototyping

**Cons:**
- Different language context from frontend
- Slightly slower startup (~300-500ms)
- Type safety requires additional tooling

**Recommended Stack:** Python + FastAPI + Pydantic
- **Startup time**: ~300-500ms
- **Memory footprint**: ~40-70MB

### Option 3: Go
**Framework Options:**
- **Gin**: Fast, minimal, excellent performance
- **Fiber**: Express-inspired, modern features
- **Standard library**: Built-in HTTP server

**Pros:**
- Extremely fast startup (~50ms)
- Low memory footprint (~10-20MB)
- Built-in concurrency
- Single binary deployment

**Cons:**
- Different paradigm from frontend
- More verbose for simple CRUD operations
- Limited rapid prototyping compared to TS/Python

**Recommended Stack:** Go + Gin + built-in JSON
- **Startup time**: ~50ms
- **Memory footprint**: ~10-20MB

### Option 4: Scala
**Framework Options:**
- **ZIO HTTP**: Functional, type-safe
- **Akka HTTP**: Actor-based, highly concurrent

**Pros:**
- Excellent type safety
- Functional programming benefits
- JVM ecosystem

**Cons:**
- Overkill for this simple use case
- Longer startup time (~2-5s)
- Higher complexity and learning curve
- Larger memory footprint (~100-200MB)

**Not recommended** for this lightweight use case.

## Recommended Architecture: TypeScript + Node.js + Fastify

### Why This Choice:
1. **Consistency**: Same language and ecosystem as frontend
2. **Simplicity**: Minimal boilerplate, easy to understand
3. **Performance**: Adequate for localhost use (sub-100ms responses)
4. **Maintainability**: Shared types, single toolchain
5. **Developer Experience**: Excellent TypeScript support, hot reload
6. **Quick Start**: ~100ms startup time, perfect for localhost development

## Technical Architecture

### Backend Structure
```
backend/
├── src/
│   ├── routes/
│   │   ├── questions.ts      # Question CRUD operations
│   │   └── health.ts         # Health check endpoint
│   ├── services/
│   │   ├── questionService.ts # Business logic
│   │   └── csvService.ts      # CSV file operations
│   ├── types/
│   │   └── index.ts          # Shared types with frontend
│   ├── utils/
│   │   ├── validation.ts     # Input validation
│   │   └── spacedRepetition.ts # Algorithm logic
│   ├── middleware/
│   │   ├── cors.ts          # CORS configuration
│   │   └── errorHandler.ts   # Error handling
│   └── server.ts            # Application entry point
├── data/
│   ├── questions.csv        # Main data file
│   └── backup/              # Automatic backups
├── package.json
├── tsconfig.json
└── .env                     # Environment configuration
```

### API Design

#### Base URL: `http://localhost:3001/api`

#### Endpoints:

**GET /questions**
- Returns all questions with pagination support
- Query params: `category`, `status`, `page`, `limit`
- Response: `{ questions: Question[], total: number, page: number }`

**GET /questions/:id**
- Returns specific question by ID
- Response: `{ question: Question }`

**POST /questions**
- Creates new question
- Body: `{ name: string, category: string, leetcodeUrl: string }`
- Response: `{ question: Question }`

**PUT /questions/:id**
- Updates existing question
- Body: `Partial<Question>`
- Response: `{ question: Question }`

**DELETE /questions/:id**
- Deletes question
- Response: `{ success: boolean }`

**POST /questions/:id/complete**
- Marks question as completed, triggers spaced repetition
- Body: `{ difficulty: 'easy' | 'medium' | 'hard', notes?: string }`
- Response: `{ question: Question }`

**POST /questions/:id/review**
- Records review completion
- Body: `{ difficulty: 'easy' | 'medium' | 'hard', notes?: string }`
- Response: `{ question: Question }`

**GET /questions/due**
- Returns questions due for review
- Response: `{ questions: Question[], overdue: Question[] }`

**GET /stats**
- Returns progress statistics
- Response: `{ completed: number, inReview: number, dueToday: number, streak: number }`

**GET /backup**
- Creates and returns current data backup
- Response: CSV file download

**POST /restore**
- Restores data from backup file
- Body: CSV file upload
- Response: `{ success: boolean, questionsImported: number }`

### Data Storage Strategy

**Primary Storage**: CSV file (maintaining compatibility)
- Location: `backend/data/questions.csv`
- Atomic writes with backup on every change
- File locking to prevent corruption

**Backup Strategy**:
- Automatic backup before each write operation
- Keep last 10 backups with timestamps
- Manual backup endpoint for user-initiated backups

**Data Validation**:
- Input validation using Zod schemas
- Duplicate URL detection
- Date format validation
- Status transition validation

### Shared Types (Frontend + Backend)

```typescript
// types/index.ts
export interface Question {
  id: number;
  name: string;
  category: string;
  leetcodeUrl: string;
  status: 'not_started' | 'completed' | 'under_review' | 'needs_attention';
  firstCompleted?: string; // ISO date string
  lastReviewed?: string;   // ISO date string
  nextReview?: string;     // ISO date string
  reviewCount: number;
  difficultyHistory: ('easy' | 'medium' | 'hard')[];
  notes: string;
}

export interface QuestionUpdate {
  name?: string;
  category?: string;
  leetcodeUrl?: string;
  notes?: string;
}

export interface ReviewRequest {
  difficulty: 'easy' | 'medium' | 'hard';
  notes?: string;
}

export interface StatsResponse {
  totalQuestions: number;
  completed: number;
  inReview: number;
  dueToday: number;
  overdue: number;
  currentStreak: number;
  completedThisWeek: number;
  reviewedThisWeek: number;
}
```

### Security Considerations

**For Localhost Development:**
- CORS enabled for `http://localhost:5173` (Vite dev server)
- Basic input validation and sanitization
- File system access restricted to data directory
- No authentication needed (single user, localhost)

**For Future Expansion:**
- Ready for JWT authentication
- Request rate limiting
- Input validation and SQL injection prevention
- HTTPS support

## Frontend Changes Required

### API Client Layer

```typescript
// src/services/api.ts
class QuestionAPI {
  private baseUrl = 'http://localhost:3001/api';
  
  async getQuestions(filters?: QuestionFilters): Promise<Question[]> { ... }
  async createQuestion(data: QuestionCreate): Promise<Question> { ... }
  async updateQuestion(id: number, data: QuestionUpdate): Promise<Question> { ... }
  async completeQuestion(id: number, data: ReviewRequest): Promise<Question> { ... }
  async reviewQuestion(id: number, data: ReviewRequest): Promise<Question> { ... }
  async getStats(): Promise<StatsResponse> { ... }
  async getDueQuestions(): Promise<{ questions: Question[], overdue: Question[] }> { ... }
}
```

### State Management Updates

- Remove CSV file manipulation logic
- Replace with API calls
- Add loading states and error handling
- Implement optimistic updates for better UX

### Error Handling

- Network error handling
- Offline state detection
- Retry mechanism for failed requests
- User-friendly error messages

## Development Workflow

### Setup Commands

```bash
# Install backend dependencies
cd backend && npm install

# Start backend in development mode
npm run dev

# Start frontend (existing)
cd .. && npm run dev

# Run both concurrently
npm run dev:all  # New script to run both
```

### Development Scripts

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "npm run dev",
    "build": "npm run build:frontend && npm run build:backend",
    "build:backend": "cd backend && npm run build",
    "build:frontend": "npm run build"
  }
}
```

## Migration Strategy

### Phase 1: Backend Development (1-2 days)
1. Set up Fastify backend with TypeScript
2. Implement CSV reading/writing service
3. Create REST API endpoints
4. Add data validation and error handling
5. Implement backup system

### Phase 2: Frontend Integration (1 day)
1. Create API client layer
2. Replace CSV manipulation with API calls
3. Add loading states and error handling
4. Test all existing functionality

### Phase 3: Enhancement (Optional)
1. Add bulk operations
2. Implement data export/import
3. Add more detailed statistics
4. Performance optimizations

## Success Criteria

### Functional Requirements
- ✅ All existing features work with backend
- ✅ Data persists between sessions
- ✅ No data loss during operations
- ✅ Sub-100ms API response times
- ✅ Automatic data backup

### Non-Functional Requirements
- ✅ Backend starts in <200ms
- ✅ API responds in <50ms for most operations
- ✅ Memory usage <50MB
- ✅ Zero configuration for localhost development
- ✅ Backward compatible with existing CSV data

## Future Considerations

### Potential Enhancements
- SQLite database for better performance
- Real-time updates with WebSockets
- Mobile app with shared backend
- Cloud deployment options
- Multi-user support with authentication

### Migration Path to Database
- Backend abstraction layer ready for database swap
- CSV import/export for data migration
- No breaking changes to frontend API

## Risk Assessment

**Low Risk Areas:**
- TypeScript consistency
- API design
- Data migration

**Medium Risk Areas:**
- File system concurrency
- Error handling complexity

**Mitigation Strategies:**
- Comprehensive testing
- Atomic file operations
- Graceful fallback mechanisms
- Good error messages

## Conclusion

The TypeScript + Node.js + Fastify approach provides the optimal balance of:
- **Simplicity**: Minimal learning curve, consistent with existing codebase
- **Performance**: Fast enough for localhost development
- **Maintainability**: Single language, shared types, modern tooling
- **Future-proofing**: Easy to extend and deploy if needed

This architecture maintains the lightweight, quick-start nature of your current application while providing the reliability and data persistence benefits of a proper backend.
