import { PDVOperator } from '../types/pdv';

export const usePermissions = (operator?: PDVOperator | null) => {
  const hasPermission = (permission: keyof PDVOperator['permissions']): boolean => {
    console.log('🔍 usePermissions - Verificando permissão:', {
      permission,
      operator: operator ? {
        name: operator.name,
        code: operator.code,
        role: operator.role,
        hasPermissions: !!operator.permissions,
        specificPermission: operator.permissions?.[permission]
      } : 'Nenhum operador'
    });

    // Se não há operador, negar acesso
    if (!operator) {
      console.log('❌ usePermissions - Sem operador, negando acesso');
      return false;
    }

    // Verificar se é admin pelo código ou função
    const isAdmin = operator.code?.toUpperCase() === 'ADMIN' || 
                   operator.name?.toUpperCase().includes('ADMIN') ||
                   operator.role?.toLowerCase() === 'admin';
    
    console.log('🔍 usePermissions - Verificação de admin:', {
      isAdmin,
      code: operator.code,
      name: operator.name,
      role: operator.role
    });
    
    if (isAdmin) {
      console.log('✅ usePermissions - Admin detectado, liberando acesso');
      return true;
    }

    // Verificar se as permissões existem
    if (!operator.permissions) {
      console.log('❌ usePermissions - Sem objeto de permissões');
      return false;
    }

    // Verificar permissão específica
    const hasSpecificPermission = operator.permissions[permission] === true;
    
    console.log('🔍 usePermissions - Resultado da verificação:', {
      permission,
      hasSpecificPermission,
      permissionValue: operator.permissions[permission],
      allPermissions: Object.entries(operator.permissions)
        .filter(([_, value]) => value)
        .map(([key, _]) => key)
    });

    return hasSpecificPermission;
  };

  return { hasPermission };
};