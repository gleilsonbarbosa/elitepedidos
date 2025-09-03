import { PDVOperator } from '../types/pdv';

export const usePermissions = (operator?: PDVOperator | null) => {
  const hasPermission = (permission: keyof PDVOperator['permissions']): boolean => {
    // Debug logging
    console.log('🔍 [PERMISSIONS] Verificando permissão:', permission, 'para operador:', operator?.name || 'No operator');
    console.log('📋 [PERMISSIONS] Permissões do operador:', JSON.stringify(operator?.permissions, null, 2));
    console.log('🎯 [PERMISSIONS] Permissão específica:', permission, '=', operator?.permissions?.[permission]);

    // Se não há operador, assumir que é admin (modo desenvolvimento)
    if (!operator) {
      console.log('❌ [PERMISSIONS] Sem operador - negando acesso');
      return false;
    }

    // Verificar permissão específica
    const hasSpecificPermission = operator.permissions?.[permission] === true;
    
    console.log('✅ [PERMISSIONS] Resultado da verificação de permissão:', {
      permission,
      hasSpecificPermission,
      finalResult: hasSpecificPermission,
      operatorCode: operator.code,
      operatorName: operator.name,
      allPermissions: JSON.stringify(operator.permissions, null, 2),
      timestamp: new Date().toISOString()
    });

    return hasSpecificPermission;
  };

  return { hasPermission };
};