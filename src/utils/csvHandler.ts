import type { Question } from '../types/Question';

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

/**
 * Parse CSV content into Question objects
 */
export function parseCSV(csvContent: string): Question[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  console.log(`CSV has ${lines.length} lines (including header)`);
  
  if (lines.length <= 1) return []; // No data or only header
  
  const questions: Question[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 11) {
      console.warn(`Line ${i + 1} has only ${values.length} values, skipping:`, lines[i]);
      continue; // Skip malformed lines (should have 11 fields)
    }
    
    try {
      const row: QuestionCSVRow = {
        id: values[0] || '',
        name: values[1] || '',
        category: values[2] || '',
        leetcode_url: values[3] || '',
        status: values[4] || 'not_started',
        first_completed: values[5] || '',
        last_reviewed: values[6] || '',
        next_review: values[7] || '',
        review_count: values[8] || '0',
        difficulty_history: values[9] || '',
        notes: values[10] || ''
      };
      
      const question = csvRowToQuestion(row);
      if (question.id > 0) { // Only add valid questions with IDs
        questions.push(question);
      } else {
        console.warn(`Question has invalid ID on line ${i + 1}:`, row);
      }
    } catch (error) {
      console.warn(`Error parsing row ${i + 1}:`, error, lines[i]);
    }
  }
  
  console.log(`Successfully parsed ${questions.length} questions`);
  return questions;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

/**
 * Convert CSV row to Question object
 */
function csvRowToQuestion(row: QuestionCSVRow): Question {
  return {
    id: parseInt(row.id) || 0,
    name: row.name,
    category: row.category,
    leetcodeUrl: row.leetcode_url,
    status: validateStatus(row.status),
    firstCompleted: row.first_completed || undefined,
    lastReviewed: row.last_reviewed || undefined,
    nextReview: row.next_review || undefined,
    reviewCount: parseInt(row.review_count) || 0,
    difficultyHistory: row.difficulty_history ? 
      row.difficulty_history.split(',').filter((d: string) => ['easy', 'medium', 'hard'].includes(d)) as ('easy' | 'medium' | 'hard')[] : 
      [],
    notes: row.notes || ''
  };
}

/**
 * Validate status value
 */
function validateStatus(status: string): Question['status'] {
  const validStatuses: Question['status'][] = ['not_started', 'completed', 'under_review', 'needs_attention'];
  return validStatuses.includes(status as Question['status']) ? status as Question['status'] : 'not_started';
}

/**
 * Convert Question objects to CSV content
 */
export function questionsToCSV(questions: Question[]): string {
  const headers = [
    'id', 'name', 'category', 'leetcode_url', 'status',
    'first_completed', 'last_reviewed', 'next_review', 'review_count', 'difficulty_history', 'notes'
  ];
  
  const rows = questions.map(question => {
    const row: string[] = [
      question.id.toString(),
      escapeCSVValue(question.name),
      escapeCSVValue(question.category),
      question.leetcodeUrl,
      question.status,
      question.firstCompleted ? new Date(question.firstCompleted).toISOString().split('T')[0] : '',
      question.lastReviewed ? new Date(question.lastReviewed).toISOString().split('T')[0] : '',
      question.nextReview ? new Date(question.nextReview).toISOString().split('T')[0] : '',
      question.reviewCount.toString(),
      question.difficultyHistory.join(','),
      escapeCSVValue(question.notes || '')
    ];
    return row.join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Escape CSV value (add quotes if contains comma or quote)
 */
function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Save questions to localStorage (fallback for file operations)
 */
export function saveToLocalStorage(questions: Question[]): void {
  const csvContent = questionsToCSV(questions);
  localStorage.setItem('leetcode-tracker-data', csvContent);
}

/**
 * Load questions from localStorage
 */
export function loadFromLocalStorage(): Question[] {
  const csvContent = localStorage.getItem('leetcode-tracker-data');
  if (!csvContent) return [];
  return parseCSV(csvContent);
}
