import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AttendanceUser {
  id: string;
  username: string;
  password_hash: string;
  name: string;
  role: 'attendant' | 'admin';
  is_active: boolean;
  permissions: {
    can_chat: boolean;
    can_view_orders: boolean;
    can_print_orders: boolean;
    can_update_status: boolean;
    can_create_manual_orders: boolean;
    can_view_tables: boolean;
    can_view_history: boolean;
    can_view_cash_register: boolean;
    can_view_sales: boolean;
    can_view_reports: boolean;
    can_view_cash_report: boolean;
    can_view_sales_report: boolean;
    can_manage_products: boolean;
    can_view_operators: boolean;
    can_view_attendance: boolean;
    can_manage_settings: boolean;
    can_use_scale: boolean;
    can_discount: boolean;
    can_cancel: boolean;
    can_view_expected_balance: boolean;
    can_edit_orders: boolean;
    can_delete_orders: boolean;
    can_cancel_orders: boolean;
    can_manage_cash_entries: boolean;
    can_edit_sales: boolean;
    can_delete_sales: boolean;
    can_edit_cash_entries: boolean;
    can_delete_cash_entries: boolean;
    can_cancel_cash_entries: boolean;
  };
  created_at: string;
  updated_at: string;
  last_login?: string;
}

interface AttendanceSession {
  isAuthenticated: boolean;
  user?: AttendanceUser;
}

export const useAttendance = () => {
  const [session, setSession] = useState<AttendanceSession>(() => {
    try {
      const storedSession = localStorage.getItem('attendance_session');
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        console.log('🔍 useAttendance - Sessão recuperada do localStorage:', parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Erro ao recuperar sessão:', error);
      localStorage.removeItem('attendance_session');
    }
    return { isAuthenticated: false };
  });

  const [users, setUsers] = useState<AttendanceUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Credenciais padrão
  const FALLBACK_CREDENTIALS = {
    username: 'admin',
    password: 'elite2024'
  };

  // Usuários padrão
  const DEFAULT_USERS: AttendanceUser[] = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      username: 'admin',
      password_hash: 'elite2024',
      name: 'Administrador',
      role: 'admin',
      is_active: true,
      permissions: {
        can_chat: true,
        can_view_orders: true,
        can_print_orders: true,
        can_update_status: true,
        can_create_manual_orders: true,
        can_view_tables: true,
        can_view_history: true,
        can_view_cash_register: true,
        can_view_sales: true,
        can_view_reports: true,
        can_view_cash_report: true,
        can_view_sales_report: true,
        can_manage_products: true,
        can_view_operators: true,
        can_view_attendance: true,
        can_manage_settings: true,
        can_use_scale: true,
        can_discount: true,
        can_cancel: true,
        can_view_expected_balance: true,
        can_edit_orders: true,
        can_delete_orders: true,
        can_cancel_orders: true,
        can_manage_cash_entries: true,
        can_edit_sales: true,
        can_delete_sales: true,
        can_edit_cash_entries: true,
        can_delete_cash_entries: true,
        can_cancel_cash_entries: true,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      username: 'sarahsantos',
      password_hash: 'elite2024',
      name: 'Sarah Santos',
      role: 'attendant',
      is_active: true,
      permissions: {
        can_chat: true,
        can_view_orders: true,
        can_print_orders: true,
        can_update_status: true,
        can_create_manual_orders: false,
        can_view_tables: false,
        can_view_history: false,
        can_view_cash_register: true,
        can_view_sales: true,
        can_view_reports: false,
        can_view_cash_report: true,
        can_view_sales_report: false,
        can_manage_products: false,
        can_view_operators: false,
        can_view_attendance: false,
        can_manage_settings: false,
        can_use_scale: false,
        can_discount: false,
        can_cancel: false,
        can_view_expected_balance: false,
        can_edit_orders: false,
        can_delete_orders: false,
        can_cancel_orders: false,
        can_manage_cash_entries: false,
        can_edit_sales: false,
        can_delete_sales: false,
        can_edit_cash_entries: false,
        can_delete_cash_entries: false,
        can_cancel_cash_entries: false,
        can_view_cash_balance: true
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      username: 'kevelly',
      password_hash: 'elite2024',
      name: 'Kevelly',
      role: 'attendant',
      is_active: true,
      permissions: {
        can_chat: true,
        can_view_orders: true,
        can_print_orders: true,
        can_update_status: true,
        can_create_manual_orders: false,
        can_view_tables: false,
        can_view_history: false,
        can_view_cash_register: true,
        can_view_sales: true,
        can_view_reports: false,
        can_view_cash_report: true,
        can_view_sales_report: false,
        can_manage_products: false,
        can_view_operators: false,
        can_view_attendance: false,
        can_manage_settings: false,
        can_use_scale: false,
        can_discount: false,
        can_cancel: false,
        can_view_expected_balance: true,
        can_edit_orders: false,
        can_delete_orders: false,
        can_cancel_orders: false,
        can_manage_cash_entries: false,
        can_edit_sales: false,
        can_delete_sales: false,
        can_edit_cash_entries: false,
        can_delete_cash_entries: false,
        can_cancel_cash_entries: false,
        can_view_cash_balance: false,
        can_view_cash_details: false,
        can_view_sales_totals: false,
        can_view_cash_entries: false
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  // Carregar usuários
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      // Verificar se Supabase está configurado
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const isSupabaseConfigured = supabaseUrl && supabaseKey && 
                                  supabaseUrl !== 'your_supabase_url_here' && 
                                  supabaseKey !== 'your_supabase_anon_key_here' &&
                                  !supabaseUrl.includes('placeholder');

      if (!isSupabaseConfigured) {
        console.warn('⚠️ Supabase não configurado - usando localStorage');
        loadUsersFromLocalStorage();
        return;
      }

      console.log('🔄 Carregando usuários de atendimento do banco...');

      const { data, error } = await supabase
        .from('attendance_users')
        .select('*')
        .order('name');

      if (error) {
        console.error('❌ Erro ao carregar usuários:', error);
        // Se não há dados no banco, criar usuários padrão
        console.log('📝 Criando usuários padrão no banco...');
        await createDefaultUsersInDatabase();
        return;
      }

      if (!data || data.length === 0) {
        console.log('📝 Nenhum usuário encontrado, criando usuários padrão...');
        await createDefaultUsersInDatabase();
        return;
      }

      console.log(`✅ ${data?.length || 0} usuários carregados do banco`);
      setUsers(data || []);

      // Salvar backup no localStorage
      if (data && data.length > 0) {
        localStorage.setItem('attendance_users', JSON.stringify(data));
      }

    } catch (err) {
      console.error('❌ Erro ao carregar usuários:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuários');
      // Em caso de erro, tentar criar usuários padrão
      await createDefaultUsersInDatabase();
    } finally {
      setLoading(false);
    }
  };

  // Criar usuários padrão no banco de dados
  const createDefaultUsersInDatabase = async () => {
    try {
      console.log('📝 Inserindo usuários padrão no banco...');
      
      const { data, error } = await supabase
        .from('attendance_users')
        .insert(DEFAULT_USERS)
        .select();
      
      if (error) {
        console.error('❌ Erro ao criar usuários padrão:', error);
        // Fallback para localStorage apenas se falhar completamente
        loadUsersFromLocalStorage();
        return;
      }
      
      console.log('✅ Usuários padrão criados no banco:', data?.length);
      setUsers(data || DEFAULT_USERS);
      
      // Salvar backup no localStorage
      localStorage.setItem('attendance_users', JSON.stringify(data || DEFAULT_USERS));
      
    } catch (err) {
      console.error('❌ Erro ao criar usuários padrão no banco:', err);
      loadUsersFromLocalStorage();
    }
  };

  // Carregar usuários do localStorage
  const loadUsersFromLocalStorage = () => {
    try {
      const savedUsers = localStorage.getItem('attendance_users');
      if (savedUsers) {
        const parsedUsers = JSON.parse(savedUsers);
        console.log('✅ Usuários carregados do localStorage:', parsedUsers.length);
        setUsers(parsedUsers);
      } else {
        console.log('ℹ️ Nenhum usuário no localStorage, criando usuários padrão');
        setUsers(DEFAULT_USERS);
        localStorage.setItem('attendance_users', JSON.stringify(DEFAULT_USERS));
      }
    } catch (error) {
      console.error('Erro ao carregar do localStorage:', error);
      setUsers(DEFAULT_USERS);
    }
  };

  // Criar usuário
  const createUser = async (userData: Omit<AttendanceUser, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Verificar se Supabase está configurado
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const isSupabaseConfigured = supabaseUrl && supabaseKey && 
                                  supabaseUrl !== 'your_supabase_url_here' && 
                                  supabaseKey !== 'your_supabase_anon_key_here' &&
                                  !supabaseUrl.includes('placeholder');

      if (!isSupabaseConfigured) {
        // Fallback para localStorage
        const newUser: AttendanceUser = {
          ...userData,
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);
        localStorage.setItem('attendance_users', JSON.stringify(updatedUsers));
        
        console.log('✅ Usuário criado no localStorage:', newUser.username);
        return newUser;
      }

      console.log('🚀 Criando usuário no banco:', userData.username);

      const { data, error } = await supabase
        .from('attendance_users')
        .insert([userData])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Usuário criado no banco:', data);
      
      // Atualizar lista local
      setUsers(prev => [...prev, data]);
      
      // Atualizar localStorage
      const updatedUsers = [...users, data];
      localStorage.setItem('attendance_users', JSON.stringify(updatedUsers));

      return data;
    } catch (err) {
      console.error('❌ Erro ao criar usuário:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar usuário');
    }
  };

  // Atualizar usuário
  const updateUser = async (id: string, updates: Partial<AttendanceUser>) => {
    try {
      // Verificar se Supabase está configurado
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const isSupabaseConfigured = supabaseUrl && supabaseKey && 
                                  supabaseUrl !== 'your_supabase_url_here' && 
                                  supabaseKey !== 'your_supabase_anon_key_here' &&
                                  !supabaseUrl.includes('placeholder');

      if (!isSupabaseConfigured) {
        // Fallback para localStorage
        const updatedUsers = users.map(user => 
          user.id === id 
            ? { ...user, ...updates, updated_at: new Date().toISOString() }
            : user
        );
        setUsers(updatedUsers);
        localStorage.setItem('attendance_users', JSON.stringify(updatedUsers));
        
        console.log('✅ Usuário atualizado no localStorage:', id);
        return;
      }

      console.log('✏️ Atualizando usuário no banco:', id);

      const { data, error } = await supabase
        .from('attendance_users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        console.warn(`⚠️ Usuário com ID ${id} não foi encontrado para atualização`);
        return null;
      }
      console.log('✅ Usuário atualizado no banco:', data);
      
      // Atualizar lista local
      setUsers(prev => prev.map(user => user.id === id ? data : user));
      
      // Atualizar localStorage
      const updatedUsers = users.map(user => user.id === id ? data : user);
      localStorage.setItem('attendance_users', JSON.stringify(updatedUsers));

      return data;
    } catch (err) {
      console.error('❌ Erro ao atualizar usuário:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar usuário');
    }
  };

  // Excluir usuário
  const deleteUser = async (id: string) => {
    try {
      // Verificar se Supabase está configurado
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const isSupabaseConfigured = supabaseUrl && supabaseKey && 
                                  supabaseUrl !== 'your_supabase_url_here' && 
                                  supabaseKey !== 'your_supabase_anon_key_here' &&
                                  !supabaseUrl.includes('placeholder');

      if (!isSupabaseConfigured) {
        // Fallback para localStorage
        const updatedUsers = users.filter(user => user.id !== id);
        setUsers(updatedUsers);
        localStorage.setItem('attendance_users', JSON.stringify(updatedUsers));
        
        console.log('✅ Usuário excluído do localStorage:', id);
        return;
      }

      console.log('🗑️ Excluindo usuário do banco:', id);

      const { error } = await supabase
        .from('attendance_users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log('✅ Usuário excluído do banco');
      
      // Atualizar lista local
      setUsers(prev => prev.filter(user => user.id !== id));
      
      // Atualizar localStorage
      const updatedUsers = users.filter(user => user.id !== id);
      localStorage.setItem('attendance_users', JSON.stringify(updatedUsers));

    } catch (err) {
      console.error('❌ Erro ao excluir usuário:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao excluir usuário');
    }
  };

  // Login
  const login = (username: string, password: string): boolean => {
    console.log('🔐 useAttendance - Tentativa de login:', { username, password: password ? '***' : 'vazio' });
    console.log('👥 Usuários disponíveis:', users.map(u => ({ username: u.username, name: u.name, role: u.role, is_active: u.is_active })));
    
    // SEMPRE buscar usuário atualizado do banco de dados PRIMEIRO
    const findUserInDatabase = async (): Promise<AttendanceUser | null> => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseKey && 
            !supabaseUrl.includes('placeholder') && 
            !supabaseKey.includes('placeholder')) {
          
          console.log('🔍 Buscando usuário atualizado no banco para login:', { username });
          const { data: dbUser, error } = await supabase
            .from('attendance_users')
            .select('*')
            .eq('username', username)
            .eq('is_active', true)
            .maybeSingle();
          
          if (!error && dbUser && dbUser.password_hash === password) {
            console.log('✅ Usuário encontrado no banco com permissões atualizadas:', {
              username: dbUser.username,
              name: dbUser.name,
              role: dbUser.role,
              permissions: Object.keys(dbUser.permissions).filter(key => dbUser.permissions[key])
            });
            console.log('🔍 Permissões do banco:', dbUser.permissions);
            
            // Atualizar lista local com dados do banco
            setUsers(prev => {
              const updated = prev.filter(u => u.id !== dbUser.id);
              return [...updated, dbUser];
            });
            
            return dbUser;
          } else if (error) {
            console.log('❌ Erro ao buscar usuário no banco:', error);
          } else if (!dbUser) {
            console.log('❌ Usuário não encontrado no banco:', username);
          } else if (dbUser.password_hash !== password) {
            console.log('❌ Senha incorreta para usuário:', username);
          } else if (!dbUser.is_active) {
            console.log('❌ Usuário inativo no banco:', username);
          }
        }
      } catch (err) {
        console.warn('⚠️ Erro ao buscar usuário no banco:', err);
      }
      
      return null;
    };
    
    // Buscar usuário do banco PRIMEIRO
    findUserInDatabase().then(dbUser => {
      if (dbUser) {
        console.log('✅ Login bem-sucedido com dados do banco - Usuário:', dbUser.name, 'Role:', dbUser.role);
        console.log('🔍 Permissões atualizadas do banco:', dbUser.permissions);
        
        const newSession = {
          isAuthenticated: true,
          user: dbUser  // Usar dados SEMPRE do banco
        };
        
        console.log('💾 Salvando sessão com dados do banco:', { username: dbUser.username, role: dbUser.role, name: dbUser.name });
        setSession(newSession);
        localStorage.setItem('attendance_session', JSON.stringify(newSession));
        
        // Atualizar último login
        updateLastLogin(dbUser.id);
        
        return;
      }
      
      // Fallback para usuários locais apenas se banco falhar
      const localUser = users.find(u => 
        u.username === username && 
        u.password_hash === password && 
        u.is_active
      );

      console.log('🔍 Usuário local encontrado:', localUser ? { username: localUser.username, name: localUser.name, role: localUser.role } : 'NENHUM');

      if (localUser) {
        console.log('⚠️ Login com dados locais (fallback) - Usuário:', localUser.name, 'Role:', localUser.role);
        console.log('🔍 Permissões do usuário local:', localUser.permissions);
        
        const newSession = {
          isAuthenticated: true,
          user: localUser
        };
        
        console.log('💾 Salvando sessão com dados locais:', { username: localUser.username, role: localUser.role, name: localUser.name });
        setSession(newSession);
        localStorage.setItem('attendance_session', JSON.stringify(newSession));
        
        // Atualizar último login
        updateLastLogin(localUser.id);
        
        return true;
      }
    });

    // Verificar usuários locais para resposta imediata
    const user = users.find(u => 
      u.username === username && 
      u.password_hash === password && 
      u.is_active
    );

    if (user) {
      // Login imediato com dados locais, mas será substituído pelos dados do banco
      return true;
    }
    
    console.log('❌ Login falhou - credenciais inválidas');
    return false;
  };

  // Logout
  const logout = () => {
    console.log('🚪 useAttendance - Logout');
    setSession({ isAuthenticated: false });
    localStorage.removeItem('attendance_session');
  };

  const updateLastLogin = async (userId: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl.includes('placeholder') || 
          supabaseKey.includes('placeholder')) {
        // Atualizar no localStorage se Supabase não estiver configurado
        const updatedUsers = users.map(user => 
          user.id === userId 
            ? { ...user, last_login: new Date().toISOString() }
            : user
        );
        setUsers(updatedUsers);
        localStorage.setItem('attendance_users', JSON.stringify(updatedUsers));
        return;
      }

      await supabase
        .from('attendance_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId);
        
      // Também atualizar no estado local
      const updatedUsers = users.map(user => 
        user.id === userId 
          ? { ...user, last_login: new Date().toISOString() }
          : user
      );
      setUsers(updatedUsers);
        
    } catch (error) {
      console.warn('Erro ao atualizar último login:', error);
    }
  };

  // Carregar usuários quando o hook for inicializado
  useEffect(() => {
    fetchUsers();
    
    // Recarregar usuários a cada 30 segundos para manter permissões sincronizadas
    const interval = setInterval(() => {
      console.log('🔄 Recarregando usuários para sincronizar permissões...');
      fetchUsers();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    session,
    users,
    loading,
    error,
    login,
    logout,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser
  };
};