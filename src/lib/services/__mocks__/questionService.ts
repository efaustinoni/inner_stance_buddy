import { vi } from 'vitest';

export const addQuestion = vi.fn().mockResolvedValue(null);
export const updateQuestion = vi.fn().mockResolvedValue(true);
export const deleteQuestion = vi.fn().mockResolvedValue(true);
export const bulkImportQuestions = vi.fn().mockResolvedValue(true);
export const extractQuestionsFromImage = vi.fn().mockResolvedValue(null);
