import { promises as fs } from 'fs';
import { createReadStream } from 'fs';
import csv from 'csv-parser';
import * as csvWriter from 'csv-writer';
import { config } from '../config/index.js';
import type { Question } from '../types/index.js';

interface QuestionCSVRow {
  id: string;
  name: string;
  category: string;
  leetcode_url: string;
  status: string;
  first_completed: string;
  last_reviewed: string;
  next_review: string;
  review_count: string;
  difficulty_history: string;
  notes: string;
}

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
        .on('data', (row: QuestionCSVRow) => {
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
    // Ensure data directory exists
    await fs.mkdir(config.dataDir, { recursive: true });

    const writer = csvWriter.createObjectCsvWriter({
      path: this.csvPath,
      header: this.headers.map(field => ({ id: field, title: field }))
    });

    const records = questions.map(question => this.questionToCSVRow(question));
    await writer.writeRecords(records);
  }

  private parseCSVRow(row: QuestionCSVRow): Question {
    return {
      id: parseInt(row.id, 10),
      name: row.name || '',
      category: row.category || '',
      leetcodeUrl: row.leetcode_url || '',
      status: (row.status as Question['status']) || 'not_started',
      firstCompleted: row.first_completed || undefined,
      lastReviewed: row.last_reviewed || undefined,
      nextReview: row.next_review || undefined,
      reviewCount: parseInt(row.review_count, 10) || 0,
      difficultyHistory: row.difficulty_history 
        ? row.difficulty_history.split(',').filter(Boolean) as ('easy' | 'medium' | 'hard')[]
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
