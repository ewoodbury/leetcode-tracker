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
  limit: z.coerce.number().int().min(1).max(10000).default(50)
});
