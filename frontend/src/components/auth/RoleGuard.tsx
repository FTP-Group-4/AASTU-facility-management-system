import type { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface RoleGuardProps {
  children: ReactNode;
  roles: string | string[];
  fallback?: ReactNode;
  requireAll?: boolean;
}

const RoleGuard = ({
  children,
  roles,
  fallback = null,
  requireAll = false,
}: RoleGuardProps) => {
  const { user, hasRole } = useAuth();

  if (!user) {
    return fallback;
  }

  let hasAccess = false;

  if (requireAll && Array.isArray(roles)) {
    hasAccess = roles.every(role => hasRole(role));
  } else {
    hasAccess = hasRole(roles);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default RoleGuard;