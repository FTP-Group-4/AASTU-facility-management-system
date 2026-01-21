import { useState } from 'react';
import { Search, List, Clock, CheckCircle, Briefcase, MapPin, AlertCircle, TrendingUp, ChevronRight } from 'lucide-react';

const JobQueue = () => {
    // Mock data
    const [queue] = useState([
        { id: 'T-900', summary: 'Emergency Generator Fault', location: 'Power House', status: 'pending', priority: 'Emergency', date: '5 mins ago' },
        { id: 'T-850', summary: 'Lab 4 Network Rack Cooling', location: 'Block 12', status: 'pending', priority: 'High', date: '45 mins ago' },
        { id: 'T-840', summary: 'Corridor Lighting - Block 05', location: 'Block 05', status: 'pending', priority: 'Medium', date: '1 hour ago' },
        { id: 'T-830', summary: 'Restroom Pipe Burst', location: 'Block 01', status: 'pending', priority: 'High', date: '1.5 hours ago' },
    ]);

    const getPriorityStyles = (priority: string) => {
        switch (priority) {
            case 'Emergency': return 'bg-rose-600 text-white shadow-rose-100';
            case 'High': return 'bg-amber-500 text-white shadow-amber-100';
            case 'Medium': return 'bg-blue-600 text-white shadow-blue-100';
            default: return 'bg-gray-500 text-white shadow-gray-100';
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Available Job Queue</h1>
                    <p className="text-sm text-gray-500">Unclaimed maintenance requests available for pickup by technical staff.</p>
                </div>
                <div className="bg-white px-5 py-2.5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Global Queue Load: Normal</span>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-indigo-600" />
                        <h2 className="font-bold text-gray-800">Available Assignments</h2>
                    </div>
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full uppercase tracking-widest">{queue.length} Tasks in Pool</span>
                </div>

                <div className="divide-y divide-gray-100">
                    {queue.map((job) => (
                        <div key={job.id} className="p-6 md:p-8 hover:bg-gray-50/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                            <div className="flex items-start gap-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${getPriorityStyles(job.priority)}`}>
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-tighter">Ticket #{job.id}</span>
                                        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase tracking-widest">
                                            <Clock className="w-3 h-3" /> {job.date}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors tracking-tight">{job.summary}</h3>
                                    <div className="flex items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">
                                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-300" /> {job.location}</span>
                                    </div>
                                </div>
                            </div>

                            <button className="px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg border-b-4 border-indigo-800 hover:bg-indigo-700 hover:translate-y-0.5 transition-all active:translate-y-1 active:border-b-0 text-xs uppercase tracking-widest flex items-center justify-center gap-3">
                                Claim This Job <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default JobQueue;
