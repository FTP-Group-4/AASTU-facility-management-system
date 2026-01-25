import { useEffect } from 'react';
import { XCircle, MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useReportStore } from '../../stores/reportStore';

const RejectedReports = () => {
    const navigate = useNavigate();
    const { reports, fetchRejectedReports, isLoading, error } = useReportStore();

    useEffect(() => {
        fetchRejectedReports();
    }, [fetchRejectedReports]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Rejected Reports</h1>
                    <p className="text-gray-500">View reports that have been rejected.</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl relative">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : reports.map(report => (
                    <div key={report.ticket_id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                            <div className="flex-1 opacity-75">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Rejected</span>
                                    <span className="text-[10px] font-mono text-gray-400">#{report.ticket_id}</span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 line-through decoration-gray-400">{report.equipment_description || 'Untitled Report'}</h3>
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{report.problem_summary}</p>
                                <div className="flex flex-wrap items-center text-xs text-gray-500 mt-2 gap-4">
                                    <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                                        {report.location?.block_name || (report.location?.block_id ? `Block ${report.location.block_id}` : 'N/A')}
                                        {report.location?.room_number ? `, Room ${report.location.room_number}` : ''}
                                    </span>
                                    <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                                        {new Date(report.submitted_at).toLocaleDateString()}
                                    </span>
                                    <span className="px-2 py-0.5 bg-gray-100 rounded capitalize">{report.category}</span>
                                </div>
                            </div>

                            <div className="flex md:flex-col gap-2 min-w-[140px]">
                                <button
                                    onClick={() => navigate(`/coordinator/reports/${report.ticket_id}`)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 shadow-sm transition-colors text-xs text-center"
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {!isLoading && reports.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <XCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">No rejected reports</h3>
                        <p className="text-gray-500 mt-1">You haven't rejected any reports.</p>
                        <button
                            onClick={() => navigate('/coordinator/dashboard')}
                            className="mt-6 text-indigo-600 font-bold hover:underline"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RejectedReports;
