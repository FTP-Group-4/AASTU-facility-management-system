import React from 'react';
import { MapPin, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { Card } from '../shared/Card';
import { Badge } from '../shared/Badge';
import { useApp } from '../../contexts/AppContext';
import type { Report } from '../../types';
import { formatTimeRemaining } from '../../utils/mockData';

interface ReportCardProps {
  report: Report;
  onClick: (report: Report) => void;
}

export function ReportCard({ report, onClick }: ReportCardProps) {
  const { language, t } = useApp();
  
  const now = new Date();
  const isOverdue = report.slaDeadline < now && report.status !== 'completed';
  const categoryLabels = {
    plumbing: { en: 'Plumbing', am: 'የውሃ ስርዓት' },
    electrical: { en: 'Electrical', am: 'የኤሌክትሪክ' },
    structural: { en: 'Structural', am: 'መዋቅራዊ' },
    hvac: { en: 'HVAC', am: 'HVAC' },
    cleaning: { en: 'Cleaning', am: 'ጽዳት' },
    landscaping: { en: 'Landscaping', am: 'የመሬት አቀማመጥ' },
    it: { en: 'IT', am: 'አይቲ' },
    furniture: { en: 'Furniture', am: 'የቤት ዕቃዎች' },
    other: { en: 'Other', am: 'ሌላ' }
  };

  const statusLabels = {
    submitted: { en: 'Submitted', am: 'ቀረበ' },
    reviewing: { en: 'Reviewing', am: 'በግምገማ ላይ' },
    approved: { en: 'Approved', am: 'ጸድቋል' },
    assigned: { en: 'Assigned', am: 'ተመድቧል' },
    'in-progress': { en: 'In Progress', am: 'በስራ ላይ' },
    completed: { en: 'Completed', am: 'ተጠናቋል' },
    rejected: { en: 'Rejected', am: 'ተቀባይነት አላገኘም' }
  };

  const priorityLabels = {
    emergency: { en: 'Emergency', am: 'የአደጋ ጊዜ' },
    high: { en: 'High', am: 'ከፍተኛ' },
    medium: { en: 'Medium', am: 'መካከለኛ' },
    low: { en: 'Low', am: 'ዝቅተኛ' }
  };

  return (
    <Card
      padding="md"
      hoverable
      onClick={() => onClick(report)}
      className="cursor-pointer"
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-[var(--color-text-tertiary)]">
                {report.ticketNumber}
              </span>
              {isOverdue && (
                <AlertTriangle className="w-4 h-4 text-[var(--color-danger)]" />
              )}
            </div>
            <h3 className="font-semibold text-[var(--color-text-primary)] truncate">
              {report.title}
            </h3>
          </div>
          <Badge variant="priority" priority={report.priority}>
            {language === 'am' ? priorityLabels[report.priority].am : priorityLabels[report.priority].en}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
          {report.description}
        </p>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">
            {report.location.block}
            {report.location.room && `, ${t('Room', 'ክፍል')} ${report.location.room}`}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <Badge variant="status" status={report.status}>
              {language === 'am' ? statusLabels[report.status].am : statusLabels[report.status].en}
            </Badge>
            <Badge variant="default">
              {language === 'am' ? categoryLabels[report.category].am : categoryLabels[report.category].en}
            </Badge>
          </div>

          {report.status !== 'completed' && (
            <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-tertiary)]'}`}>
              <Clock className="w-3 h-3" />
              <span>{formatTimeRemaining(report.slaDeadline, language)}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
