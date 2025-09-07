@@ .. @@
 -- Security policies
 CREATE POLICY "Allow authenticated users to manage promotions"
   ON promotions
   FOR ALL
-  TO authenticated
+  TO public
   USING (true)
   WITH CHECK (true);
 
 CREATE POLICY "Allow read access for all users"
   ON promotions
   FOR SELECT
   TO public
   USING (true);
+
+-- Additional policies for public access to manage promotions
+CREATE POLICY "Allow public insert on promotions"
+  ON promotions
+  FOR INSERT
+  TO public
+  WITH CHECK (true);
+
+CREATE POLICY "Allow public update on promotions"
+  ON promotions
+  FOR UPDATE
+  TO public
+  USING (true)
+  WITH CHECK (true);
+
+CREATE POLICY "Allow public delete on promotions"
+  ON promotions
+  FOR DELETE
+  TO public
+  USING (true);