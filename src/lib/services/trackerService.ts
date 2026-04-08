// Created: 2026-04-08
// Domain: Progress Trackers and Check-ins

import { supabase } from '../supabase';
import type { ExerciseQuestion } from './questionService';
import type { ExerciseWeek } from './weekService';
import type { ExerciseAnswer } from './answerService';
import { ok, err, type Result } from './types';

export interface ProgressTracker {
  id: string;
  question_id: string;
  user_id: string;
  started_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProgressCheckIn {
  id: string;
  tracker_id: string;
  check_in_date: string;
  is_done: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface TrackerWithQuestion extends ProgressTracker {
  question: ExerciseQuestion;
  week: ExerciseWeek;
}

export interface TrackerWithCheckIns extends ProgressTracker {
  question: ExerciseQuestion;
  week: ExerciseWeek;
  check_ins: ProgressCheckIn[];
  answer?: ExerciseAnswer;
}

export async function createProgressTracker(questionId: string): Promise<Result<ProgressTracker>> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err('auth', 'Not authenticated');

  const { data, error } = await supabase
    .from('progress_trackers')
    .insert({
      question_id: questionId,
      user_id: user.id,
      started_at: new Date().toISOString().split('T')[0],
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating progress tracker:', error);
    return err('db', error.message);
  }

  return ok(data);
}

/**
 * Batch-fetch trackers for multiple questions in a single DB round-trip.
 * Returns a map of questionId → tracker (null when no tracker exists for that question).
 */
export async function getTrackersForQuestions(
  questionIds: string[]
): Promise<Record<string, ProgressTracker | null>> {
  if (questionIds.length === 0) return {};

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data, error } = await supabase
    .from('progress_trackers')
    .select('*')
    .eq('user_id', user.id)
    .in('question_id', questionIds);

  if (error) {
    console.error('Error fetching trackers for questions:', error);
    return {};
  }

  // Pre-seed every requested id with null so callers always get a complete map
  const trackerMap: Record<string, ProgressTracker | null> = {};
  for (const qId of questionIds) {
    trackerMap[qId] = data?.find((t) => t.question_id === qId) ?? null;
  }
  return trackerMap;
}

export async function getTrackerForQuestion(questionId: string): Promise<ProgressTracker | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('progress_trackers')
    .select('*')
    .eq('question_id', questionId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching tracker:', error);
    return null;
  }

  return data;
}

export async function fetchUserTrackers(): Promise<TrackerWithQuestion[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: trackers, error: trackersError } = await supabase
    .from('progress_trackers')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (trackersError || !trackers?.length) {
    return [];
  }

  const questionIds = trackers.map((t) => t.question_id);
  const { data: questions } = await supabase
    .from('decrypted_exercise_questions')
    .select('*')
    .in('id', questionIds);

  const weekIds = [...new Set(questions?.map((q) => q.week_id) || [])];
  const { data: weeks } = await supabase.from('exercise_weeks').select('*').in('id', weekIds);

  // Build result only when both question and week resolve — avoids non-null assertions
  return trackers.reduce<TrackerWithQuestion[]>((acc, tracker) => {
    const question = questions?.find((q) => q.id === tracker.question_id);
    const week = weeks?.find((w) => w.id === question?.week_id);
    if (question && week) {
      acc.push({ ...tracker, question, week });
    }
    return acc;
  }, []);
}

export async function toggleCheckIn(
  trackerId: string,
  date: string,
  isDone: boolean
): Promise<boolean> {
  // ITEM-08: upsert on UNIQUE(tracker_id, check_in_date) — no pre-read needed
  const { error } = await supabase.from('progress_check_ins').upsert(
    {
      tracker_id: trackerId,
      check_in_date: date,
      is_done: isDone,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'tracker_id,check_in_date' }
  );

  if (error) {
    console.error('Error toggling check-in:', error);
    return false;
  }

  return true;
}

export async function deleteProgressTracker(trackerId: string): Promise<boolean> {
  const { error } = await supabase.from('progress_trackers').delete().eq('id', trackerId);

  if (error) {
    console.error('Error deleting tracker:', error);
    return false;
  }

  return true;
}

export async function updateCheckInNotes(
  trackerId: string,
  date: string,
  notes: string
): Promise<boolean> {
  // Upsert on UNIQUE(tracker_id, check_in_date).
  // is_done is intentionally absent from the payload:
  //   INSERT  → DB DEFAULT (false) initialises it.
  //   UPDATE  → DO UPDATE SET only covers the columns listed here,
  //             so the existing is_done value is preserved.
  const { error } = await supabase.from('progress_check_ins').upsert(
    {
      tracker_id: trackerId,
      check_in_date: date,
      notes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'tracker_id,check_in_date' }
  );

  if (error) {
    console.error('Error updating check-in notes:', error);
    return false;
  }

  return true;
}
