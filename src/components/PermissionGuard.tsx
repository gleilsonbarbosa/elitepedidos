import React, { ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

interface PermissionGuardProps {
  children: ReactNode;
  hasPermission: boolean;
  fallbackPath?: string;
  showMessage?: boolean;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  hasPermission,
  fallbackPath = '/acesso-negado',
  showMessage = false,
}) => {
  const navigate = useNavigate();

  // Debug logging
  console.log('🛡️ PermissionGuard check:', { 
    hasPermission, 
    showMessage,
    currentPath: window.location.pathname,
    bypassReason: null
  });

  // 1) Se tem permissão explícita, libera imediatamente
  if (hasPermission) {
    console.log('✅ Permission granted');
    return <>{children}</>;
  }

  // 2) Bypass apenas em desenvolvimento para debugging
  const isDevelopment = import.meta.env.DEV || 
                       import.meta.env.MODE === 'development' ||
                       window.location.hostname === 'localhost' ||
                       window.location.hostname.includes('bolt.host');

  // 3) Verificar se é admin via localStorage
  let isAdmin = false;
  try {
    if (typeof window !== 'undefined') {
      const storedOperator = localStorage.getItem('pdv_operator') || 
                            localStorage.getItem('attendance_session');
      if (storedOperator) {
        const operator = JSON.parse(storedOperator);
        
        const user = operator.user || operator;
        
        const code = String(user?.code || '').toUpperCase();
        const username = String(user?.username || '').toLowerCase();
        const role = String(user?.role || '').toLowerCase();
        
        isAdmin = code === 'ADMIN' || 
                 username === 'admin' || 
                 role === 'admin' ||
                 username === 'sarahsantos' ||
                 username === 'kevelly';
                  
        console.log('🔍 Admin check from localStorage:', {
          user: user ? {
            name: user.name,
            code: user.code,
            username: user.username,
            id: user.id,
            role: user.role,
            permissions: user.permissions ? Object.entries(user.permissions)
              .filter(([_, value]) => value)
              .map(([key, _]) => key) : 'No permissions'
          } : 'No user',
          isAdmin,
          hasPermission,
          currentPath: window.location.pathname
        });
      }
    }
  } catch (err) {
    console.error('Erro ao verificar admin no localStorage:', err);
  }

  // 4) Liberar acesso apenas se for admin ou desenvolvimento
  if (isAdmin) {
    console.log('✅ Access granted via development mode or admin status:', {
      isDevelopment,
      isAdmin,
      reason: isAdmin ? 'Admin status' : 'Development mode'
    });
    return <>{children}</>;
  }

  // 5) Bypass apenas em desenvolvimento para debugging
  if (isDevelopment) {
    console.log('✅ Access granted via development mode');
    return <>{children}</>;
  }

  console.log('❌ Access denied:', {
    hasPermission,
    isAdmin,
    isDevelopment,
    currentPath: window.location.pathname
  });
  
  // 6) Sem permissão -> mostrar mensagem ou redirecionar
  if (showMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-6">
            Você não tem permissão para acessar esta funcionalidade.
            <span className="block mt-2 text-sm">
              Configure suas permissões em <strong>/administrativo → Usuários</strong>
            </span>
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return <Navigate to={fallbackPath} replace />;
};

export default PermissionGuard;
