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
        permissions: Object.keys(session.user.permissions ?? {}).filter(key => 
          (session.user.permissions ?? {})[key as keyof typeof session.user.permissions]
        )
      } : 'No user'
    });
  }, [session]);

  // Converter usuário de atendimento para formato PDV operator
  const convertToPDVOperator = (attendanceUser: any): PDVOperator => {
    return {
      id: attendanceUser.id,
      name: attendanceUser.name, // Usar o nome real do usuário
      code: (attendanceUser.username || '').toUpperCase(),
      username: attendanceUser.username, // Adicionar username para verificações
      password_hash: attendanceUser.password_hash,
      is_active: attendanceUser.is_active,
      role: attendanceUser.role, // Adicionar role do usuário
      permissions: {
        can_cancel: (attendanceUser.permissions ?? {}).can_cancel || false,
        can_discount: (attendanceUser.permissions ?? {}).can_discount || false,
        can_use_scale: (attendanceUser.permissions ?? {}).can_use_scale || false,
        can_view_sales: (attendanceUser.permissions ?? {}).can_view_sales || false,
        can_view_orders: (attendanceUser.permissions ?? {}).can_view_orders || false,
        can_view_reports: (attendanceUser.permissions ?? {}).can_view_reports || false,
        can_view_products: (attendanceUser.permissions ?? {}).can_view_products || false,
        can_view_operators: (attendanceUser.permissions ?? {}).can_view_operators || false,
        can_manage_products: (attendanceUser.permissions ?? {}).can_manage_products || false,
        can_manage_settings: (attendanceUser.permissions ?? {}).can_manage_settings || false,
        can_view_attendance: (attendanceUser.permissions ?? {}).can_view_attendance || false,
        can_view_cash_report: (attendanceUser.permissions ?? {}).can_view_cash_report || false,
        can_view_sales_report: (attendanceUser.permissions ?? {}).can_view_sales_report || false,
        can_view_cash_register: (attendanceUser.permissions ?? {}).can_view_cash_register || false,
        can_view_expected_balance: (attendanceUser.permissions ?? {}).can_view_expected_balance || false,
        can_edit_orders: (attendanceUser.permissions ?? {}).can_edit_orders || false,
        can_delete_orders: (attendanceUser.permissions ?? {}).can_delete_orders || false,
        can_cancel_orders: (attendanceUser.permissions ?? {}).can_cancel_orders || false,
        can_manage_cash_entries: (attendanceUser.permissions ?? {}).can_manage_cash_entries || false,
        can_edit_sales: (attendanceUser.permissions ?? {}).can_edit_sales || false,
        can_delete_sales: (attendanceUser.permissions ?? {}).can_delete_sales || false,
        can_edit_cash_entries: (attendanceUser.permissions ?? {}).can_edit_cash_entries || false,
        can_delete_cash_entries: (attendanceUser.permissions ?? {}).can_delete_cash_entries || false,
        can_cancel_cash_entries: (attendanceUser.permissions ?? {}).can_cancel_cash_entries || false
      },
      created_at: attendanceUser.created_at,
      updated_at: attendanceUser.updated_at,
      last_login: attendanceUser.last_login
    };
  };

  // Se está logado, mostrar sistema unificado
  if (session.isAuthenticated) {
    // Verificar se há usuário na sessão
    if (!session.user) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Erro: Dados do usuário não encontrados</p>
            <button 
              onClick={logout}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Voltar ao Login
            </button>
          </div>
        </div>
      );
    }

    // Converter usuário de atendimento para operador PDV
    const pdvOperator = convertToPDVOperator(session.user);
    
    console.log('✅ Usuário convertido para operador PDV:', {
      originalName: session.user.name,
      originalUsername: session.user.username,
      originalId: session.user.id,
      convertedName: pdvOperator.name,
      username: session.user.username,
      code: pdvOperator.code,
      permissions: pdvOperator.permissions
    });

    return (
      <UnifiedAttendancePage 
        operator={pdvOperator}
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