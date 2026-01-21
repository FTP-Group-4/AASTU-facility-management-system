import { useNavigate } from 'react-router-dom';
import { Users, Activity, AlertTriangle, Heart, Clock, CheckCircle2, Building, Shield } from 'lucide-react';

const AdminDashboard = () => {
    const navigate = useNavigate();

    // Mock data
    const stats = [
        { label: 'System Health', value: '98%', icon: Heart, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Active Reports', value: '24', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Urgent Issues', value: '3', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
        { label: 'Total Users', value: '1,248', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    ];

    const activities = [
        { id: 1, type: 'assignment', text: 'Coordinator assigned to Block 57', time: '12 mins ago', icon: Shield, color: 'text-blue-500' },
        { id: 2, type: 'status', text: 'SLA policy updated for Electrical', time: '1 hour ago', icon: Clock, color: 'text-amber-500' },
        { id: 3, type: 'user', text: 'New Fixer account created: chala_m', time: '4 hours ago', icon: Users, color: 'text-indigo-500' },
        { id: 4, type: 'system', text: 'Scheduled backup completed', time: '1 day ago', icon: CheckCircle2, color: 'text-emerald-500' },
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
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-800">System Activity Log</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        {activities.map((act) => (
                            <div key={act.id} className="flex items-center gap-4">
                                <div className={`p-2.5 rounded-lg bg-gray-50 ${act.color}`}>
                                    <act.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-800">{act.text}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{act.time}</p>
                                </div>
                                <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">Details</button>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-gray-100 text-center">
                        <button className="text-sm font-semibold text-gray-500 hover:text-indigo-600">View Full Operational History</button>
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
                                <span className="block text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Avg Resolution Time</span>
                                <span className="text-2xl font-bold">4.2 Hours</span>
                            </div>
                            <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                                <span className="block text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Total Issues Resolved</span>
                                <span className="text-2xl font-bold">1,248</span>
                            </div>
                        </div>
                        <button className="w-full mt-6 py-3 bg-white text-indigo-700 font-bold rounded-lg hover:bg-gray-50 transition-colors text-sm shadow-md">
                            Generate Q1 Report
                        </button>
                    </div>
                    <Activity className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10 rotate-12" />
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
