import { useNavigate } from 'react-router-dom';
import { Plus, List, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { reportApi } from '../../api/reports/reportApi';
import type { ReportSummary, ReportsResponse } from '../../types/report';

const ReporterDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        in_progress: 0,
        completed: 0,
    });

    const [recentReports, setRecentReports] = useState<ReportSummary[]>([]);

    const calculateStats = (reports: ReportSummary[]) => {
        return {
            total: reports.length,
            pending: reports.filter(r =>
                r.status === 'submitted' ||
                r.status === 'pending_approval'
            ).length,
            in_progress: reports.filter(r =>
                r.status === 'approved' ||
                r.status === 'assigned' ||
                r.status === 'in_progress'
            ).length,
            completed: reports.filter(r =>
                r.status === 'completed' ||
                r.status === 'closed'
            ).length,
        };
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                // Try to get reports with limit
                const response = await reportApi.getMyReports({ limit: 5 });

                console.log('Dashboard API Response:', response);

                // Handle different response structures
                let reports: ReportSummary[] = [];

                if (response && Array.isArray(response.reports)) {
                    // Structure: { reports: [], summary: {} }
                    reports = response.reports;
                } else if (response && Array.isArray(response)) {
                    // Structure: [] (just array of reports)
                    reports = response;
                } else if (response && typeof response === 'object' && response.summary) {
                    // Structure: { data: { reports: [], summary: {} } }
                    reports = response.reports || [];
                }

                console.log('Parsed reports:', reports);

                // Calculate stats from reports
                const calculatedStats = calculateStats(reports);
                setStats(calculatedStats);
                setRecentReports(reports);
                setError(null);

            } catch (err: any) {
                console.error('Failed to fetch dashboard data:', err);
                setError('Failed to load dashboard data. Please try again later.');

                // Set empty state
                setStats({
                    total: 0,
                    pending: 0,
                    in_progress: 0,
                    completed: 0,
                });
                setRecentReports([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

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
        <div className="max-w-4xl mx-auto space-y-6">

            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg">
                <h1 className="text-2xl font-bold mb-2">Welcome Back, Reporter</h1>
                <p className="text-indigo-100 mb-6">Found an issue on campus? Report it now and help us maintain AASTU facilities.</p>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => navigate('/reporter/new-report')}
                        className="flex items-center px-4 py-2.5 bg-white text-indigo-700 font-semibold rounded-lg shadow-md hover:bg-gray-50 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Report New Issue
                    </button>
                    <button
                        onClick={() => navigate('/reporter/reports')}
                        className="flex items-center px-4 py-2.5 bg-indigo-700/50 text-white font-semibold rounded-lg hover:bg-indigo-700/70 transition-all border border-indigo-500"
                    >
                        <List className="w-5 h-5 mr-2" />
                        My Reports
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl relative" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="p-3 bg-blue-50 rounded-full text-blue-600 mb-2">
                        <List className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">{stats.total}</h3>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Reports</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="p-3 bg-orange-50 rounded-full text-orange-600 mb-2">
                        <Clock className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">{stats.pending}</h3>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Pending</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="p-3 bg-indigo-50 rounded-full text-indigo-600 mb-2">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">{stats.in_progress}</h3>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">In Progress</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="p-3 bg-green-50 rounded-full text-green-600 mb-2">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">{stats.completed}</h3>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Resolved</p>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="font-bold text-gray-800 text-lg">Recent Reports</h2>
                    <button onClick={() => navigate('/reporter/reports')} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">View All</button>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                        Loading activity...
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {recentReports.length > 0 ? (
                            recentReports.map(report => (
                                <div
                                    key={report.ticket_id}
                                    onClick={() => navigate(`/reporter/reports/${report.ticket_id}`)}
                                    className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group cursor-pointer"
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className={`p-2 rounded-lg mt-1 ${getStatusColor(report.status)}`}>
                                            {report.status === 'completed' || report.status === 'closed' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-800 text-sm group-hover:text-indigo-600 transition-colors">
                                                {report.problem_summary || 'No description'}
                                            </h4>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {report.location?.block_name ||
                                                    (report.location?.block_id ? `Block ${report.location.block_id}` : 'General Location')}
                                                {report.location?.room_number ? ` - ${report.location.room_number}` : (report.location?.description ? ` - ${report.location.description}` : '')} • {report.ticket_id}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(report.status)}`}>
                                            {report.status ? report.status.replace('_', ' ') : 'unknown'}
                                        </span>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {report.submitted_at ? new Date(report.submitted_at).toLocaleDateString() : 'No date'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                <p>You haven't submitted any reports yet.</p>
                                <button
                                    onClick={() => navigate('/reporter/new-report')}
                                    className="text-indigo-600 font-medium hover:underline mt-2"
                                >
                                    Submit your first report
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReporterDashboard;