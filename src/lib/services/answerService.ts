// Created: 2026-04-08
// Last Updated: 2026-04-08 (ITEM-08: replaced read-then-write with upsert)
// Domain: Answers

import { supabase } from '../supabase';

export interface ExerciseAnswer {
  id: string;
  question_id: string;
  user_id: string;
  answer_text: string;
  created_at: string;
  updated_at: string;
}

export async function saveAnswer(questionId: string, answerText: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

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
    return false;
  }

  return true;
}
