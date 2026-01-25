/** Fixer MyJobs Page module */
import { useState, useEffect } from 'react';
import { Clock, CheckCircle, Briefcase, MapPin, AlertCircle, PlayCircle, CheckSquare } from 'lucide-react';
import { fixerService } from '../../services/fixerService';
import type { FixerDashboardData, DashboardJob } from '../../services/fixerService';

const MyJobs = () => {
    const [dashboardData, setDashboardData] = useState<FixerDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingJob, setUpdatingJob] = useState<string | null>(null);
    const [completionModal, setCompletionModal] = useState<{ show: boolean; job: DashboardJob | null }>({ show: false, job: null });
    const [completionNotes, setCompletionNotes] = useState('');

    const fetchJobs = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fixerService.getDashboard();
            setDashboardData(data);
        } catch (err: any) {
            console.error('Error fetching jobs:', err);
            setError(err.response?.data?.message || 'Failed to load jobs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const handleStartWork = async (id: string, ticketId: string) => {
        try {
            setUpdatingJob(id);
            console.log(`Starting work on job: ${ticketId} (Internal ID: ${id})`);
            await fixerService.updateJobStatus(id, { status: 'in_progress' });
            await fetchJobs();
        } catch (err: any) {
            console.error('Error starting work:', err);
            const errorMessage = err.message || err.response?.data?.message || 'Failed to start work on job';
            alert(`Error: ${errorMessage}`);
        } finally {
            setUpdatingJob(null);
        }
    };

    const handleCompleteJob = async () => {
        if (!completionModal.job) return;

        if (!completionNotes.trim()) {
            alert('Completion notes are required');
            return;
        }

        const { id, ticket_id } = completionModal.job;

        try {
            setUpdatingJob(id);
            console.log(`Completing job: ${ticket_id} (Internal ID: ${id})`);
            await fixerService.updateJobStatus(id, {
                status: 'completed',
                notes: completionNotes
            });
            setCompletionModal({ show: false, job: null });
            setCompletionNotes('');
            await fetchJobs();
        } catch (err: any) {
            console.error('Error completing job:', err);
            const errorMessage = err.message || err.response?.data?.message || 'Failed to complete job';
            alert(`Error: ${errorMessage}`);
        } finally {
            setUpdatingJob(null);
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'completed': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            case 'in_progress': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
            case 'assigned': return 'text-blue-600 bg-blue-50 border-blue-100';
            default: return 'text-gray-600 bg-gray-50 border-gray-100';
        }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your jobs...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-6xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-red-900 mb-2">Error Loading Jobs</h3>
                    <p className="text-red-700 mb-4">{error}</p>
                    <button
                        onClick={fetchJobs}
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

    const allJobs = [...dashboardData.assigned_jobs, ...dashboardData.in_progress_jobs];

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Active Jobs</h1>
                    <p className="text-sm text-gray-500">Overview of all maintenance tasks currently assigned to you.</p>
                </div>
                <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">{allJobs.length} Active Tasks</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-100">
                    {allJobs.length > 0 ? allJobs.map((job) => (
                        <div
                            key={job.id}
                            className="p-5 hover:bg-gray-50/80 transition-all flex items-center justify-between"
                        >
                            <div className="flex items-start gap-4 flex-1">
                                <div className={`p-3 rounded-xl border transition-colors ${getStatusStyles(job.status)}`}>
                                    {job.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-gray-900">{job.problem_summary}</h3>
                                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">#{job.ticket_id}</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${job.priority === 'emergency' ? 'bg-rose-100 text-rose-700' :
                                            job.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {job.priority}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400" /> {job.location}</span>
                                        <span className="flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-gray-400" /> {job.category}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-wider italic">
                                        Reporter: {job.reporter_name}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`hidden sm:inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusStyles(job.status)}`}>
                                    {job.status.replace('_', ' ')}
                                </span>
                                {job.status === 'assigned' && (
                                    <button
                                        onClick={() => handleStartWork(job.id, job.ticket_id)}
                                        disabled={updatingJob === job.id}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all text-xs disabled:opacity-50"
                                    >
                                        <PlayCircle className="w-4 h-4" />
                                        {updatingJob === job.id ? 'Starting...' : 'Start Work'}
                                    </button>
                                )}
                                {job.status === 'in_progress' && (
                                    <button
                                        onClick={() => setCompletionModal({ show: true, job })}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-all text-xs"
                                    >
                                        <CheckSquare className="w-4 h-4" />
                                        Mark Complete
                                    </button>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="p-12 text-center text-gray-500">
                            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-lg font-medium">No active jobs</p>
                            <p className="text-sm mt-2">Check the job queue for available assignments</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Completion Modal */}
            {completionModal.show && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Complete Job</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Please provide completion notes for ticket <span className="font-bold">#{completionModal.job?.ticket_id}</span>
                        </p>
                        <textarea
                            value={completionNotes}
                            onChange={(e) => setCompletionNotes(e.target.value)}
                            placeholder="Describe the work performed, parts used, and any other relevant details..."
                            className="w-full h-32 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
                            required
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => {
                                    setCompletionModal({ show: false, job: null });
                                    setCompletionNotes('');
                                }}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCompleteJob}
                                disabled={!completionNotes.trim() || updatingJob === completionModal.job?.ticket_id}
                                className="flex-1 px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {updatingJob === completionModal.job?.ticket_id ? 'Completing...' : 'Complete Job'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyJobs;
