# LeetCode Tracker Backend

A TypeScript/Node.js backend for the LeetCode tracker application, providing REST APIs for persistent data storage.

(100% built by Claude 🤖)

## Setup and Development

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
cd backend
npm install
```

### Development

```bash
# Start development server (with TypeScript compilation and auto-reload)
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start

# Type check without compilation
npm run type-check
```

### Manual Start (for testing)

```bash
# Compile TypeScript first
npm run build

# Start the compiled server
node dist/server.js
```

The server will run on `http://localhost:3001`

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Questions
- `GET /api/questions` - Get all questions (paginated)
  - Query params: `category`, `status`, `page`, `limit`
- `GET /api/questions/:id` - Get specific question
- `POST /api/questions` - Create new question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question
- `POST /api/questions/:id/complete` - Mark question as completed
- `POST /api/questions/:id/review` - Record question review
- `GET /api/questions/due` - Get questions due for review

### Statistics
- `GET /api/stats` - Get progress statistics

## Example API Usage

### Create a question
```bash
curl -X POST http://localhost:3001/api/questions \
  -H "Content-Type: application/json" \
  -d '{"name":"Two Sum","category":"Arrays","leetcodeUrl":"https://leetcode.com/problems/two-sum/"}'
```

### Complete a question
```bash
curl -X POST http://localhost:3001/api/questions/1/complete \
  -H "Content-Type: application/json" \
  -d '{"difficulty":"easy","notes":"Solved using hash map"}'
```

### Get statistics
```bash
curl http://localhost:3001/api/stats
```

## Data Storage

- Data is stored in CSV format at `data/questions.csv`
- Automatic backups are created before each write operation
- The backend reads the existing CSV data from the frontend on startup

## Configuration

Environment variables (optional):
- `PORT` - Server port (default: 3001)
- `HOST` - Server host (default: localhost)
- `DATA_DIR` - Data directory path (default: ./data)

## Testing

The backend has been tested with:
- ✅ Reading existing NeetCode 150 questions from CSV
- ✅ Creating new questions
- ✅ Completing questions (triggers spaced repetition)
- ✅ Retrieving statistics
- ✅ Getting due questions
- ✅ Data persistence to CSV

## Current Status

The backend is **fully functional** and ready for frontend integration. All core features are implemented:

1. **Data Persistence** - Questions are saved to CSV file
2. **CRUD Operations** - Create, read, update, delete questions
3. **Spaced Repetition** - Automatic scheduling of reviews
4. **Statistics** - Progress tracking and reporting
5. **Validation** - Input validation using Zod schemas
6. **Error Handling** - Proper HTTP status codes and error messages

## Next Steps

1. **Frontend Integration** - Update the React frontend to use the backend API instead of local CSV manipulation
2. **Enhanced Features** - Add backup/restore endpoints, bulk operations
3. **Production Deployment** - Add production configuration and deployment scripts
