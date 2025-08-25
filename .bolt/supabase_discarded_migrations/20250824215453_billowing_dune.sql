@@ .. @@
 /*
   # Add two more tables for both stores
 
   1. New Tables
     - Add 2 new tables to store1_tables
     - Add 2 new tables to store2_tables
     - All tables start as 'livre' (free)
     - Default capacity of 4 people
 
   2. Configuration
     - Tables are active by default
     - Located in main area
     - Ready for immediate use
 */
 
 -- Add tables to Store 1
 INSERT INTO store1_tables (number, name, capacity, status, location, is_active) VALUES
-  ((SELECT COALESCE(MAX(number), 0) + 1 FROM store1_tables), 'Mesa ' || (SELECT COALESCE(MAX(number), 0) + 1 FROM store1_tables), 4, 'livre', 'Área principal', true),
-  ((SELECT COALESCE(MAX(number), 0) + 2 FROM store1_tables), 'Mesa ' || (SELECT COALESCE(MAX(number), 0) + 2 FROM store1_tables), 4, 'livre', 'Área principal', true);
+  (2, 'Mesa 2', 4, 'livre', 'Área principal', true),
+  (3, 'Mesa 3', 4, 'livre', 'Área principal', true);
 
 -- Add tables to Store 2
 INSERT INTO store2_tables (number, name, capacity, status, location, is_active) VALUES
-  ((SELECT COALESCE(MAX(number), 0) + 1 FROM store2_tables), 'Mesa ' || (SELECT COALESCE(MAX(number), 0) + 1 FROM store2_tables), 4, 'livre', 'Área principal', true),
-  ((SELECT COALESCE(MAX(number), 0) + 2 FROM store2_tables), 'Mesa ' || (SELECT COALESCE(MAX(number), 0) + 2 FROM store2_tables), 4, 'livre', 'Área principal', true);
+  (2, 'Mesa 2', 4, 'livre', 'Área principal', true),
+  (3, 'Mesa 3', 4, 'livre', 'Área principal', true);