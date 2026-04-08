// Created: 2026-04-08
// Last Updated: 2026-04-08 (ITEM-08: replaced read-then-write with upsert)
// Domain: Answers

import { supabase } from '../supabase';
import { ok, err, type Result } from './types';
import { withRetry, isTransientResult } from '../withRetry';
import { dataCache, CACHE_KEY } from '../dataCache';
import { getCurrentUser } from '../getCurrentUser';

export type { Result };

export interface ExerciseAnswer {
  id: string;
  question_id: string;
  user_id: string;
  answer_text: string;
  created_at: string;
  updated_at: string;
}

/**
 * Saves (or updates) the current user's answer to a question.
 * Uses upsert on UNIQUE(question_id, user_id) — idempotent and safe to retry.
 * Retried automatically on transient db/network failures via `withRetry`.
 *
 * @param questionId - UUID of the question being answered.
 * @param answerText - The user's answer text (stored encrypted via pgsodium).
 * @returns Result<void> — ok on success, err with code 'auth' or 'db' on failure.
 */
export async function saveAnswer(questionId: string, answerText: string): Promise<Result> {
  // Upsert is idempotent — safe to retry on transient db/network failures.
  // isTransientResult never retries auth errors (permanent — retrying won't help).
  return withRetry(async () => {
    const user = await getCurrentUser();
    if (!user) return err('auth', 'Not authenticated');

    const { error } = await supabase.from('exercise_answers').upsert(
      {
        question_id: questionId,
        user_id: user.id,
        answer_text: answerText,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'question_id,user_id' }
    );

    if (error) {
      console.error('Error saving answer:', error);
      return err('db', error.message);
    }

    dataCache.invalidate(CACHE_KEY.DASHBOARD);
    return ok(undefined);
  }, isTransientResult);
}
