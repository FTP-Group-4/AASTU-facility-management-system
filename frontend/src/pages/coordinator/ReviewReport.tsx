import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, User, AlertTriangle, Info, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useReportStore } from '../../stores/reportStore';
import { getMediaUrl } from '../../lib/urlUtils';
import type { ReportPriority } from '../../types/report';

const ReviewReport = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentReport, fetchCoordinatorReport, isLoading, error, reviewReport } = useReportStore();

    const [priority, setPriority] = useState<ReportPriority>('medium');
    const [rejectionReason, setRejectionReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            fetchCoordinatorReport(id);
        }
    }, [id, fetchCoordinatorReport]);

    useEffect(() => {
        if (currentReport?.priority) {
            setPriority(currentReport.priority);
        }
    }, [currentReport]);

    const handleAction = async (action: 'approve' | 'reject') => {
        if (!id) return;

        if (action === 'reject' && !rejectionReason.trim()) {
            setActionError('Please provide a reason for rejection.');
            return;
        }

        try {
            setIsSubmitting(true);
            setActionError(null);
            await reviewReport(id, action, priority, action === 'reject' ? rejectionReason : undefined);
            navigate('/coordinator/dashboard');
        } catch (err: any) {
            setActionError(err.message || 'Failed to submit review.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error || !currentReport) {
        return (
            <div className="max-w-4xl mx-auto p-8 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
                <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Could Not Load Report</h2>
                <p className="text-gray-500 mb-6">{error || 'Report not found or access denied.'}</p>
                <button
                    onClick={() => navigate('/coordinator/dashboard')}
                    className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </button>

            {actionError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl relative">
                    <span className="block sm:inline">{actionError}</span>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <div className="flex items-center space-x-3 mb-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${currentReport.status === 'submitted' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                {currentReport.status.replace('_', ' ')}
                            </span>
                            <span className="text-gray-400 text-sm">#{currentReport.ticket_id}</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">{currentReport.equipment_description || currentReport.problem_description?.substring(0, 50) || 'Unnamed Equipment'}</h1>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Category</span>
                        <p className="font-bold text-indigo-600 capitalize">{currentReport.category}</p>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                                <Info size={16} /> Problem Description
                            </h3>
                            <div className="p-4 bg-gray-50 rounded-xl text-gray-700 leading-relaxed border border-gray-200 shadow-inner">
                                {currentReport.problem_description}
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="flex items-center text-gray-600">
                                    <MapPin className="w-5 h-5 mr-3 text-indigo-400" />
                                    <div>
                                        <span className="block text-xs font-bold text-gray-400 uppercase">Location</span>
                                        <span className="font-medium text-sm">
                                            {currentReport.location?.block_name || (currentReport.location?.block_id ? `Block ${currentReport.location.block_id}` : 'General Location')}
                                            {currentReport.location?.room_number ? `, Room ${currentReport.location.room_number}` : ''}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center text-gray-600">
                                    <Clock className="w-5 h-5 mr-3 text-indigo-400" />
                                    <div>
                                        <span className="block text-xs font-bold text-gray-400 uppercase">Submitted</span>
                                        <span className="font-medium text-sm">{currentReport.submitted_at ? new Date(currentReport.submitted_at).toLocaleString() : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {currentReport.photos && currentReport.photos.length > 0 && (
                            <div>
                                <h3 className="font-bold text-gray-800 border-b pb-2 mb-4">Evidence Photos</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {currentReport.photos.map((photo, i) => (
                                        <a key={photo.id || i} href={getMediaUrl(photo.url)} target="_blank" rel="noopener noreferrer" className="rounded-lg overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity aspect-square block">
                                            <img src={getMediaUrl(photo.thumbnail_url || photo.url)} alt="Report evidence" className="h-full w-full object-cover" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 text-sm">
                            <h3 className="font-bold text-gray-800 mb-4">Reporter Info</h3>
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold mr-3 border border-indigo-200">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{currentReport.submitted_by?.name || 'Unknown'}</p>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">{currentReport.submitted_by?.role || 'Reporter'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border-2 border-indigo-100 p-5 rounded-xl shadow-lg relative">
                            <h3 className="font-bold text-gray-800 mb-4">Determine Action</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Set Priority</label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as ReportPriority)}
                                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-sm"
                                    >
                                        <option value="low">Low Priority</option>
                                        <option value="medium">Medium Priority</option>
                                        <option value="high">High Priority</option>
                                        <option value="emergency">EMERGENCY</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Rejection Reason (if applicable)</label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Reason for rejection..."
                                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500 h-24"
                                    />
                                </div>

                                <div className="space-y-3 pt-2">
                                    <button
                                        onClick={() => handleAction('approve')}
                                        disabled={isSubmitting}
                                        className={`w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                        {isSubmitting ? 'Processing...' : 'Approve & Assign'}
                                    </button>
                                    <button
                                        onClick={() => handleAction('reject')}
                                        disabled={isSubmitting}
                                        className={`w-full flex items-center justify-center px-4 py-3 bg-white border-2 border-red-100 text-red-600 font-bold rounded-xl hover:bg-red-50 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <XCircle className="w-5 h-5 mr-2" />
                                        Reject Issue
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewReport;
