/*
  # Fix RLS policies for attendance_users table

  1. Security Updates
    - Drop existing conflicting policies
    - Create new comprehensive policies for attendance_users table
    - Allow anonymous users to insert when table is empty (for initial setup)
    - Allow authenticated users full access
    - Allow public read access for login functionality

  2. Changes
    - Remove restrictive policies that prevent initial user creation
    - Add policy for empty table initialization
    - Add policy for authenticated user management
    - Add policy for public login access
*/

-- Drop existing policies that might be causing conflicts
DROP POLICY IF EXISTS "Allow authenticated user management" ON attendance_users;
DROP POLICY IF EXISTS "Allow user creation when table empty or authenticated" ON attendance_users;
DROP POLICY IF EXISTS "Authenticated users can delete attendance users" ON attendance_users;
DROP POLICY IF EXISTS "Authenticated users can read attendance users" ON attendance_users;
DROP POLICY IF EXISTS "Authenticated users can update attendance users" ON attendance_users;

-- Create comprehensive policies for attendance_users
CREATE POLICY "attendance_users_select_public"
  ON attendance_users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "attendance_users_insert_when_empty_or_authenticated"
  ON attendance_users
  FOR INSERT
  TO public
  WITH CHECK (
    -- Allow insert if table is empty (for initial setup) OR user is authenticated
    (SELECT count(*) FROM attendance_users) = 0 OR auth.uid() IS NOT NULL
  );

CREATE POLICY "attendance_users_update_authenticated"
  ON attendance_users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "attendance_users_delete_authenticated"
  ON attendance_users
  FOR DELETE
  TO authenticated
  USING (true);