import { useState, useEffect } from 'react';
import { Clock, Briefcase, MapPin, AlertCircle, TrendingUp, ChevronRight } from 'lucide-react';
import { fixerService } from '../../services/fixerService';
import type { JobQueueResponse } from '../../services/fixerService';

const JobQueue = () => {
    const [queueData, setQueueData] = useState<JobQueueResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [acceptingJob, setAcceptingJob] = useState<string | null>(null);

    const fetchQueue = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fixerService.getJobQueue();
            setQueueData(data);
        } catch (err: any) {
            console.error('Error fetching queue:', err);
            setError(err.response?.data?.message || 'Failed to load job queue');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
    }, []);

    const handleAcceptJob = async (id: string, ticketId: string) => {
        try {
            setAcceptingJob(id);
            console.log(`Accepting job: ${ticketId} (Internal ID: ${id})`);
            await fixerService.updateJobStatus(id, { status: 'assigned' });
            // Refresh the queue after accepting
            await fetchQueue();
        } catch (err: any) {
            console.error('Error accepting job:', err);
            const errorMessage = err.message || err.response?.data?.message || 'Failed to accept job';
            alert(`Error: ${errorMessage}`);
        } finally {
            setAcceptingJob(null);
        }
    };

    const getPriorityStyles = (priority: string) => {
        switch (priority) {
            case 'emergency': return 'bg-rose-600 text-white shadow-rose-100';
            case 'high': return 'bg-amber-500 text-white shadow-amber-100';
            case 'medium': return 'bg-blue-600 text-white shadow-blue-100';
            default: return 'bg-gray-500 text-white shadow-gray-100';
        }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading job queue...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-6xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-red-900 mb-2">Error Loading Queue</h3>
                    <p className="text-red-700 mb-4">{error}</p>
                    <button
                        onClick={fetchQueue}
                        className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!queueData) {
        return null;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Available Job Queue</h1>
                    <p className="text-sm text-gray-500">Unclaimed maintenance requests available for pickup by technical staff.</p>
                </div>
                <div className="bg-white px-5 py-2.5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">
                        {queueData.queue_stats.emergency_count > 0 ? 'EMERGENCY JOBS WAITING' : 'Queue Load: Normal'}
                    </span>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-indigo-600" />
                        <h2 className="font-bold text-gray-800">Available Assignments</h2>
                    </div>
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full uppercase tracking-widest">
                        {queueData.queue_stats.total_waiting} Tasks in Pool
                    </span>
                </div>

                <div className="divide-y divide-gray-100">
                    {queueData.queue.length > 0 ? queueData.queue.map((job) => (
                        <div key={job.id} className="p-6 md:p-8 hover:bg-gray-50/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                            <div className="flex items-start gap-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${getPriorityStyles(job.priority)}`}>
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-tighter">
                                            Ticket #{job.ticket_id}
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase tracking-widest">
                                            <Clock className="w-3 h-3" /> {job.waiting_time}
                                        </span>
                                        {job.assigned_to_me && (
                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">
                                                Already Assigned to You
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors tracking-tight">{job.problem}</h3>
                                    <div className="flex items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">
                                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-300" /> {job.location}</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] ${job.sla_urgency === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                                            job.sla_urgency === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            SLA: {job.sla_urgency}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {!job.assigned_to_me && (
                                <button
                                    onClick={() => handleAcceptJob(job.id, job.ticket_id)}
                                    disabled={acceptingJob === job.id}
                                    className="px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg border-b-4 border-indigo-800 hover:bg-indigo-700 hover:translate-y-0.5 transition-all active:translate-y-1 active:border-b-0 text-xs uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {acceptingJob === job.id ? 'Accepting...' : 'Claim This Job'} <ChevronRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )) : (
                        <div className="p-12 text-center text-gray-500">
                            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-lg font-medium">No jobs available in the queue</p>
                            <p className="text-sm mt-2">Check back later for new assignments</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JobQueue;
