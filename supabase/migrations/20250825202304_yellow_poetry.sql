-- Atualizar mesa 1 para livre
UPDATE store1_tables 
SET 
  status = 'livre',
  current_sale_id = NULL,
  updated_at = NOW()
WHERE number = 1;

-- Atualizar mesa 15 para livre  
UPDATE store1_tables 
SET 
  status = 'livre',
  current_sale_id = NULL,
  updated_at = NOW()
WHERE number = 15;

-- Verificar se as mesas foram atualizadas
SELECT number, name, status, current_sale_id 
FROM store1_tables 
WHERE number IN (1, 15);