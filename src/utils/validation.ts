/**
 * Validate LeetCode URL format
 */
export function validateLeetCodeURL(url: string): boolean {
  const leetcodePattern = /^https:\/\/leetcode\.com\/problems\/[a-z0-9-]+\/?$/;
  return leetcodePattern.test(url);
}

/**
 * Extract problem slug from LeetCode URL
 */
export function extractProblemSlug(url: string): string | null {
  const match = url.match(/\/problems\/([a-z0-9-]+)\/?$/);
  return match ? match[1] : null;
}

/**
 * Generate question name from problem slug
 */
export function generateQuestionName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Validate question name (non-empty, reasonable length)
 */
export function validateQuestionName(name: string): boolean {
  return name.trim().length > 0 && name.trim().length <= 100;
}

/**
 * Validate category name
 */
export function validateCategory(category: string): boolean {
  return category.trim().length > 0 && category.trim().length <= 50;
}

/**
 * Check if URL already exists in questions list
 */
export function isDuplicateURL(url: string, existingQuestions: { leetcodeUrl: string }[]): boolean {
  return existingQuestions.some(q => q.leetcodeUrl === url);
}

/**
 * Validate date string (YYYY-MM-DD format)
 */
export function validateDateString(dateStr: string): boolean {
  if (!dateStr) return true; // Empty dates are allowed
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(dateStr)) return false;
  
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && date.toISOString().split('T')[0] === dateStr;
}

/**
 * Sanitize string for CSV (remove problematic characters)
 */
export function sanitizeForCSV(input: string): string {
  return input
    .replace(/[\r\n]/g, ' ') // Replace newlines with spaces
    .trim();
}
