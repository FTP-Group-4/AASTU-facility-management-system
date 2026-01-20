import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Button from '../common/UI/Button';
import Input from '../common/UI/Input';
import Alert from '../common/UI/Alert';
import { useAuth } from '../../hooks/useAuth';
import AuthService from '../../services/authService';
import { cn } from '../../lib/utils';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};

    // Validate email
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!AuthService.validateAASTUEmail(email)) {
      errors.email = 'Please use an AASTU email address (@aastu.edu.et or @aastustudent.edu.et)';
    }

    // Validate password
    if (!password.trim()) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      await login(email, password, rememberMe);
      
      // Redirect to the intended page or dashboard
      navigate(from, { replace: true });
    } catch (err: any) {
      // Error is already set by AuthContext
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6 animate-fade-in">
          <AlertCircle className="h-4 w-4" />
          <Alert.Title>Login Error</Alert.Title>
          <Alert.Description>{error}</Alert.Description>
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Email Input */}
          <Input
            label="Email Address"
            type="email"
            placeholder="user@aastu.edu.et"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={formErrors.email}
            leftIcon={<Mail className="w-4 h-4" />}
            disabled={isLoading}
            autoComplete="email"
            required
          />

          {/* Password Input */}
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={formErrors.password}
              leftIcon={<Lock className="w-4 h-4" />}
              disabled={isLoading}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              disabled={isLoading}
            />
            <span className="text-sm text-muted-foreground">Remember me</span>
          </label>

          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-primary hover:text-primary-dark transition-colors"
            disabled={isLoading}
          >
            Forgot password?
          </button>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Use your AASTU email address to sign in
          </p>
          <div className="mt-2 text-xs text-muted-foreground space-y-1">
            <p>• Students: @aastustudent.edu.et</p>
            <p>• Staff & Faculty: @aastu.edu.et</p>
          </div>
        </div>
      </form>

      {/* Demo Credentials (for development only) */}
      {import.meta.env.DEV && (
        <div className="mt-8 pt-6 border-t border-border">
          <h4 className="text-sm font-medium mb-2">Demo Credentials:</h4>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Reporter:</span>
              <span>student@aastustudent.edu.et</span>
            </div>
            <div className="flex justify-between">
              <span>Coordinator:</span>
              <span>coordinator@aastu.edu.et</span>
            </div>
            <div className="flex justify-between">
              <span>Admin:</span>
              <span>admin@aastu.edu.et</span>
            </div>
            <div className="text-center mt-2">
              <span>Password for all: </span>
              <code className="bg-muted px-2 py-1 rounded">password123</code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginForm;