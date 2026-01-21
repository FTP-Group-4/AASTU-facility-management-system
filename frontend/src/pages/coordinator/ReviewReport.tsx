import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, User, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const ReviewReport = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Mock Data based on ID
    const report = {
        id: id || 'AASTU-FIX-20240320-0046',
        summary: 'Broken window in Room 305',
        location: 'Block 57, Room 305',
        description: 'Window pane is shattered, dangerous. Wind is blowing papers everywhere.',
        reporter: {
            name: 'Student Name',
            role: 'Reporter',
            dept: 'Software Eng.'
        },
        time: '15 mins ago',
        submittedAt: '2024-03-20 10:30 AM',
        category: 'Mechanical',
        priority: 'Medium', // Coordinator can change this
        photos: ['https://via.placeholder.com/300']
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Pending
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <div className="flex items-center space-x-3 mb-2">
                            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full uppercase">Pending Approval</span>
                            <span className="text-gray-400 text-sm">#{report.id}</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">{report.summary}</h1>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-800 border-b pb-2">Issue Details</h3>
                            <p className="text-gray-600 leading-relaxed">{report.description}</p>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="flex items-center text-gray-600">
                                    <MapPin className="w-5 h-5 mr-3 text-gray-400" />
                                    <div>
                                        <span className="block text-xs font-bold text-gray-400 uppercase">Location</span>
                                        <span className="font-medium">{report.location}</span>
                                    </div>
                                </div>
                                <div className="flex items-center text-gray-600">
                                    <AlertTriangle className="w-5 h-5 mr-3 text-gray-400" />
                                    <div>
                                        <span className="block text-xs font-bold text-gray-400 uppercase">Category</span>
                                        <span className="font-medium">{report.category}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-800 border-b pb-2 mb-4">Photos</h3>
                            <div className="flex flex-wrap gap-4">
                                {report.photos.map((photo, i) => (
                                    <div key={i} className="rounded-lg overflow-hidden border border-gray-200">
                                        <img src={photo} alt="Report" className="h-48 w-auto object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4">Reporter Info</h3>
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold mr-3">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{report.reporter.name}</p>
                                    <p className="text-xs text-gray-500">{report.reporter.dept}</p>
                                </div>
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                                <Clock className="w-4 h-4 mr-2" />
                                <span>Reported: {report.submittedAt}</span>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
                            <h3 className="font-bold text-gray-800 mb-4">Action</h3>
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">Set Priority</label>
                                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option>Low</option>
                                    <option selected>Medium</option>
                                    <option>High</option>
                                    <option>Emergency</option>
                                </select>

                                <button className="w-full flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-md mt-4">
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    Approve & Assign
                                </button>
                                <button className="w-full flex items-center justify-center px-4 py-2.5 bg-white border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors">
                                    <XCircle className="w-5 h-5 mr-2" />
                                    Reject Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewReport;
