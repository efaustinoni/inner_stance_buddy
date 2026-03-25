/*
  # Add Secure RLS Policies for user_feeds Table

  1. Security Changes
    - Drop existing permissive RLS policies that allowed anyone to access feeds
    - Add restrictive policies that require authentication and ownership verification
    - Users can only access their own calendar feeds (matched by email address)
  
  2. New RLS Policies
    - SELECT: Authenticated users can only view their own feeds
    - INSERT: Authenticated users can only create feeds for their own email
    - UPDATE: Authenticated users can only update their own feeds
    - DELETE: Authenticated users can only delete their own feeds
  
  3. Important Notes
    - All policies require authentication (TO authenticated)
    - All policies verify ownership by comparing user_email with auth email
    - The calendar-feed endpoint remains public (requires token for access)
    - This prevents any user from accessing another user's feed information
*/

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can view feeds by token" ON user_feeds;
DROP POLICY IF EXISTS "Anyone can create feeds" ON user_feeds;
DROP POLICY IF EXISTS "Anyone can update feed access time" ON user_feeds;
DROP POLICY IF EXISTS "Anyone can delete their feeds" ON user_feeds;

-- Create secure policies that require authentication and ownership

CREATE POLICY "Authenticated users can view own feed"
  ON user_feeds FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Authenticated users can create own feed"
  ON user_feeds FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Authenticated users can update own feed"
  ON user_feeds FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = user_email)
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY "Authenticated users can delete own feed"
  ON user_feeds FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' = user_email);