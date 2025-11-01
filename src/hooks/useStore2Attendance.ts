import { useState, useCallback } from 'react';

interface Store2User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'attendant';
  isActive: boolean;
  permissions: {
    can_view_orders: boolean;
    can_update_status: boolean;
    can_chat: boolean;
    can_create_manual_orders: boolean;
    can_print_orders: boolean;
  };
}

interface Store2Session {
  isAuthenticated: boolean;
  user?: Store2User;
}

export const useStore2Attendance = () => {
  const [session, setSession] = useState<Store2Session>(() => {
    try {
      const storedSession = localStorage.getItem('store2_attendance_session');
      if (storedSession) {
        return JSON.parse(storedSession);
      }
    } catch (error) {
      console.error('Erro ao recuperar sessão da Loja 2:', error);
      localStorage.removeItem('store2_attendance_session');
    }
    return { isAuthenticated: false };
  });

  // Usuários padrão da Loja 2
  const users: Store2User[] = [
    {
      id: '1',
      username: 'loja2',
      password: 'elite2024',
      name: 'Administrador Loja 2',
      role: 'admin',
      isActive: true,
      permissions: {
        can_view_orders: false, // Loja 2 não tem delivery
        can_update_status: false,
        can_chat: false,
        can_create_manual_orders: false,
        can_print_orders: true
      }
    }
  ];

  const login = useCallback((username: string, password: string): boolean => {
    console.log('🔐 Store2 - Tentativa de login:', { username });
    
    const user = users.find(u => 
      u.username === username && 
      u.password === password && 
      u.isActive
    );

    if (user) {
      const newSession = {
        isAuthenticated: true,
        user
      };
      
      setSession(newSession);
      localStorage.setItem('store2_attendance_session', JSON.stringify(newSession));
      
      console.log('✅ Store2 - Login bem-sucedido:', user.username);
      return true;
    }

    console.log('❌ Store2 - Login falhou para:', username);
    return false;
  }, []);

  const logout = useCallback(() => {
    console.log('🚪 Store2 - Logout');
    setSession({ isAuthenticated: false });
    localStorage.removeItem('store2_attendance_session');
  }, []);

  return {
    session,
    users,
    login,
    logout
  };
};