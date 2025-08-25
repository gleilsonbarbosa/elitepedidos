/*
  # Add two more tables for store usage

  1. New Tables
    - Adding 2 more tables to store1_tables
    - Tables will be numbered sequentially
    - Both tables will be free and active by default

  2. Changes
    - Insert new table records with proper configuration
    - Set default capacity and status
*/

-- Add two more tables to store1_tables
INSERT INTO store1_tables (number, name, capacity, status, location, is_active) VALUES
  ((SELECT COALESCE(MAX(number), 0) + 1 FROM store1_tables), 'Mesa ' || (SELECT COALESCE(MAX(number), 0) + 1 FROM store1_tables), 4, 'livre', 'Área principal', true),
  ((SELECT COALESCE(MAX(number), 0) + 2 FROM store1_tables), 'Mesa ' || (SELECT COALESCE(MAX(number), 0) + 2 FROM store1_tables), 4, 'livre', 'Área principal', true);

-- Add two more tables to store2_tables as well
INSERT INTO store2_tables (number, name, capacity, status, location, is_active) VALUES
  ((SELECT COALESCE(MAX(number), 0) + 1 FROM store2_tables), 'Mesa ' || (SELECT COALESCE(MAX(number), 0) + 1 FROM store2_tables), 4, 'livre', 'Área principal', true),
  ((SELECT COALESCE(MAX(number), 0) + 2 FROM store2_tables), 'Mesa ' || (SELECT COALESCE(MAX(number), 0) + 2 FROM store2_tables), 4, 'livre', 'Área principal', true);