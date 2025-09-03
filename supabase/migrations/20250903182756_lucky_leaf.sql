/*
  # Fix attendance_users RLS policy

  1. Security Changes
    - Drop existing conflicting policies
    - Create new policy that allows anonymous users to insert when table is empty
    - Maintain security for authenticated users

  This fixes the RLS violation error when creating default users.
*/

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Allow user creation when table empty or authenticated" ON attendance_users;
DROP POLICY IF EXISTS "Allow authenticated user management" ON attendance_users;

-- Create a new policy that allows anonymous inserts only when table is empty
CREATE POLICY "Allow initial user creation when table empty"
  ON attendance_users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Allow if table is empty (for initial setup) OR user is authenticated
    (SELECT count(*) FROM attendance_users) = 0 OR auth.uid() IS NOT NULL
  );

-- Keep existing policies for other operations
CREATE POLICY "Authenticated users can read attendance users" 
  ON attendance_users 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can update attendance users" 
  ON attendance_users 
  FOR UPDATE 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete attendance users" 
  ON attendance_users 
  FOR DELETE 
  TO authenticated 
  USING (true);