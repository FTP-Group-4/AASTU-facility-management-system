import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import Button from '../../components/common/UI/Button';
import Input from '../../components/common/UI/Input';
import Alert from '../../components/common/UI/Alert';
import { authApi } from '../../api/auth/authApi';
import AuthService from '../../services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState<{ email?: string }>({});
  
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const errors: { email?: string } = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!AuthService.validateAASTUEmail(email)) {
      errors.email = 'Please use an AASTU email address';
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
    setError(null);
    setSuccess(false);

    try {
      // This is a mock API call - replace with actual implementation
      await authApi.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
      <div className="w-full max-w-md bg-card rounded-lg shadow-lg p-8">
        {/* Back Button */}
        <button
          onClick={handleBackToLogin}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Forgot Password
          </h1>
          <p className="text-muted-foreground">
            Enter your AASTU email address to receive a password reset link
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <Alert variant="success" className="mb-6 animate-fade-in">
            <CheckCircle className="h-4 w-4" />
            <Alert.Title>Email Sent</Alert.Title>
            <Alert.Description>
              If an account exists with {email}, you will receive a password reset link shortly.
              Check your inbox and follow the instructions.
            </Alert.Description>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-6 animate-fade-in">
            <Alert.Title>Error</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert>
        )}

        {/* Form */}
        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="bg-success-light text-success rounded-lg p-4">
              <CheckCircle className="w-12 h-12 mx-auto mb-3" />
              <p className="font-medium">Check your email</p>
              <p className="text-sm mt-1">
                We've sent password reset instructions to your email address.
              </p>
            </div>
            
            <Button
              onClick={handleBackToLogin}
              variant="outline"
              className="w-full"
            >
              Return to Login
            </Button>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            Didn't receive the email? Check your spam folder or contact{' '}
            <a 
              href="mailto:itsupport@aastu.edu.et" 
              className="text-primary hover:underline"
            >
              IT Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;