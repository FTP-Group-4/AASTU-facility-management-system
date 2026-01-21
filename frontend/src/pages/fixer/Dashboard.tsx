import { useNavigate, Link } from 'react-router-dom';
import { Wrench, CheckCircle, Clock, AlertTriangle, List, Activity, TrendingUp, ChevronRight } from 'lucide-react';

const FixerDashboard = () => {
    const navigate = useNavigate();

    // Mock data
    const stats = [
        { label: 'Assigned Jobs', value: '5', icon: List, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'In Progress', value: '2', icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Resolved Today', value: '3', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Overdue SLA', value: '1', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
    ];

    const urgentJobs = [
        { id: 'T-882', task: 'Main Server Room AC Fault', block: 'Block 01', priority: 'Emergency', time: '10m ago' },
        { id: 'T-771', task: 'Lecture Hall 2 Projector Power', block: 'Block 57', priority: 'High', time: '2h remaining' },
    ];

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
                        {urgentJobs.map((job) => (
                            <div key={job.id} className="p-6 hover:bg-gray-50/50 transition-colors flex items-center justify-between group">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${job.priority === 'Emergency' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {job.priority}
                                        </span>
                                        <span className="text-[10px] font-semibold text-gray-400">#{job.id}</span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{job.task}</h3>
                                    <p className="text-xs text-gray-500">{job.block} • Reported {job.time}</p>
                                </div>
                                <button
                                    onClick={() => navigate(`/fixer/jobs/${job.id}`)}
                                    className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-all"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Score section */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center">
                        <div className="inline-flex p-4 rounded-full bg-emerald-50 text-emerald-600 mb-4">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">94.8%</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Resolution Efficiency</p>
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <p className="text-sm font-medium text-gray-600 italic leading-relaxed">
                                "Outstanding performance this week. You've resolved 80% of tasks within the prime window."
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FixerDashboard;
