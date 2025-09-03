import { PDVOperator } from '../types/pdv';

export const usePermissions = (operator?: PDVOperator | null) => {
  const hasPermission = (permission: keyof PDVOperator['permissions']): boolean => {
    // Se não há operador, negar acesso
    if (!operator) {
      console.log('❌ [PERMISSIONS] Sem operador - negando acesso para:', permission);
      return false;
    }

    // BYPASS apenas para usuários ADMIN - sempre permitir acesso
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


    // Verificar permissão específica para usuários não-admin
    const hasSpecificPermission = operator.permissions?.[permission] === true;
    
    console.log('🔍 [PERMISSIONS] Verificação final de permissão:', {
      permission,
      operatorCode: operator.code,
      operatorName: operator.name,
      operatorUsername: operator.username,
      operatorId: operator.id,
      isAdmin,
      hasSpecificPermission,
      allPermissions: operator.permissions,
      finalResult: hasSpecificPermission
    });

    return hasSpecificPermission;
  };

  return { hasPermission };
};