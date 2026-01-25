import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertTriangle, Building2, User, MapPin, X, Info, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { coordinatorApi } from '../../api/reports/coordinatorApi';
import type { CoordinatorDashboardResponse } from '../../api/reports/types';

const CoordinatorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CoordinatorDashboardResponse | null>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await coordinatorApi.getDashboard();
        setData(response);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch coordinator dashboard:', err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const stats = data?.stats || {
    total_pending: 0,
    approved_today: 0,
    sla_compliance_rate: 0
  };

  const assignedBlocks = data?.assigned_blocks || [];
  const pendingReports = data?.pending_reports || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-2">Coordinator Dashboard</h1>
          <p className="text-blue-100 italic">Oversee facility integrity and approve repair workflows for your assigned zones.</p>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Building2 size={120} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Pending Approvals', value: stats.total_pending, color: 'text-orange-600', bg: 'bg-orange-50', icon: Clock },
          { label: 'Approved Today', value: stats.approved_today, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
          { label: 'SLA Compliance', value: `${stats.sla_compliance_rate}%`, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: TrendingUp },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</h3>
            </div>
            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content: Pending Reports */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <Info size={18} className="text-indigo-600" /> Awaiting Review
              </h2>
              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-tighter">{pendingReports.length} Active</span>
            </div>
            <div className="divide-y divide-gray-50">
              {pendingReports.map(report => (
                <div key={report.ticket_id} className="p-5 hover:bg-gray-50 transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{report.problem_summary}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} /> {report.location}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      {new Date(report.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {report.possible_duplicates && report.possible_duplicates.length > 0 && (
                    <div className="mb-4 inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                      SYSTEM DETECTED POTENTIAL DUPLICATE ({report.possible_duplicates.length})
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 border border-gray-200">
                        {report.submitted_by.charAt(0)}
                      </div>
                      <span className="text-xs font-semibold text-gray-600">By: {report.submitted_by}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-50 transition-all shadow-sm"
                      >
                        Quick Look
                      </button>
                      <button
                        onClick={() => navigate(`/coordinator/reports/${report.ticket_id}`)}
                        className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition-all"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {pendingReports.length === 0 && (
                <div className="p-12 text-center text-gray-400">
                  <CheckCircle className="w-12 h-12 text-emerald-100 mx-auto mb-3" />
                  <p className="font-medium">No reports awaiting verification.</p>
                </div>
              )}
            </div>
            {pendingReports.length > 0 && (
              <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
                <button
                  onClick={() => navigate('/coordinator/pending')}
                  className="text-indigo-600 text-sm font-bold hover:underline"
                >
                  View All Pending Reports
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Assigned Blocks Status */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/30">
              <h2 className="font-bold text-gray-800">Assigned Facility Nodes</h2>
            </div>
            <div className="p-5 space-y-4">
              {assignedBlocks.map(block => (
                <div key={block.block_id} className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 text-indigo-500 mr-2" />
                      <span className="font-bold text-gray-800 text-sm">{block.block_name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">#{block.block_id}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white rounded-lg p-2 text-center border border-gray-100 shadow-sm">
                      <span className="block text-sm font-bold text-orange-600">{block.pending_approvals}</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase">Wait</span>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center border border-gray-100 shadow-sm">
                      <span className="block text-sm font-bold text-blue-600">{block.in_progress}</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase">Active</span>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center border border-gray-100 shadow-sm">
                      <span className={`block text-sm font-bold ${block.overdue > 0 ? 'text-rose-600' : 'text-gray-300'}`}>{block.overdue}</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">SLA Fail</span>
                    </div>
                  </div>
                </div>
              ))}
              {assignedBlocks.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-gray-400 text-xs">No blocks assigned to you.</p>
                </div>
              )}
            </div>
            <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
              <button
                onClick={() => navigate('/coordinator/blocks')}
                className="text-indigo-600 text-sm font-bold hover:underline"
              >
                View All Nodes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in duration-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Report Details - Quick View</h3>
              <button onClick={() => setSelectedReport(null)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">#{selectedReport.ticket_id}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{selectedReport.category}</span>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">{selectedReport.problem_summary}</h4>
                <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600 italic leading-relaxed border border-gray-100">
                  Wait time: {new Date(selectedReport.submitted_at).toLocaleDateString()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Location</p>
                    <p className="text-xs font-bold text-gray-800">{selectedReport.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Reporter</p>
                    <p className="text-xs font-bold text-gray-800">{selectedReport.submitted_by}</p>
                  </div>
                </div>
              </div>

              {selectedReport.possible_duplicates && selectedReport.possible_duplicates.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <h5 className="text-[10px] font-bold text-amber-800 uppercase mb-2">Possible Duplicates</h5>
                  <div className="space-y-2">
                    {selectedReport.possible_duplicates.map((dup: any) => (
                      <div key={dup.ticket_id} className="flex justify-between items-center text-xs">
                        <span className="font-mono text-amber-900">{dup.ticket_id}</span>
                        <span className="px-1.5 py-0.5 bg-amber-200 text-amber-800 rounded">{dup.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setSelectedReport(null)}
                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-gray-50 transition-all"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedReport(null);
                  navigate(`/coordinator/reports/${selectedReport.ticket_id}`);
                }}
                className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md flex items-center justify-center"
              >
                Review Full Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorDashboard;
