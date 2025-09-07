/*
  # Create search orders function

  1. New Function
    - `search_orders_by_short_id(p_short_id TEXT)`
      - Searches orders by converting UUID to text and using LIKE operator
      - Returns matching order IDs
  
  2. Security
    - Function is accessible to public for order lookup functionality
*/

CREATE OR REPLACE FUNCTION search_orders_by_short_id(p_short_id TEXT)
RETURNS TABLE(id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY 
  SELECT o.id 
  FROM orders o 
  WHERE o.id::text LIKE '%' || p_short_id || '%'
  LIMIT 10;
END;
$$;

-- Grant execute permission to public for order lookup
GRANT EXECUTE ON FUNCTION search_orders_by_short_id(TEXT) TO public;