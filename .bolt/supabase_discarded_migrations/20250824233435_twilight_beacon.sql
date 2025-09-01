/*
  # Fix RLS policy for financeiro_fluxo table

  1. Security Changes
    - Update RLS policies for `financeiro_fluxo` table to allow public insert operations
    - Maintain existing authenticated user policies
    - Add policy for anonymous users to insert cash flow entries

  2. Changes Made
    - Add INSERT policy for public role to allow cash flow entry creation
    - Keep existing authenticated policies intact
*/

-- Add INSERT policy for public role to allow cash flow entries
CREATE POLICY IF NOT EXISTS "Allow public insert to financeiro_fluxo"
  ON financeiro_fluxo
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Ensure the table has RLS enabled (should already be enabled)
ALTER TABLE financeiro_fluxo ENABLE ROW LEVEL SECURITY;