import React, { useState } from 'react';
import { Plus, Search, Filter, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '../shared/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../shared/Card';
import { Input } from '../shared/Input';
import { EmptyState } from '../shared/EmptyState';
import { ReportCard } from '../reports/ReportCard';
import { ReportSubmissionModal, ReportFormData } from '../reports/ReportSubmissionModal';
import { useApp } from '../../contexts/AppContext';
import type { Report } from '../../types';
import { mockReports } from '../../utils/mockData';

interface ReporterDashboardProps {
  onViewReport: (report: Report) => void;
}

export function ReporterDashboard({ onViewReport }: ReporterDashboardProps) {
  const { user, syncStatus, t } = useApp();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Filter reports for current user
  const userReports = mockReports.filter(r => r.reporterId === user?.id);

  const stats = {
    total: userReports.length,
    submitted: userReports.filter(r => r.status === 'submitted').length,
    inProgress: userReports.filter(r => r.status === 'in-progress').length,
    completed: userReports.filter(r => r.status === 'completed').length
  };

  const filteredReports = userReports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || report.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleSubmitReport = (data: ReportFormData) => {
    console.log('New report submitted:', data);
    // In a real app, this would call an API
    setShowSubmitModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Offline Indicator */}
      {!syncStatus.isOnline && (
        <div className="bg-[var(--color-warning)] bg-opacity-10 border border-[var(--color-warning)] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[var(--color-warning)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">
                {t('Working Offline', 'ከመስመር ውጭ በመስራት ላይ')}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                {t(
                  'You can still submit reports. They will be synced when connection is restored.',
                  'አሁንም ሪፖርቶችን ማስገባት ይችላሉ። ግንኙነት ሲመለስ ይመሳሰላሉ።'
                )}
              </p>
              {syncStatus.pendingActions > 0 && (
                <p className="text-sm text-[var(--color-warning)] mt-2">
                  {syncStatus.pendingActions} {t('pending actions', 'በመጠባበቅ ላይ ያሉ እርምጃዎች')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {t('Total Reports', 'ጠቅላላ ሪፖርቶች')}
              </p>
              <p className="text-2xl font-semibold text-[var(--color-text-primary)] mt-1">
                {stats.total}
              </p>
            </div>
            <div className="p-2 bg-[var(--color-primary)] bg-opacity-10 rounded-lg">
              <Clock className="w-5 h-5 text-[var(--color-primary)]" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {t('Submitted', 'ቀረቡ')}
              </p>
              <p className="text-2xl font-semibold text-[var(--color-text-primary)] mt-1">
                {stats.submitted}
              </p>
            </div>
            <div className="p-2 bg-blue-500 bg-opacity-10 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {t('In Progress', 'በስራ ላይ')}
              </p>
              <p className="text-2xl font-semibold text-[var(--color-text-primary)] mt-1">
                {stats.inProgress}
              </p>
            </div>
            <div className="p-2 bg-cyan-500 bg-opacity-10 rounded-lg">
              <Clock className="w-5 h-5 text-cyan-500" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {t('Completed', 'ተጠናቀቁ')}
              </p>
              <p className="text-2xl font-semibold text-[var(--color-text-primary)] mt-1">
                {stats.completed}
              </p>
            </div>
            <div className="p-2 bg-[var(--color-success)] bg-opacity-10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-[var(--color-success)]" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="primary"
          size="lg"
          onClick={() => setShowSubmitModal(true)}
          icon={<Plus className="w-5 h-5" />}
          className="flex-1 sm:flex-initial"
        >
          {t('Report New Issue', 'አዲስ ጉዳይ ሪፖርት ያድርጉ')}
        </Button>
      </div>

      {/* Search and Filter */}
      <Card padding="md">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder={t('Search by ticket number or title...', 'በቲኬት ቁጥር ወይም ርዕስ ይፈልጉ...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5" />}
              fullWidth
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            <option value="all">{t('All Status', 'ሁሉም ሁኔታዎች')}</option>
            <option value="submitted">{t('Submitted', 'ቀረቡ')}</option>
            <option value="in-progress">{t('In Progress', 'በስራ ላይ')}</option>
            <option value="completed">{t('Completed', 'ተጠናቀቁ')}</option>
            <option value="rejected">{t('Rejected', 'ተቀባይነት አላገኙም')}</option>
          </select>
        </div>
      </Card>

      {/* Reports List */}
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
          {t('My Reports', 'የእኔ ሪፖርቶች')}
        </h2>
        
        {filteredReports.length === 0 ? (
          <Card padding="lg">
            <EmptyState
              icon={<AlertCircle className="w-16 h-16" />}
              title={t('No reports found', 'ምንም ሪፖርቶች አልተገኙም')}
              description={t(
                'Start by reporting a new issue using the button above.',
                'ከላይ ያለውን ቁልፍ በመጠ��ም አዲስ ጉዳይ በማሳወቅ ይጀምሩ።'
              )}
              action={{
                label: t('Report New Issue', 'አዲስ ጉዳይ ሪፖርት ያድርጉ'),
                onClick: () => setShowSubmitModal(true)
              }}
            />
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredReports.map(report => (
              <ReportCard
                key={report.id}
                report={report}
                onClick={onViewReport}
              />
            ))}
          </div>
        )}
      </div>

      {/* Report Submission Modal */}
      <ReportSubmissionModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSubmit={handleSubmitReport}
      />
    </div>
  );
}
