/*
  # Fix RLS policy for financeiro_fluxo table

  1. Security Changes
    - Update INSERT policy to allow anonymous users to add cash flow entries
    - Ensure proper permissions for cash flow management

  This migration fixes the RLS policy that was preventing users from adding new cash flow entries.
*/

-- Drop the existing restrictive INSERT policy if it exists
DROP POLICY IF EXISTS "Enable insert for public users" ON financeiro_fluxo;

-- Create a new INSERT policy that allows anonymous users to add entries
CREATE POLICY "Allow insert for all users including anonymous"
  ON financeiro_fluxo
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Ensure the existing SELECT policy allows reading for authenticated users
DROP POLICY IF EXISTS "Permitir leitura para usuários autenticados" ON financeiro_fluxo;

CREATE POLICY "Allow read access for authenticated users"
  ON financeiro_fluxo
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure UPDATE and DELETE policies exist for authenticated users
DROP POLICY IF EXISTS "Permitir atualização para usuários autenticados" ON financeiro_fluxo;
DROP POLICY IF EXISTS "Permitir exclusão para usuários autenticados" ON financeiro_fluxo;

CREATE POLICY "Allow update for authenticated users"
  ON financeiro_fluxo
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated users"
  ON financeiro_fluxo
  FOR DELETE
  TO authenticated
  USING (true);