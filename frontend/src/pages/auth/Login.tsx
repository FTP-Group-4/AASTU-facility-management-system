import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building } from 'lucide-react';
import LoginForm from '../../components/auth/LoginForm';
import { useAuth } from '../../hooks/useAuth';

const Login = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return null; // Or show a loading spinner
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mb-4 border border-purple-200">
            <Building className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AASTU FMS</h1>
          <p className="text-gray-600">Facilities Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-500">
              Sign in to your account
            </p>
          </div>

          <LoginForm />

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Need help? Contact IT Support at{' '}
              <a
                href="mailto:itsupport@aastu.edu.et"
                className="text-purple-600 hover:underline font-medium"
              >
                itsupport@aastu.edu.et
              </a>
            </p>
            <p className="text-xs text-gray-400 mt-2">
              © {new Date().getFullYear()} AASTU. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;