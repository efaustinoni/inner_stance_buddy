// Created: 2026-02-13
// Last Updated: 2026-04-02 18:06 UTC (use decrypted views for encrypted columns)

import { supabase } from './supabase';

export interface ExerciseQuarter {
  id: string;
  user_id: string;
  label: string;
  created_at: string;
  updated_at: string;
}

export interface ExerciseWeek {
  id: string;
  user_id: string;
  week_number: number;
  title: string;
  topic: string;
  quarter_id?: string | null;
  quarter_label?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExerciseQuestion {
  id: string;
  week_id: string;
  question_label: string;
  question_text: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ExerciseAnswer {
  id: string;
  question_id: string;
  user_id: string;
  answer_text: string;
  created_at: string;
  updated_at: string;
}

export interface QuestionWithAnswer extends ExerciseQuestion {
  answer?: ExerciseAnswer;
}

export interface WeekWithQuestions extends ExerciseWeek {
  questions: QuestionWithAnswer[];
}

export async function fetchUserQuarters(): Promise<ExerciseQuarter[]> {
  const { data, error } = await supabase
    .from('exercise_quarters')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching quarters:', error);
    return [];
  }

  return data || [];
}

export async function createQuarter(label: string): Promise<ExerciseQuarter | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('exercise_quarters')
    .insert({ user_id: user.id, label: label.trim() })
    .select()
    .single();

  if (error) {
    console.error('Error creating quarter:', error);
    return null;
  }

  return data;
}

export async function updateQuarter(quarterId: string, label: string): Promise<boolean> {
  const { error } = await supabase
    .from('exercise_quarters')
    .update({ label: label.trim(), updated_at: new Date().toISOString() })
    .eq('id', quarterId);

  if (error) {
    console.error('Error updating quarter:', error);
    return false;
  }

  return true;
}

export async function deleteQuarter(quarterId: string): Promise<boolean> {
  const { error } = await supabase
    .from('exercise_quarters')
    .delete()
    .eq('id', quarterId);

  if (error) {
    console.error('Error deleting quarter:', error);
    return false;
  }

  return true;
}

export async function fetchUserWeeks(): Promise<ExerciseWeek[]> {
  const { data, error } = await supabase
    .from('exercise_weeks')
    .select('*, exercise_quarters(label)')
    .order('week_number', { ascending: true });

  if (error) {
    console.error('Error fetching weeks:', error);
    return [];
  }

  return (data || []).map((w: any) => ({
    ...w,
    quarter_label: w.exercise_quarters?.label ?? null,
    exercise_quarters: undefined,
  }));
}

export async function fetchWeekWithQuestions(weekId: string): Promise<WeekWithQuestions | null> {
  const { data: week, error: weekError } = await supabase
    .from('exercise_weeks')
    .select('*')
    .eq('id', weekId)
    .maybeSingle();

  if (weekError || !week) {
    console.error('Error fetching week:', weekError);
    return null;
  }

  const { data: questions, error: questionsError } = await supabase
    .from('decrypted_exercise_questions')
    .select('*')
    .eq('week_id', weekId)
    .order('sort_order', { ascending: true });

  if (questionsError) {
    console.error('Error fetching questions:', questionsError);
    return { ...week, questions: [] };
  }

  const questionIds = questions?.map(q => q.id) || [];

  let answers: ExerciseAnswer[] = [];
  if (questionIds.length > 0) {
    const { data: answersData } = await supabase
      .from('decrypted_exercise_answers')
      .select('*')
      .in('question_id', questionIds);
    answers = answersData || [];
  }

  const questionsWithAnswers: QuestionWithAnswer[] = (questions || []).map(q => ({
    ...q,
    answer: answers.find(a => a.question_id === q.id)
  }));

  return {
    ...week,
    questions: questionsWithAnswers
  };
}

export async function createWeek(
  weekNumber: number,
  topic: string,
  quarterId?: string | null
): Promise<ExerciseWeek | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('exercise_weeks')
    .insert({
      user_id: user.id,
      week_number: weekNumber,
      title: 'Exercise',
      topic,
      quarter_id: quarterId ?? null
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating week:', error);
    return null;
  }

  return data;
}

export async function moveWeekToQuarter(weekId: string, quarterId: string | null): Promise<boolean> {
  const { error } = await supabase
    .from('exercise_weeks')
    .update({ quarter_id: quarterId, updated_at: new Date().toISOString() })
    .eq('id', weekId);

  if (error) {
    console.error('Error moving week to quarter:', error);
    return false;
  }

  return true;
}

export async function copyWeekToQuarter(
  weekId: string,
  targetQuarterId: string | null,
  includeAnswers: boolean
): Promise<ExerciseWeek | null> {
  const { data: { user } } = await supabase.auth.getUser();
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
      quarter_id: targetQuarterId
    })
    .select()
    .single();

  if (weekError || !newWeek) {
    console.error('Error copying week:', weekError);
    return null;
  }

  // Read source questions from decrypted view to get plaintext for copy
  const { data: sourceQuestions } = await supabase
    .from('decrypted_exercise_questions')
    .select('*')
    .eq('week_id', weekId)
    .order('sort_order', { ascending: true });

  if (sourceQuestions && sourceQuestions.length > 0) {
    const newQuestions: any[] = [];
    for (const q of sourceQuestions) {
      const { data: newQ, error: qError } = await supabase
        .from('exercise_questions')
        .insert({
          week_id: newWeek.id,
          question_label: q.question_label,
          question_text: q.question_text,
          sort_order: q.sort_order
        })
        .select()
        .single();

      if (!qError && newQ) {
        newQuestions.push({ newId: newQ.id, oldId: q.id });
      }
    }

    if (includeAnswers && newQuestions.length > 0) {
      const oldIds = newQuestions.map(q => q.oldId);
      const { data: sourceAnswers } = await supabase
        .from('decrypted_exercise_answers')
        .select('*')
        .eq('user_id', user.id)
        .in('question_id', oldIds);

      if (sourceAnswers && sourceAnswers.length > 0) {
        for (const a of sourceAnswers) {
          const mapping = newQuestions.find(q => q.oldId === a.question_id);
          if (mapping) {
            await supabase.from('exercise_answers').insert({
              question_id: mapping.newId,
              user_id: user.id,
              answer_text: a.answer_text
            });
          }
        }
      }
    }
  }

  return newWeek;
}

export async function updateWeek(
  weekId: string,
  updates: { title?: string; topic?: string; week_number?: number; quarter_id?: string | null }
): Promise<boolean> {
  const { error } = await supabase
    .from('exercise_weeks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', weekId);

  if (error) {
    console.error('Error updating week:', error);
    return false;
  }

  return true;
}

export async function deleteWeek(weekId: string): Promise<boolean> {
  const { error } = await supabase
    .from('exercise_weeks')
    .delete()
    .eq('id', weekId);

  if (error) {
    console.error('Error deleting week:', error);
    return false;
  }

  return true;
}

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
      sort_order: sortOrder
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding question:', error);
    return null;
  }

  return data;
}

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

export async function deleteQuestion(questionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('exercise_questions')
    .delete()
    .eq('id', questionId);

  if (error) {
    console.error('Error deleting question:', error);
    return false;
  }

  return true;
}

export async function saveAnswer(
  questionId: string,
  answerText: string
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: existing } = await supabase
    .from('exercise_answers')
    .select('id')
    .eq('question_id', questionId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('exercise_answers')
      .update({ answer_text: answerText, updated_at: new Date().toISOString() })
      .eq('id', existing.id);

    if (error) {
      console.error('Error updating answer:', error);
      return false;
    }
  } else {
    const { error } = await supabase
      .from('exercise_answers')
      .insert({
        question_id: questionId,
        user_id: user.id,
        answer_text: answerText
      });

    if (error) {
      console.error('Error creating answer:', error);
      return false;
    }
  }

  return true;
}

export async function bulkImportQuestions(
  weekId: string,
  questions: { label: string; text: string; answer?: string }[],
  replaceExisting: boolean = true
): Promise<boolean> {
  console.log('[BulkImport] Received questions:', JSON.stringify(questions.map(q => ({
    label: q.label,
    text: q.text?.substring(0, 30),
    hasAnswer: !!q.answer,
    answerPreview: q.answer?.substring(0, 30)
  })), null, 2));

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  if (replaceExisting) {
    const { data: existingQuestions } = await supabase
      .from('exercise_questions')
      .select('id')
      .eq('week_id', weekId);

    if (existingQuestions && existingQuestions.length > 0) {
      const questionIds = existingQuestions.map(q => q.id);

      await supabase
        .from('exercise_answers')
        .delete()
        .in('question_id', questionIds);

      await supabase
        .from('progress_check_ins')
        .delete()
        .in('tracker_id', (
          await supabase
            .from('progress_trackers')
            .select('id')
            .in('question_id', questionIds)
        ).data?.map(t => t.id) || []);

      await supabase
        .from('progress_trackers')
        .delete()
        .in('question_id', questionIds);

      await supabase
        .from('exercise_questions')
        .delete()
        .eq('week_id', weekId);

      console.log(`[BulkImport] Deleted ${existingQuestions.length} existing questions for week`);
    }
  }

  // Insert questions one by one to guarantee order and get reliable IDs
  const insertedQuestions: ExerciseQuestion[] = [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const { data: inserted, error: qError } = await supabase
      .from('exercise_questions')
      .insert({
        week_id: weekId,
        question_label: q.label,
        question_text: q.text,
        sort_order: i
      })
      .select()
      .single();

    if (qError || !inserted) {
      console.error(`[BulkImport] Error inserting question ${i + 1}:`, qError);
      return false;
    }
    insertedQuestions.push(inserted);
  }

  console.log(`[BulkImport] Inserted ${insertedQuestions.length} questions`);

  const answersToInsert = questions
    .map((q, index) => {
      if (!q.answer) return null;
      const insertedQuestion = insertedQuestions[index];
      if (!insertedQuestion) return null;
      return {
        question_id: insertedQuestion.id,
        user_id: user.id,
        answer_text: q.answer
      };
    })
    .filter((a): a is { question_id: string; user_id: string; answer_text: string } => a !== null);

  if (answersToInsert.length > 0) {
    const { error: answerError } = await supabase
      .from('exercise_answers')
      .insert(answersToInsert);

    if (answerError) {
      console.error('[BulkImport] Error inserting answers:', answerError);
      return false;
    }
    console.log(`[BulkImport] Inserted ${answersToInsert.length} answers`);
  } else {
    console.log('[BulkImport] No answers to insert');
  }

  return true;
}

export interface ImageExtractedData {
  weekNumber?: number;
  theme?: string;
  questions: { label: string; text: string; answer?: string }[];
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
  const { data: { session } } = await supabase.auth.getSession();
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

  const questions = data.questions.map((q: any) => ({
    label: q.label || 'Vraag',
    text: q.text || '',
    // Answers returned from the Edge Function already use | as line separator;
    // convert them to newlines so they match the app's internal format.
    answer: q.answer
      ? String(q.answer).split('|').map((a: string) => a.trim()).join('\n')
      : undefined,
  }));

  return {
    weekNumber: data.weekNumber ?? undefined,
    theme: data.theme ?? undefined,
    questions,
  };
}

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

export async function createProgressTracker(questionId: string): Promise<ProgressTracker | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('progress_trackers')
    .insert({
      question_id: questionId,
      user_id: user.id,
      started_at: new Date().toISOString().split('T')[0]
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating progress tracker:', error);
    return null;
  }

  return data;
}

export async function getTrackerForQuestion(questionId: string): Promise<ProgressTracker | null> {
  const { data: { user } } = await supabase.auth.getUser();
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
  const { data: { user } } = await supabase.auth.getUser();
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

  const questionIds = trackers.map(t => t.question_id);
  const { data: questions } = await supabase
    .from('decrypted_exercise_questions')
    .select('*')
    .in('id', questionIds);

  const weekIds = [...new Set(questions?.map(q => q.week_id) || [])];
  const { data: weeks } = await supabase
    .from('exercise_weeks')
    .select('*')
    .in('id', weekIds);

  return trackers.map(tracker => {
    const question = questions?.find(q => q.id === tracker.question_id);
    const week = weeks?.find(w => w.id === question?.week_id);
    return {
      ...tracker,
      question: question!,
      week: week!
    };
  }).filter(t => t.question && t.week);
}

export async function fetchTrackerWithCheckIns(trackerId: string): Promise<TrackerWithCheckIns | null> {
  const { data: tracker, error: trackerError } = await supabase
    .from('progress_trackers')
    .select('*')
    .eq('id', trackerId)
    .maybeSingle();

  if (trackerError || !tracker) {
    console.error('Error fetching tracker:', trackerError);
    return null;
  }

  const { data: question } = await supabase
    .from('decrypted_exercise_questions')
    .select('*')
    .eq('id', tracker.question_id)
    .maybeSingle();

  const { data: week } = await supabase
    .from('exercise_weeks')
    .select('*')
    .eq('id', question?.week_id)
    .maybeSingle();

  const { data: checkIns } = await supabase
    .from('decrypted_progress_check_ins')
    .select('*')
    .eq('tracker_id', trackerId)
    .order('check_in_date', { ascending: true });

  const { data: answer } = await supabase
    .from('decrypted_exercise_answers')
    .select('*')
    .eq('question_id', tracker.question_id)
    .eq('user_id', tracker.user_id)
    .maybeSingle();

  return {
    ...tracker,
    question: question!,
    week: week!,
    check_ins: checkIns || [],
    answer: answer || undefined
  };
}

export async function toggleCheckIn(trackerId: string, date: string, isDone: boolean): Promise<boolean> {
  const { data: existing } = await supabase
    .from('progress_check_ins')
    .select('id')
    .eq('tracker_id', trackerId)
    .eq('check_in_date', date)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('progress_check_ins')
      .update({ is_done: isDone, updated_at: new Date().toISOString() })
      .eq('id', existing.id);

    if (error) {
      console.error('Error updating check-in:', error);
      return false;
    }
  } else {
    const { error } = await supabase
      .from('progress_check_ins')
      .insert({
        tracker_id: trackerId,
        check_in_date: date,
        is_done: isDone
      });

    if (error) {
      console.error('Error creating check-in:', error);
      return false;
    }
  }

  return true;
}

export async function deleteProgressTracker(trackerId: string): Promise<boolean> {
  const { error } = await supabase
    .from('progress_trackers')
    .delete()
    .eq('id', trackerId);

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
  const { data: existing } = await supabase
    .from('progress_check_ins')
    .select('id')
    .eq('tracker_id', trackerId)
    .eq('check_in_date', date)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('progress_check_ins')
      .update({ notes, updated_at: new Date().toISOString() })
      .eq('id', existing.id);

    if (error) {
      console.error('Error updating notes:', error);
      return false;
    }
  } else {
    const { error } = await supabase
      .from('progress_check_ins')
      .insert({
        tracker_id: trackerId,
        check_in_date: date,
        is_done: false,
        notes
      });

    if (error) {
      console.error('Error creating check-in with notes:', error);
      return false;
    }
  }

  return true;
}

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { weeks: [], questions: [] };

  const { data: weeksRaw } = await supabase
    .from('exercise_weeks')
    .select('*, exercise_quarters(label)')
    .order('week_number', { ascending: true });

  if (!weeksRaw?.length) return { weeks: [], questions: [] };

  const weeks: ExerciseWeek[] = weeksRaw.map((w: any) => ({
    ...w,
    quarter_label: w.exercise_quarters?.label ?? null,
    exercise_quarters: undefined,
  }));

  if (!weeks?.length) return { weeks: [], questions: [] };

  const weekIds = weeks.map(w => w.id);
  const { data: questions } = await supabase
    .from('decrypted_exercise_questions')
    .select('*')
    .in('week_id', weekIds)
    .order('sort_order', { ascending: true });

  if (!questions?.length) return { weeks, questions: [] };

  const questionIds = questions.map(q => q.id);

  const { data: answers } = await supabase
    .from('decrypted_exercise_answers')
    .select('*')
    .eq('user_id', user.id)
    .in('question_id', questionIds);

  const { data: trackers } = await supabase
    .from('progress_trackers')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .in('question_id', questionIds);

  const weekMap = new Map(weeks.map(w => [w.id, w]));
  const answerMap = new Map(answers?.map(a => [a.question_id, a]) || []);
  const trackerMap = new Map(trackers?.map(t => [t.question_id, t]) || []);

  const dashboardQuestions: DashboardQuestion[] = questions.map(q => {
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
      tracker_started_at: tracker?.started_at
    };
  });

  return { weeks, questions: dashboardQuestions };
}
