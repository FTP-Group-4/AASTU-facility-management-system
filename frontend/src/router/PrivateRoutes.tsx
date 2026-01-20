import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import type { ComponentType } from 'react';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Spinner from '../components/common/UI/Spinner';
import { useAuth } from '../hooks/useAuth';

// Lazy load page components
const Dashboard = lazy(() => import('../pages/reporter/Dashboard').then(module => ({ default: (module as any).default ?? (module as any).Dashboard }) as { default: ComponentType<any> }));
const CoordinatorDashboard = lazy(() => import('../pages/coordinator/Dashboard').then(module => ({ default: (module as any).default ?? (module as any).Dashboard }) as { default: ComponentType<any> }));
const FixerDashboard = lazy(() => import('../pages/fixer/Dashboard').then(module => ({ default: (module as any).default ?? (module as any).Dashboard }) as { default: ComponentType<any> }));
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard').then(module => ({ default: (module as any).default ?? (module as any).Dashboard }) as { default: ComponentType<any> }));
const Profile = lazy(() => import('../pages/shared/Profile').then(module => ({ default: (module as any).default ?? (module as any).Profile }) as { default: ComponentType<any> }));
const Unauthorized = lazy(() => import('../pages/shared/Unauthorized').then(module => ({ default: (module as any).default ?? (module as any).Unauthorized }) as { default: ComponentType<any> }));

const PrivateRoutes = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" label="Loading application..." />
      </div>
    }>
      <Routes>
        {/* Reporter Routes */}
        <Route path="/reporter/*" element={
          <ProtectedRoute requiredRole="reporter">
            <Routes>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </ProtectedRoute>
        } />

        {/* Coordinator Routes */}
        <Route path="/coordinator/*" element={
          <ProtectedRoute requiredRole="coordinator">
            <Routes>
              <Route path="dashboard" element={<CoordinatorDashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </ProtectedRoute>
        } />

        {/* Fixer Routes */}
        <Route path="/fixer/*" element={
          <ProtectedRoute requiredRole={['electrical_fixer', 'mechanical_fixer']}>
            <Routes>
              <Route path="dashboard" element={<FixerDashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin/*" element={
          <ProtectedRoute requiredRole="admin">
            <Routes>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </ProtectedRoute>
        } />

        {/* Shared Routes */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />

        {/* Unauthorized Route */}
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Default redirect based on role */}
        <Route path="/" element={
          <ProtectedRoute>
            <RoleBasedRedirect />
          </ProtectedRoute>
        } />

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

// Component to redirect based on user role
const RoleBasedRedirect = () => {
  const { user } = useAuth() as { user?: { role?: string } | null };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'reporter':
      return <Navigate to="/reporter/dashboard" replace />;
    case 'coordinator':
      return <Navigate to="/coordinator/dashboard" replace />;
    case 'electrical_fixer':
    case 'mechanical_fixer':
      return <Navigate to="/fixer/dashboard" replace />;
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default PrivateRoutes;