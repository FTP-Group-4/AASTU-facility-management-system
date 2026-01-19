import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  Building2,
  ClipboardList,
  Wrench,
  BarChart3,
  X
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import type { UserRole } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
}

export function Sidebar({ isOpen, onClose, currentView, onNavigate }: SidebarProps) {
  const { user, t } = useApp();

  const getMenuItems = (role: UserRole) => {
    const commonItems = [
      { 
        id: 'dashboard', 
        icon: LayoutDashboard, 
        label: t('Dashboard', 'ዳሽቦርድ'),
        roles: ['reporter', 'coordinator', 'fixer', 'admin']
      },
      { 
        id: 'reports', 
        icon: FileText, 
        label: t('Reports', 'ሪፖርቶች'),
        roles: ['reporter', 'coordinator', 'fixer', 'admin']
      }
    ];

    const roleSpecific = {
      coordinator: [
        { id: 'review', icon: ClipboardList, label: t('Review Queue', 'ግምገማ ወረፋ'), roles: ['coordinator'] },
        { id: 'blocks', icon: Building2, label: t('Block Management', 'የብሎክ አስተዳደር'), roles: ['coordinator'] }
      ],
      fixer: [
        { id: 'jobs', icon: Wrench, label: t('My Jobs', 'የእኔ ስራዎች'), roles: ['fixer'] }
      ],
      admin: [
        { id: 'users', icon: Users, label: t('Users', 'ተጠቃሚዎች'), roles: ['admin'] },
        { id: 'blocks', icon: Building2, label: t('Blocks', 'ብሎኮች'), roles: ['admin'] },
        { id: 'analytics', icon: BarChart3, label: t('Analytics', 'ትንተና'), roles: ['admin'] }
      ]
    };

    const items = [...commonItems];
    if (role in roleSpecific) {
      items.push(...roleSpecific[role as keyof typeof roleSpecific]);
    }

    items.push({ 
      id: 'settings', 
      icon: Settings, 
      label: t('Settings', 'ቅንብሮች'),
      roles: ['reporter', 'coordinator', 'fixer', 'admin']
    });

    return items;
  };

  const menuItems = user ? getMenuItems(user.role) : [];

  const handleNavigate = (viewId: string) => {
    onNavigate(viewId);
    onClose();
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50 h-screen
          w-64 bg-[var(--color-surface-elevated)] border-r border-[var(--color-border)]
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] md:hidden">
          <h2 className="font-semibold text-[var(--color-text-primary)]">
            {t('Menu', 'ምናሌ')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
            aria-label={t('Close menu', 'ምናሌ ዝጋ')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 overflow-y-auto h-[calc(100vh-73px)] md:h-screen" aria-label="Main navigation">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavigate(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                      transition-colors duration-200
                      ${isActive 
                        ? 'bg-[var(--color-primary)] text-white' 
                        : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'
                      }
                    `}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
