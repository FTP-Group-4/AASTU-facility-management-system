import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Activity, AlertTriangle, Heart, Building } from 'lucide-react';
import { adminService } from '../../services/adminService';
import type { DashboardData } from '../../types/admin'; // Fixed import

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<DashboardData | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const dashboardData = await adminService.getDashboard();
                setData(dashboardData);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
                setError('Failed to load system dashboard. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 p-4 rounded-lg text-red-800 text-center">
                <AlertTriangle className="mx-auto h-8 w-8 mb-2 text-red-600" />
                <p>{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded text-sm font-semibold transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    const { system_health, reports_summary, sla_compliance, alerts } = data!;

    const stats = [
        { label: 'System Health', value: system_health.uptime ? 'Healthy' : 'Degraded', icon: Heart, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Active Reports', value: reports_summary.reports_today.toString(), icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'SLA Violations', value: alerts.filter(a => a.type === 'sla_violation').length.toString(), icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
        { label: 'Total Users', value: system_health.active_users.toString(), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header section */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 text-white shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 tracking-tight">System Administration</h1>
                        <p className="text-gray-400">Manage infrastructure, user permissions, and global system settings from one hub.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/admin/users')}
                            className="px-4 py-2 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-all flex items-center gap-2"
                        >
                            <Users size={18} /> Manage Users
                        </button>
                        <button
                            onClick={() => navigate('/admin/blocks')}
                            className="px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-all flex items-center gap-2"
                        >
                            <Building size={18} /> Facilities
                        </button>
                        <button
                            onClick={() => navigate('/admin/reports')}
                            className="px-4 py-2 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-400 transition-all flex items-center gap-2 shadow-md"
                        >
                            <Activity size={18} /> Reports Registry
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-gray-900 leading-none mt-1">{stat.value}</h3>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* SLA Compliance */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-800">SLA Compliance & Alerts</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        {alerts.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                <Activity className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                <p>No active alerts. System is running smoothly.</p>
                            </div>
                        ) : (
                            alerts.map((alert, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-3 rounded-lg bg-red-50 border border-red-100">
                                    <div className="p-2 rounded-full bg-red-100 text-red-600">
                                        <AlertTriangle className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-800">{alert.type.replace('_', ' ').toUpperCase()}</p>
                                        <p className="text-xs text-red-600 mt-0.5">{alert.message}</p>
                                    </div>
                                </div>
                            ))
                        )}

                        <div className="mt-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Compliance Rates</h3>
                            <div className="space-y-3">
                                {Object.entries(sla_compliance).map(([level, rate]) => (
                                    <div key={level}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="capitalize">{level} Priority</span>
                                            <span className="font-semibold">{rate}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${rate > 90 ? 'bg-green-500' : rate > 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                style={{ width: `${rate}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance Card */}
                <div className="bg-indigo-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5" /> Performance Metrics
                        </h2>
                        <div className="space-y-4">
                            <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                                <span className="block text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Avg Resolution Rating</span>
                                <span className="text-2xl font-bold">{reports_summary.avg_rating} / 5.0</span>
                            </div>
                            <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                                <span className="block text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Completion Rate</span>
                                <span className="text-2xl font-bold">{reports_summary.completion_rate}%</span>
                            </div>
                            <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                                <span className="block text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">System Uptime</span>
                                <span className="text-2xl font-bold">{system_health.uptime}</span>
                            </div>
                        </div>

                    </div>
                    <Activity className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10 rotate-12" />
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
