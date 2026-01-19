import React, { useState } from 'react';
import { User, Bell, Palette, Shield, Globe } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { useApp } from '../../contexts/AppContext';
import type { Theme, Language } from '../../types';

export function SettingsPage() {
  const { user, language, setLanguage, theme, setTheme, settings, updateSettings, t } = useApp();
  const [activeSection, setActiveSection] = useState<'profile' | 'preferences' | 'notifications' | 'security'>('profile');

  const sections = [
    { id: 'profile', label: t('Profile', 'መገለጫ'), icon: User },
    { id: 'preferences', label: t('Preferences', 'ምርጫዎች'), icon: Palette },
    { id: 'notifications', label: t('Notifications', 'ማሳወቂያዎች'), icon: Bell },
    { id: 'security', label: t('Security', 'ደህንነት'), icon: Shield }
  ];

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    updateSettings({ theme: newTheme });
  };

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    updateSettings({ language: newLang });
  };

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-3xl font-semibold">
          {user?.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
            {language === 'am' && user?.nameAm ? user.nameAm : user?.name}
          </h3>
          <p className="text-[var(--color-text-secondary)]">{user?.email}</p>
          <p className="text-sm text-[var(--color-text-tertiary)] capitalize mt-1">
            {user?.role}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Input
          label={t('Full Name', 'ሙሉ ስም')}
          value={user?.name || ''}
          fullWidth
        />
        
        {language === 'am' && (
          <Input
            label={t('Name in Amharic', 'በአማርኛ ስም')}
            value={user?.nameAm || ''}
            fullWidth
          />
        )}

        <Input
          label={t('Email Address', 'የኢሜይል አድራሻ')}
          type="email"
          value={user?.email || ''}
          disabled
          fullWidth
        />

        <Input
          label={t('Phone Number', 'ስልክ ቁጥር')}
          type="tel"
          value={user?.phone || ''}
          fullWidth
        />

        {user?.block && (
          <Input
            label={t('Block', 'ብሎክ')}
            value={user.block}
            disabled
            fullWidth
          />
        )}

        <Button variant="primary">
          {t('Save Changes', 'ለውጦችን አስቀምጥ')}
        </Button>
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="space-y-6">
      {/* Language */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
          <Globe className="w-4 h-4 inline mr-2" />
          {t('Language', 'ቋንቋ')}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleLanguageChange('en')}
            className={`
              p-4 rounded-lg border-2 transition-all text-left
              ${language === 'en'
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] bg-opacity-10'
                : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
              }
            `}
          >
            <p className="font-medium text-[var(--color-text-primary)]">English</p>
            <p className="text-sm text-[var(--color-text-secondary)]">English Language</p>
          </button>
          <button
            onClick={() => handleLanguageChange('am')}
            className={`
              p-4 rounded-lg border-2 transition-all text-left
              ${language === 'am'
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] bg-opacity-10'
                : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
              }
            `}
          >
            <p className="font-medium text-[var(--color-text-primary)]">አማርኛ</p>
            <p className="text-sm text-[var(--color-text-secondary)]">የአማርኛ ቋንቋ</p>
          </button>
        </div>
      </div>

      {/* Theme */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
          <Palette className="w-4 h-4 inline mr-2" />
          {t('Theme', 'ገጽታ')}
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleThemeChange('light')}
            className={`
              p-4 rounded-lg border-2 transition-all
              ${theme === 'light'
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] bg-opacity-10'
                : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
              }
            `}
          >
            <div className="w-full h-12 bg-white border border-gray-300 rounded mb-2"></div>
            <p className="text-sm font-medium text-[var(--color-text-primary)] text-center">
              {t('Light', 'ብሩህ')}
            </p>
          </button>
          <button
            onClick={() => handleThemeChange('dark')}
            className={`
              p-4 rounded-lg border-2 transition-all
              ${theme === 'dark'
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] bg-opacity-10'
                : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
              }
            `}
          >
            <div className="w-full h-12 bg-gray-900 border border-gray-700 rounded mb-2"></div>
            <p className="text-sm font-medium text-[var(--color-text-primary)] text-center">
              {t('Dark', 'ጨለማ')}
            </p>
          </button>
          <button
            onClick={() => handleThemeChange('high-contrast')}
            className={`
              p-4 rounded-lg border-2 transition-all
              ${theme === 'high-contrast'
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] bg-opacity-10'
                : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
              }
            `}
          >
            <div className="w-full h-12 bg-black border-2 border-white rounded mb-2"></div>
            <p className="text-sm font-medium text-[var(--color-text-primary)] text-center">
              {t('High Contrast', 'ከፍተኛ ንጽፅር')}
            </p>
          </button>
        </div>
      </div>

      {/* Accessibility */}
      <div>
        <h4 className="font-medium text-[var(--color-text-primary)] mb-3">
          {t('Accessibility', 'ተደራሽነት')}
        </h4>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 bg-[var(--color-surface)] rounded-lg cursor-pointer">
            <span className="text-[var(--color-text-primary)]">
              {t('Large Text', 'ትልቅ ጽሁፍ')}
            </span>
            <input
              type="checkbox"
              checked={settings.accessibility.largeText}
              onChange={(e) => updateSettings({
                accessibility: { ...settings.accessibility, largeText: e.target.checked }
              })}
              className="w-5 h-5"
            />
          </label>
          <label className="flex items-center justify-between p-3 bg-[var(--color-surface)] rounded-lg cursor-pointer">
            <span className="text-[var(--color-text-primary)]">
              {t('Screen Reader Support', 'የማያ ገጽ አንባቢ ድጋፍ')}
            </span>
            <input
              type="checkbox"
              checked={settings.accessibility.screenReader}
              onChange={(e) => updateSettings({
                accessibility: { ...settings.accessibility, screenReader: e.target.checked }
              })}
              className="w-5 h-5"
            />
          </label>
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-4">
      <p className="text-[var(--color-text-secondary)]">
        {t('Configure how you receive notifications', 'ማሳወቂያዎችን እንዴት እንደሚቀበሉ ያዋቅሩ')}
      </p>

      <div className="space-y-3">
        <label className="flex items-center justify-between p-4 bg-[var(--color-surface)] rounded-lg cursor-pointer">
          <div>
            <p className="font-medium text-[var(--color-text-primary)]">
              {t('Email Notifications', 'የኢሜይል ማሳወቂያዎች')}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t('Receive notifications via email', 'በኢሜይል ማሳወቂያዎችን ይቀበሉ')}
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.notifications.email}
            onChange={(e) => updateSettings({
              notifications: { ...settings.notifications, email: e.target.checked }
            })}
            className="w-5 h-5"
          />
        </label>

        <label className="flex items-center justify-between p-4 bg-[var(--color-surface)] rounded-lg cursor-pointer">
          <div>
            <p className="font-medium text-[var(--color-text-primary)]">
              {t('Push Notifications', 'የመግፊያ ማሳወቂያዎች')}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t('Receive push notifications in browser', 'በአሳሽ ውስጥ የመግፊያ ማሳወቂያዎችን ይቀበሉ')}
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.notifications.push}
            onChange={(e) => updateSettings({
              notifications: { ...settings.notifications, push: e.target.checked }
            })}
            className="w-5 h-5"
          />
        </label>

        <label className="flex items-center justify-between p-4 bg-[var(--color-surface)] rounded-lg cursor-pointer">
          <div>
            <p className="font-medium text-[var(--color-text-primary)]">
              {t('SMS Notifications', 'የኤስ ኤም ኤስ ማሳወቂያዎች')}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t('Receive notifications via SMS', 'በኤስ ኤም ኤስ ማሳወቂያዎችን ይቀበሉ')}
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.notifications.sms}
            onChange={(e) => updateSettings({
              notifications: { ...settings.notifications, sms: e.target.checked }
            })}
            className="w-5 h-5"
          />
        </label>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-[var(--color-text-primary)] mb-4">
          {t('Change Password', 'የይለፍ ቃል ቀይር')}
        </h4>
        <div className="space-y-4">
          <Input
            type="password"
            label={t('Current Password', 'የአሁኑ የይለፍ ቃል')}
            fullWidth
          />
          <Input
            type="password"
            label={t('New Password', 'አዲስ የይለፍ ቃል')}
            fullWidth
          />
          <Input
            type="password"
            label={t('Confirm New Password', 'አዲሱን የይለፍ ቃል ያረጋግጡ')}
            fullWidth
          />
          <Button variant="primary">
            {t('Update Password', 'የይለፍ ቃል አዘምን')}
          </Button>
        </div>
      </div>

      <div className="pt-6 border-t border-[var(--color-border)]">
        <h4 className="font-medium text-[var(--color-text-primary)] mb-2">
          {t('Active Sessions', 'ንቁ ክፍለ ጊዜዎች')}
        </h4>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          {t('Manage your active sessions across devices', 'በመሳሪያዎች ላይ ያሉ ንቁ ክፍለ ጊዜዎችዎን ያስተዳድሩ')}
        </p>
        <div className="p-4 bg-[var(--color-surface)] rounded-lg">
          <p className="text-sm text-[var(--color-text-primary)]">
            {t('Current Session', 'የአሁኑ ክፍለ ጊዜ')} • {t('Last active: Now', 'መጨረሻ ንቁ: አሁን')}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
        {t('Settings', 'ቅንብሮች')}
      </h1>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {sections.map(section => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                    ${activeSection === section.id
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{section.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <Card padding="lg">
            {activeSection === 'profile' && renderProfile()}
            {activeSection === 'preferences' && renderPreferences()}
            {activeSection === 'notifications' && renderNotifications()}
            {activeSection === 'security' && renderSecurity()}
          </Card>
        </div>
      </div>
    </div>
  );
}
