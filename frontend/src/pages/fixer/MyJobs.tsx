import { useState } from 'react';
import { Search, List, Clock, CheckCircle, ChevronRight, Briefcase, MapPin, AlertCircle, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MyJobs = () => {
    const navigate = useNavigate();

    // Mock data
    const [jobs] = useState([
        { id: 'T-882', summary: 'Main Server Room AC Fault', location: 'Block 01, Room 004', status: 'in_progress', date: '30 mins ago', type: 'Electrical' },
        { id: 'T-771', summary: 'Lecture Hall 2 Projector Power', location: 'Block 57, Hall 2', status: 'assigned', date: '2 hours ago', type: 'Audio/Visual' },
        { id: 'T-654', summary: 'Sink Leakage - Faculty Lounge', location: 'Block 12, Floor 2', status: 'completed', date: 'Yesterday', type: 'Plumbing' },
    ]);

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'completed': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            case 'in_progress': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
            case 'assigned': return 'text-blue-600 bg-blue-50 border-blue-100';
            default: return 'text-gray-600 bg-gray-50 border-gray-100';
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Active Jobs</h1>
                    <p className="text-sm text-gray-500">Overview of all maintenance tasks currently assigned to you.</p>
                </div>
                <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">{jobs.filter(j => j.status !== 'completed').length} Pending Tasks</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 bg-gray-50/50">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
                        <input
                            type="text"
                            placeholder="Find target job by ID or equipment..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                        />
                    </div>
                    <button className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition-all text-sm shadow-sm">
                        <Filter className="w-4 h-4 mr-2 text-gray-400" /> Filter Jobs
                    </button>
                </div>

                <div className="divide-y divide-gray-100">
                    {jobs.map((job) => (
                        <div
                            key={job.id}
                            onClick={() => navigate(`/fixer/jobs/${job.id}`)}
                            className="p-5 hover:bg-gray-50/80 transition-all flex items-center justify-between cursor-pointer group"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl border transition-colors ${getStatusStyles(job.status)}`}>
                                    {job.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{job.summary}</h3>
                                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">#{job.id}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400" /> {job.location}</span>
                                        <span className="flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-gray-400" /> {job.type}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-wider italic">{job.status === 'completed' ? 'Resolved ' : 'Assigned '} {job.date}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`hidden sm:inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-gray-100 ${getStatusStyles(job.status)}`}>
                                    {job.status.replace('_', ' ')}
                                </span>
                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MyJobs;
