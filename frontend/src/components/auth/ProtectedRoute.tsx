import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../../components/common/UI/Spinner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string | string[];
  requiredPermission?: string | string[];
  redirectTo?: string;
}

const ProtectedRoute = ({
  children,
  requiredRole,
  requiredPermission,
  redirectTo = '/login',
}: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading, hasRole, hasPermission, hasAnyPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" label="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save the attempted location for redirect after login
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role requirement
  if (requiredRole) {
    const hasRequiredRole = hasRole(requiredRole);
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check permission requirement
  if (requiredPermission) {
    let hasRequiredPermission = false;
    
    if (Array.isArray(requiredPermission)) {
      hasRequiredPermission = hasAnyPermission(requiredPermission);
    } else {
      hasRequiredPermission = hasPermission(requiredPermission);
    }

    if (!hasRequiredPermission) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;