// Created: 2026-04-08
// Domain: Progress Trackers and Check-ins

import { supabase } from '../supabase';
import { dataCache, CACHE_KEY } from '../dataCache';
import { getCurrentUser } from '../getCurrentUser';
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

/**
 * Creates a new progress tracker for a question, starting today.
 * The tracker drives the daily check-in calendar on ProgressTrackingPage.
 *
 * @param questionId - UUID of the question to track.
 * @returns Result<ProgressTracker> — ok with the new tracker, or err with code 'auth' or 'db'.
 */
export async function createProgressTracker(questionId: string): Promise<Result<ProgressTracker>> {
  const user = await getCurrentUser();
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

  dataCache.invalidate(CACHE_KEY.DASHBOARD);
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

  const user = await getCurrentUser();
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

/**
 * Fetches the single active tracker for a question belonging to the current user.
 * Returns null when no tracker exists or the user is unauthenticated.
 * Prefer {@link getTrackersForQuestions} when checking multiple questions at once.
 *
 * @param questionId - UUID of the question whose tracker to look up.
 */
export async function getTrackerForQuestion(questionId: string): Promise<ProgressTracker | null> {
  const user = await getCurrentUser();
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

/**
 * Fetches all active trackers for the current user, joined with their question and week data.
 * Used by ProgressTrackingPage to list everything the user is currently tracking.
 *
 * @returns Array of trackers with embedded question and week objects.
 *          Silently returns [] on auth failure or when no active trackers exist.
 */
export async function fetchUserTrackers(): Promise<TrackerWithQuestion[]> {
  const user = await getCurrentUser();
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

/**
 * Toggles the done/undone state of a check-in for a given tracker and date.
 * Uses upsert on UNIQUE(tracker_id, check_in_date) — no pre-read needed.
 *
 * @param trackerId - UUID of the parent tracker.
 * @param date - ISO date string (YYYY-MM-DD).
 * @param isDone - New done state to persist.
 * @returns true on success, false on DB error.
 */
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

/**
 * Permanently deletes a progress tracker and all its check-ins via DB cascade.
 *
 * @param trackerId - UUID of the tracker to delete.
 * @returns true on success, false on DB error.
 */
export async function deleteProgressTracker(trackerId: string): Promise<boolean> {
  const { error } = await supabase.from('progress_trackers').delete().eq('id', trackerId);

  if (error) {
    console.error('Error deleting tracker:', error);
    return false;
  }

  return true;
}

/**
 * Updates the notes field for a check-in on a given date.
 * Uses upsert on UNIQUE(tracker_id, check_in_date):
 * - INSERT (new row): `is_done` uses the DB DEFAULT (false).
 * - UPDATE (existing row): only `notes` and `updated_at` are changed; `is_done` is preserved.
 *
 * @param trackerId - UUID of the parent tracker.
 * @param date - ISO date string (YYYY-MM-DD).
 * @param notes - The reflection text to save.
 * @returns true on success, false on DB error.
 */
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
