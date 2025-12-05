/*
  # Adicionar cash_register_id à tabela pdv_sales

  ## Alterações
  - Adicionar coluna cash_register_id para vincular vendas ao caixa
  - Permite rastreamento de quais vendas foram feitas em qual caixa
*/

ALTER TABLE pdv_sales
ADD COLUMN IF NOT EXISTS cash_register_id uuid REFERENCES pdv_cash_registers(id);

CREATE INDEX IF NOT EXISTS idx_pdv_sales_cash_register 
ON pdv_sales(cash_register_id);

COMMENT ON COLUMN pdv_sales.cash_register_id IS 'ID do caixa onde a venda foi realizada';