import { useState } from 'react';
import { AlertTriangle, MapPin, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const PendingApprovals = () => {
    // Mock Data
    const [reports, setReports] = useState([
        {
            id: 'AASTU-FIX-20240320-0046',
            summary: 'Broken window in Room 305',
            location: 'Block 57, Room 305',
            description: 'Window pane is shattered, dangerous.',
            reporter: 'Student Name',
            time: '15 mins ago',
            duplicate: true,
            status: 'pending_approval'
        },
        // ... more
    ]);

    const handleAction = (id: string, action: 'approve' | 'reject') => {
        console.log(`Report ${id} ${action}d`);
        // Remove from list for demo
        setReports(prev => prev.filter(r => r.id !== id));
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Pending Approvals</h1>
                <p className="text-gray-500">Review and approve reporter submissions.</p>
            </div>

            <div className="space-y-4">
                {reports.map(report => (
                    <div key={report.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full uppercase">Pending</span>
                                    {report.duplicate && (
                                        <span className="flex items-center bg-amber-50 text-amber-600 text-xs font-bold px-2 py-1 rounded-full border border-amber-100">
                                            <AlertTriangle className="w-3 h-3 mr-1" /> Possible Duplicate
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">{report.summary}</h3>
                                <div className="flex items-center text-sm text-gray-500 mt-2 gap-4">
                                    <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {report.location}</span>
                                    <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> {report.time}</span>
                                </div>
                                <p className="mt-4 text-gray-600 bg-gray-50 p-3 rounded-lg text-sm">{report.description}</p>
                            </div>

                            <div className="flex md:flex-col gap-2 min-w-[140px]">
                                <Link
                                    to={`/coordinator/reports/${report.id}`}
                                    className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition-colors text-sm text-center"
                                >
                                    Review Details
                                </Link>
                                <button
                                    onClick={() => handleAction(report.id, 'reject')}
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors text-sm"
                                >
                                    Reject Report
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {reports.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                            <Clock className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">All caught up!</h3>
                        <p className="text-gray-500 mt-1">No pending reports to review.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PendingApprovals;
