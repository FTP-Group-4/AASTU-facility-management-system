import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  PlayCircle,
  Wrench,
  BarChart3
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../shared/Card';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Modal } from '../shared/Modal';
import { useApp } from '../../contexts/AppContext';
import type { Report, Priority } from '../../types';
import { mockReports, formatTimeRemaining } from '../../utils/mockData';

interface FixerDashboardProps {
  onViewReport: (report: Report) => void;
}

export function FixerDashboard({ onViewReport }: FixerDashboardProps) {
  const { user, language, t } = useApp();
  const [selectedJob, setSelectedJob] = useState<Report | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobStatus, setJobStatus] = useState('');

  // Filter reports assigned to current fixer
  const myJobs = mockReports.filter(r => 
    r.assignedTo === user?.id && 
    (r.status === 'assigned' || r.status === 'in-progress')
  );

  // Group by priority
  const jobsByPriority = {
    emergency: myJobs.filter(j => j.priority === 'emergency'),
    high: myJobs.filter(j => j.priority === 'high'),
    medium: myJobs.filter(j => j.priority === 'medium'),
    low: myJobs.filter(j => j.priority === 'low')
  };

  const stats = {
    activeJobs: myJobs.length,
    inProgress: myJobs.filter(j => j.status === 'in-progress').length,
    completed: mockReports.filter(r => r.assignedTo === user?.id && r.status === 'completed').length,
    avgTime: 3.8,
    compliance: 94
  };

  const handleStartJob = (job: Report) => {
    setSelectedJob(job);
    setJobStatus('in-progress');
    setShowJobModal(true);
  };

  const handleCompleteJob = () => {
    console.log('Completing job:', selectedJob?.id);
    setShowJobModal(false);
    setSelectedJob(null);
  };

  const priorityConfig: Record<Priority, { 
    label: string; 
    labelAm: string; 
    color: string; 
    icon: React.ReactNode 
  }> = {
    emergency: {
      label: 'Emergency',
      labelAm: 'የአደጋ ጊዜ',
      color: 'border-[var(--color-emergency)]',
      icon: <AlertTriangle className="w-5 h-5 text-[var(--color-emergency)]" />
    },
    high: {
      label: 'High Priority',
      labelAm: 'ከፍተኛ ቅድሚያ',
      color: 'border-[var(--color-warning)]',
      icon: <AlertTriangle className="w-5 h-5 text-[var(--color-warning)]" />
    },
    medium: {
      label: 'Medium Priority',
      labelAm: 'መካከለኛ ቅድሚያ',
      color: 'border-[var(--color-secondary)]',
      icon: <Clock className="w-5 h-5 text-[var(--color-secondary)]" />
    },
    low: {
      label: 'Low Priority',
      labelAm: 'ዝቅተኛ ቅድሚያ',
      color: 'border-[var(--color-text-tertiary)]',
      icon: <Clock className="w-5 h-5 text-[var(--color-text-tertiary)]" />
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {t('Active Jobs', 'ንቁ ስራዎች')}
              </p>
              <p className="text-2xl font-semibold text-[var(--color-text-primary)] mt-1">
                {stats.activeJobs}
              </p>
            </div>
            <div className="p-2 bg-[var(--color-primary)] bg-opacity-10 rounded-lg">
              <Wrench className="w-5 h-5 text-[var(--color-primary)]" />
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
              <PlayCircle className="w-5 h-5 text-cyan-500" />
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
                {t('Avg Time (hrs)', 'አማ ጊዜ (ሰዓ)')}
              </p>
              <p className="text-2xl font-semibold text-[var(--color-text-primary)] mt-1">
                {stats.avgTime}
              </p>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {t('SLA Rate', 'SLA መጠን')}
              </p>
              <p className="text-2xl font-semibold text-[var(--color-text-primary)] mt-1">
                {stats.compliance}%
              </p>
            </div>
            <div className="p-2 bg-[var(--color-success)] bg-opacity-10 rounded-lg">
              <BarChart3 className="w-5 h-5 text-[var(--color-success)]" />
            </div>
          </div>
        </Card>
      </div>

      {/* Priority-Based Job Queue */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
          {t('Job Queue', 'የስራ ወረፋ')}
        </h2>

        {(Object.keys(jobsByPriority) as Priority[]).map(priority => {
          const jobs = jobsByPriority[priority];
          if (jobs.length === 0) return null;

          const config = priorityConfig[priority];

          return (
            <div key={priority}>
              <div className="flex items-center gap-2 mb-3">
                {config.icon}
                <h3 className="font-semibold text-[var(--color-text-primary)]">
                  {language === 'am' ? config.labelAm : config.label}
                </h3>
                <span className="ml-auto text-sm text-[var(--color-text-tertiary)]">
                  {jobs.length} {t('jobs', 'ስራዎች')}
                </span>
              </div>

              <div className="grid gap-3">
                {jobs.map(job => {
                  const timeRemaining = formatTimeRemaining(job.slaDeadline, language);
                  const isOverdue = job.slaDeadline < new Date();

                  return (
                    <Card
                      key={job.id}
                      padding="md"
                      className={`border-l-4 ${config.color}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-[var(--color-text-tertiary)]">
                              {job.ticketNumber}
                            </span>
                            <Badge variant="status" status={job.status}>
                              {job.status}
                            </Badge>
                          </div>

                          <h4 className="font-semibold text-[var(--color-text-primary)]">
                            {job.title}
                          </h4>

                          <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
                            {job.description}
                          </p>

                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-[var(--color-text-secondary)]">
                              📍 {job.location.block}
                              {job.location.room && `, ${t('Room', 'ክፍል')} ${job.location.room}`}
                            </span>
                            <span className={isOverdue ? 'text-[var(--color-danger)] font-medium' : 'text-[var(--color-text-tertiary)]'}>
                              ⏱️ {timeRemaining}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          {job.status === 'assigned' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleStartJob(job)}
                              icon={<PlayCircle className="w-4 h-4" />}
                            >
                              {t('Start', 'ጀምር')}
                            </Button>
                          )}
                          {job.status === 'in-progress' && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => {
                                setSelectedJob(job);
                                setShowJobModal(true);
                              }}
                              icon={<CheckCircle className="w-4 h-4" />}
                            >
                              {t('Complete', 'አጠናቅቅ')}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewReport(job)}
                          >
                            {t('Details', 'ዝርዝሮች')}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}

        {myJobs.length === 0 && (
          <Card padding="lg">
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-[var(--color-success)]" />
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                {t('All Caught Up!', 'ሁሉም ተጠናቀቀ!')}
              </h3>
              <p className="text-[var(--color-text-secondary)]">
                {t('No active jobs at the moment.', 'በአሁኑ ጊዜ ንቁ ስራዎች የሉም።')}
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Job Completion Modal */}
      {selectedJob && (
        <Modal
          isOpen={showJobModal}
          onClose={() => {
            setShowJobModal(false);
            setSelectedJob(null);
          }}
          title={t('Complete Job', 'ስራን አጠናቅቅ')}
          size="lg"
        >
          <div className="space-y-4">
            <div className="p-4 bg-[var(--color-surface)] rounded-lg">
              <h4 className="font-medium text-[var(--color-text-primary)] mb-2">
                {selectedJob.title}
              </h4>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {selectedJob.ticketNumber}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                {t('Work Summary', 'የስራ ማጠቃለያ')}
              </label>
              <textarea
                placeholder={t('Describe the work completed...', 'የተጠናቀቀ��ን ስራ ይግለጹ...')}
                rows={4}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                {t('Time Spent (hours)', 'የጠፋ ጊዜ (ሰዓታት)')}
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="2.5"
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="success"
                fullWidth
                onClick={handleCompleteJob}
                icon={<CheckCircle className="w-4 h-4" />}
              >
                {t('Mark as Complete', 'እንደተጠናቀቀ ምልክት አድርግ')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
