import { useState } from 'react';
import type { Question } from '../types/Question';
import { 
  validateLeetCodeURL, 
  validateQuestionName, 
  validateCategory,
  isDuplicateURL,
  extractProblemSlug,
  generateQuestionName,
  sanitizeForCSV
} from '../utils/validation';
import './AddQuestion.css';

interface AddQuestionProps {
  questions: Question[];
  onAddQuestion: (question: Omit<Question, 'id'>) => void;
  onBack: () => void;
}

// Common categories from NeetCode 150
const COMMON_CATEGORIES = [
  'Arrays & Hashing',
  'Two Pointers',
  'Sliding Window',
  'Stack',
  'Binary Search',
  'Linked List',
  'Trees',
  'Tries',
  'Heap / Priority Queue',
  'Backtracking',
  'Graphs',
  'Advanced Graphs',
  '1-D Dynamic Programming',
  '2-D Dynamic Programming',
  'Greedy',
  'Intervals',
  'Math & Geometry',
  'Bit Manipulation',
  'Other'
];

export default function AddQuestion({ questions, onAddQuestion, onBack }: AddQuestionProps) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [leetcodeDifficulty, setLeetcodeDifficulty] = useState<
    "Easy" | "Medium" | "Hard"
  >("Medium");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    
    // Auto-generate name if URL is valid and name is empty
    if (validateLeetCodeURL(newUrl) && !name) {
      const slug = extractProblemSlug(newUrl);
      if (slug) {
        setName(generateQuestionName(slug));
      }
    }
    
    // Clear URL-related errors
    if (errors.url) {
      setErrors(prev => ({ ...prev, url: '' }));
    }
  };

  const handleNameChange = (newName: string) => {
    setName(newName);
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }));
    }
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    if (newCategory !== 'Other') {
      setCustomCategory('');
    }
    if (errors.category) {
      setErrors(prev => ({ ...prev, category: '' }));
    }
  };

  const handleCustomCategoryChange = (newCustomCategory: string) => {
    setCustomCategory(newCustomCategory);
    if (errors.category) {
      setErrors(prev => ({ ...prev, category: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate URL
    if (!url.trim()) {
      newErrors.url = 'LeetCode URL is required';
    } else if (!validateLeetCodeURL(url)) {
      newErrors.url = 'Please enter a valid LeetCode URL (e.g., https://leetcode.com/problems/two-sum/)';
    } else if (isDuplicateURL(url, questions)) {
      newErrors.url = 'This question has already been added';
    }

    // Validate name
    if (!name.trim()) {
      newErrors.name = 'Question name is required';
    } else if (!validateQuestionName(name)) {
      newErrors.name = 'Question name must be between 1 and 100 characters';
    }

    // Validate category
    const finalCategory = category === 'Other' ? customCategory : category;
    if (!finalCategory.trim()) {
      newErrors.category = 'Category is required';
    } else if (!validateCategory(finalCategory)) {
      newErrors.category = 'Category must be between 1 and 50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const finalCategory = category === 'Other' ? customCategory : category;
      
      const newQuestion: Omit<Question, "id"> = {
        name: sanitizeForCSV(name.trim()),
        category: sanitizeForCSV(finalCategory.trim()),
        leetcodeUrl: url.trim(),
        leetcodeDifficulty: leetcodeDifficulty,
        status: "not_started",
        reviewCount: 0,
        difficultyHistory: [],
        notes: "",
      };

      onAddQuestion(newQuestion);
      
      // Reset form
      setUrl('');
      setName('');
      setCategory('');
      setCustomCategory('');
      setLeetcodeDifficulty("Medium");
      setErrors({});
      
      // Go back to main view
      onBack();
    } catch (error) {
      console.error('Error adding question:', error);
      setErrors({ submit: 'Failed to add question. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setUrl('');
    setName('');
    setCategory('');
    setCustomCategory('');
    setLeetcodeDifficulty("Medium");
    setErrors({});
  };

  return (
    <div className="add-question">
      <div className="add-question-header">
        <button onClick={onBack} className="back-button">
          ← Back to Questions
        </button>
        <h2>Add Custom Question</h2>
      </div>

      <form onSubmit={handleSubmit} className="add-question-form">
        <div className="form-group">
          <label htmlFor="url">LeetCode URL *</label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://leetcode.com/problems/example-problem/"
            className={errors.url ? "error" : ""}
          />
          {errors.url && <span className="error-message">{errors.url}</span>}
          <small className="help-text">
            Paste the LeetCode problem URL. The question name will be
            auto-generated.
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="name">Question Name *</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g., Two Sum"
            className={errors.name ? "error" : ""}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="category">Category *</label>
          <select
            id="category"
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className={errors.category ? "error" : ""}
          >
            <option value="">Select a category...</option>
            {COMMON_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && (
            <span className="error-message">{errors.category}</span>
          )}
        </div>

        {category === "Other" && (
          <div className="form-group">
            <label htmlFor="customCategory">Custom Category *</label>
            <input
              type="text"
              id="customCategory"
              value={customCategory}
              onChange={(e) => handleCustomCategoryChange(e.target.value)}
              placeholder="Enter custom category name"
              className={errors.category ? "error" : ""}
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="leetcodeDifficulty">LeetCode Difficulty</label>
          <select
            id="leetcodeDifficulty"
            value={leetcodeDifficulty}
            onChange={(e) =>
              setLeetcodeDifficulty(
                e.target.value as "Easy" | "Medium" | "Hard"
              )
            }
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
          <small className="help-text">
            Select the official LeetCode difficulty for this problem.
          </small>
        </div>

        {errors.submit && (
          <div className="error-message submit-error">{errors.submit}</div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={handleReset}
            className="reset-button"
            disabled={isSubmitting}
          >
            Reset
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add Question"}
          </button>
        </div>
      </form>

      <div className="add-question-help">
        <h3>Tips:</h3>
        <ul>
          <li>
            Copy the URL from your browser when viewing a LeetCode problem
          </li>
          <li>
            The question name will be automatically generated from the URL
          </li>
          <li>
            Choose the most appropriate category for spaced repetition grouping
          </li>
          <li>You can add any LeetCode problem, not just from NeetCode 150</li>
        </ul>
      </div>
    </div>
  );
}
