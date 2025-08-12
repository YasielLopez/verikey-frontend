export const validateTitle = (title: string): { isValid: boolean; error?: string } => {
  if (!title || !title.trim()) {
    return { isValid: false, error: 'Title is required' };
  }

  const trimmedTitle = title.trim();
  const MIN_LENGTH = 3;
  const MAX_LENGTH = 30;

  if (trimmedTitle.length < MIN_LENGTH) {
    return { isValid: false, error: `Title must be at least ${MIN_LENGTH} characters` };
  }

  if (trimmedTitle.length > MAX_LENGTH) {
    return { isValid: false, error: `Title must be no more than ${MAX_LENGTH} characters` };
  }

  // Check for single extremely long word
  const words = trimmedTitle.split(/\s+/);
  if (words.length === 1 && trimmedTitle.length > 20) {
    return { isValid: false, error: 'Please use a descriptive title, not a single long word' };
  }

  // Check that no single word is too long
  const MAX_WORD_LENGTH = 15;
  for (const word of words) {
    if (word.length > MAX_WORD_LENGTH) {
      return { isValid: false, error: `Words cannot exceed ${MAX_WORD_LENGTH} characters` };
    }
  }

  // Check for minimum meaningful content
  if (!/[a-zA-Z]/.test(trimmedTitle)) {
    return { isValid: false, error: 'Title must contain at least some letters' };
  }

  return { isValid: true };
};