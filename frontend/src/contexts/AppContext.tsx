import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, Language, Theme, SyncStatus, AppSettings } from '../types';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  syncStatus: SyncStatus;
  setSyncStatus: (status: SyncStatus) => void;
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  t: (en: string, am?: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('light');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    pendingActions: 0,
    syncing: false
  });
  
  const [settings, setSettings] = useState<AppSettings>({
    language: 'en',
    theme: 'light',
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    accessibility: {
      highContrast: false,
      largeText: false,
      screenReader: false
    }
  });

  // Translation helper
  const t = (en: string, am?: string) => {
    return language === 'am' && am ? am : en;
  };

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setSyncStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSyncStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync language and theme with settings
  useEffect(() => {
    setSettings(prev => ({ ...prev, language, theme }));
  }, [language, theme]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.language) setLanguage(newSettings.language);
      if (newSettings.theme) setTheme(newSettings.theme);
      return updated;
    });
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        language,
        setLanguage,
        theme,
        setTheme,
        syncStatus,
        setSyncStatus,
        settings,
        updateSettings,
        t
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
