import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building } from 'lucide-react';
import LoginForm from '../../components/auth/LoginForm';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

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
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Branding & Info */}
      <div className="md:w-1/2 bg-gradient-to-br from-primary to-primary-dark text-primary-foreground p-8 md:p-12">
        <div className="max-w-md mx-auto h-full flex flex-col justify-center">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Building className="h-10 w-10" />
              <div>
                <h1 className="text-3xl font-bold">AASTU FMS</h1>
                <p className="text-primary-foreground/80">Facilities Management System</p>
              </div>
            </div>
            
            <p className="text-lg mb-6">
              Streamlining maintenance requests and facility management across Addis Ababa Science & Technology University
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-primary/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2">For Students & Staff</h3>
              <p className="text-sm opacity-90">
                Submit maintenance requests, track progress, and provide feedback
              </p>
            </div>

            <div className="bg-primary/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2">For Coordinators</h3>
              <p className="text-sm opacity-90">
                Review and prioritize reports, assign to maintenance teams
              </p>
            </div>

            <div className="bg-primary/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2">For Maintenance Teams</h3>
              <p className="text-sm opacity-90">
                Receive assignments, update status, and complete repairs
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="md:w-1/2 bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Welcome Back
            </h2>
            <p className="text-muted-foreground">
              Sign in to your AASTU Facilities Management account
            </p>
          </div>

          <LoginForm />

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Need help? Contact IT Support at{' '}
              <a 
                href="mailto:itsupport@aastu.edu.et" 
                className="text-primary hover:underline"
              >
                itsupport@aastu.edu.et
              </a>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              © {new Date().getFullYear()} AASTU. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;