import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Uso: <ProtectedRoute roles={['cliente']}><PerfilCliente /></ProtectedRoute>
const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (roles && roles.length > 0 && !roles.includes(user.tipo)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default ProtectedRoute;
