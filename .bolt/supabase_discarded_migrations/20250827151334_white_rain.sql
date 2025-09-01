-- PERSONALIZAÇÕES PARA A NOVA LOJA
-- Execute após o script principal

-- Atualizar informações da loja
UPDATE store_settings SET
  store_name = 'Elite Açaí - [NOME DA NOVA LOJA]',
  phone = '([DDD]) 99999-9999',
  address = '[ENDEREÇO COMPLETO DA NOVA LOJA]',
  cnpj = '[CNPJ DA NOVA LOJA]',
  delivery_fee = 6.00, -- Ajustar taxa de entrega se necessário
  min_order_value = 20.00 -- Ajustar valor mínimo se necessário
WHERE id = 'default';

-- Atualizar configurações do PDV
UPDATE pdv_settings SET
  store_name = 'Elite Açaí - [NOME DA NOVA LOJA]'
WHERE id = 'loja1';

-- Atualizar informações da loja na tabela stores
UPDATE stores SET
  name = 'Elite Açaí - [NOME DA NOVA LOJA]',
  address = '[ENDEREÇO COMPLETO DA NOVA LOJA]',
  phone = '([DDD]) 99999-9999'
WHERE code = 'NOVA_LOJA';

-- Ajustar horários de funcionamento se necessário
-- Exemplo: Fechar mais cedo nos domingos
UPDATE store_hours SET
  close_time = '18:00'
WHERE day_of_week = 0; -- Domingo

-- Adicionar bairros específicos da nova cidade/região
INSERT INTO delivery_neighborhoods (name, delivery_fee, delivery_time, is_active) VALUES
('[BAIRRO 1]', 5.00, 30, true),
('[BAIRRO 2]', 6.00, 35, true),
('[BAIRRO 3]', 7.00, 40, true),
('[BAIRRO 4]', 8.00, 45, true)
ON CONFLICT DO NOTHING;

-- Criar operador específico da nova loja
INSERT INTO pdv_operators (name, code, password_hash, is_active, permissions) VALUES
('[NOME DO GERENTE]', '[CODIGO_GERENTE]', '[SENHA]', true, '{
  "can_cancel": true,
  "can_discount": true,
  "can_use_scale": true,
  "can_view_sales": true,
  "can_view_orders": true,
  "can_view_reports": true,
  "can_view_products": true,
  "can_view_operators": false,
  "can_manage_products": true,
  "can_manage_settings": false,
  "can_view_attendance": true,
  "can_view_cash_report": true,
  "can_view_sales_report": true,
  "can_view_cash_register": true
}'::JSONB)
ON CONFLICT (code) DO NOTHING;

SELECT 'Personalizações aplicadas com sucesso!' as message;