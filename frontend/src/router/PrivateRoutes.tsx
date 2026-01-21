import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import type { ComponentType } from 'react';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Spinner from '../components/common/UI/Spinner';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/common/Layout/Layout';

// Lazy load page components
// Reporter
const Dashboard = lazy(() => import('../pages/reporter/Dashboard').then(module => ({ default: (module as any).default ?? (module as any).Dashboard }) as { default: ComponentType<any> }));
const NewReport = lazy(() => import('../pages/reporter/NewReport').then(module => ({ default: (module as any).default ?? (module as any).NewReport }) as { default: ComponentType<any> }));
const MyReports = lazy(() => import('../pages/reporter/MyReports').then(module => ({ default: (module as any).default ?? (module as any).MyReports }) as { default: ComponentType<any> }));

// Coordinator
const CoordinatorDashboard = lazy(() => import('../pages/coordinator/Dashboard').then(module => ({ default: (module as any).default ?? (module as any).Dashboard }) as { default: ComponentType<any> }));
const PendingApprovals = lazy(() => import('../pages/coordinator/PendingApprovals').then(module => ({ default: (module as any).default ?? (module as any).PendingApprovals }) as { default: ComponentType<any> }));
const AssignedBlocks = lazy(() => import('../pages/coordinator/AssignedBlocks').then(module => ({ default: (module as any).default ?? (module as any).AssignedBlocks }) as { default: ComponentType<any> }));
const ReviewReport = lazy(() => import('../pages/coordinator/ReviewReport').then(module => ({ default: (module as any).default ?? (module as any).ReviewReport }) as { default: ComponentType<any> }));

// Fixer
const FixerDashboard = lazy(() => import('../pages/fixer/Dashboard').then(module => ({ default: (module as any).default ?? (module as any).Dashboard }) as { default: ComponentType<any> }));
const MyJobs = lazy(() => import('../pages/fixer/MyJobs').then(module => ({ default: (module as any).default ?? (module as any).MyJobs }) as { default: ComponentType<any> }));
const JobDetails = lazy(() => import('../pages/fixer/JobDetails').then(module => ({ default: (module as any).default ?? (module as any).JobDetails }) as { default: ComponentType<any> }));

// Admin Pages
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard').then(module => ({ default: (module as any).default ?? (module as any).Dashboard }) as { default: ComponentType<any> }));
const AdminUsers = lazy(() => import('../pages/admin/Users').then(module => ({ default: (module as any).default ?? (module as any).Users }) as { default: ComponentType<any> }));
const AdminBlocks = lazy(() => import('../pages/admin/Blocks').then(module => ({ default: (module as any).default ?? (module as any).Blocks }) as { default: ComponentType<any> }));
const AdminAssignments = lazy(() => import('../pages/admin/Assignments').then(module => ({ default: (module as any).default ?? (module as any).Assignments }) as { default: ComponentType<any> }));
const AdminSettings = lazy(() => import('../pages/admin/Settings').then(module => ({ default: (module as any).default ?? (module as any).Settings }) as { default: ComponentType<any> }));

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
        <Route element={<Layout />}>
          {/* Reporter Routes */}
          <Route path="/reporter/*" element={
            <ProtectedRoute requiredRole="reporter">
              <Routes>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="new-report" element={<NewReport />} />
                <Route path="reports" element={<MyReports />} />
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
                <Route path="pending" element={<PendingApprovals />} />
                <Route path="reports/:id" element={<ReviewReport />} />
                <Route path="blocks" element={<AssignedBlocks />} />
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
                <Route path="jobs" element={<MyJobs />} />
                <Route path="jobs/:id" element={<JobDetails />} />
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
                <Route path="users" element={<AdminUsers />} />
                <Route path="blocks" element={<AdminBlocks />} />
                <Route path="assignments" element={<AdminAssignments />} />
                <Route path="config" element={<AdminSettings />} />
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
        </Route>

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
      // Prevent infinite redirect loop if role is unrecognized but user is authenticated
      return <Navigate to="/unauthorized" replace />;
  }
};

export default PrivateRoutes;