import { PDVOperator } from '../types/pdv';

export const usePermissions = (operator?: PDVOperator | null) => {
  const hasPermission = (permission: keyof PDVOperator['permissions']): boolean => {
    // Se não há operador, assumir que é admin (modo desenvolvimento)
    if (!operator) {
      return true;
    }

    // Verificar se é admin pelo código
    const isAdmin = operator.code?.toUpperCase() === 'ADMIN' || 
                   operator.name?.toUpperCase().includes('ADMIN');
    
    if (isAdmin) {
      return true;
    }

    // Verificar permissão específica
    const hasSpecificPermission = operator.permissions?.[permission] === true;

    return hasSpecificPermission;
  };

  return { hasPermission };
};