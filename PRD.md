# LeetCode Practice Tracker - Product Requirements Document

## Overview
A TypeScript-based web application to help track LeetCode practice progress using the NeetCode 150 question list, with spaced repetition for review scheduling.

## Technical Stack
- **Frontend**: TypeScript, Vite
- **Storage**: CSV file (no backend/database)
- **Styling**: Basic CSS with minimal color scheme
- **Deployment**: Local development only (localhost)

## Core Features

### 1. Question List Display
**Requirement**: Display NeetCode 150 questions organized by category
- Show questions in a clear, categorized list format
- Each question entry should include:
  - Question name/title
  - Direct link to LeetCode question
  - Category (e.g., Arrays & Hashing, Two Pointers, etc.)
  - Completion status indicator
  - Last attempted date
  - Next review date (if applicable)

### 2. Spaced Repetition System
**Requirement**: Implement spaced repetition algorithm for review scheduling
- **Algorithm Logic**:
  - Initial review: 1 day after first completion
  - Subsequent reviews: 3 days → 7 days → 14 days → 30 days → 60 days → 90 days
  - Reset interval to 1 day if question is marked as "struggled" during review
- **Review Queue**:
  - Display questions due for review today
  - Show overdue questions (past due date)
  - Allow marking review completion with difficulty assessment

### 3. Progress Tracking
**Requirement**: Track completion and review status for each question
- **Status Types**:
  - Not Started (default)
  - Completed
  - Under Review (in spaced repetition cycle)
  - Needs Attention (struggled on recent review)
- **Visual Indicators**:
  - ✅ Completed and up-to-date
  - 📝 Due for review today
  - ⚠️ Overdue for review
  - ❌ Needs attention (recently struggled)

### 4. Custom Question Management
**Requirement**: Allow adding custom questions beyond NeetCode 150
- **Add Question Form**:
  - LeetCode URL input field
  - Question name/title input field
  - Category selection dropdown
  - Auto-parse question number from URL if possible
- **Validation**:
  - Ensure URL is valid LeetCode format
  - Prevent duplicate questions
  - Require both URL and name fields

## Data Storage Structure

### CSV Schema
```
id,name,category,leetcode_url,status,first_completed,last_reviewed,next_review,review_count,difficulty_history
1,"Two Sum","Arrays & Hashing","https://leetcode.com/problems/two-sum/","completed","2024-01-15","2024-01-20","2024-01-27",2,"easy,easy"
```

**Fields Explanation**:
- `id`: Unique identifier
- `name`: Question title
- `category`: Problem category
- `leetcode_url`: Direct link to LeetCode problem
- `status`: Current status (not_started, completed, under_review, needs_attention)
- `first_completed`: Date of first completion (YYYY-MM-DD)
- `last_reviewed`: Date of last review (YYYY-MM-DD)
- `next_review`: Date of next scheduled review (YYYY-MM-DD)
- `review_count`: Number of times reviewed
- `difficulty_history`: Comma-separated list of self-assessed difficulty (easy, medium, hard)

## User Interface Requirements

### Main Dashboard
- **Header**: App title and current date
- **Navigation Tabs**:
  - "All Questions" - Full categorized list
  - "Review Queue" - Questions due for review
  - "Add Question" - Form to add custom questions

### Question List View
- **Category Groupings**: Collapsible sections by category
- **Question Entries**: Each row shows:
  - Status icon
  - Question name (clickable link to LeetCode)
  - Last reviewed date
  - Next review date
  - Action buttons (Mark Complete, Review, etc.)

### Review Queue View
- **Priority Sections**:
  - Overdue questions (sorted by days overdue)
  - Due today
  - Upcoming (next 3 days)
- **Review Interface**:
  - Question link
  - "Mark Reviewed" button with difficulty selection
  - Notes field (optional)

### Recent Activity Top View
- Show number of new questions completed in the last 7 days
- Show number of reviews completed in the last 7 days
- Show number of days active in the last 7 days
- Show number of questions currently in the review queue

### Add Question Form
- URL input field with validation
- Question name input field
- Category dropdown (populated from existing categories + "Other")
- Submit and Cancel buttons

## Functional Requirements

### Data Management
- **CSV Loading**: Parse CSV on app startup
- **Data Persistence**: Write changes back to CSV file
- **Error Handling**: Handle malformed CSV data gracefully
- **Backup**: Keep previous CSV version before overwriting

### Spaced Repetition Logic
```typescript
function calculateNextReview(reviewCount: number, difficulty: 'easy' | 'medium' | 'hard'): Date {
  const intervals = [1, 3, 7, 14, 30, 90]; // days
  let intervalIndex = Math.min(reviewCount, intervals.length - 1);
  
  // Reset to beginning if struggled (marked as hard)
  if (difficulty === 'hard') {
    intervalIndex = 0;
  }
  
  const daysToAdd = intervals[intervalIndex];
  return new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
}
```

### URL Validation
- Validate LeetCode URL format: `https://leetcode.com/problems/[problem-slug]/`
- Extract problem name from URL if possible
- Check for duplicate URLs before adding

## Non-Functional Requirements

### Performance
- App should load within 2 seconds on localhost
- CSV parsing should handle 500+ questions efficiently
- UI should be responsive to user interactions

### Usability
- Minimal, clean interface focused on functionality
- Clear visual hierarchy with appropriate spacing
- Keyboard navigation support for forms
- Mobile-friendly responsive design

### Data Integrity
- Validate all date fields
- Ensure CSV data consistency
- Handle edge cases (missing fields, invalid dates)
- Graceful degradation for corrupted data

## Implementation Notes

### Pre-populated Data
- Include complete NeetCode 150 list in initial CSV
- Organize by standard NeetCode categories:
  - Arrays & Hashing
  - Two Pointers
  - Sliding Window
  - Stack
  - Binary Search
  - Linked List
  - Trees
  - Tries
  - Heap / Priority Queue
  - Backtracking
  - Graphs
  - Advanced Graphs
  - 1-D Dynamic Programming
  - 2-D Dynamic Programming
  - Greedy
  - Intervals
  - Math & Geometry
  - Bit Manipulation

### File Structure
```
src/
├── components/
│   ├── QuestionList.tsx
│   ├── ReviewQueue.tsx
│   ├── AddQuestion.tsx
│   └── Dashboard.tsx
├── utils/
│   ├── csvHandler.ts
│   ├── spacedRepetition.ts
│   └── validation.ts
├── types/
│   └── Question.ts
├── data/
│   └── questions.csv
└── App.tsx
```

### Key TypeScript Interfaces
```typescript
interface Question {
  id: number;
  name: string;
  category: string;
  leetcodeUrl: string;
  status: 'not_started' | 'completed' | 'under_review' | 'needs_attention';
  firstCompleted?: Date;
  lastReviewed?: Date;
  nextReview?: Date;
  reviewCount: number;
  difficultyHistory: ('easy' | 'medium' | 'hard')[];
}
```

## Success Criteria
- Successfully displays all 150 NeetCode questions by category
- Implements working spaced repetition algorithm
- Allows adding and tracking custom questions
- Persists data reliably in CSV format
- Provides clear visual feedback for question status
- Review queue accurately shows due/overdue questions

## Out of Scope
- User authentication or multi-user support
- Cloud synchronization or backup
- Advanced analytics or progress charts
- Integration with LeetCode API
- Mobile app version
- Themes or advanced styling