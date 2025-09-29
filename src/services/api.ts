import type { Question } from '../types/Question';

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

export interface QuestionsResponse {
  questions: Question[];
  total: number;
  page: number;
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

export interface DueQuestionsResponse {
  questions: Question[];
  overdue: Question[];
}

class QuestionAPI {
  private baseUrl = 'http://localhost:3001/api';

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async getQuestions(filters?: QuestionFilters): Promise<QuestionsResponse> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const query = params.toString();
    const endpoint = `/questions${query ? `?${query}` : ''}`;
    
    return this.request<QuestionsResponse>(endpoint);
  }

  async getAllQuestions(): Promise<Question[]> {
    // Get all questions by requesting with a high limit
    const response = await this.getQuestions({ limit: 1000 });
    let allQuestions = [...response.questions];
    
    // If there are more questions, fetch them in batches
    const totalPages = Math.ceil(response.total / 1000);
    for (let page = 2; page <= totalPages; page++) {
      const nextBatch = await this.getQuestions({ page, limit: 1000 });
      allQuestions = [...allQuestions, ...nextBatch.questions];
    }
    
    return allQuestions;
  }

  async getQuestion(id: number): Promise<Question> {
    const response = await this.request<{ question: Question }>(`/questions/${id}`);
    return response.question;
  }

  async createQuestion(data: CreateQuestionRequest): Promise<Question> {
    const response = await this.request<{ question: Question }>('/questions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.question;
  }

  async updateQuestion(id: number, data: UpdateQuestionRequest): Promise<Question> {
    const response = await this.request<{ question: Question }>(`/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.question;
  }

  async deleteQuestion(id: number): Promise<void> {
    await this.request<{ success: boolean }>(`/questions/${id}`, {
      method: 'DELETE',
    });
  }

  async completeQuestion(id: number, data: ReviewRequest): Promise<Question> {
    const response = await this.request<{ question: Question }>(`/questions/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.question;
  }

  async reviewQuestion(id: number, data: ReviewRequest): Promise<Question> {
    const response = await this.request<{ question: Question }>(`/questions/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.question;
  }

  async resetQuestion(id: number): Promise<Question> {
    const response = await this.request<{ question: Question }>(`/questions/${id}/reset`, {
      method: 'POST',
    });
    return response.question;
  }

  async getDueQuestions(): Promise<DueQuestionsResponse> {
    return this.request<DueQuestionsResponse>('/questions/due');
  }

  async getStats(): Promise<StatsResponse> {
    return this.request<StatsResponse>('/stats');
  }

  async checkHealth(): Promise<{ status: string; timestamp: string; uptime: number }> {
    return this.request<{ status: string; timestamp: string; uptime: number }>('/health');
  }

  async refreshData(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/questions/refresh', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

export const questionAPI = new QuestionAPI();
