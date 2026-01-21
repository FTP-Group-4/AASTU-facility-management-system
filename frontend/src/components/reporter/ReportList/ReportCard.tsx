import { Calendar, Building, Clock, Eye, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../common/UI/Button';
import Badge from '../../common/UI/Badge';
import PriorityBadge from '../../common/UI/PriorityBadge';
import StatusBadge from '../../common/UI/StatusBadge';
import SLAIndicator from '../../common/UI/SLAIndicator';
import type { ReportSummary } from '../../../types/report';
import { formatDate } from '../../../lib/utils';
import { cn } from '../../../lib/utils';

interface ReportCardProps {
  report: ReportSummary;
  compact?: boolean;
}

const ReportCard = ({ report, compact = false }: ReportCardProps) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/reporter/reports/${report.ticket_id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'closed':
        return 'text-success';
      case 'in-progress':
      case 'assigned':
        return 'text-warning';
      case 'rejected':
        return 'text-danger';
      case 'pending_approval':
      case 'reviewing':
        return 'text-muted-foreground';
      default:
        return 'text-primary';
    }
  };

  const getSLAStatus = () => {
    if (!report.sla_deadline) return null;
    
    const deadline = new Date(report.sla_deadline);
    const now = new Date();
    const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursRemaining <= 2) return 'critical';
    if (hoursRemaining <= 12) return 'warning';
    return 'normal';
  };

  const slaStatus = getSLAStatus();

  if (compact) {
    return (
      <div
        className={cn(
          'border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer',
          slaStatus === 'critical' && 'border-danger/30 bg-danger/5'
        )}
        onClick={handleViewDetails}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <StatusBadge status={report.status} size="sm" />
            </div>
            <div>
              <h4 className="font-medium text-sm">{report.problem_summary}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building className="w-3 h-3" />
                  {report.location.block_name || 'General Area'}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(report.submitted_at, 'short')}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <PriorityBadge priority={report.priority} size="sm" />
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'border rounded-lg p-4 hover:bg-accent/50 transition-colors',
        slaStatus === 'critical' && 'border-danger/30 bg-danger/5'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium">{report.problem_summary}</h4>
            <PriorityBadge priority={report.priority} size="sm" />
            <StatusBadge status={report.status} size="sm" />
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Building className="w-4 h-4" />
              {report.location.block_name 
                ? `Block ${report.location.block_id}${report.location.room_number ? `, Room ${report.location.room_number}` : ''}`
                : 'General Area'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(report.submitted_at, 'long')}
            </span>
            {report.current_assignee && (
              <span>Assigned to: {report.current_assignee}</span>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewDetails}
          className="gap-2"
        >
          <Eye className="w-4 h-4" />
          View
        </Button>
      </div>

      {/* SLA Warning */}
      {slaStatus === 'critical' && report.sla_deadline && (
        <div className="mb-3 bg-danger-light border border-danger/30 rounded-lg p-3 animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-danger" />
            <span className="text-sm font-medium text-danger">SLA Critical</span>
          </div>
          <SLAIndicator 
            deadline={new Date(report.sla_deadline)}
            currentTime={new Date()}
            size="sm"
            className="mt-2"
          />
        </div>
      )}

      {/* Progress Info */}
      <div className="flex items-center justify-between pt-3 border-t">
        <div className="text-sm">
          <span className="text-muted-foreground">Ticket ID: </span>
          <code className="bg-muted px-2 py-1 rounded text-xs">
            {report.ticket_id}
          </code>
        </div>
        
        {report.sla_deadline && slaStatus !== 'critical' && (
          <SLAIndicator 
            deadline={new Date(report.sla_deadline)}
            currentTime={new Date()}
            size="sm"
          />
        )}
      </div>
    </div>
  );
};

export default ReportCard;