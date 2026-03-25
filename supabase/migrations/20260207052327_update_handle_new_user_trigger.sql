/*
  # Update handle_new_user trigger to process security and terms data

  1. Changes
    - Updates handle_new_user() function to extract security_question and 
      security_answer_hash from user metadata
    - Adds logic to create user_terms_agreements record from metadata
    - This fixes the RLS issue where post-signup database operations fail
      because the user isn't authenticated until email is confirmed

  2. Security
    - Trigger runs with SECURITY DEFINER, bypassing RLS
    - Security answer hash is already computed client-side using SHA-256
    - All data passed through Supabase's secure auth metadata
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create user profile with all data from metadata
  INSERT INTO public.user_profiles (
    id, 
    email, 
    display_name, 
    timezone,
    security_question,
    security_answer_hash
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'timezone', 'UTC'),
    new.raw_user_meta_data->>'security_question',
    new.raw_user_meta_data->>'security_answer_hash'
  );

  -- Create terms agreement record if terms data is provided
  IF new.raw_user_meta_data->>'terms_version' IS NOT NULL THEN
    INSERT INTO public.user_terms_agreements (
      user_id,
      terms_version,
      privacy_version,
      terms_version_string,
      privacy_version_string,
      agreed_at,
      user_agent
    )
    VALUES (
      new.id,
      (new.raw_user_meta_data->>'terms_version')::date,
      (new.raw_user_meta_data->>'privacy_version')::date,
      new.raw_user_meta_data->>'terms_version_string',
      new.raw_user_meta_data->>'privacy_version_string',
      now(),
      new.raw_user_meta_data->>'user_agent'
    );
  END IF;

  RETURN new;
END;
$function$;
