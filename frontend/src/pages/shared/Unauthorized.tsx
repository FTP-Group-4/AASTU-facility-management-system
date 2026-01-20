import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Home, LogIn } from 'lucide-react';
import Button from '../../components/common/UI/Button';
import { useAuth } from '../../hooks/useAuth';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleGoHome = () => {
    if (isAuthenticated) {
      navigate('/');
    } else {
      navigate('/login');
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-danger/5 to-danger/10 p-4">
      <div className="w-full max-w-md bg-card rounded-lg shadow-lg p-8 text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-danger" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Access Denied
        </h1>
        
        <p className="text-muted-foreground mb-6">
          You don't have permission to access this page with your current role.
        </p>

        {/* Role Information */}
        <div className="bg-muted rounded-lg p-4 mb-6">
          <p className="text-sm font-medium mb-1">Current Access Level</p>
          <p className="text-xs text-muted-foreground">
            Please contact your administrator if you believe this is an error.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleGoHome}
            className="w-full flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go to Home
          </Button>

          {isAuthenticated ? (
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign in with different account
            </Button>
          ) : (
            <Button
              onClick={handleLogin}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>
          )}
        </div>

        {/* Contact Info */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Need access? Contact{' '}
            <a 
              href="mailto:fms-admin@aastu.edu.et" 
              className="text-primary hover:underline"
            >
              FMS Administrator
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;