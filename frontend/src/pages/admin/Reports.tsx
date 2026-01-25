import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, AlertCircle, MapPin, FileText, ChevronRight, X, Download, Loader2, ArrowRight } from 'lucide-react';
import { adminService } from '../../services/adminService';

const AdminReports = () => {
    const navigate = useNavigate();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 1
    });

    const fetchReports = async (page = 1) => {
        try {
            setLoading(true);
            setError(null);
            console.log('Fetching reports page:', page, 'search:', searchTerm);
            const response = await adminService.getAllReports({
                page,
                limit: pagination.limit,
                search: searchTerm
            });

            // Log response structure to console
            console.log('Response received:', response);

            // Backend format: { success, message, data: { reports, pagination } }
            // axisInterceptor returns Body, so response is the Body.
            // But adminService.getAllReports returns response.data, so it should be { reports, pagination }

            let reportList = [];
            let pagData = null;

            if (response && response.reports) {
                // response is { reports, pagination }
                reportList = response.reports;
                pagData = response.pagination;
            } else if (response && response.data && response.data.reports) {
                // response is { success, message, data: { reports, pagination } }
                reportList = response.data.reports;
                pagData = response.data.pagination;
            }

            setReports(reportList || []);
            setPagination(pagData || { page, limit: 10, total: 0, pages: 1 });
        } catch (err: any) {
            console.error('Failed to fetch reports:', err);
            setError(err.message || 'Failed to load reports. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports(1);
    }, [searchTerm]); // Re-fetch on search

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchReports(1);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            fetchReports(newPage);
        }
    };

    // Generate Report State
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [reportConfig, setReportConfig] = useState({
        report_type: 'performance',
        format: 'pdf',
        date_range: 'last_30_days' // simplified data range
    });
    const [generationSuccess, setGenerationSuccess] = useState<string | null>(null);

    const handleGenerateReport = async () => {
        try {
            setIsGenerating(true);
            setGenerationSuccess(null);

            // Call actual endpoint
            const response: any = await adminService.generateReport(reportConfig);

            // Simulate processing formatting
            setGenerationSuccess(response.message || 'Report generated successfully! Check your email.');

            // Auto close after 2 sec or let user close
            setTimeout(() => {
                // setIsGenerateModalOpen(false); // Optional: keep open to show success
            }, 2000);
        } catch (error) {
            console.error('Report generation failed:', error);
            alert('Failed to generate report. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

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
        switch (priority) {
            case 'Emergency': return 'text-rose-600';
            case 'High': return 'text-amber-600';
            case 'Medium': return 'text-blue-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Facility Repair Reports</h1>
                    <p className="text-sm text-gray-500">Global registry of all maintenance requests, incidents, and archival data.</p>
                </div>
                
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4">
                    <form onSubmit={handleSearch} className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
                        <input
                            type="text"
                            placeholder="Find reports by ticket ID, location, or issue summary..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all shadow-sm"
                        />
                    </form>
                    <button className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition-all text-sm shadow-sm group">
                        <Filter className="w-4 h-4 mr-2 text-gray-400 group-hover:text-indigo-600" /> Filter Reports
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ticket ID</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Issue & Details</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Condition</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
                                        <p>Loading reports...</p>
                                    </td>
                                </tr>
                            ) : reports.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No reports found in the system. (Debug: Total {pagination.total})
                                    </td>
                                </tr>
                            ) : (
                                reports.map((report) => (
                                    <tr
                                        key={report.id}
                                        className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                                        onClick={() => navigate(`/admin/reports/${report.id}`)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">#{report.ticket_id}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{report.equipment_description}</p>
                                                <div className="flex items-center gap-2">
                                                    <AlertCircle className={`w-3 h-3 ${getPriorityColor(report.priority)}`} />
                                                    <span className={`text-[10px] font-bold uppercase tracking-tight ${getPriorityColor(report.priority)}`}>{report.priority} Priority</span>
                                                    <span className="text-[10px] text-gray-300">•</span>
                                                    <span className="text-[10px] text-gray-400 font-medium">{new Date(report.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-xs font-semibold">
                                                    {report.block ? report.block.name || `Block ${report.block.block_number}` : 'General'}
                                                    {report.room_number ? `, Rm ${report.room_number}` : ''}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border tracking-wider ${getStatusStyles(report.status)}`}>
                                                {report.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/admin/reports/${report.id}`);
                                                }}
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {!loading && pagination.pages > 1 && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
                        <p className="text-xs text-gray-500 font-medium">
                            Showing <span className="text-gray-900">{reports.length}</span> of <span className="text-gray-900">{pagination.total}</span> reports
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="px-3 py-1.5 bg-white border border-gray-200 rounded text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`w-8 h-8 rounded text-xs font-bold transition-all ${pagination.page === pageNum ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm'}`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page === pagination.pages}
                                className="px-3 py-1.5 bg-white border border-gray-200 rounded text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>


            {/* Generate Report Modal */}
            {isGenerateModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Generate System Report</h2>
                                <p className="text-sm text-gray-500">Select parameters for your exported data.</p>
                            </div>
                            <button
                                onClick={() => setIsGenerateModalOpen(false)}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {generationSuccess ? (
                                <div className="bg-green-50 border border-green-100 rounded-xl p-6 text-center">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <FileText className="w-6 h-6 text-green-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-green-800 mb-1">Report Generated!</h3>
                                    <p className="text-green-700 text-sm">{generationSuccess}</p>
                                    <button
                                        onClick={() => { setIsGenerateModalOpen(false); setGenerationSuccess(null); }}
                                        className="mt-4 px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
                                    >
                                        Close
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Report Type</label>
                                            <select
                                                value={reportConfig.report_type}
                                                onChange={(e) => setReportConfig({ ...reportConfig, report_type: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                                            >
                                                <option value="performance">Performance Analysis</option>
                                                <option value="maintenance">Maintenance Logs</option>
                                                <option value="financial">Financial Overview</option>
                                                <option value="inventory">Inventory Status</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Format</label>
                                            <select
                                                value={reportConfig.format}
                                                onChange={(e) => setReportConfig({ ...reportConfig, format: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                                            >
                                                <option value="pdf">PDF Document</option>
                                                <option value="excel">Excel Spreadsheet</option>
                                                <option value="csv">CSV Raw Data</option>
                                                <option value="json">JSON API Response</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Data Period</label>
                                        <select
                                            value={reportConfig.date_range}
                                            onChange={(e) => setReportConfig({ ...reportConfig, date_range: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                                        >
                                            <option value="today">Today so far</option>
                                            <option value="last_7_days">Last 7 Days</option>
                                            <option value="last_30_days">Last 30 Days</option>
                                            <option value="this_quarter">Current Quarter</option>
                                            <option value="all_time">All Time History</option>
                                        </select>
                                    </div>

                                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex gap-3 items-start">
                                        <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-bold text-indigo-900">Pro Tip</h4>
                                            <p className="text-xs text-indigo-700 leading-relaxed mt-1">
                                                Large date ranges may take longer to process. You will be notified via email when complex reports are ready for download.
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {!generationSuccess && (
                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsGenerateModalOpen(false)}
                                    className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition-all text-sm"
                                    disabled={isGenerating}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleGenerateReport}
                                    className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all text-sm flex items-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
                                    disabled={isGenerating}
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            Generate Report
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReports;
