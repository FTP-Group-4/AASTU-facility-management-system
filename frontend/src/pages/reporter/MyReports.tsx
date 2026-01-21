import { useState, useEffect } from 'react';
import { Search, List, CheckCircle, Clock, Plus, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useReportStore } from '../../stores/reportStore';
import type { ReportStatus } from '../../types/report';
import Button from '../../components/common/UI/Button';

const MyReports = () => {
  const navigate = useNavigate();
  const { reports, fetchMyReports, isLoading, error, filters, setFilters } = useReportStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMyReports();
  }, [filters.status, filters.priority, filters.page]);

  const handleFilterChange = (status: string) => {
    if (status === 'all') {
      setFilters({ ...filters, status: undefined, page: 1 });
    } else {
      setFilters({ ...filters, status: status as ReportStatus, page: 1 });
    }
  };

  const filteredReports = reports.filter(report =>
    report.problem_summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.ticket_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'closed': return 'text-green-600 bg-green-50 border-green-200';
      case 'in_progress':
      case 'assigned': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'submitted':
      case 'pending_approval': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
      case 'reopened': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">My Reports</h1>
          <p className="text-gray-500">Track status of your submitted issues.</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate('/reporter/new-report')}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New Report
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search reports by ID or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            {['all', 'submitted', 'in_progress', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => handleFilterChange(status)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${(filters.status === status || (status === 'all' && !filters.status))
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
                  }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-sm border-b border-red-100">
            {error}
          </div>
        )}

        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="p-12 text-center text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
              Loading your reports...
            </div>
          ) : filteredReports.length > 0 ? (
            filteredReports.map(report => (
              <div
                key={report.ticket_id}
                onClick={() => navigate(`/reporter/reports/${report.ticket_id}`)}
                className="p-4 md:p-6 hover:bg-gray-50 transition-colors cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-2.5 rounded-xl border ${getStatusColor(report.status)}`}>
                    {report.status === 'completed' || report.status === 'closed' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {report.problem_summary}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500">
                      {report.location?.block_name || (report.location?.block_id ? `Block ${report.location.block_id}` : 'General Location')} • {report.location?.room_number || report.location?.description || 'No location details'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-[10px] font-mono text-gray-400 px-1.5 py-0.5 bg-gray-100 rounded">
                        {report.ticket_id}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                      <span className="text-xs text-gray-500 capitalize">{report.category}</span>
                    </div>
                  </div>
                </div>
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 md:text-right border-t md:border-t-0 pt-4 md:pt-0">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(report.status)}`}>
                    {report.status.replace('_', ' ')}
                  </span>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(report.submitted_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-16 text-center">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <List className="text-gray-400 w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No reports found</h3>
              <p className="text-gray-500 mb-6">We couldn't find any reports matching your current criteria.</p>
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({ status: undefined, page: 1 });
                  setSearchTerm('');
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyReports;
