import { PDVOperator } from '../types/pdv';

export const usePermissions = (operator?: PDVOperator | null) => {
  const hasPermission = (permission: keyof PDVOperator['permissions']): boolean => {
    // Se não há operador, negar acesso
    if (!operator) {
      console.log('❌ [PERMISSIONS] Sem operador - negando acesso para:', permission);
      return false;
    }

    // BYPASS EXPANDIDO para usuários ADMIN - sempre permitir acesso
    const isAdmin = operator.code?.toUpperCase() === 'ADMIN' || 
                   operator.name?.toUpperCase().includes('ADMIN') ||
                   operator.username?.toUpperCase() === 'ADMIN' ||
                   operator.role === 'admin' ||
                   operator.id === '1' || // ID do admin padrão
                   operator.id === '00000000-0000-0000-0000-000000000001'; // UUID do admin padrão
    
    if (isAdmin) {
      console.log('✅ [PERMISSIONS] ADMIN detectado - permitindo acesso total para:', permission, {
        operatorCode: operator.code,
        operatorName: operator.name,
        operatorUsername: operator.username,
        operatorRole: operator.role,
        operatorId: operator.id
      });
      return true;
    }

    // VERIFICAÇÃO ESPECIAL para permissões de caixa - mais permissiva
    if (permission === 'can_view_cash_register') {
      // Permitir acesso se tem qualquer uma dessas permissões relacionadas a caixa
      const hasCashPermissions = operator.permissions?.can_view_cash_register ||
                                operator.permissions?.can_view_cash_report ||
                                operator.permissions?.can_manage_cash_entries ||
                                operator.permissions?.can_view_expected_balance ||
                                operator.permissions?.can_view_sales ||
                                operator.permissions?.can_view_reports;
      
      if (hasCashPermissions) {
        console.log('✅ [PERMISSIONS] Acesso ao caixa permitido por permissões relacionadas:', {
          permission,
          operatorName: operator.name,
          permissions: operator.permissions
        });
        return true;
      }
    }

    // Verificar permissão específica para usuários não-admin
    const hasSpecificPermission = operator.permissions?.[permission] === true;
    
    console.log('🔍 [PERMISSIONS] Verificação final de permissão:', {
      permission,
      operatorCode: operator.code,
      operatorName: operator.name,
      operatorUsername: operator.username,
      isAdmin,
      hasSpecificPermission,
      allPermissions: operator.permissions,
      finalResult: hasSpecificPermission
    });

    return hasSpecificPermission;
  };

  return { hasPermission };
};