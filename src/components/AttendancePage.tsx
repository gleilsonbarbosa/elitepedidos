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
    // Use the logged in user from the session
    // Convert attendance user to PDV operator format for compatibility
    const validOperator = session.user ? {
      id: session.user.id,
      name: session.user.name,
      code: session.user.username,
      password_hash: '', // Not needed for display
      is_active: session.user.is_active,
      permissions: {
        can_cancel: session.user.permissions.can_cancel || false,
        can_discount: session.user.permissions.can_discount || false,
        can_use_scale: session.user.permissions.can_use_scale || false,
        can_view_sales: session.user.permissions.can_view_sales || false,
        can_view_orders: session.user.permissions.can_view_orders || false,
        can_view_reports: session.user.permissions.can_view_reports || false,
        can_view_products: session.user.permissions.can_view_products || false,
        can_view_operators: session.user.permissions.can_view_operators || false,
        can_manage_products: session.user.permissions.can_manage_products || false,
        can_manage_settings: session.user.permissions.can_manage_settings || false,
        can_view_attendance: session.user.permissions.can_view_attendance || false,
        can_view_cash_report: session.user.permissions.can_view_cash_report || false,
        can_view_sales_report: session.user.permissions.can_view_sales_report || false,
        can_view_cash_register: session.user.permissions.can_view_cash_register || false,
        can_view_expected_balance: session.user.permissions.can_view_expected_balance || false
      },
      created_at: session.user.created_at,
      updated_at: session.user.updated_at,
      last_login: session.user.last_login
    } : null;

    return (
      <UnifiedAttendancePage 
        operator={validOperator}
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