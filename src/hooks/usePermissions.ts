import { PDVOperator } from '../types/pdv';

export const usePermissions = (operator?: PDVOperator | null) => {
  const hasPermission = (permission: keyof PDVOperator['permissions']): boolean => {
    console.log('🔍 [PERMISSIONS] Verificando permissão em produção:', {
      permission,
      operator: operator ? {
        id: operator.id,
        name: operator.name,
        username: operator.username,
        code: operator.code,
        role: operator.role
      } : 'null',
      environment: import.meta.env.MODE,
      isDev: import.meta.env.DEV
    });
    
    // Se não há operador, negar acesso
    if (!operator) {
      console.log('❌ [PERMISSIONS] Sem operador - negando acesso para:', permission);
      return false;
    }

    // PRODUÇÃO: Verificar permissões atualizadas do localStorage
    if (!import.meta.env.DEV) {
      try {
        const currentSession = localStorage.getItem('attendance_session');
        if (currentSession) {
          const session = JSON.parse(currentSession);
          if (session.user && session.user.permissions) {
            const hasUpdatedPermission = session.user.permissions[permission] === true;
            console.log('🔍 [PRODUÇÃO] Verificando permissão atualizada:', {
              permission,
              hasUpdatedPermission,
              sessionPermissions: session.user.permissions
            });
            
            // Se é admin, sempre permitir
            const isSessionAdmin = session.user.role === 'admin' || 
                                 session.user.username === 'admin' ||
                                 session.user.code === 'ADMIN';
            
            if (isSessionAdmin) {
              console.log('✅ [PRODUÇÃO] Admin detectado na sessão - permitindo acesso');
              return true;
            }
            
            return hasUpdatedPermission;
          }
        }
      } catch (err) {
        console.error('❌ [PRODUÇÃO] Erro ao verificar sessão:', err);
      }
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