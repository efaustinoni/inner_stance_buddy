// Created: 2026-04-08
// Last Updated: 2026-04-08 (ITEM-08: replaced read-then-write with upsert)
// Domain: Answers

import { supabase } from '../supabase';
import { ok, err, type Result } from './types';
import { withRetry, isTransientResult } from '../withRetry';

export type { Result };

export interface ExerciseAnswer {
  id: string;
  question_id: string;
  user_id: string;
  answer_text: string;
  created_at: string;
  updated_at: string;
}

export async function saveAnswer(questionId: string, answerText: string): Promise<Result> {
  // Upsert is idempotent — safe to retry on transient db/network failures.
  // isTransientResult never retries auth errors (permanent — retrying won't help).
  return withRetry(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
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

    return ok(undefined);
  }, isTransientResult);
}
