import { useState } from 'react';
import { Search, Filter, MoreVertical, Clock, MapPin, AlertCircle, CheckCircle, FileText, ChevronRight } from 'lucide-react';

const AdminReports = () => {
    // Mock data
    const [reports] = useState([
        { id: 'T-882', summary: 'Main Server Room AC Fault', location: 'Block 01, Room 004', status: 'in_progress', priority: 'Emergency', date: '30 mins ago' },
        { id: 'T-771', summary: 'Lecture Hall 2 Projector Power', location: 'Block 57, Hall 2', status: 'pending_approval', priority: 'High', date: '2 hours ago' },
        { id: 'T-654', summary: 'Sink Leakage - Faculty Lounge', location: 'Block 12, Floor 2', status: 'completed', priority: 'Medium', date: 'Yesterday' },
        { id: 'T-543', summary: 'Broken Window - Dorm 4', location: 'Block 40, Room 112', status: 'rejected', priority: 'Low', date: '2 days ago' },
    ]);

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
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2">
                        Download Export <FileText className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
                        <input
                            type="text"
                            placeholder="Find reports by ticket ID, location, or issue summary..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all shadow-sm"
                        />
                    </div>
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
                            {reports.map((report) => (
                                <tr key={report.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">#{report.id}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{report.summary}</p>
                                            <div className="flex items-center gap-2">
                                                <AlertCircle className={`w-3 h-3 ${getPriorityColor(report.priority)}`} />
                                                <span className={`text-[10px] font-bold uppercase tracking-tight ${getPriorityColor(report.priority)}`}>{report.priority} Priority</span>
                                                <span className="text-[10px] text-gray-300">•</span>
                                                <span className="text-[10px] text-gray-400 font-medium">{report.date}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="text-xs font-semibold">{report.location}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border tracking-wider ${getStatusStyles(report.status)}`}>
                                            {report.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminReports;
