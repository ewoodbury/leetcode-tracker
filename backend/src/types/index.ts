export interface Question {
  id: number;
  name: string;
  category: string;
  leetcodeUrl: string;
  leetcodeDifficulty?: 'Easy' | 'Medium' | 'Hard';
  status: 'not_started' | 'completed' | 'under_review' | 'needs_attention';
  firstCompleted?: string; // ISO date string
  lastReviewed?: string;   // ISO date string
  nextReview?: string;     // ISO date string
  reviewCount: number;
  difficultyHistory: ('easy' | 'medium' | 'hard')[];
  notes: string;
}

export interface CreateQuestionRequest {
  name: string;
  category: string;
  leetcodeUrl: string;
  leetcodeDifficulty?: 'Easy' | 'Medium' | 'Hard';
  notes?: string;
}

export interface UpdateQuestionRequest {
  name?: string;
  category?: string;
  leetcodeUrl?: string;
  notes?: string;
}

export interface ReviewRequest {
  difficulty: 'easy' | 'medium' | 'hard';
  notes?: string;
}

export interface QuestionFilters {
  category?: string;
  status?: 'not_started' | 'completed' | 'under_review' | 'needs_attention';
  page?: number;
  limit?: number;
}

export interface StatsResponse {
  totalQuestions: number;
  completed: number;
  inReview: number;
  dueToday: number;
  overdue: number;
  completedThisWeek: number;
  reviewedThisWeek: number;
}

export interface QuestionsResponse {
  questions: Question[];
  total: number;
  page: number;
}

export interface DueQuestionsResponse {
  questions: Question[];
  overdue: Question[];
}
