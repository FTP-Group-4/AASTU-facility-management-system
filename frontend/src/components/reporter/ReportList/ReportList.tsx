import { useState, useEffect } from 'react';
import { Search, Filter, FileWarning, Download } from 'lucide-react';
import Input from '../../common/UI/Input';
import Select from '../../common/UI/Select';
import Button from '../../common/UI/Button';
import Pagination from '../../common/UI/Pagination';
import ReportCard from './ReportCard';
import { useReportStore } from '../../../stores/reportStore';
import type { ReportFilters, ReportStatus, ReportPriority } from '../../../types/report';
import { cn } from '../../../lib/utils';

interface ReportListProps {
  isCoordinator?: boolean;
  blockFilter?: number;
  showFilters?: boolean;
}

const ReportList = ({ 
  isCoordinator = false, 
  blockFilter,
  showFilters = true 
}: ReportListProps) => {
  const { 
    reports, 
    filters, 
    isLoading, 
    fetchMyReports, 
    fetchCoordinatorReports,
    setFilters 
  } = useReportStore();

  const [localFilters, setLocalFilters] = useState<ReportFilters>({
    ...filters,
    search: '',
    status: undefined,
    priority: undefined,
    block_id: blockFilter,
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Load reports on mount and filter changes
  useEffect(() => {
    const loadReports = async () => {
      if (isCoordinator) {
        await fetchCoordinatorReports(localFilters);
      } else {
        await fetchMyReports(localFilters);
      }
    };

    const timer = setTimeout(loadReports, 300);
    return () => clearTimeout(timer);
  }, [localFilters, isCoordinator]);

  const handleSearchChange = (value: string) => {
    setLocalFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleStatusChange = (status: string) => {
    setLocalFilters(prev => ({ ...prev, status: status ? (status as ReportStatus) : undefined, page: 1 }));
  };

  const handlePriorityChange = (priority: string) => {
    setLocalFilters(prev => ({ ...prev, priority: priority ? (priority as ReportPriority) : undefined, page: 1 }));
  };

  const handleBlockChange = (blockId: string) => {
    setLocalFilters(prev => ({ 
      ...prev, 
      block_id: blockId ? parseInt(blockId) : undefined, 
      page: 1 
    }));
  };

  const handleDateChange = (field: 'date_from' | 'date_to', value: string) => {
    setLocalFilters(prev => ({ ...prev, [field]: value || undefined, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setLocalFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setLocalFilters({
      page: 1,
      limit: 10,
      search: '',
      status: undefined,
      priority: undefined,
      block_id: blockFilter,
    });
  };

  const handleExport = () => {
    // Implement export functionality
    console.log('Export reports');
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'pending_approval', label: 'Pending Approval' },
    { value: 'approved', label: 'Approved' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'closed', label: 'Closed' },
    { value: 'reopened', label: 'Reopened' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  const blockOptions = [
    { value: '', label: 'All Blocks' },
    ...Array.from({ length: 100 }, (_, i) => ({
      value: (i + 1).toString(),
      label: `Block ${i + 1}`,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            {isCoordinator ? 'Assigned Reports' : 'My Reports'}
          </h2>
          <p className="text-muted-foreground">
            {isCoordinator 
              ? 'Manage reports from your assigned blocks'
              : 'Track the status of your maintenance requests'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="space-y-4">
          {/* Quick Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              placeholder="Search reports..."
              value={localFilters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              className="md:col-span-2"
            />
            
            <Select
              value={localFilters.status || ''}
              onChange={(e) => handleStatusChange(e.target.value)}
              options={statusOptions}
              placeholder="Status"
            />
            
            <Select
              value={localFilters.priority || ''}
              onChange={(e) => handlePriorityChange(e.target.value)}
              options={priorityOptions}
              placeholder="Priority"
            />
          </div>

          {/* Advanced Filters Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Filter className="w-4 h-4" />
            {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
          </button>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in">
              <Select
                label="Block"
                value={localFilters.block_id?.toString() || ''}
                onChange={(e) => handleBlockChange(e.target.value)}
                options={blockOptions}
              />
              
              <Input
                label="From Date"
                type="date"
                value={localFilters.date_from || ''}
                onChange={(e) => handleDateChange('date_from', e.target.value)}
              />
              
              <Input
                label="To Date"
                type="date"
                value={localFilters.date_to || ''}
                onChange={(e) => handleDateChange('date_to', e.target.value)}
              />
              
              <div className="flex items-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  className="w-full"
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-muted-foreground">Loading reports...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && reports.length === 0 && (
        <div className="text-center py-12">
          <FileWarning className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-medium mb-2">No reports found</h3>
          <p className="text-muted-foreground mb-4">
            {localFilters.search || localFilters.status || localFilters.priority
              ? 'Try adjusting your filters'
              : isCoordinator
              ? 'No reports have been assigned to your blocks yet'
              : "You haven't submitted any reports yet"
            }
          </p>
          {(localFilters.search || localFilters.status || localFilters.priority) && (
            <Button variant="outline" onClick={handleResetFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Reports Grid */}
      {!isLoading && reports.length > 0 && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-card border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{reports.length}</p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">
                {reports.filter(r => r.status === 'pending_approval').length}
              </p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold">
                {reports.filter(r => r.status === 'in_progress').length}
              </p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">
                {reports.filter(r => r.status === 'completed').length}
              </p>
            </div>
          </div>

          {/* Reports List */}
          <div className="space-y-3">
            {reports.map((report) => (
              <ReportCard key={report.ticket_id} report={report} />
            ))}
          </div>

          {/* Pagination */}
          {localFilters.limit && reports.length >= localFilters.limit && (
            <div className="pt-4 border-t">
              <Pagination
                currentPage={localFilters.page || 1}
                totalPages={Math.ceil(reports.length / (localFilters.limit || 10))}
                onPageChange={handlePageChange}
                totalItems={reports.length}
                pageSize={localFilters.limit || 10}
                showInfo
                showFirstLast
                showPrevNext
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportList;