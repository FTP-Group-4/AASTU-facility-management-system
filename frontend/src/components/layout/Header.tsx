import React, { useState } from 'react';
import { Bell, Menu, Settings, User, LogOut, Wifi, WifiOff } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Button } from '../shared/Button';

interface HeaderProps {
  onMenuClick: () => void;
  onNotificationsClick: () => void;
  unreadCount?: number;
}

export function Header({ onMenuClick, onNotificationsClick, unreadCount = 0 }: HeaderProps) {
  const { user, language, setLanguage, syncStatus, t } = useApp();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLanguageToggle = () => {
    setLanguage(language === 'en' ? 'am' : 'en');
  };

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)] shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Menu & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors md:hidden"
            aria-label={t('Open menu', 'ምናሌ ክፈት')}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--color-primary)] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AA</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-semibold text-[var(--color-text-primary)]">
                {t('AASTU Facilities', 'የአ.አ.ሳ.ዩ. መገልገያዎች')}
              </h1>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {t('Management System', 'አስተዳደር ስርዓት')}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Online Status */}
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--color-surface)]">
            {syncStatus.isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-[var(--color-success)]" />
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {t('Online', 'ኦንላይን')}
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-[var(--color-danger)]" />
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {t('Offline', 'ከመስመር ውጭ')}
                </span>
              </>
            )}
          </div>

          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLanguageToggle}
            aria-label={t('Toggle language', 'ቋንቋ ቀይር')}
          >
            <span className="font-medium">{language === 'en' ? 'አማ' : 'EN'}</span>
          </Button>

          {/* Notifications */}
          <button
            onClick={onNotificationsClick}
            className="relative p-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
            aria-label={t('Notifications', 'ማሳወቂያዎች')}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--color-danger)] text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
              aria-label={t('User menu', 'የተጠቃሚ ምናሌ')}
              aria-expanded={showUserMenu}
            >
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center">
                <span className="text-sm font-medium">
                  {user?.name.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg shadow-[var(--shadow-lg)] animate-slide-down">
                <div className="p-3 border-b border-[var(--color-border)]">
                  <p className="font-medium text-[var(--color-text-primary)]">
                    {language === 'am' && user?.nameAm ? user.nameAm : user?.name}
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{user?.email}</p>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-1 capitalize">
                    {user?.role}
                  </p>
                </div>
                <div className="p-2">
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors text-left"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>{t('Profile', 'መገለጫ')}</span>
                  </button>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors text-left"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="w-4 h-4" />
                    <span>{t('Settings', 'ቅንብሮች')}</span>
                  </button>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-danger)] transition-colors text-left"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('Logout', 'ውጣ')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
