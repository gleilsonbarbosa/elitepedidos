/*
  # Fix RLS policies for financeiro_fluxo table

  1. Security Changes
    - Drop existing restrictive INSERT policy
    - Create new permissive INSERT policy for public users
    - Ensure all CRUD operations work properly

  2. Changes Made
    - Allow public users to insert cash flow entries
    - Maintain existing read/update/delete policies for authenticated users
*/

-- Drop the existing restrictive INSERT policy if it exists
DROP POLICY IF EXISTS "Allow public insert to financeiro_fluxo" ON financeiro_fluxo;

-- Create a new permissive INSERT policy for public users
CREATE POLICY "Enable insert for public users"
  ON financeiro_fluxo
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE financeiro_fluxo ENABLE ROW LEVEL SECURITY;