import React, { useState } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { LoginPage } from './components/auth/LoginPage';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ReporterDashboard } from './components/dashboard/ReporterDashboard';
import { CoordinatorDashboard } from './components/dashboard/CoordinatorDashboard';
import { FixerDashboard } from './components/dashboard/FixerDashboard';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { ReportDetailsPage } from './components/reports/ReportDetailsPage';
import { NotificationsCenter } from './components/notifications/NotificationsCenter';
import { SettingsPage } from './components/settings/SettingsPage';
import { SyncIndicator } from './components/shared/SyncIndicator';
import type { Report } from './types';
import { mockNotifications } from './utils/mockData';
// import 'index.css';

function AppContent() {
  const { user } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Determine which dashboard to show based on user role
  const renderDashboard = () => {
    if (selectedReport) {
      return (
        <ReportDetailsPage
          report={selectedReport}
          onBack={() => setSelectedReport(null)}
        />
      );
    }

    if (currentView === 'settings') {
      return <SettingsPage />;
    }

    if (!user) return null;

    switch (user.role) {
      case 'reporter':
        return <ReporterDashboard onViewReport={setSelectedReport} />;
      case 'coordinator':
        return <CoordinatorDashboard onViewReport={setSelectedReport} />;
      case 'fixer':
        return <FixerDashboard onViewReport={setSelectedReport} />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <ReporterDashboard onViewReport={setSelectedReport} />;
    }
  };

  if (!user) {
    return <LoginPage />;
  }

  const unreadNotifications = mockNotifications.filter(n => n.userId === user.id && !n.read).length;

  return (
    <div className="min-h-screen flex bg-[var(--color-background)]">
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          setSelectedReport(null);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onNotificationsClick={() => setNotificationsOpen(true)}
          unreadCount={unreadNotifications}
        />

        {/* Main Content */}
        <main
          id="main-content"
          className="flex-1 overflow-auto p-4 md:p-6 lg:p-8"
          role="main"
        >
          <div className="max-w-7xl mx-auto">
            {renderDashboard()}
          </div>
        </main>
      </div>

      {/* Notifications Panel */}
      <NotificationsCenter
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      {/* Sync Indicator */}
      <SyncIndicator />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}