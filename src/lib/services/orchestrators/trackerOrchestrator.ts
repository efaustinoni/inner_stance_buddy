// Created: 2026-04-08
// Orchestrator: Tracker Detail
// Combines: tracker + question + week + check-ins + answer into one tracker view payload.

import { supabase } from '../../supabase';
import type { TrackerWithCheckIns } from '../trackerService';
import { ok, err, type Result } from '../types';

export async function fetchTrackerWithCheckIns(
  trackerId: string
): Promise<Result<TrackerWithCheckIns>> {
  const { data: tracker, error: trackerError } = await supabase
    .from('progress_trackers')
    .select('*')
    .eq('id', trackerId)
    .maybeSingle();

  if (trackerError) {
    console.error('Error fetching tracker:', trackerError);
    return err('db', trackerError.message);
  }
  if (!tracker) return err('db', 'Tracker not found');

  const [questionResult, checkInsResult, answerResult] = await Promise.all([
    supabase
      .from('decrypted_exercise_questions')
      .select('*')
      .eq('id', tracker.question_id)
      .maybeSingle(),
    supabase
      .from('decrypted_progress_check_ins')
      .select('*')
      .eq('tracker_id', trackerId)
      .order('check_in_date', { ascending: true }),
    supabase
      .from('decrypted_exercise_answers')
      .select('*')
      .eq('question_id', tracker.question_id)
      .eq('user_id', tracker.user_id)
      .maybeSingle(),
  ]);

  const question = questionResult.data;

  const weekResult = await supabase
    .from('exercise_weeks')
    .select('*')
    .eq('id', question?.week_id)
    .maybeSingle();

  // Guard: if related question or week is missing, the tracker detail cannot be assembled
  if (!question || !weekResult.data) {
    console.error('Missing related data for tracker:', trackerId);
    return err('db', 'Missing related question or week data');
  }

  return ok({
    ...tracker,
    question,
    week: weekResult.data,
    check_ins: checkInsResult.data || [],
    answer: answerResult.data || undefined,
  });
}
