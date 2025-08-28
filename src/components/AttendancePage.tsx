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
  const [loadingOperator, setLoadingOperator] = React.useState(false);

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

  // Fetch corresponding PDV operator when user logs in
  React.useEffect(() => {
    const fetchPdvOperator = async () => {
      if (!session.isAuthenticated || !session.user) {
        setPdvOperator(null);
        return;
      }

      setLoadingOperator(true);
      try {
        // Try to find PDV operator by matching username to code
        const { data: operators, error } = await supabase
          .from('pdv_operators')
          .select('*')
          .eq('code', session.user.username.toUpperCase())
          .eq('is_active', true)
          .limit(1);

        if (error) {
          console.error('❌ Error fetching PDV operator:', error);
          throw error;
        }

        let operator = operators?.[0];

        // If no matching operator found, try to find ADMIN operator as fallback
        if (!operator) {
          console.log('🔍 No matching PDV operator found, looking for ADMIN...');
          const { data: adminOperators, error: adminError } = await supabase
            .from('pdv_operators')
            .select('*')
            .eq('code', 'ADMIN')
            .eq('is_active', true)
            .limit(1);

          if (adminError) {
            console.error('❌ Error fetching ADMIN operator:', adminError);
            throw adminError;
          }

          operator = adminOperators?.[0];
        }

        // If still no operator found, create ADMIN operator
        if (!operator) {
          console.log('📝 Creating ADMIN operator...');
          const { data: newOperator, error: createError } = await supabase
            .from('pdv_operators')
            .insert([{
              name: 'Administrador',
              code: 'ADMIN',
              password_hash: 'elite2024',
              is_active: true,
              permissions: {
                can_cancel: true,
                can_discount: true,
                can_use_scale: true,
                can_view_sales: true,
                can_view_orders: true,
                can_view_reports: true,
                can_view_products: true,
                can_view_operators: true,
                can_manage_products: true,
                can_manage_settings: true,
                can_view_attendance: true,
                can_view_cash_report: true,
                can_view_sales_report: true,
                can_view_cash_register: true,
                can_view_expected_balance: true
              }
            }])
            .select()
            .single();

          if (createError) {
            console.error('❌ Error creating ADMIN operator:', createError);
            throw createError;
          }

          operator = newOperator;
          console.log('✅ ADMIN operator created:', operator);
        }

        setPdvOperator(operator);
        console.log('✅ PDV operator set:', { id: operator.id, code: operator.code, name: operator.name });

      } catch (error) {
        console.error('❌ Error setting up PDV operator:', error);
        // Fallback to null - this will prevent sales from being created
        setPdvOperator(null);
      } finally {
        setLoadingOperator(false);
      }
    };

    fetchPdvOperator();
  }, [session.isAuthenticated, session.user]);
  // Se está logado, mostrar sistema unificado
  if (session.isAuthenticated) {
    // Show loading while fetching PDV operator
    if (loadingOperator) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando operador...</p>
          </div>
        </div>
      );
    }

    // Show error if no valid PDV operator found
    if (!pdvOperator) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Erro: Operador PDV não encontrado</p>
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