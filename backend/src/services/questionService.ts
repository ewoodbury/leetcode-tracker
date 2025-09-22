import { csvService } from './csvService.js';
import { spacedRepetitionService } from '../utils/spacedRepetition.js';
import type { 
  Question, 
  CreateQuestionRequest, 
  UpdateQuestionRequest, 
  ReviewRequest,
  QuestionFilters,
  QuestionsResponse,
  DueQuestionsResponse,
  StatsResponse
} from '../types/index.js';

export class QuestionService {
  private questions: Question[] = [];
  private nextId = 1;
  private isUpdatingFromFile = false; // Flag to prevent circular updates

  async initialize(): Promise<void> {
    this.questions = await csvService.readQuestions();
    this.nextId = Math.max(...this.questions.map(q => q.id), 0) + 1;
    
    // Set up file watching to reload data when CSV is manually modified
    csvService.watchForChanges(() => {
      this.reloadFromFile();
    });
  }

  async getAllQuestions(filters?: QuestionFilters): Promise<QuestionsResponse> {
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
      leetcodeDifficulty: data.leetcodeDifficulty,
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
    const question = this.questions.find(q => q.id === id);
    if (!question) {
      throw new Error('Question not found');
    }

    const now = new Date();
    const nextReview = spacedRepetitionService.calculateNextReview(
      question.reviewCount, 
      reviewData.difficulty
    );

    question.lastReviewed = now.toISOString();
    question.nextReview = nextReview.toISOString();
    question.reviewCount += 1;
    question.difficultyHistory.push(reviewData.difficulty);
    question.notes = reviewData.notes || question.notes;

    // Update status based on difficulty
    if (reviewData.difficulty === 'hard') {
      question.status = 'needs_attention';
    } else {
      question.status = 'under_review';
    }

    await this.saveQuestions();
    return question;
  }

  async resetQuestion(id: number): Promise<Question> {
    const question = this.questions.find(q => q.id === id);
    if (!question) {
      throw new Error('Question not found');
    }

    // Reset the question to initial state
    question.status = 'not_started';
    question.firstCompleted = undefined;
    question.lastReviewed = undefined;
    question.nextReview = undefined;
    question.reviewCount = 0;
    question.difficultyHistory = [];

    await this.saveQuestions();
    return question;
  }

  async getDueQuestions(): Promise<DueQuestionsResponse> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const dueQuestions = this.questions.filter(q => {
      if (!q.nextReview || q.nextReview === '0') return false;
      const reviewDate = new Date(q.nextReview);
      if (isNaN(reviewDate.getTime())) return false; // Invalid date
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

  getStats(): StatsResponse {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const completed = this.questions.filter(q => 
      q.status === 'completed' || q.status === 'under_review'
    ).length;

    const inReview = this.questions.filter(q => q.status === 'under_review').length;

    // Calculate due questions inline to avoid async
    const dueQuestions = this.questions.filter(q => {
      if (!q.nextReview || q.nextReview === '0') return false;
      const reviewDate = new Date(q.nextReview);
      if (isNaN(reviewDate.getTime())) return false; // Invalid date
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

    const completedThisWeek = this.questions.filter(q => 
      q.firstCompleted && new Date(q.firstCompleted) >= weekAgo
    ).length;

    const reviewedThisWeek = this.questions.filter(q => {
      if (!q.lastReviewed || new Date(q.lastReviewed) < weekAgo) return false;
      // Only count as a review if it's not the same as first completion (actual subsequent review)
      return q.reviewCount > 1 && q.lastReviewed !== q.firstCompleted;
    }).length;

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
    // Set flag to prevent reloading when we're the ones writing
    this.isUpdatingFromFile = true;
    await csvService.writeQuestions(this.questions);
    // Reset flag after a short delay to allow file system to settle
    setTimeout(() => {
      this.isUpdatingFromFile = false;
    }, 100);
  }

  /**
   * Reload questions from CSV file (used when file is manually modified)
   */
  async reloadFromFile(): Promise<void> {
    if (this.isUpdatingFromFile) {
      // Don't reload if we're the ones who just wrote to the file
      return;
    }
    
    try {
      console.log('Reloading questions from CSV file...');
      const reloadedQuestions = await csvService.readQuestions();
      this.questions = reloadedQuestions;
      this.nextId = Math.max(...this.questions.map(q => q.id), 0) + 1;
      console.log(`Reloaded ${this.questions.length} questions from CSV file`);
    } catch (error) {
      console.error('Error reloading questions from CSV:', error);
    }
  }

  /**
   * Manually refresh data from CSV file (for API endpoint)
   */
  async refreshFromFile(): Promise<void> {
    await this.reloadFromFile();
  }
}

export const questionService = new QuestionService();
