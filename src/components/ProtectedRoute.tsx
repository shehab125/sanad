import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requireAdmin?: boolean;
}

/**
 * A wrapper for routes that require authentication and optionally admin privileges.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, session, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    // Could show loading spinner here
    return <div>Loading...</div>;
  }
  // الاعتماد على الجلسة وليس صف profiles فقط — يمنع حلقة «دخلت لكن رجعت للوجين».
  if (!session) {
    const redirect = `${location.pathname}${location.search || ''}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }
  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default ProtectedRoute;