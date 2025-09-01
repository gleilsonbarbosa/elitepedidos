/*
  # Create admin user and fix RLS policies for financeiro_fluxo

  1. Security Updates
    - Update RLS policies for financeiro_fluxo table to allow authenticated users
    - Ensure proper INSERT permissions for authenticated role
    
  2. Notes
    - Admin user needs to be created manually in Supabase Auth dashboard
    - Use email: admin@eliteacai.com with password: elite2024
    - This migration only fixes the RLS policies
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow insert for all users including anonymous" ON financeiro_fluxo;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON financeiro_fluxo;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON financeiro_fluxo;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON financeiro_fluxo;

-- Create new policies that allow authenticated users full access
CREATE POLICY "Allow authenticated users full access to financeiro_fluxo"
  ON financeiro_fluxo
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Also allow anonymous read access for demonstration purposes
CREATE POLICY "Allow anonymous read access to financeiro_fluxo"
  ON financeiro_fluxo
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous insert for backward compatibility (can be removed later)
CREATE POLICY "Allow anonymous insert to financeiro_fluxo"
  ON financeiro_fluxo
  FOR INSERT
  TO anon
  WITH CHECK (true);