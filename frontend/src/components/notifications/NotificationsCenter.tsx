import React, { useState } from 'react';
import { X, Bell, AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Card } from '../shared/Card';
import { EmptyState } from '../shared/EmptyState';
import { useApp } from '../../contexts/AppContext';
import type { Notification, NotificationType } from '../../types';
import { mockNotifications } from '../../utils/mockData';

interface NotificationsCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsCenter({ isOpen, onClose }: NotificationsCenterProps) {
  const { language, t } = useApp();
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');
  const [notifications, setNotifications] = useState(mockNotifications);

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'alert':
        return <Bell className="w-5 h-5 text-[var(--color-danger)]" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-[var(--color-warning)]" />;
      case 'info':
        return <Info className="w-5 h-5 text-[var(--color-secondary)]" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-[var(--color-success)]" />;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
        onClick={onClose}
      />

      {/* Notifications Panel */}
      <div
        className={`
          fixed top-0 right-0 z-50 h-screen w-full sm:w-96
          bg-[var(--color-surface-elevated)] border-l border-[var(--color-border)]
          shadow-[var(--shadow-xl)] transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {t('Notifications', 'ማሳወቂያዎች')}
            </h2>
            {unreadCount > 0 && (
              <p className="text-sm text-[var(--color-text-secondary)]">
                {unreadCount} {t('unread', 'ያልተነበቡ')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
              >
                {t('Mark all read', 'ሁሉንም እንደተነበበ ምልክት አድርግ')}
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
              aria-label={t('Close notifications', 'ማሳወቂያዎችን ዝጋ')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-[var(--color-border)]">
          <div className="flex gap-2 overflow-x-auto">
            <Button
              variant={filter === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              {t('All', 'ሁሉም')}
            </Button>
            <Button
              variant={filter === 'alert' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('alert')}
            >
              {t('Alerts', 'ማንቂያዎች')}
            </Button>
            <Button
              variant={filter === 'warning' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('warning')}
            >
              {t('Warnings', 'ማስጠንቀቂያዎች')}
            </Button>
            <Button
              variant={filter === 'info' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('info')}
            >
              {t('Info', 'መረጃ')}
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto h-[calc(100vh-180px)]">
          {filteredNotifications.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={<Bell className="w-16 h-16" />}
                title={t('No notifications', 'ምንም ማሳወቂያዎች የሉም')}
                description={t(
                  'You\'re all caught up!',
                  'ሁሉንም አይተዋል!'
                )}
              />
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`
                    p-4 hover:bg-[var(--color-surface)] transition-colors cursor-pointer
                    ${!notification.read ? 'bg-[var(--color-primary)] bg-opacity-5' : ''}
                  `}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-medium text-[var(--color-text-primary)]">
                          {language === 'am' && notification.titleAm 
                            ? notification.titleAm 
                            : notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                        {language === 'am' && notification.messageAm 
                          ? notification.messageAm 
                          : notification.message}
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                      {notification.actionUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                        >
                          {t('View Details', 'ዝርዝሮችን ይመልከቱ')}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
