import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import App from './App';

export const APP_ROUTES = [
  { path: '/', label: 'Portal Clientes', element: <App /> },
  { path: '*', element: <Navigate to="/" replace /> },
];

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/personal" element={<App />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
