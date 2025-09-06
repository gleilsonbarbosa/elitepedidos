/*
  # Disable RLS for promotions table

  1. Security Changes
    - Disable Row Level Security on promotions table
    - Remove all existing policies
    - Allow full public access for admin operations

  This allows the admin panel to create, read, update, and delete promotions
  without authentication restrictions.
*/

-- Drop all existing policies first
DROP POLICY IF EXISTS "Allow authenticated users to manage promotions" ON promotions;
DROP POLICY IF EXISTS "Allow read access for all users" ON promotions;
DROP POLICY IF EXISTS "Allow public insert on promotions" ON promotions;
DROP POLICY IF EXISTS "Allow public update on promotions" ON promotions;
DROP POLICY IF EXISTS "Allow public delete on promotions" ON promotions;

-- Disable Row Level Security completely
ALTER TABLE promotions DISABLE ROW LEVEL SECURITY;