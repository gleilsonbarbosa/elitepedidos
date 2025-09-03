/*
  # Fix attendance_users RLS policy for default user creation

  1. Security Changes
    - Update RLS policy to allow anonymous users to insert when table is empty
    - Ensure authenticated users can still manage users normally
    - Maintain security while allowing initial setup

  2. Changes Made
    - Drop existing conflicting policies
    - Create new policy that allows insert when table is empty for both anon and authenticated users
    - Keep existing policies for other operations
*/

-- Drop the conflicting policy that might be preventing inserts
DROP POLICY IF EXISTS "Allow initial user setup when table empty" ON attendance_users;
DROP POLICY IF EXISTS "Enable INSERT access for user creation" ON attendance_users;

-- Create a comprehensive policy that allows inserts when table is empty
CREATE POLICY "Allow user creation when table empty or authenticated"
  ON attendance_users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Allow if table is empty (for initial setup)
    (SELECT count(*) FROM attendance_users) = 0
    OR
    -- Allow if user is authenticated (for normal operations)
    auth.uid() IS NOT NULL
  );