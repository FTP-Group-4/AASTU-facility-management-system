import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, AlertTriangle, CheckCircle, Wrench, Package, User, Camera, Trash2, Zap } from 'lucide-react';

const JobDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Mock data
    const job = {
        id: id || 'T-882',
        summary: 'Main Server Room AC Fault',
        location: 'Block 01, Room 004',
        description: 'Unit is leaking water and making clear grinding sounds. Airflow is minimal. Critical for server cooling. Repair requires professional expertise in HVAC systems.',
        status: 'in_progress',
        priority: 'Emergency',
        reporter: 'Admin System',
        category: 'Electrical/HVAC',
        submittedAt: '30 mins ago',
        photos: ['https://via.placeholder.com/400x300']
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-400 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest transition-all group"
            >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Queue
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-100 bg-gray-50/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${job.priority === 'Emergency' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                {job.priority} Priority
                            </span>
                            <span className="text-gray-400 font-bold text-xs">Ticket #{job.id}</span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{job.summary}</h1>
                    </div>
                    <button className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-md hover:bg-emerald-700 transition-all active:scale-95 text-sm flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" /> Mark Job as Resolved
                    </button>
                </div>

                <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-10">
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Job Description</h3>
                            <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 leading-relaxed text-gray-700">
                                {job.description}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-50 bg-white shadow-sm">
                                <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Exact Location</span>
                                    <span className="text-sm font-bold text-gray-900">{job.location}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-50 bg-white shadow-sm">
                                <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                                    <Wrench className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Required Expertise</span>
                                    <span className="text-sm font-bold text-gray-900">{job.category} Specialist</span>
                                </div>
                            </div>
                        </div>

                        {/* Completion form */}
                        <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 space-y-6">
                            <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                                <Zap className="w-4 h-4" /> Work Logs & Documentation
                            </h3>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Maintenance Notes</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Describe the steps taken to resolve the issue..."
                                        className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Parts Used</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="e.g. AC Filter, Capacitors"
                                            className="flex-1 bg-white border border-indigo-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <button className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                            <Package className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Evidence Photos</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {job.photos.map((p, i) => (
                                    <img key={i} src={p} className="rounded-xl border border-gray-100 object-cover w-full h-48 shadow-sm" alt="Issue Evidence" />
                                ))}
                                <button className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-indigo-400 hover:text-indigo-600 transition-all min-h-[12rem]">
                                    <Camera className="w-8 h-8" />
                                    <span className="text-xs font-bold">Upload Progress Photo</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold border border-gray-200">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Assigned By</p>
                                    <p className="font-bold text-gray-900">{job.reporter}</p>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                                <div className="flex justify-between items-center text-xs font-bold">
                                    <span className="text-gray-400 uppercase">Received</span>
                                    <span className="text-gray-700">{job.submittedAt}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold border-t border-gray-100 pt-3">
                                    <span className="text-gray-400 uppercase tracking-tight">Status</span>
                                    <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Active Deployment</span>
                                </div>
                            </div>

                            <button className="w-full py-4 border-2 border-rose-100 bg-rose-50 text-rose-600 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-2">
                                <Trash2 className="w-4 h-4" /> Request Reassignment
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobDetails;
