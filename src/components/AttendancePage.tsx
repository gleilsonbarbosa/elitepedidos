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
  const [isLoadingOperator, setIsLoadingOperator] = React.useState(false);

  // Function to find or create PDV operator
  const findOrCreatePDVOperator = async (attendanceUser: any) => {
    setIsLoadingOperator(true);
    try {
      // First, try to find existing operator by username (code)
      const { data: existingOperator } = await supabase
        .from('pdv_operators')
        .select('*')
        .eq('code', attendanceUser.username)
        .single();

      if (existingOperator) {
        console.log('✅ Found existing PDV operator:', existingOperator.name);
        setPdvOperator(existingOperator);
        return existingOperator;
      }

      // If no operator exists, create a new one
      const { data: newOperator, error } = await supabase
        .from('pdv_operators')
        .insert({
          name: attendanceUser.name || 'ADMIN',
          code: attendanceUser.username,
          password_hash: 'attendance_user', // Placeholder since they login via attendance
          is_active: true,
          permissions: {
            can_cancel: attendanceUser.permissions.can_cancel || false,
            can_discount: attendanceUser.permissions.can_discount || false,
            can_use_scale: attendanceUser.permissions.can_use_scale || false,
            can_view_sales: attendanceUser.permissions.can_view_sales || false,
            can_view_orders: attendanceUser.permissions.can_view_orders || false,
            can_view_reports: attendanceUser.permissions.can_view_reports || false,
            can_view_products: attendanceUser.permissions.can_view_products || false,
            can_view_operators: attendanceUser.permissions.can_view_operators || false,
            can_manage_products: attendanceUser.permissions.can_manage_products || false,
            can_manage_settings: attendanceUser.permissions.can_manage_settings || false,
            can_view_attendance: attendanceUser.permissions.can_view_attendance || false,
            can_view_cash_report: attendanceUser.permissions.can_view_cash_report || false,
            can_view_sales_report: attendanceUser.permissions.can_view_sales_report || false,
            can_view_cash_register: attendanceUser.permissions.can_view_cash_register || false
          }
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating PDV operator:', error);
        throw error;
      }

      console.log('✅ Created new PDV operator:', newOperator.name);
      setPdvOperator(newOperator);
      return newOperator;
    } catch (error) {
      console.error('❌ Error finding/creating PDV operator:', error);
      return null;
    } finally {
      setIsLoadingOperator(false);
    }
  };

  // Effect to find/create PDV operator when attendance user logs in
  React.useEffect(() => {
    if (session.isAuthenticated && session.user && !pdvOperator) {
      findOrCreatePDVOperator(session.user);
    } else if (!session.isAuthenticated) {
      setPdvOperator(null);
    }
  }, [session.isAuthenticated, session.user, pdvOperator]);

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
      } : 'No user',
      pdvOperator: pdvOperator ? {
        id: pdvOperator.id,
        name: pdvOperator.name,
        code: pdvOperator.code
      } : 'No PDV operator'
    });
  }, [session, pdvOperator]);

  // Se está logado, mostrar sistema unificado
  if (session.isAuthenticated && pdvOperator) {
    return (
      <UnifiedAttendancePage 
        operator={pdvOperator}
        onLogout={logout}
      />
    );
  }

  // Show loading while finding/creating PDV operator
  if (session.isAuthenticated && isLoadingOperator) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando operador...</p>
        </div>
      </div>
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