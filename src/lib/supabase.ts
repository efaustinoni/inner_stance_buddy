// Created: 2025-12-21
// Last updated: 2025-12-22 (added cancellation tracking fields)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Poll = {
  id: string;
  title: string;
  description: string;
  creator_name: string;
  creator_email: string;
  timezone: string;
  duration_minutes: number;
  location_type: string;
  location_details: string;
  status: 'open' | 'finalized' | 'cancelled';
  final_slot_id: string | null;
  cancellation_reason: 'user' | 'auto_expired' | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PollTimeSlot = {
  id: string;
  poll_id: string;
  proposed_datetime: string;
  status: 'pending' | 'final' | 'cancelled';
  sequence: number;
  created_at: string;
};

export type PollResponse = {
  id: string;
  poll_id: string;
  participant_name: string;
  participant_email: string;
  created_at: string;
};

export type PollResponseSlot = {
  id: string;
  response_id: string;
  time_slot_id: string;
  is_available: boolean;
  created_at: string;
};
