// Created: 2026-04-08
// Domain: Quarters

import { supabase } from '../supabase';

export interface ExerciseQuarter {
  id: string;
  user_id: string;
  label: string;
  created_at: string;
  updated_at: string;
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  const { error } = await supabase.from('exercise_quarters').delete().eq('id', quarterId);

  if (error) {
    console.error('Error deleting quarter:', error);
    return false;
  }

  return true;
}
