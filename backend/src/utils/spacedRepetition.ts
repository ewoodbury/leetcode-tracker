export class SpacedRepetitionService {
  private readonly intervals = [1, 3, 7, 14, 30, 90]; // days

  calculateNextReview(reviewCount: number, difficulty: 'easy' | 'medium' | 'hard'): Date {
    let intervalIndex = Math.min(reviewCount, this.intervals.length - 1);
    
    // Reset to beginning if struggled (marked as hard)
    if (difficulty === 'hard') {
      intervalIndex = 0;
    }
    
    const daysToAdd = this.intervals[intervalIndex];
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + daysToAdd);
    
    // Set to start of day to avoid time zone issues
    nextReview.setHours(0, 0, 0, 0);
    
    return nextReview;
  }
}

export const spacedRepetitionService = new SpacedRepetitionService();
