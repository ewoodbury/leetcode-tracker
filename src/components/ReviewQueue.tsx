import type { Question } from '../types/Question';
import { questionAPI } from '../services/api';
import { isDueForReview, isOverdue, getDaysOverdue } from '../utils/spacedRepetition';
import './ReviewQueue.css';

interface ReviewQueueProps {
  questions: Question[];
  onUpdateQuestions: (questions: Question[]) => void;
}

export default function ReviewQueue({ questions, onUpdateQuestions }: ReviewQueueProps) {
  const markReviewed = async (questionId: number, difficulty: 'easy' | 'medium' | 'hard') => {
    try {
      const updatedQuestion = await questionAPI.reviewQuestion(questionId, { 
        difficulty 
      });
      const updatedQuestions = questions.map(q => 
        q.id === questionId ? updatedQuestion : q
      );
      onUpdateQuestions(updatedQuestions);
    } catch (error) {
      console.error('Error marking question as reviewed:', error);
      alert('Failed to mark question as reviewed. Please try again.');
    }
  };

  // Filter questions that need review
  const reviewQuestions = questions.filter(q => 
    q.status === 'under_review' && q.nextReview
  );

  // Categorize review questions
  const overdueQuestions = reviewQuestions
    .filter(q => isOverdue(q.nextReview))
    .sort((a, b) => getDaysOverdue(b.nextReview!) - getDaysOverdue(a.nextReview!));

  const dueTodayQuestions = reviewQuestions
    .filter(q => !isOverdue(q.nextReview) && isDueForReview(q.nextReview));

  const upcomingQuestions = reviewQuestions
    .filter(q => {
      if (!q.nextReview) return false;
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      const reviewDate = new Date(q.nextReview);
      return reviewDate > new Date() && reviewDate <= threeDaysFromNow;
    })
    .sort((a, b) => new Date(a.nextReview!).getTime() - new Date(b.nextReview!).getTime());

  const needsAttentionQuestions = questions.filter(q => q.status === 'needs_attention');

  const renderQuestionCard = (question: Question, showDaysOverdue = false) => (
    <div key={question.id} className="review-question-card">
      <div className="question-header">
        <a 
          href={question.leetcodeUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="question-name"
        >
          {question.name}
        </a>
        <span className="question-category">{question.category}</span>
      </div>
      
      <div className="question-details">
        {question.lastReviewed && (
          <div>Last reviewed: {new Date(question.lastReviewed).toLocaleDateString()}</div>
        )}
        {question.nextReview && (
          <div>
            Next review: {new Date(question.nextReview).toLocaleDateString()}
            {showDaysOverdue && isOverdue(question.nextReview) && (
              <span className="overdue-days">
                ({getDaysOverdue(question.nextReview)} days overdue)
              </span>
            )}
          </div>
        )}
        <div>Reviews completed: {question.reviewCount}</div>
        {question.difficultyHistory.length > 0 && (
          <div>Recent difficulty: {question.difficultyHistory.slice(-3).join(', ')}</div>
        )}
      </div>
      
      <div className="review-actions">
        <span>Mark as reviewed:</span>
        <button
          onClick={() => markReviewed(question.id, 'easy')}
          className="review-button easy"
        >
          Easy
        </button>
        <button
          onClick={() => markReviewed(question.id, 'medium')}
          className="review-button medium"
        >
          Medium
        </button>
        <button
          onClick={() => markReviewed(question.id, 'hard')}
          className="review-button hard"
        >
          Hard
        </button>
      </div>
    </div>
  );

  if (reviewQuestions.length === 0 && needsAttentionQuestions.length === 0) {
    return (
      <div className="review-queue">
        <div className="empty-state">
          <h2>🎉 No reviews due!</h2>
          <p>You're all caught up with your reviews. Great job!</p>
          <p>Complete more questions to build your review queue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-queue">
      {needsAttentionQuestions.length > 0 && (
        <section className="review-section">
          <h2 className="section-title needs-attention">
            ❌ Needs Attention ({needsAttentionQuestions.length})
          </h2>
          <p className="section-description">
            Questions you recently struggled with. These have been reset to review after 1 day.
          </p>
          <div className="review-questions">
            {needsAttentionQuestions.map(q => renderQuestionCard(q))}
          </div>
        </section>
      )}

      {overdueQuestions.length > 0 && (
        <section className="review-section">
          <h2 className="section-title overdue">
            ⚠️ Overdue ({overdueQuestions.length})
          </h2>
          <p className="section-description">
            Questions that were due for review in the past. Review these first!
          </p>
          <div className="review-questions">
            {overdueQuestions.map(q => renderQuestionCard(q, true))}
          </div>
        </section>
      )}

      {dueTodayQuestions.length > 0 && (
        <section className="review-section">
          <h2 className="section-title due-today">
            📝 Due Today ({dueTodayQuestions.length})
          </h2>
          <p className="section-description">
            Questions scheduled for review today.
          </p>
          <div className="review-questions">
            {dueTodayQuestions.map(q => renderQuestionCard(q))}
          </div>
        </section>
      )}

      {upcomingQuestions.length > 0 && (
        <section className="review-section">
          <h2 className="section-title upcoming">
            📅 Upcoming (Next 3 Days) ({upcomingQuestions.length})
          </h2>
          <p className="section-description">
            Questions scheduled for review in the next few days.
          </p>
          <div className="review-questions">
            {upcomingQuestions.map(q => renderQuestionCard(q))}
          </div>
        </section>
      )}
    </div>
  );
}
