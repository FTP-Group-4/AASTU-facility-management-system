import { useNavigate } from 'react-router-dom';
import { Plus, List, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
// import { reportApi } from '../../api/reports/reportApi'; // Mocking for now to avoid dependency errors if api not fully set

const ReporterDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    // Mock data matching API structure
    const [stats, setStats] = useState({
        total: 12,
        pending: 2,
        in_progress: 3,
        completed: 7,
    });

    const [recentReports, setRecentReports] = useState([
        {
            id: "AASTU-FIX-20240320-0045",
            summary: "Projector won't turn on",
            location: "Block 57 - Room 201",
            status: "in_progress",
            date: "2024-03-20"
        },
        {
            id: "AASTU-FIX-20240318-0022",
            summary: "Broken chair in lab",
            location: "Block 12 - Lab 3",
            status: "completed",
            date: "2024-03-18"
        }
    ]);

    useEffect(() => {
        // Simulate API call
        setTimeout(() => setLoading(false), 500);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-50 border-green-200';
            case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'pending_approval': return 'text-orange-600 bg-orange-50 border-orange-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">

            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg">
                <h1 className="text-2xl font-bold mb-2">Welcome Back, Reporter</h1>
                <p className="text-indigo-100 mb-6">Found an issue on campus? Report it now and help us maintain AASTU facilities.</p>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => navigate('/reporter/new-report')}
                        className="flex items-center px-4 py-2.5 bg-white text-indigo-700 font-semibold rounded-lg shadow-md hover:bg-gray-50 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Report New Issue
                    </button>
                    <button
                        onClick={() => navigate('/reporter/reports')}
                        className="flex items-center px-4 py-2.5 bg-indigo-700/50 text-white font-semibold rounded-lg hover:bg-indigo-700/70 transition-all border border-indigo-500"
                    >
                        <List className="w-5 h-5 mr-2" />
                        My Reports
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="p-3 bg-blue-50 rounded-full text-blue-600 mb-2">
                        <List className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">{stats.total}</h3>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Reports</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="p-3 bg-orange-50 rounded-full text-orange-600 mb-2">
                        <Clock className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">{stats.pending}</h3>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Pending</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="p-3 bg-indigo-50 rounded-full text-indigo-600 mb-2">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">{stats.in_progress}</h3>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">In Progress</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="p-3 bg-green-50 rounded-full text-green-600 mb-2">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">{stats.completed}</h3>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Resolved</p>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="font-bold text-gray-800 text-lg">Recent Reports</h2>
                    <button onClick={() => navigate('/reporter/reports')} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">View All</button>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-400">Loading activity...</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {recentReports.map(report => (
                            <div key={report.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                <div className="flex items-start space-x-3">
                                    <div className={`p-2 rounded-lg mt-1 ${getStatusColor(report.status)}`}>
                                        {report.status === 'completed' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800 text-sm group-hover:text-indigo-600 transition-colors">{report.summary}</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">{report.location} • {report.id}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(report.status)}`}>
                                        {report.status.replace('_', ' ')}
                                    </span>
                                    <p className="text-xs text-gray-400 mt-1">{report.date}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReporterDashboard;
