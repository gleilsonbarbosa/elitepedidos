import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DeliveryPage from './Delivery/DeliveryPage';
import OrderTrackingPage from './Customer/OrderTrackingPage';
import OrderLookup from './Customer/OrderLookup';
import AdminPage from './Admin/AdminPage';
import AttendancePage from './AttendancePage';
import AccessDeniedPage from './AccessDeniedPage';
import { useState } from 'react';
import PDVLogin from './PDV/PDVLogin';
import PDVMain from './PDV/PDVMain';
import { PDVOperator } from '../types/pdv';
import NotFoundPage from './NotFoundPage';
import DeliveryLogin from './DeliveryDriver/DeliveryLogin';
import DeliveryOrdersPage from './DeliveryDriver/DeliveryOrdersPage';
import ProtectedRoute from './DeliveryDriver/ProtectedRoute';
import TableSalesPanel from './TableSales/TableSalesPanel';
import PDVPage from './PDV/PDVPage';
import MonthlyCashFlowPage from './CashFlow/MonthlyCashFlowPage';


const Router: React.FC = () => {
  // Solicitar permissão para notificações ao iniciar o app
  useEffect(() => {
    // Verificar se o navegador suporta notificações
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      // Solicitar permissão
      Notification.requestPermission().then(permission => {
        console.log('Permissão de notificação:', permission);
      });
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DeliveryPage />} />
        <Route path="/buscar-pedido" element={<OrderLookup />} />
        <Route path="/pedido/:orderId" element={<OrderTrackingPage />} />
        <Route path="/atendimento" element={<AttendancePage />} />
        <Route path="/administrativo" element={<AdminPage />} />
        <Route path="/acesso-negado" element={<AccessDeniedPage />} />
        <Route path="/pdv" element={<PDVPage />} />
        <Route path="/pdv/app" element={<PDVPage />} />
        <Route path="/odv" element={<PDVPage />} />
        <Route path="/login" element={<DeliveryLogin />} />
        <Route path="/entregas" element={
          <ProtectedRoute>
            <DeliveryOrdersPage />
          </ProtectedRoute>
        } />
        <Route path="/atendimento/mesas" element={<TableSalesPanel storeId={1} />} />
        <Route path="/atendimento2/mesas" element={<TableSalesPanel storeId={2} />} />
        <Route path="/fluxo-caixa" element={<MonthlyCashFlowPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;