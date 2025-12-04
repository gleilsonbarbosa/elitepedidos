/*
  # Adicionar permissões faltantes ao operador ADMIN
  
  1. Atualizações
    - Adiciona permissões `can_edit_cash_entries` e `can_delete_cash_entries` ao operador ADMIN
    - Adiciona permissões `can_manage_settings` e `can_view_attendance`
    
  2. Notas
    - Atualiza apenas o operador com código 'ADMIN' (case-insensitive)
    - Mantém todas as permissões existentes
*/

-- Atualizar permissões do operador ADMIN
UPDATE pdv_operators
SET permissions = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(permissions, '{}'::jsonb),
        '{can_edit_cash_entries}',
        'true'::jsonb
      ),
      '{can_delete_cash_entries}',
      'true'::jsonb
    ),
    '{can_manage_settings}',
    'true'::jsonb
  ),
  '{can_view_attendance}',
  'true'::jsonb
),
updated_at = now()
WHERE UPPER(code) = 'ADMIN';