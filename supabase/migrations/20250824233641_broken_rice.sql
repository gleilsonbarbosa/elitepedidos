/*
  # Fix RLS policy for financeiro_fluxo table

  1. Security Changes
    - Drop existing INSERT policy that may be too restrictive
    - Create new INSERT policy allowing public access
    - Maintain existing SELECT, UPDATE, DELETE policies for authenticated users
  
  2. Changes Made
    - Allow public users to insert cash flow entries
    - Keep other operations restricted to authenticated users for security
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Permitir inserção para usuários autenticados" ON financeiro_fluxo;

-- Create new INSERT policy for public access
CREATE POLICY "Allow public insert to financeiro_fluxo"
  ON financeiro_fluxo
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE financeiro_fluxo ENABLE ROW LEVEL SECURITY;