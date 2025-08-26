import React from 'react';
import { useNavigate } from 'react-router-dom';
import AttendanceLogin from './Orders/AttendanceLogin';
import UnifiedAttendancePage from './UnifiedAttendancePage';
import { useAttendance } from '../hooks/useAttendance';
import { supabase } from '../lib/supabase';
import { PDVOperator } from '../types/pdv';

const AttendancePage: React.FC = () => {
  const navigate = useNavigate();
  const { session, login, logout } = useAttendance();
  const [pdvOperator, setPdvOperator] = React.useState<PDVOperator | null>(null);

  // Fetch the ADMIN operator from pdv_operators table
  React.useEffect(() => {
    const fetchPdvOperator = async () => {
      try {
        const { data, error } = await supabase
          .from('pdv_operators')
          .select('*')
          .eq('code', 'ADMIN')
          .single();

        if (error) {
          console.error('❌ Error fetching PDV operator:', error);
          return;
        }

        if (data) {
          setPdvOperator(data);
          console.log('✅ PDV operator fetched:', data);
        } else {
          console.warn('⚠️ Nenhum operador ADMIN encontrado');
          setPdvOperator(null);
        }
      } catch (error) {
        console.error('❌ Error in fetchPdvOperator:', error);
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          console.warn('⚠️ Erro de conexão ao buscar operador - usando modo offline');
        }
        setPdvOperator(null);
      }
    };

    if (session.isAuthenticated) {
      fetchPdvOperator();
    }
  }, [session.isAuthenticated]);

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 AttendancePage - Session state:', {
      isAuthenticated: session.isAuthenticated,
      user: session.user ? {
        username: session.user.username,
        name: session.user.name,
        role: session.user.role,
        permissions: Object.keys(session.user.permissions).filter(key => 
          session.user.permissions[key as keyof typeof session.user.permissions]
        )
      } : 'No user'
    });
  }, [session]);

  // Se está logado, mostrar sistema unificado
  if (session.isAuthenticated) {
    // Create operator based on attendance session user
    const attendanceOperator = session.user ? {
      id: session.user.id,
      name: session.user.name,
      code: session.user.username.toUpperCase(),
      password_hash: '',
      is_active: true,
      permissions: session.user.permissions || {
        can_cancel: false,
        can_discount: false,
        can_use_scale: false,
        can_view_sales: true,
        can_view_orders: true,
        can_view_reports: false,
        can_view_products: true,
        can_view_operators: false,
        can_manage_products: false,
        can_manage_settings: false,
        can_view_attendance: true,
        can_view_cash_report: false,
        can_view_sales_report: false,
        can_view_cash_register: false,
        can_view_expected_balance: false
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: null
    } : null;

    return (
      <UnifiedAttendancePage 
        operator={attendanceOperator}
        onLogout={logout}
      />
    );
  }

  // Se não está logado, mostrar tela de login
  return (
    <AttendanceLogin 
      onLogin={(username, password) => {
        console.log('🔐 AttendanceLogin - Tentativa de login:', { username });
        const success = login(username, password);
        console.log('🔐 AttendanceLogin - Resultado do login:', success);
        
        if (success) {
          console.log('✅ AttendanceLogin - Login bem-sucedido');
        }
        
        return success;
      }} 
    />
  );
};

export default AttendancePage;