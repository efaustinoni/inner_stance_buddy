// Created: 2026-04-08
// Orchestrator: Dashboard
// Combines: weeks (quarter join) + questions + answers + trackers into one dashboard payload.

import { supabase } from '../../supabase';
import { dataCache, CACHE_KEY } from '../../dataCache';
import { getCurrentUser } from '../../getCurrentUser';
import type { ExerciseWeek } from '../weekService';

export interface DashboardQuestion {
  id: string;
  question_label: string;
  question_text: string;
  week_id: string;
  week_number: number;
  week_topic: string;
  quarter_id?: string | null;
  quarter_label?: string | null;
  answer_text?: string;
  tracker_id?: string;
  tracker_started_at?: string;
}

export async function fetchDashboardData(): Promise<{
  weeks: ExerciseWeek[];
  questions: DashboardQuestion[];
}> {
  const cached = dataCache.get<{ weeks: ExerciseWeek[]; questions: DashboardQuestion[] }>(
    CACHE_KEY.DASHBOARD
  );
  if (cached) return cached;

  const user = await getCurrentUser();
  if (!user) return { weeks: [], questions: [] };

  const { data: weeksRaw } = await supabase
    .from('exercise_weeks')
    .select('*, exercise_quarters(label)')
    .order('week_number', { ascending: true });

  if (!weeksRaw?.length) return { weeks: [], questions: [] };

  type WeekRowWithJoin = ExerciseWeek & { exercise_quarters?: { label: string } | null };
  const weeks: ExerciseWeek[] = weeksRaw.map((w: WeekRowWithJoin) => ({
    ...w,
    quarter_label: w.exercise_quarters?.label ?? null,
    exercise_quarters: undefined,
  }));

  if (!weeks?.length) return { weeks: [], questions: [] };

  const weekIds = weeks.map((w) => w.id);
  const { data: questions } = await supabase
    .from('decrypted_exercise_questions')
    .select('*')
    .in('week_id', weekIds)
    .order('sort_order', { ascending: true });

  if (!questions?.length) return { weeks, questions: [] };

  const questionIds = questions.map((q) => q.id);

  const [answersResult, trackersResult] = await Promise.all([
    supabase
      .from('decrypted_exercise_answers')
      .select('*')
      .eq('user_id', user.id)
      .in('question_id', questionIds),
    supabase
      .from('progress_trackers')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .in('question_id', questionIds),
  ]);

  const weekMap = new Map(weeks.map((w) => [w.id, w]));
  const answerMap = new Map(answersResult.data?.map((a) => [a.question_id, a]) || []);
  const trackerMap = new Map(trackersResult.data?.map((t) => [t.question_id, t]) || []);

  const dashboardQuestions: DashboardQuestion[] = questions.map((q) => {
    const week = weekMap.get(q.week_id);
    const answer = answerMap.get(q.id);
    const tracker = trackerMap.get(q.id);

    return {
      id: q.id,
      question_label: q.question_label,
      question_text: q.question_text,
      week_id: q.week_id,
      week_number: week?.week_number || 0,
      week_topic: week?.topic || '',
      quarter_id: week?.quarter_id ?? null,
      quarter_label: week?.quarter_label ?? null,
      answer_text: answer?.answer_text,
      tracker_id: tracker?.id,
      tracker_started_at: tracker?.started_at,
    };
  });

  const result = { weeks, questions: dashboardQuestions };
  dataCache.set(CACHE_KEY.DASHBOARD, result);
  return result;
}
