import { PDVOperator } from '../types/pdv';

export const usePermissions = (operator?: PDVOperator | null) => {
  const hasPermission = (permission: keyof PDVOperator['permissions']): boolean => {
    // Debug logging
    console.log('🔍 Verificando permissão:', {
      permission,
      operator: operator ? {
        name: operator.name,
        code: operator.code,
        id: operator.id
      } : 'No operator',
      hasOperator: !!operator
    });

    // Se não há operador, assumir que é admin (modo desenvolvimento)
    if (!operator) {
      console.log('✅ Sem operador - assumindo admin (modo desenvolvimento)');
      return true;
    }

    // Verificar se é admin por diferentes critérios
    const isAdmin = operator.code?.toUpperCase() === 'ADMIN';

    if (isAdmin) {
      console.log('✅ Usuário é admin - permissão concedida');
      return true;
    }

    // Verificar permissão específica
    const hasSpecificPermission = operator.permissions?.[permission] === true;
    
    console.log('🔍 Verificação de permissão específica:', {
      permission,
      hasSpecificPermission,
      permissions: operator.permissions
    });

    return hasSpecificPermission;
  };

  return { hasPermission };
};