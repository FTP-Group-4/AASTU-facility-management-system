import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  BarChart3,
  Users
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../shared/Card';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Modal } from '../shared/Modal';
import { useApp } from '../../contexts/AppContext';
import type { Report, ReportStatus } from '../../types';
import { mockReports, mockUsers, formatTimeRemaining } from '../../utils/mockData';

interface CoordinatorDashboardProps {
  onViewReport: (report: Report) => void;
}

export function CoordinatorDashboard({ onViewReport }: CoordinatorDashboardProps) {
  const { language, t } = useApp();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Group reports by status
  const columns: { status: ReportStatus; title: string; titleAm: string; color: string }[] = [
    { status: 'submitted', title: 'Submitted', titleAm: 'ቀረቡ', color: 'bg-blue-500' },
    { status: 'reviewing', title: 'Reviewing', titleAm: 'በግምገማ ላይ', color: 'bg-yellow-500' },
    { status: 'assigned', title: 'Assigned', titleAm: 'ተመድበዋል', color: 'bg-purple-500' },
    { status: 'completed', title: 'Completed', titleAm: 'ተጠናቀዋል', color: 'bg-green-500' }
  ];

  const getReportsByStatus = (status: ReportStatus) => {
    return mockReports.filter(r => r.status === status);
  };

  const handleReviewReport = (report: Report) => {
    setSelectedReport(report);
    setShowReviewModal(true);
  };

  const handleApprove = () => {
    console.log('Approving report:', selectedReport?.id);
    setShowReviewModal(false);
    setSelectedReport(null);
  };

  const handleReject = () => {
    console.log('Rejecting report:', selectedReport?.id);
    setShowReviewModal(false);
    setSelectedReport(null);
  };

  const stats = {
    total: mockReports.length,
    pending: mockReports.filter(r => r.status === 'submitted').length,
    inProgress: mockReports.filter(r => r.status === 'in-progress' || r.status === 'assigned').length,
    completed: mockReports.filter(r => r.status === 'completed').length,
    slaCompliance: 92
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {t('Total', 'ጠቅላላ')}
              </p>
              <p className="text-2xl font-semibold text-[var(--color-text-primary)] mt-1">
                {stats.total}
              </p>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {t('Pending', 'በመጠባበቅ ላይ')}
              </p>
              <p className="text-2xl font-semibold text-[var(--color-text-primary)] mt-1">
                {stats.pending}
              </p>
            </div>
            <div className="p-2 bg-blue-500 bg-opacity-10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-blue-500" />
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
                {t('Completed', 'ተጠናቀዋል')}
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

        <Card padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {t('SLA Compliance', 'SLA ተገዢነት')}
              </p>
              <p className="text-2xl font-semibold text-[var(--color-text-primary)] mt-1">
                {stats.slaCompliance}%
              </p>
            </div>
            <div className="p-2 bg-[var(--color-success)] bg-opacity-10 rounded-lg">
              <BarChart3 className="w-5 h-5 text-[var(--color-success)]" />
            </div>
          </div>
        </Card>
      </div>

      {/* Kanban Board */}
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
          {t('Workflow Board', 'የስራ ሂደት ቦርድ')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map(column => {
            const reports = getReportsByStatus(column.status);
            
            return (
              <div key={column.status} className="flex flex-col gap-3">
                {/* Column Header */}
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${column.color}`} />
                  <h3 className="font-semibold text-[var(--color-text-primary)]">
                    {language === 'am' ? column.titleAm : column.title}
                  </h3>
                  <span className="ml-auto text-sm text-[var(--color-text-tertiary)]">
                    {reports.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-3 min-h-[200px]">
                  {reports.map(report => {
                    const timeRemaining = formatTimeRemaining(report.slaDeadline, language);
                    const isOverdue = report.slaDeadline < new Date() && report.status !== 'completed';

                    return (
                      <Card
                        key={report.id}
                        padding="sm"
                        hoverable
                        onClick={() => handleReviewReport(report)}
                        className="cursor-pointer"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-mono text-[var(--color-text-tertiary)]">
                              {report.ticketNumber}
                            </span>
                            <Badge variant="priority" priority={report.priority}>
                              {report.priority}
                            </Badge>
                          </div>

                          <h4 className="font-medium text-sm text-[var(--color-text-primary)] line-clamp-2">
                            {report.title}
                          </h4>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[var(--color-text-secondary)]">
                              {report.location.block}
                            </span>
                            <span className={isOverdue ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-tertiary)]'}>
                              {timeRemaining}
                            </span>
                          </div>

                          {report.fixer && (
                            <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                              <Users className="w-3 h-3" />
                              <span>{report.fixer.name}</span>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Modal */}
      {selectedReport && (
        <Modal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedReport(null);
          }}
          title={t('Review Report', 'ሪፖርት ይገምግሙ')}
          size="lg"
        >
          <div className="space-y-4">
            <div className="p-4 bg-[var(--color-surface)] rounded-lg space-y-3">
              <div>
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {t('Ticket Number', 'የቲኬት ቁጥር')}
                </span>
                <p className="font-mono text-[var(--color-text-primary)]">
                  {selectedReport.ticketNumber}
                </p>
              </div>

              <div>
                <span className="text-sm text-[var(--color-text-secondary)]">{t('Title', 'ርዕስ')}</span>
                <p className="font-medium text-[var(--color-text-primary)]">{selectedReport.title}</p>
              </div>

              <div>
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {t('Description', 'መግለጫ')}
                </span>
                <p className="text-[var(--color-text-primary)]">{selectedReport.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {t('Category', 'ምድብ')}
                  </span>
                  <p className="text-[var(--color-text-primary)] capitalize">{selectedReport.category}</p>
                </div>
                <div>
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {t('Location', 'ቦታ')}
                  </span>
                  <p className="text-[var(--color-text-primary)]">{selectedReport.location.block}</p>
                </div>
              </div>
            </div>

            {/* Assignment */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                {t('Assign to Fixer', 'ለአስተካካይ ይመድቡ')}
              </label>
              <select className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                <option value="">{t('Select fixer', 'አስተካካይ ይምረጡ')}</option>
                {mockUsers.filter(u => u.role === 'fixer').map(fixer => (
                  <option key={fixer.id} value={fixer.id}>{fixer.name}</option>
                ))}
              </select>
            </div>

            {/* Priority Override */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                {t('Priority Level', 'የቅድሚያ ደረጃ')}
              </label>
              <select className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                <option value="emergency">{t('Emergency', 'የአደጋ ጊዜ')}</option>
                <option value="high">{t('High', 'ከፍተኛ')}</option>
                <option value="medium" selected>{t('Medium', 'መካከለኛ')}</option>
                <option value="low">{t('Low', 'ዝቅተኛ')}</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="success"
                fullWidth
                icon={<CheckCircle className="w-4 h-4" />}
                onClick={handleApprove}
              >
                {t('Approve & Assign', 'ጸድቅና ምደብ')}
              </Button>
              <Button
                variant="danger"
                fullWidth
                icon={<XCircle className="w-4 h-4" />}
                onClick={handleReject}
              >
                {t('Reject', 'አትቀበል')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
