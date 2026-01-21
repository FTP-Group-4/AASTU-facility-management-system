import { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Clock, Info, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useReportStore } from '../../stores/reportStore';
import type { ReportSummary } from '../../types/report';

const PendingApprovals = () => {
    const navigate = useNavigate();
    const { reports, fetchCoordinatorReports, isLoading, error, reviewReport } = useReportStore();
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchCoordinatorReports({ status: 'submitted' });
    }, [fetchCoordinatorReports]);

    const handleQuickAction = async (id: string, action: 'approve' | 'reject') => {
        try {
            setActionLoading(id);
            await reviewReport(id, action, 'medium'); // Default priority
        } catch (err) {
            console.error('Failed to update report:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const pendingReports = reports.filter(r => r.status === 'submitted');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Pending Approvals</h1>
                    <p className="text-gray-500">Review and approve reporter submissions for your assigned blocks.</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl relative">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            <div className="space-y-4">
                {isLoading && !actionLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : pendingReports.map(report => (
                    <div key={report.ticket_id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Submitted</span>
                                    <span className="text-[10px] font-mono text-gray-400">#{report.ticket_id}</span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">{report.problem_summary}</h3>
                                <div className="flex flex-wrap items-center text-xs text-gray-500 mt-2 gap-4">
                                    <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                                        {report.location?.block_name || (report.location?.block_id ? `Block ${report.location.block_id}` : 'N/A')}
                                        {report.location?.room_number ? `, Room ${report.location.room_number}` : ''}
                                    </span>
                                    <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                                        {new Date(report.submitted_at).toLocaleDateString()}
                                    </span>
                                    <span className="px-2 py-0.5 bg-gray-100 rounded capitalize">{report.category}</span>
                                </div>
                            </div>

                            <div className="flex md:flex-col gap-2 min-w-[140px]">
                                <button
                                    onClick={() => navigate(`/coordinator/reports/${report.ticket_id}`)}
                                    className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition-colors text-xs text-center"
                                >
                                    Review Details
                                </button>
                                <button
                                    disabled={!!actionLoading}
                                    onClick={() => handleQuickAction(report.ticket_id, 'reject')}
                                    className="px-4 py-2 bg-white border border-red-100 text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors text-xs disabled:opacity-50"
                                >
                                    {actionLoading === report.ticket_id ? 'Wait...' : 'Quick Reject'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {!isLoading && pendingReports.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">All caught up!</h3>
                        <p className="text-gray-500 mt-1">No pending reports to review in your blocks.</p>
                        <button
                            onClick={() => navigate('/coordinator/dashboard')}
                            className="mt-6 text-indigo-600 font-bold hover:underline"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PendingApprovals;
