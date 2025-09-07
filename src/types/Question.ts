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
  notes?: string;
}

export interface QuestionCSVRow {
  id: string;
  name: string;
  category: string;
  leetcode_url: string;
  leetcode_difficulty: string;
  status: string;
  first_completed: string;
  last_reviewed: string;
  next_review: string;
  review_count: string;
  difficulty_history: string;
  notes: string;
}
