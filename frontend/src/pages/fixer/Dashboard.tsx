import { useNavigate, Link } from 'react-router-dom';
import { Wrench, CheckCircle, Clock, AlertTriangle, List, Activity, TrendingUp, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fixerService } from '../../services/fixerService';
import type { FixerDashboardData } from '../../services/fixerService';

const FixerDashboard = () => {
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState<FixerDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fixerService.getDashboard();
            setDashboardData(data);
        } catch (err: any) {
            console.error('Error fetching dashboard:', err);
            setError(err.response?.data?.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-6xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-red-900 mb-2">Error Loading Dashboard</h3>
                    <p className="text-red-700 mb-4">{error}</p>
                    <button
                        onClick={fetchDashboard}
                        className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!dashboardData) {
        return null;
    }

    const stats = [
        { label: 'Assigned Jobs', value: dashboardData.stats.total_assigned.toString(), icon: List, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'In Progress', value: dashboardData.in_progress_jobs.length.toString(), icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Completed Today', value: dashboardData.completed_today.toString(), icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Emergency', value: dashboardData.stats.emergency_count.toString(), icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
    ];

    // Combine assigned and in-progress jobs for urgent display
    const urgentJobs = [...dashboardData.assigned_jobs, ...dashboardData.in_progress_jobs]
        .filter(job => job.priority === 'emergency' || job.priority === 'high')
        .slice(0, 2);

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            {/* Header section */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2 tracking-tight italic">Fixer Dashboard</h1>
                    <p className="text-indigo-100 max-w-lg mb-6">You are currently on duty. There are {urgentJobs.length} urgent tasks requiring immediate attention.</p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/fixer/jobs')}
                            className="px-5 py-2.5 bg-white text-indigo-700 font-bold rounded-lg shadow-md hover:bg-gray-50 transition-all active:scale-95 text-sm"
                        >
                            Open My Job Queue
                        </button>
                    </div>
                </div>
                <Wrench className="absolute -bottom-10 -right-10 w-64 h-64 text-indigo-500 opacity-20 rotate-12" />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className={`p-3.5 rounded-xl ${stat.bg} ${stat.color}`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-gray-900 leading-none mt-1">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Urgent Queue */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="font-bold text-gray-800 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-rose-500" /> Urgent Maintenance Tasks
                        </h2>
                        <Link to="/fixer/jobs" className="text-xs font-bold text-indigo-600 hover:underline">View All Active Jobs</Link>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {urgentJobs.length > 0 ? urgentJobs.map((job) => (
                            <div key={job.id} className="p-6 hover:bg-gray-50/50 transition-colors flex items-center justify-between group">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${job.priority === 'emergency' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {job.priority}
                                        </span>
                                        <span className="text-[10px] font-semibold text-gray-400">#{job.ticket_id}</span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{job.problem_summary}</h3>
                                    <p className="text-xs text-gray-500">{job.location} • Reported by {job.reporter_name}</p>
                                </div>
                                <button
                                    onClick={() => navigate(`/fixer/jobs/${job.id}`)}
                                    className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-all"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )) : (
                            <div className="p-6 text-center text-gray-500">
                                <p className="text-sm">No urgent tasks at the moment</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Score section */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center">
                        <div className="inline-flex p-4 rounded-full bg-emerald-50 text-emerald-600 mb-4">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">{dashboardData.stats.avg_completion_time}</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Avg Completion Time</p>
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <p className="text-sm font-medium text-gray-600 italic leading-relaxed">
                                Keep up the great work! You have {dashboardData.stats.total_assigned} active assignments.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FixerDashboard;
