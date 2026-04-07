/*
  # Update handle_new_user trigger to store security_answer_salt

  1. Changes
    - Extends handle_new_user() to extract `security_answer_salt` from user
      metadata and store it in user_profiles alongside the hash
    - New signups pass both security_answer_hash and security_answer_salt
      through Supabase auth metadata (set client-side in AuthPage.tsx)

  2. Backward compatibility
    - If metadata does not contain security_answer_salt (e.g. old clients),
      the column is left as NULL and legacy hash verification still works
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
    security_answer_hash,
    security_answer_salt
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'timezone', 'UTC'),
    new.raw_user_meta_data->>'security_question',
    new.raw_user_meta_data->>'security_answer_hash',
    new.raw_user_meta_data->>'security_answer_salt'
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
