import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, CheckCircle, Wrench, User, AlertCircle } from 'lucide-react';
import { fixerService } from '../../services/fixerService';

const JobDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchJobDetails = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const data = await fixerService.getJobDetails(id);
                setJob(data);
            } catch (err: any) {
                console.error('Error fetching job details:', err);
                setError(err.response?.data?.message || 'Failed to load job details');
            } finally {
                setLoading(false);
            }
        };

        fetchJobDetails();
    }, [id]);

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Retrieving job records...</p>
                </div>
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="max-w-5xl mx-auto py-10">
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-900 mb-2">Could Not Load Job</h2>
                    <p className="text-red-700 mb-6">{error || 'The job you are looking for was not found.'}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2 mx-auto"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to List
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-400 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest transition-all group"
            >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to My Jobs
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-100 bg-gray-50/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${job.priority === 'emergency' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                {job.priority} Priority
                            </span>
                            <span className="text-gray-400 font-bold text-xs">Ticket #{job.ticket_id}</span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{job.equipment_description || job.summary}</h1>
                    </div>
                    {job.status !== 'completed' && job.status !== 'closed' && (
                        <button
                            onClick={() => navigate('/fixer/jobs')}
                            className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-md hover:bg-emerald-700 transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
                        >
                            <CheckCircle className="w-5 h-5" /> Manage Status in My Jobs
                        </button>
                    )}
                </div>

                <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-10">
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Problem Description</h3>
                            <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 leading-relaxed text-gray-700">
                                {job.problem_description}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-50 bg-white shadow-sm">
                                <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Location</span>
                                    <span className="text-sm font-bold text-gray-900">
                                        {job.location?.type === 'specific'
                                            ? `Block ${job.location?.block_name}, Room ${job.location?.room_number}`
                                            : job.location?.description || 'General Location'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-50 bg-white shadow-sm">
                                <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                                    <Wrench className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Category</span>
                                    <span className="text-sm font-bold text-gray-900 capitalize">{job.category} Service</span>
                                </div>
                            </div>
                        </div>

                        {job.photos && job.photos.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Evidence Photos</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {job.photos.map((p: any, i: number) => (
                                        <div key={i} className="relative group">
                                            <img
                                                src={p.url || p}
                                                className="rounded-xl border border-gray-100 object-cover w-full h-48 shadow-sm transition-transform group-hover:scale-[1.02]"
                                                alt={`Issue Evidence ${i + 1}`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold border border-gray-200">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Reported By</p>
                                    <p className="font-bold text-gray-900">{job.submitted_by?.name || 'Academic User'}</p>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                                <div className="flex justify-between items-center text-xs font-bold">
                                    <span className="text-gray-400 uppercase">Received</span>
                                    <span className="text-gray-700">{new Date(job.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold border-t border-gray-100 pt-3">
                                    <span className="text-gray-400 uppercase tracking-tight">Status</span>
                                    <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">{job.status.replace('_', ' ')}</span>
                                </div>
                            </div>

                            {job.sla && (
                                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">SLA Deadline</p>
                                    <div className="flex items-center gap-2 text-indigo-700 font-bold">
                                        <Clock className="w-4 h-4" />
                                        <span>{new Date(job.sla.deadline).toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobDetails;
