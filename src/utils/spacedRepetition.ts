/**
 * Calculate the next review date based on the review count and difficulty
 * Implements spaced repetition algorithm: 1 day → 3 days → 7 days → 14 days → 30 days → 90 days
 * Resets to 1 day if marked as "hard" (struggled)
 */
export function calculateNextReview(
  reviewCount: number, 
  difficulty: 'easy' | 'medium' | 'hard'
): Date {
  const intervals = [1, 3, 7, 14, 30, 90]; // days
  let intervalIndex = Math.min(reviewCount, intervals.length - 1);
  
  // Reset to beginning if struggled (marked as hard)
  if (difficulty === 'hard') {
    intervalIndex = 0;
  }
  
  const daysToAdd = intervals[intervalIndex];
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + daysToAdd);
  return nextReview;
}

/**
 * Check if a question is due for review
 */
export function isDueForReview(nextReview: string | undefined): boolean {
  if (!nextReview) return false;
  return new Date(nextReview) <= new Date();
}

/**
 * Check if a question is overdue for review
 */
export function isOverdue(nextReview: string | undefined): boolean {
  if (!nextReview) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reviewDate = new Date(nextReview);
  reviewDate.setHours(0, 0, 0, 0);
  return reviewDate < today;
}

/**
 * Get days overdue (positive number if overdue, 0 if due today, negative if future)
 */
export function getDaysOverdue(nextReview: string | undefined): number {
  if (!nextReview) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reviewDate = new Date(nextReview);
  reviewDate.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - reviewDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
