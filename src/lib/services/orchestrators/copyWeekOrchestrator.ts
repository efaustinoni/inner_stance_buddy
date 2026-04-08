// Created: 2026-04-08
// Orchestrator: Copy Week
// Combines: weeks + questions + answers to deep-copy a week into a target quarter.

import { supabase } from '../../supabase';
import type { ExerciseWeek } from '../weekService';

export async function copyWeekToQuarter(
  weekId: string,
  targetQuarterId: string | null,
  includeAnswers: boolean
): Promise<ExerciseWeek | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: sourceWeek } = await supabase
    .from('exercise_weeks')
    .select('*')
    .eq('id', weekId)
    .maybeSingle();

  if (!sourceWeek) return null;

  const { data: newWeek, error: weekError } = await supabase
    .from('exercise_weeks')
    .insert({
      user_id: user.id,
      week_number: sourceWeek.week_number,
      title: sourceWeek.title,
      topic: sourceWeek.topic,
      quarter_id: targetQuarterId,
    })
    .select()
    .single();

  if (weekError || !newWeek) {
    console.error('Error copying week:', weekError);
    return null;
  }

  const { data: sourceQuestions } = await supabase
    .from('decrypted_exercise_questions')
    .select('*')
    .eq('week_id', weekId)
    .order('sort_order', { ascending: true });

  if (sourceQuestions && sourceQuestions.length > 0) {
    // Batch-insert all questions in one round-trip.
    // sort_order is unique within a week, so it is used as the matching key
    // to build the old-id → new-id mapping after the insert.
    const { data: newQs, error: qBatchError } = await supabase
      .from('exercise_questions')
      .insert(
        sourceQuestions.map((q) => ({
          week_id: newWeek.id,
          question_label: q.question_label,
          question_text: q.question_text,
          sort_order: q.sort_order,
        }))
      )
      .select();

    if (qBatchError || !newQs) {
      console.error('Error batch-inserting questions for copy:', qBatchError);
      return newWeek;
    }

    const newQuestions = sourceQuestions.map((oldQ) => ({
      newId: newQs.find((nq) => nq.sort_order === oldQ.sort_order)!.id,
      oldId: oldQ.id,
    }));

    if (includeAnswers && newQuestions.length > 0) {
      const oldIds = newQuestions.map((q) => q.oldId);
      const { data: sourceAnswers } = await supabase
        .from('decrypted_exercise_answers')
        .select('*')
        .eq('user_id', user.id)
        .in('question_id', oldIds);

      if (sourceAnswers && sourceAnswers.length > 0) {
        // Collect all answer rows then insert in a single batch call
        const answersToInsert = sourceAnswers
          .map((a) => {
            const mapping = newQuestions.find((q) => q.oldId === a.question_id);
            if (!mapping) return null;
            return { question_id: mapping.newId, user_id: user.id, answer_text: a.answer_text };
          })
          .filter(
            (a): a is { question_id: string; user_id: string; answer_text: string } => a !== null
          );

        if (answersToInsert.length > 0) {
          await supabase.from('exercise_answers').insert(answersToInsert);
        }
      }
    }
  }

  return newWeek;
}
