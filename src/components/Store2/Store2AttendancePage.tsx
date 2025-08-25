import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, ArrowLeft, User, LogOut, AlertCircle } from 'lucide-react';
import { useStore2Attendance } from '../../hooks/useStore2Attendance';
import Store2AttendancePanel from './Store2AttendancePanel';

import Store2Login from './Store2Login';


const Store2AttendancePage: React.FC = () => {
  const navigate = useNavigate();
  const { session, login, logout } = useStore2Attendance();

  // Se o atendente está logado, mostrar painel de atendimento
  if (session.isAuthenticated) {
    return (
      <Store2AttendancePanel 
        operator={session.user}
        onLogout={logout}
      />
    );
  }

  // Se não está logado, mostrar tela de login
  return (
    <Store2Login 
      onLogin={(username, password) => {
        const success = login(username, password);
        return success;
      }} 
    />
  );
};

export default Store2AttendancePage;