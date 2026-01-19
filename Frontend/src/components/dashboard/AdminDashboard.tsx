import React, { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  Building2, 
  Settings as SettingsIcon,
  TrendingUp,
  Download,
  Edit,
  Trash2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../shared/Card';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { useApp } from '../../contexts/AppContext';
import { mockStats, mockUsers, mockBlocks, mockPerformanceMetrics } from '../../utils/mockData';

export function AdminDashboard() {
  const { language, t } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'blocks' | 'analytics'>('overview');

  const tabs = [
    { id: 'overview', label: t('Overview', 'አጠቃላይ እይታ'), icon: BarChart3 },
    { id: 'users', label: t('Users', 'ተጠቃሚዎች'), icon: Users },
    { id: 'blocks', label: t('Blocks', 'ብሎኮች'), icon: Building2 },
    { id: 'analytics', label: t('Analytics', 'ትንተና'), icon: TrendingUp }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="md">
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t('Total Reports', 'ጠቅላላ ሪፖርቶች')}
            </p>
            <p className="text-2xl font-semibold text-[var(--color-text-primary)] mt-1">
              {mockStats.total}
            </p>
            <p className="text-xs text-[var(--color-success)] mt-1">
              +12% {t('this month', 'በዚህ ወር')}
            </p>
          </div>
        </Card>

        <Card padding="md">
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t('Active Users', 'ንቁ ተጠቃሚዎች')}
            </p>
            <p className="text-2xl font-semibold text-[var(--color-text-primary)] mt-1">
              {mockUsers.length}
            </p>
          </div>
        </Card>

        <Card padding="md">
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t('Avg Resolution Time', 'አማ መፍታት ጊዜ')}
            </p>
            <p className="text-2xl font-semibold text-[var(--color-text-primary)] mt-1">
              {mockStats.avgResolutionTime}h
            </p>
          </div>
        </Card>

        <Card padding="md">
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t('SLA Compliance', 'SLA ተገዢነት')}
            </p>
            <p className="text-2xl font-semibold text-[var(--color-text-primary)] mt-1">
              {mockStats.slaCompliance}%
            </p>
          </div>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('Reports by Status', 'ሪፖርቶች በሁኔታ')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {t('Submitted', 'ቀረቡ')}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-[var(--color-surface)] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${(mockStats.submitted / mockStats.total) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-[var(--color-text-primary)] w-8">
                    {mockStats.submitted}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {t('In Progress', 'በስራ ላይ')}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-[var(--color-surface)] rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500" style={{ width: `${(mockStats.inProgress / mockStats.total) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-[var(--color-text-primary)] w-8">
                    {mockStats.inProgress}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {t('Completed', 'ተጠናቀዋል')}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-[var(--color-surface)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--color-success)]" style={{ width: `${(mockStats.completed / mockStats.total) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-[var(--color-text-primary)] w-8">
                    {mockStats.completed}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('Top Performers', 'ከፍተኛ አፈጻጸም')} </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockPerformanceMetrics.map((metric, idx) => {
                const user = mockUsers.find(u => u.id === metric.userId);
                return (
                  <div key={metric.userId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-[var(--color-text-tertiary)]">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-medium text-[var(--color-text-primary)]">
                          {user?.name}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          {metric.completed} {t('completed', 'ተጠናቀቁ')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {metric.slaCompliance}%
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {t('SLA Rate', 'SLA መጠን')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button icon={<Download className="w-4 h-4" />}>
          {t('Export Report', 'ሪፖርት ላክ')}
        </Button>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
          {t('User Management', 'የተጠቃሚ አስተዳደር')}
        </h3>
        <Button variant="primary">
          {t('Add User', 'ተጠቃሚ አክል')}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-primary)]">
                    {t('Name', 'ስም')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-primary)]">
                    {t('Email', 'ኢሜይል')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-primary)]">
                    {t('Role', 'ሚና')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-primary)]">
                    {t('Status', 'ሁኔታ')}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-[var(--color-text-primary)]">
                    {t('Actions', 'እርምጃዎች')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {mockUsers.map(user => (
                  <tr key={user.id} className="hover:bg-[var(--color-surface)] transition-colors">
                    <td className="px-4 py-3 text-sm text-[var(--color-text-primary)]">
                      {user.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant="default">{user.role}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant="status" status="completed">Active</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1 hover:bg-[var(--color-surface)] rounded">
                          <Edit className="w-4 h-4 text-[var(--color-text-secondary)]" />
                        </button>
                        <button className="p-1 hover:bg-[var(--color-surface)] rounded">
                          <Trash2 className="w-4 h-4 text-[var(--color-danger)]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderBlocks = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
          {t('Block Management', 'የብሎክ አስተዳደር')}
        </h3>
        <Button variant="primary">
          {t('Add Block', 'ብሎክ አክል')}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockBlocks.map(block => {
          const coordinator = mockUsers.find(u => u.id === block.coordinatorId);
          return (
            <Card key={block.id} padding="md">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-[var(--color-text-primary)]">
                      {language === 'am' && block.nameAm ? block.nameAm : block.name}
                    </h4>
                    <p className="text-sm text-[var(--color-text-secondary)]">{block.code}</p>
                  </div>
                  <Badge variant="status" status={block.status === 'active' ? 'completed' : 'rejected'}>
                    {block.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-secondary)]">
                      {t('Floors', 'ፎቆች')}:
                    </span>
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {block.floors}
                    </span>
                  </div>
                  {coordinator && (
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--color-text-secondary)]">
                        {t('Coordinator', 'አስተባባሪ')}:
                      </span>
                      <span className="font-medium text-[var(--color-text-primary)]">
                        {coordinator.name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" fullWidth>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" fullWidth>
                    <Trash2 className="w-4 h-4 text-[var(--color-danger)]" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
        {t('System Analytics', 'የስርዓት ትንተና')}
      </h3>

      <Card>
        <CardHeader>
          <CardTitle>{t('Performance Trends', 'የአፈጻጸም አዝማሚያዎች')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-[var(--color-text-secondary)]">
            {t('Chart visualization would be displayed here', 'የገበታ ምስላዊነት እዚህ ይታያል')}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('Category Distribution', 'የምድብ ስርጭት')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center text-[var(--color-text-secondary)]">
              {t('Pie chart here', 'የፓይ ገበታ እዚህ')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('Resolution Times', 'የመፍታት ጊዜዎች')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center text-[var(--color-text-secondary)]">
              {t('Bar chart here', 'የባር ገበታ እዚህ')}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-[var(--color-border)] overflow-x-auto">
        <nav className="flex gap-1" role="tablist">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }
                `}
                role="tab"
                aria-selected={activeTab === tab.id}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div role="tabpanel">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'blocks' && renderBlocks()}
        {activeTab === 'analytics' && renderAnalytics()}
      </div>
    </div>
  );
}
