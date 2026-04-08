// Created: 2026-04-08
// Domain: Questions

import { supabase } from '../supabase';

export interface ExerciseQuestion {
  id: string;
  week_id: string;
  question_label: string;
  question_text: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ImageExtractedData {
  weekNumber?: number;
  theme?: string;
  questions: { label: string; text: string; answer?: string }[];
}

/**
 * Adds a single question to a week.
 * The question text is stored encrypted via pgsodium (write path goes through exercise_questions directly;
 * decrypted reads use the decrypted_exercise_questions view).
 *
 * @param weekId - UUID of the parent week.
 * @param questionLabel - Short label shown above the question (e.g. "Reflectie 1a").
 * @param questionText - Full question body.
 * @param sortOrder - 0-based position within the week.
 * @returns The created question, or null on DB error.
 */
export async function addQuestion(
  weekId: string,
  questionLabel: string,
  questionText: string,
  sortOrder: number
): Promise<ExerciseQuestion | null> {
  const { data, error } = await supabase
    .from('exercise_questions')
    .insert({
      week_id: weekId,
      question_label: questionLabel,
      question_text: questionText,
      sort_order: sortOrder,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding question:', error);
    return null;
  }

  return data;
}

/**
 * Applies partial updates to a question's mutable fields.
 *
 * @param questionId - UUID of the question to update.
 * @param updates - Fields to change (any subset of question_label, question_text, sort_order).
 * @returns true on success, false on DB error.
 */
export async function updateQuestion(
  questionId: string,
  updates: { question_label?: string; question_text?: string; sort_order?: number }
): Promise<boolean> {
  const { error } = await supabase
    .from('exercise_questions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', questionId);

  if (error) {
    console.error('Error updating question:', error);
    return false;
  }

  return true;
}

/**
 * Permanently deletes a question and its answers via DB cascade.
 *
 * @param questionId - UUID of the question to delete.
 * @returns true on success, false on DB error.
 */
export async function deleteQuestion(questionId: string): Promise<boolean> {
  const { error } = await supabase.from('exercise_questions').delete().eq('id', questionId);

  if (error) {
    console.error('Error deleting question:', error);
    return false;
  }

  return true;
}

/**
 * Replaces or appends a batch of questions (and optional pre-written answers) to a week.
 * When `replaceExisting` is true (default), all existing questions, answers, and trackers
 * for the week are deleted first, then the new batch is inserted in a single round-trip.
 *
 * @param weekId - UUID of the target week.
 * @param questions - Array of question data; `answer` is optional per question.
 * @param replaceExisting - When true, wipes existing questions before inserting. Default: true.
 * @returns true on success, false on auth failure or DB error.
 */
export async function bulkImportQuestions(
  weekId: string,
  questions: { label: string; text: string; answer?: string }[],
  replaceExisting: boolean = true
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  if (replaceExisting) {
    const { data: existingQuestions } = await supabase
      .from('exercise_questions')
      .select('id')
      .eq('week_id', weekId);

    if (existingQuestions && existingQuestions.length > 0) {
      const questionIds = existingQuestions.map((q) => q.id);

      await supabase.from('exercise_answers').delete().in('question_id', questionIds);

      await supabase
        .from('progress_check_ins')
        .delete()
        .in(
          'tracker_id',
          (
            await supabase.from('progress_trackers').select('id').in('question_id', questionIds)
          ).data?.map((t) => t.id) || []
        );

      await supabase.from('progress_trackers').delete().in('question_id', questionIds);

      await supabase.from('exercise_questions').delete().eq('week_id', weekId);
    }
  }

  // Batch-insert all questions in one round-trip.
  // sort_order = array index so rows can be reconstructed in original order after the insert.
  const { data: insertedRaw, error: insertError } = await supabase
    .from('exercise_questions')
    .insert(
      questions.map((q, i) => ({
        week_id: weekId,
        question_label: q.label,
        question_text: q.text,
        sort_order: i,
      }))
    )
    .select();

  if (insertError || !insertedRaw) {
    console.error('[BulkImport] Error inserting questions:', insertError);
    return false;
  }

  // Reconstruct insertion order — sort by sort_order so index == original position
  const insertedQuestions = [...insertedRaw].sort((a, b) => a.sort_order - b.sort_order);

  const answersToInsert = questions
    .map((q, index) => {
      if (!q.answer) return null;
      const insertedQuestion = insertedQuestions[index];
      if (!insertedQuestion) return null;
      return {
        question_id: insertedQuestion.id,
        user_id: user.id,
        answer_text: q.answer,
      };
    })
    .filter((a): a is { question_id: string; user_id: string; answer_text: string } => a !== null);

  if (answersToInsert.length > 0) {
    const { error: answerError } = await supabase.from('exercise_answers').insert(answersToInsert);

    if (answerError) {
      console.error('[BulkImport] Error inserting answers:', answerError);
      return false;
    }
  }

  return true;
}

/**
 * Calls the `extract-questions-from-image` Supabase Edge Function.
 * The function uses the OPENAI_API_KEY + OPENAI_MODEL secrets to extract
 * questions (and optionally answers) from the provided image.
 *
 * @param imageBase64 - Base64-encoded image data (without the data-URL prefix)
 * @param mimeType   - MIME type of the image, e.g. "image/jpeg" or "image/png"
 */
export async function extractQuestionsFromImage(
  imageBase64: string,
  mimeType: string
): Promise<ImageExtractedData | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    console.error('[extractQuestionsFromImage] No active session');
    return null;
  }

  const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-questions-from-image`;
  let response: Response;
  try {
    response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageBase64, mimeType }),
    });
  } catch (fetchError) {
    console.error('[extractQuestionsFromImage] Network error:', fetchError);
    return null;
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[extractQuestionsFromImage] HTTP ${response.status}:`, errorText);
    return null;
  }

  const data = await response.json();

  if (!data || !Array.isArray(data.questions)) {
    console.error('[extractQuestionsFromImage] Unexpected response shape:', data);
    return null;
  }

  type RawQuestion = { label: string; text: string; answer?: string | null };
  const questions = data.questions.map((q: RawQuestion) => ({
    label: q.label || 'Vraag',
    text: q.text || '',
    // Answers returned from the Edge Function already use | as line separator;
    // convert them to newlines so they match the app's internal format.
    answer: q.answer
      ? String(q.answer)
          .split('|')
          .map((a: string) => a.trim())
          .join('\n')
      : undefined,
  }));

  return {
    weekNumber: data.weekNumber ?? undefined,
    theme: data.theme ?? undefined,
    questions,
  };
}
