import React from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  User,
  CheckCircle,
  XCircle,
  PlayCircle,
  AlertTriangle,
  Image as ImageIcon
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../shared/Card';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { useApp } from '../../contexts/AppContext';
import type { Report } from '../../types';
import { formatTimeRemaining } from '../../utils/mockData';

interface ReportDetailsPageProps {
  report: Report;
  onBack: () => void;
}

export function ReportDetailsPage({ report, onBack }: ReportDetailsPageProps) {
  const { user, language, t } = useApp();

  const isReporter = user?.id === report.reporterId;
  const isCoordinator = user?.role === 'coordinator';
  const isFixer = user?.id === report.assignedTo;
  const isAdmin = user?.role === 'admin';

  const timeRemaining = formatTimeRemaining(report.slaDeadline, language);
  const isOverdue = report.slaDeadline < new Date() && report.status !== 'completed';

  const statusLabels = {
    submitted: { en: 'Submitted', am: 'ቀረበ' },
    reviewing: { en: 'Reviewing', am: 'በግምገማ ላይ' },
    approved: { en: 'Approved', am: 'ጸድቋል' },
    assigned: { en: 'Assigned', am: 'ተመድቧል' },
    'in-progress': { en: 'In Progress', am: 'በስራ ላይ' },
    completed: { en: 'Completed', am: 'ተጠናቋል' },
    rejected: { en: 'Rejected', am: 'ተቀባይነት አላገኘም' }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={onBack}
          icon={<ArrowLeft className="w-5 h-5" />}
          aria-label={t('Go back', 'ተመለስ')}
        />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            {report.title}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {report.ticketNumber}
          </p>
        </div>
        <Badge variant="status" status={report.status}>
          {language === 'am' ? statusLabels[report.status].am : statusLabels[report.status].en}
        </Badge>
        <Badge variant="priority" priority={report.priority}>
          {report.priority}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('Report Details', 'የሪፖርት ዝርዝሮች')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Location */}
              <div>
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] mb-1">
                  <MapPin className="w-4 h-4" />
                  <span>{t('Location', 'ቦታ')}</span>
                </div>
                <p className="text-[var(--color-text-primary)] ml-6">
                  {report.location.block}
                  {report.location.floor && `, ${t('Floor', 'ፎቅ')} ${report.location.floor}`}
                  {report.location.room && `, ${t('Room', 'ክፍል')} ${report.location.room}`}
                </p>
                {report.location.description && (
                  <p className="text-sm text-[var(--color-text-secondary)] ml-6 mt-1">
                    {report.location.description}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium text-[var(--color-text-primary)] mb-2">
                  {t('Problem Description', 'የችግር መግለጫ')}
                </h4>
                <p className="text-[var(--color-text-secondary)]">
                  {report.description}
                </p>
              </div>

              {/* Photos */}
              {report.photos.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] mb-2">
                    <ImageIcon className="w-4 h-4" />
                    <span>{t('Photos', 'ፎቶዎች')}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {report.photos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="aspect-square bg-[var(--color-surface)] rounded-lg flex items-center justify-center"
                      >
                        <ImageIcon className="w-8 h-8 text-[var(--color-text-tertiary)]" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SLA Progress */}
              {report.status !== 'completed' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      {t('SLA Progress', 'SLA እድገት')}
                    </span>
                    <span className={`text-sm font-medium ${isOverdue ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-secondary)]'}`}>
                      {timeRemaining}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[var(--color-surface)] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${isOverdue ? 'bg-[var(--color-danger)]' : 'bg-[var(--color-primary)]'}`}
                      style={{ width: isOverdue ? '100%' : '60%' }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>{t('Timeline', 'የጊዜ መስመር')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.timeline.map((event, idx) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] bg-opacity-10 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-[var(--color-primary)]" />
                      </div>
                      {idx < report.timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-[var(--color-border)] mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium text-[var(--color-text-primary)]">
                        {language === 'am' && event.actionAm ? event.actionAm : event.action}
                      </p>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {event.user.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                      {event.details && (
                        <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                          {language === 'am' && event.detailsAm ? event.detailsAm : event.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('Information', 'መረጃ')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Reporter */}
              <div>
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] mb-1">
                  <User className="w-4 h-4" />
                  <span>{t('Reporter', 'ሪፖርተር')}</span>
                </div>
                <p className="text-[var(--color-text-primary)] ml-6">
                  {report.reporter.name}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] ml-6">
                  {report.reporter.email}
                </p>
              </div>

              {/* Coordinator */}
              {report.coordinator && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] mb-1">
                    <User className="w-4 h-4" />
                    <span>{t('Coordinator', 'አስተባባሪ')}</span>
                  </div>
                  <p className="text-[var(--color-text-primary)] ml-6">
                    {report.coordinator.name}
                  </p>
                </div>
              )}

              {/* Fixer */}
              {report.fixer && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] mb-1">
                    <User className="w-4 h-4" />
                    <span>{t('Assigned Fixer', 'የተመደበ አስተካካይ')}</span>
                  </div>
                  <p className="text-[var(--color-text-primary)] ml-6">
                    {report.fixer.name}
                  </p>
                </div>
              )}

              {/* Dates */}
              <div>
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>{t('Created', 'ተፈጠረ')}</span>
                </div>
                <p className="text-[var(--color-text-primary)] ml-6">
                  {new Date(report.createdAt).toLocaleDateString()}
                </p>
              </div>

              {report.completedAt && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] mb-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>{t('Completed', 'ተጠናቋል')}</span>
                  </div>
                  <p className="text-[var(--color-text-primary)] ml-6">
                    {new Date(report.completedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('Actions', 'እርምጃዎች')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isCoordinator && report.status === 'submitted' && (
                <>
                  <Button variant="success" fullWidth icon={<CheckCircle className="w-4 h-4" />}>
                    {t('Approve', 'ጸድቅ')}
                  </Button>
                  <Button variant="danger" fullWidth icon={<XCircle className="w-4 h-4" />}>
                    {t('Reject', 'አትቀበል')}
                  </Button>
                </>
              )}

              {isFixer && report.status === 'assigned' && (
                <Button variant="primary" fullWidth icon={<PlayCircle className="w-4 h-4" />}>
                  {t('Start Work', 'ስራ ጀምር')}
                </Button>
              )}

              {isFixer && report.status === 'in-progress' && (
                <Button variant="success" fullWidth icon={<CheckCircle className="w-4 h-4" />}>
                  {t('Mark Complete', 'እንደተጠናቀቀ ምልክት አድርግ')}
                </Button>
              )}

              {(isAdmin || isCoordinator) && (
                <Button variant="outline" fullWidth>
                  {t('Edit Report', 'ሪፖርት አርትዕ')}
                </Button>
              )}

              {isReporter && report.status === 'submitted' && (
                <Button variant="outline" fullWidth>
                  {t('Cancel Report', 'ሪፖርት ሰርዝ')}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Duplicate Warning */}
          {report.isDuplicate && (
            <Card className="border-[var(--color-warning)]">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-[var(--color-warning)] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)] mb-1">
                      {t('Possible Duplicate', 'ሊሆን የሚችል ድግግሞሽ')}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {t('Similar to', 'ተመሳሳይ ከ')} #{report.duplicateOf}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
