import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    MapPin,
    Clock,
    User,
    FileText,
    Image as ImageIcon,
    AlertTriangle,
    Loader2,
    Shield,
    Activity
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { getMediaUrl } from '../../lib/urlUtils';

const AdminReportDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const response = await adminService.getReportById(id);
                // The service returns response.data which is { report: { ... } } or the report itself
                const reportData = response.report || response.data || response;
                setReport(reportData);
                setError(null);
            } catch (err: any) {
                console.error('Failed to fetch report details:', err);
                setError(err.message || 'Failed to load report details.');
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id]);

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'in_progress': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'pending_approval': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'emergency': return 'text-rose-600 bg-rose-50 border-rose-100';
            case 'high': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'medium': return 'text-blue-600 bg-blue-50 border-blue-100';
            default: return 'text-gray-600 bg-gray-50 border-gray-100';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                <p className="text-gray-500 font-medium">Retrieving report records...</p>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="max-w-2xl mx-auto p-8 text-center bg-white rounded-2xl border border-gray-100 shadow-sm mt-12">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Detailed View Unavailable</h2>
                <p className="text-gray-500 mb-6">{error || 'The requested report could not be found.'}</p>
                <button
                    onClick={() => navigate('/admin/reports')}
                    className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                    Return to Registry
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            {/* Navigation & Actions */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-500 hover:text-indigo-600 transition-colors font-semibold group"
                >
                    <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Registry
                </button>
                <div className="flex gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase border tracking-widest ${getStatusStyles(report?.status || '')} shadow-sm`}>
                        {report?.status?.replace('_', ' ') || 'Unknown Status'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Side */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Header Card */}
                    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border tracking-tighter ${getPriorityColor(report.priority)}`}>
                                    {report.priority} Priority
                                </span>
                                <span className="text-gray-300 text-xs font-mono font-bold tracking-widest">
                                    UUID: {report.id}
                                </span>
                            </div>
                            <h1 className="text-3xl font-black text-gray-900 leading-tight mb-2">
                                {report.equipment_description}
                            </h1>
                            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 font-semibold mt-4">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-indigo-500" />
                                    {report.block ? report.block.name || `Block ${report.block.block_number}` : 'General Location'}
                                    {report.room_number ? `, Room ${report.room_number}` : ''}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-indigo-500" />
                                    {new Date(report.created_at).toLocaleString()}
                                </div>
                            </div>
                        </div>
                        <Activity className="absolute -bottom-12 -right-12 w-48 h-48 opacity-[0.03] rotate-12" />
                    </div>

                    {/* Details Card */}
                    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-500" /> Incident Description
                        </h2>
                        <div className="bg-gray-50 rounded-2xl p-6 text-gray-700 leading-relaxed border border-gray-100 whitespace-pre-wrap min-h-[120px]">
                            {report.problem_description}
                        </div>

                        {report.location_description && (
                            <div className="mt-6">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Location Notes</h3>
                                <p className="text-sm font-medium text-gray-600 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                                    {report.location_description}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Evidence Photos */}
                    {report.photos && report.photos.length > 0 && (
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-indigo-500" /> Media Evidence ({report.photos.length})
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {report.photos.map((photo: any, i: number) => (
                                    <div key={photo.id || i} className="group relative rounded-2xl overflow-hidden border border-gray-100 aspect-square">
                                        <img
                                            src={getMediaUrl(photo.url)}
                                            alt="Evidence"
                                            crossOrigin="anonymous"
                                            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <a
                                                href={getMediaUrl(photo.url)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-3 bg-white rounded-full text-indigo-600 scale-50 group-hover:scale-100 transition-transform duration-300"
                                            >
                                                <ImageIcon size={20} />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Info Side */}
                <div className="space-y-6">
                    {/* Reporter Card */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Registry Details</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-700 font-black border border-indigo-200">
                                    <User size={18} />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-xs font-bold text-gray-400 uppercase truncate">Submitted By</p>
                                    <p className="font-bold text-gray-900 truncate">{report.submitter?.full_name || 'System User'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700 font-black border border-emerald-200">
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase">TICKET ID</p>
                                    <p className="font-bold text-gray-900">#{report.ticket_id}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-700 font-black border border-amber-200">
                                    <Shield size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase">Category</p>
                                    <p className="font-bold text-gray-900 capitalize">{report.category}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline placeholder/Workflow */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center justify-between">
                            Workflow History
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 rounded-full text-gray-400 uppercase">Verified</span>
                        </h3>
                        <div className="relative space-y-6 before:absolute before:inset-y-0 before:left-3 before:w-0.5 before:bg-gray-100">
                            {report.workflow_history?.map((step: any, i: number) => (
                                <div key={i} className="relative pl-8">
                                    <div className={`absolute left-0 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${i === 0 ? 'bg-indigo-500' : 'bg-gray-300'
                                        }`} />
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 uppercase tracking-tight">{step.action?.replace('_', ' ') || 'System Action'}</p>
                                        <p className="text-[10px] text-gray-400 font-bold mb-1">{step.created_at ? new Date(step.created_at).toLocaleString() : 'Date N/A'}</p>
                                        {step.notes && (
                                            <p className="text-[11px] text-gray-500 italic bg-gray-50 p-2 rounded-lg border border-gray-100">
                                                "{step.notes}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )) || (
                                    <p className="text-xs text-center text-gray-400 italic">No history recorded yet.</p>
                                )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminReportDetails;
