import { useState, useEffect } from 'react';
import {
    Clock,
    CheckCircle,
    Search,
    Filter,
    Calendar,
    MapPin,
    ChevronRight,
    Loader2,
    History,
    AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fixerService } from '../../services/fixerService';
import { formatDate } from '../../lib/utils';

const JobHistory = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const fetchHistory = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fixerService.getJobHistory({
                status: statusFilter || undefined,
                search: searchTerm || undefined
            });
            setJobs(data || []);
        } catch (err: any) {
            console.error('Error fetching job history:', err);
            setError(err.response?.data?.message || 'Failed to load job history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchHistory();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter]);

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'closed': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'in_progress': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'assigned': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'emergency': return 'text-rose-600 font-black';
            case 'high': return 'text-amber-600 font-bold';
            case 'medium': return 'text-blue-600 font-bold';
            default: return 'text-gray-500 font-medium';
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <History className="text-indigo-600" /> Job History
                    </h1>
                    <p className="text-sm text-gray-500">View and track all maintenance tasks you've handled.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by Ticket ID or equipment..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400 mr-1" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="">All Statuses</option>
                        <option value="completed">Completed</option>
                        <option value="closed">Closed</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase tracking-widest font-black text-gray-400">
                            <tr>
                                <th className="px-6 py-4">Ticket</th>
                                <th className="px-6 py-4">Task Details</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Completed At</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && jobs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
                                        <p className="text-gray-500 text-sm">Loading history records...</p>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-rose-500 font-medium">
                                        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        {error}
                                    </td>
                                </tr>
                            ) : jobs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        No history records found.
                                    </td>
                                </tr>
                            ) : (
                                jobs.map((job) => (
                                    <tr
                                        key={job.id}
                                        className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                                        onClick={() => navigate(`/fixer/jobs/${job.id}`)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-gray-900">#{job.ticket_id}</span>
                                                <span className={`text-[10px] uppercase tracking-tighter ${getPriorityColor(job.priority)}`}>
                                                    {job.priority} Priority
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-gray-800 line-clamp-1">{job.problem_summary}</p>
                                                <div className="flex items-center text-[11px] text-gray-400 font-medium">
                                                    <MapPin className="w-3 h-3 mr-1" /> {job.location}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{job.category}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border tracking-tight ${getStatusStyles(job.status)}`}>
                                                {job.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {job.completed_at ? (
                                                <div className="flex items-center text-xs font-medium text-emerald-600">
                                                    <CheckCircle className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                                                    {formatDate(job.completed_at, 'short')}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-300 font-medium italic">In Progress</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-gray-300 group-hover:text-indigo-600 transition-colors">
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default JobHistory;
