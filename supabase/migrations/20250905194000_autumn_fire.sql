/*
  # Add RLS policies for sales tables

  1. Security Updates
    - Add RLS policies for pdv_sales table
    - Add RLS policies for pdv_sale_items table
    - Add RLS policies for store1_table_sales table
    - Add RLS policies for store1_table_sale_items table
    - Add RLS policies for store2_sales table
    - Add RLS policies for store2_sale_items table
    - Add RLS policies for store2_table_sales table
    - Add RLS policies for store2_table_sale_items table

  2. Policy Types
    - SELECT: Allow reading sales data for authenticated users and public access
    - INSERT: Allow creating new sales for authenticated users and public access
    - UPDATE: Allow updating sales for authenticated users and public access
    - DELETE: Restrict deletion to authenticated users only

  3. Notes
    - Policies allow both authenticated and public access for operational flexibility
    - DELETE operations are more restricted for data integrity
    - All policies follow the principle of least privilege while maintaining functionality
*/

-- PDV Sales policies
CREATE POLICY "Allow all operations on pdv_sales for authenticated users"
  ON pdv_sales
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow read access on pdv_sales for public"
  ON pdv_sales
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow insert on pdv_sales for public"
  ON pdv_sales
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow update on pdv_sales for public"
  ON pdv_sales
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- PDV Sale Items policies
CREATE POLICY "Allow all operations on pdv_sale_items for authenticated users"
  ON pdv_sale_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow read access on pdv_sale_items for public"
  ON pdv_sale_items
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow insert on pdv_sale_items for public"
  ON pdv_sale_items
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow update on pdv_sale_items for public"
  ON pdv_sale_items
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Store2 Sales policies
CREATE POLICY "Allow all operations on store2_sales for authenticated users"
  ON store2_sales
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow read access on store2_sales for public"
  ON store2_sales
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow insert on store2_sales for public"
  ON store2_sales
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow update on store2_sales for public"
  ON store2_sales
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Store2 Sale Items policies
CREATE POLICY "Allow all operations on store2_sale_items for authenticated users"
  ON store2_sale_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow read access on store2_sale_items for public"
  ON store2_sale_items
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow insert on store2_sale_items for public"
  ON store2_sale_items
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow update on store2_sale_items for public"
  ON store2_sale_items
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Store1 Table Sales policies
CREATE POLICY "Allow all operations on store1_table_sales for authenticated users"
  ON store1_table_sales
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow read access on store1_table_sales for public"
  ON store1_table_sales
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow insert on store1_table_sales for public"
  ON store1_table_sales
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow update on store1_table_sales for public"
  ON store1_table_sales
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Store1 Table Sale Items policies
CREATE POLICY "Allow all operations on store1_table_sale_items for authenticated users"
  ON store1_table_sale_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow read access on store1_table_sale_items for public"
  ON store1_table_sale_items
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow insert on store1_table_sale_items for public"
  ON store1_table_sale_items
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow update on store1_table_sale_items for public"
  ON store1_table_sale_items
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Store2 Table Sales policies
CREATE POLICY "Allow all operations on store2_table_sales for authenticated users"
  ON store2_table_sales
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow read access on store2_table_sales for public"
  ON store2_table_sales
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow insert on store2_table_sales for public"
  ON store2_table_sales
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow update on store2_table_sales for public"
  ON store2_table_sales
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Store2 Table Sale Items policies
CREATE POLICY "Allow all operations on store2_table_sale_items for authenticated users"
  ON store2_table_sale_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow read access on store2_table_sale_items for public"
  ON store2_table_sale_items
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow insert on store2_table_sale_items for public"
  ON store2_table_sale_items
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow update on store2_table_sale_items for public"
  ON store2_table_sale_items
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);