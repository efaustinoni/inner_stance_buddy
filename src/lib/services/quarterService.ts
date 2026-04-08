// Created: 2026-04-08
// Domain: Quarters

import { supabase } from '../supabase';
import { dataCache, CACHE_KEY } from '../dataCache';
import { getCurrentUser } from '../getCurrentUser';

export interface ExerciseQuarter {
  id: string;
  user_id: string;
  label: string;
  created_at: string;
  updated_at: string;
}

export async function fetchUserQuarters(): Promise<ExerciseQuarter[]> {
  const cached = dataCache.get<ExerciseQuarter[]>(CACHE_KEY.QUARTERS);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('exercise_quarters')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching quarters:', error);
    throw error;
  }

  const result = data || [];
  dataCache.set(CACHE_KEY.QUARTERS, result);
  return result;
}

export async function createQuarter(label: string): Promise<ExerciseQuarter | null> {
  const user = await getCurrentUser();
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

  dataCache.invalidate(CACHE_KEY.QUARTERS, CACHE_KEY.DASHBOARD);
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

  // Dashboard shows quarter labels on questions — invalidate both
  dataCache.invalidate(CACHE_KEY.QUARTERS, CACHE_KEY.DASHBOARD);
  return true;
}

export async function deleteQuarter(quarterId: string): Promise<boolean> {
  const { error } = await supabase.from('exercise_quarters').delete().eq('id', quarterId);

  if (error) {
    console.error('Error deleting quarter:', error);
    return false;
  }

  dataCache.invalidate(CACHE_KEY.QUARTERS, CACHE_KEY.DASHBOARD);
  return true;
}
