import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { useApp } from '../../contexts/AppContext';
import { mockUsers } from '../../utils/mockData';

export function LoginPage() {
  const { setUser, language, setLanguage, syncStatus, t } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate AASTU email
    if (!email.endsWith('@aastu.edu.et')) {
      setError(t(
        'Please use your AASTU email address (@aastu.edu.et)',
        'እባክዎን የAASU ኢሜይል አድራሻዎን ይጠቀሙ (@aastu.edu.et)'
      ));
      return;
    }

    setLoading(true);

    // Simulate login
    setTimeout(() => {
      const user = mockUsers.find(u => u.email === email);
      if (user) {
        setUser(user);
      } else {
        setError(t('Invalid credentials', 'ልክ ያልሆነ ምስክርነት'));
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4 py-8">
      <div className="w-full max-w-md">
        {/* Offline Indicator */}
        {!syncStatus.isOnline && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-[var(--color-warning)] bg-opacity-10 border border-[var(--color-warning)] rounded-lg">
            <WifiOff className="w-5 h-5 text-[var(--color-warning)]" />
            <span className="text-sm text-[var(--color-text-primary)]">
              {t('You are currently offline', 'በአሁኑ ጊዜ ከመስመር ውጭ ነዎት')}
            </span>
          </div>
        )}

        {/* Login Card */}
        <div className="bg-[var(--color-surface-elevated)] rounded-lg shadow-[var(--shadow-xl)] border border-[var(--color-border)] p-8">
          {/* Logo & Branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--color-primary)] rounded-xl mb-4">
              <span className="text-white font-bold text-2xl">AA</span>
            </div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-2">
              {t('AASTU Facilities', 'የአ.አ.ሳ.ዩ. መገልገያዎች')}
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              {t('Management System', 'አስተዳደር ስርዓት')}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div
                className="flex items-start gap-2 p-3 bg-[var(--color-danger)] bg-opacity-10 border border-[var(--color-danger)] rounded-lg"
                role="alert"
              >
                <AlertCircle className="w-5 h-5 text-[var(--color-danger)] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-[var(--color-text-primary)]">{error}</span>
              </div>
            )}

            <Input
              type="email"
              label={t('Email Address', 'የኢሜይል አድራሻ')}
              placeholder={t('your.email@aastu.edu.et', 'የእርስዎ.ኢሜይል@aastu.edu.et')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-5 h-5" />}
              required
              fullWidth
              autoComplete="email"
            />

            <Input
              type="password"
              label={t('Password', 'የይለፍ ቃል')}
              placeholder={t('Enter your password', 'የይለፍ ቃልዎን ያስገቡ')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-5 h-5" />}
              required
              fullWidth
              autoComplete="current-password"
            />

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
            >
              {t('Sign In', 'ግባ')}
            </Button>
          </form>

          {/* Language Toggle */}
          <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
            <button
              onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
              className="w-full text-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
            >
              {language === 'en' ? 'ወደ አማርኛ ይቀይሩ' : 'Switch to English'}
            </button>
          </div>

          {/* Demo Credentials */}
          <div className="mt-4 p-3 bg-[var(--color-surface)] rounded-lg">
            <p className="text-xs text-[var(--color-text-secondary)] mb-2">
              {t('Demo Credentials:', 'የማሳያ ምስክሮች:')}
            </p>
            <ul className="text-xs text-[var(--color-text-tertiary)] space-y-1">
              <li>Reporter: john.doe@aastu.edu.et</li>
              <li>Coordinator: coordinator@aastu.edu.et</li>
              <li>Fixer: fixer@aastu.edu.et</li>
              <li>Admin: admin@aastu.edu.et</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-[var(--color-text-tertiary)] mt-6">
          {t(
            '© 2026 Addis Ababa Science and Technology University',
            '© 2026 አዲስ አበባ ሳይንስና ቴክኖሎጂ ዩኒቨርሲቲ'
          )}
        </p>
      </div>
    </div>
  );
}
