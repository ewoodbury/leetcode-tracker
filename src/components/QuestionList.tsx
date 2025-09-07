import { useState } from 'react';
import type { Question } from '../types/Question';
import { questionAPI } from '../services/api';
import { isDueForReview, isOverdue } from '../utils/spacedRepetition';
import './QuestionList.css';

interface QuestionListProps {
  questions: Question[];
  onUpdateQuestions: (questions: Question[]) => void;
}

export default function QuestionList({ questions, onUpdateQuestions }: QuestionListProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Arrays & Hashing']));

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const updateQuestionNotes = async (questionId: number, notes: string) => {
    try {
      const updatedQuestion = await questionAPI.updateQuestion(questionId, { notes });
      const updatedQuestions = questions.map(q => 
        q.id === questionId ? updatedQuestion : q
      );
      onUpdateQuestions(updatedQuestions);
    } catch (error) {
      console.error('Error updating question notes:', error);
      alert('Failed to update notes. Please try again.');
    }
  };

  const markCompleted = async (questionId: number, reviewDifficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
    try {
      const updatedQuestion = await questionAPI.completeQuestion(questionId, { 
        difficulty: reviewDifficulty 
      });
      const updatedQuestions = questions.map(q => 
        q.id === questionId ? updatedQuestion : q
      );
      onUpdateQuestions(updatedQuestions);
    } catch (error) {
      console.error('Error marking question as completed:', error);
      alert('Failed to mark question as completed. Please try again.');
    }
  };

  const markNotStarted = async (questionId: number) => {
    try {
      const updatedQuestion = await questionAPI.resetQuestion(questionId);
      const updatedQuestions = questions.map(q => 
        q.id === questionId ? updatedQuestion : q
      );
      onUpdateQuestions(updatedQuestions);
    } catch (error) {
      console.error('Error resetting question:', error);
      alert('Failed to reset question. Please try again.');
    }
  };

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

  const getStatusIcon = (question: Question) => {
    if (question.status === 'not_started') return '⭕';
    if (question.status === 'needs_attention') return '❌';
    if (question.nextReview && isOverdue(question.nextReview)) return '⚠️';
    if (question.nextReview && isDueForReview(question.nextReview)) return '📝';
    return '✅';
  };

  const getStatusText = (question: Question) => {
    if (question.status === 'not_started') return 'Not Started';
    if (question.status === 'needs_attention') return 'Needs Attention';
    if (question.nextReview && isOverdue(question.nextReview)) return 'Overdue';
    if (question.nextReview && isDueForReview(question.nextReview)) return 'Due Today';
    return 'Up to Date';
  };

  // Group questions by category
  const questionsByCategory = questions.reduce((acc, question) => {
    if (!acc[question.category]) {
      acc[question.category] = [];
    }
    acc[question.category].push(question);
    return acc;
  }, {} as Record<string, Question[]>);

  return (
    <div className="question-list">
      {Object.entries(questionsByCategory).map(([category, categoryQuestions]) => {
        const isExpanded = expandedCategories.has(category);
        const completedCount = categoryQuestions.filter(q => 
          q.status === 'completed' || q.status === 'under_review'
        ).length;
        
        return (
          <div key={category} className="category-section">
            <button
              className="category-header"
              onClick={() => toggleCategory(category)}
            >
              <span className="category-toggle">{isExpanded ? "▼" : "▶"}</span>
              <span className="category-name">{category}</span>
              <span className="category-progress">
                ({completedCount}/{categoryQuestions.length})
              </span>
            </button>

            {isExpanded && (
              <div className="questions-grid">
                {categoryQuestions.map((question) => (
                  <div key={question.id} className="question-card">
                    <div className="question-main">
                      <span
                        className="status-icon"
                        title={getStatusText(question)}
                      >
                        {getStatusIcon(question)}
                      </span>
                      <a
                        href={question.leetcodeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="question-name"
                        title={question.name}
                      >
                        {question.name}
                      </a>
                      {question.leetcodeDifficulty && (
                        <span
                          className={`difficulty-badge ${question.leetcodeDifficulty.toLowerCase()}`}
                        >
                          {question.leetcodeDifficulty}
                        </span>
                      )}
                    </div>

                    <div className="question-details">
                      {question.lastReviewed && (
                        <div className="question-date">
                          Last:{" "}
                          {new Date(question.lastReviewed).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </div>
                      )}
                      {question.nextReview && (
                        <div className="question-date">
                          Next:{" "}
                          {new Date(question.nextReview).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </div>
                      )}
                      {question.reviewCount > 0 && (
                        <div className="question-stats">
                          Reviews: {question.reviewCount}
                        </div>
                      )}
                    </div>

                    <div className="question-notes">
                      <input
                        type="text"
                        placeholder="Add notes..."
                        value={question.notes || ""}
                        onChange={(e) =>
                          updateQuestionNotes(question.id, e.target.value)
                        }
                      />
                    </div>

                    <div className="question-actions">
                      {question.status === "not_started" && (
                        <div className="completion-actions">
                          <span>Mark as:</span>
                          <button
                            onClick={() => markCompleted(question.id, "easy")}
                            className="action-button easy"
                            title="Easy - next review in 1 day"
                          >
                            Easy
                          </button>
                          <button
                            onClick={() => markCompleted(question.id, "medium")}
                            className="action-button medium"
                            title="Medium - next review in 1 day"
                          >
                            Medium
                          </button>
                          <button
                            onClick={() => markCompleted(question.id, "hard")}
                            className="action-button hard"
                            title="Hard - next review in 1 day"
                          >
                            Hard
                          </button>
                        </div>
                      )}

                      {question.status !== "not_started" && (
                        <button
                          onClick={() => markNotStarted(question.id)}
                          className="action-button undo"
                          title="Reset to not started"
                        >
                          Undo
                        </button>
                      )}

                      {question.status !== "not_started" &&
                        question.nextReview &&
                        isDueForReview(question.nextReview) && (
                          <div className="review-actions">
                            <span>Review:</span>
                            <button
                              onClick={() => markReviewed(question.id, "easy")}
                              className="action-button easy"
                            >
                              Easy
                            </button>
                            <button
                              onClick={() =>
                                markReviewed(question.id, "medium")
                              }
                              className="action-button medium"
                            >
                              Medium
                            </button>
                            <button
                              onClick={() => markReviewed(question.id, "hard")}
                              className="action-button hard"
                            >
                              Hard
                            </button>
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
