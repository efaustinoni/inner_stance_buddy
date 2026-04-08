// Created: 2026-04-08
// Domain: Weeks

import { supabase } from '../supabase';
import { dataCache, CACHE_KEY } from '../dataCache';
import { getCurrentUser } from '../getCurrentUser';
import type { ExerciseQuestion } from './questionService';
import type { ExerciseAnswer } from './answerService';

// The exercise_weeks.title column is reserved for future use and always stores
// this fixed value. The DB has DEFAULT 'Exercise' — do not pass it in updates.
const WEEK_TITLE = 'Exercise' as const;

export interface ExerciseWeek {
  id: string;
  user_id: string;
  week_number: number;
  title?: string; // always 'Exercise'; optional because the app never reads it
  topic: string;
  quarter_id?: string | null;
  quarter_label?: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuestionWithAnswer extends ExerciseQuestion {
  answer?: ExerciseAnswer;
}

export interface WeekWithQuestions extends ExerciseWeek {
  questions: QuestionWithAnswer[];
}

export async function fetchUserWeeks(): Promise<ExerciseWeek[]> {
  const cached = dataCache.get<ExerciseWeek[]>(CACHE_KEY.WEEKS);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('exercise_weeks')
    .select('*, exercise_quarters(label)')
    .order('week_number', { ascending: true });

  if (error) {
    console.error('Error fetching weeks:', error);
    throw error;
  }

  type WeekWithJoin = ExerciseWeek & { exercise_quarters?: { label: string } | null };
  const result = (data || []).map((w: WeekWithJoin) => ({
    ...w,
    quarter_label: w.exercise_quarters?.label ?? null,
    exercise_quarters: undefined,
  }));
  dataCache.set(CACHE_KEY.WEEKS, result);
  return result;
}

export async function fetchWeekWithQuestions(weekId: string): Promise<WeekWithQuestions | null> {
  // Fetch week and questions in parallel — both only need weekId
  const [weekResult, questionsResult] = await Promise.all([
    supabase.from('exercise_weeks').select('*').eq('id', weekId).maybeSingle(),
    supabase
      .from('decrypted_exercise_questions')
      .select('*')
      .eq('week_id', weekId)
      .order('sort_order', { ascending: true }),
  ]);

  if (weekResult.error || !weekResult.data) {
    console.error('Error fetching week:', weekResult.error);
    return null;
  }

  const week = weekResult.data;

  if (questionsResult.error) {
    console.error('Error fetching questions:', questionsResult.error);
    return { ...week, questions: [] };
  }

  const questions = questionsResult.data || [];
  const questionIds = questions.map((q) => q.id);

  // Answers depend on question IDs — must follow the parallel fetch
  let answers: ExerciseAnswer[] = [];
  if (questionIds.length > 0) {
    const { data: answersData } = await supabase
      .from('decrypted_exercise_answers')
      .select('*')
      .in('question_id', questionIds);
    answers = answersData || [];
  }

  const questionsWithAnswers: QuestionWithAnswer[] = questions.map((q) => ({
    ...q,
    answer: answers.find((a) => a.question_id === q.id),
  }));

  return { ...week, questions: questionsWithAnswers };
}

export async function createWeek(
  weekNumber: number,
  topic: string,
  quarterId?: string | null
): Promise<ExerciseWeek | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('exercise_weeks')
    .insert({
      user_id: user.id,
      week_number: weekNumber,
      title: WEEK_TITLE,
      topic,
      quarter_id: quarterId ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating week:', error);
    return null;
  }

  dataCache.invalidate(CACHE_KEY.WEEKS, CACHE_KEY.DASHBOARD);
  return data;
}

export async function moveWeekToQuarter(
  weekId: string,
  quarterId: string | null
): Promise<boolean> {
  const { error } = await supabase
    .from('exercise_weeks')
    .update({ quarter_id: quarterId, updated_at: new Date().toISOString() })
    .eq('id', weekId);

  if (error) {
    console.error('Error moving week to quarter:', error);
    return false;
  }

  dataCache.invalidate(CACHE_KEY.WEEKS, CACHE_KEY.DASHBOARD);
  return true;
}

export async function updateWeek(
  weekId: string,
  updates: { topic?: string; week_number?: number; quarter_id?: string | null }
): Promise<boolean> {
  const { error } = await supabase
    .from('exercise_weeks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', weekId);

  if (error) {
    console.error('Error updating week:', error);
    return false;
  }

  dataCache.invalidate(CACHE_KEY.WEEKS, CACHE_KEY.DASHBOARD);
  return true;
}

export async function deleteWeek(weekId: string): Promise<boolean> {
  const { error } = await supabase.from('exercise_weeks').delete().eq('id', weekId);

  if (error) {
    console.error('Error deleting week:', error);
    return false;
  }

  dataCache.invalidate(CACHE_KEY.WEEKS, CACHE_KEY.DASHBOARD);
  return true;
}
