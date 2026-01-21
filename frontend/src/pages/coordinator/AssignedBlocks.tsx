import { useState, useEffect } from 'react';
import { Building2, AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { coordinatorApi } from '../../api/reports/coordinatorApi';
import type { CoordinatorDashboardResponse } from '../../api/reports/types';

const AssignedBlocks = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<CoordinatorDashboardResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await coordinatorApi.getDashboard();
                setData(response);
            } catch (err) {
                setError('Failed to fetch assigned blocks data.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const blocks = data?.assigned_blocks || [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Assigned Facilities</h1>
                <p className="text-gray-500">Facility nodes and buildings under your direct supervision.</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {blocks.map(block => (
                    <div key={block.block_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 mr-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">{block.block_name}</h3>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Node ID: #{block.block_id}</p>
                                </div>
                            </div>
                            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-tighter">Supervised</span>
                        </div>

                        <div className="p-6 grid grid-cols-2 gap-4">
                            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[10px] text-orange-700 font-bold uppercase tracking-wide">Awaiting Review</p>
                                    <Clock className="w-3 h-3 text-orange-400" />
                                </div>
                                <p className="text-3xl font-bold text-orange-600">{block.pending_approvals}</p>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[10px] text-blue-700 font-bold uppercase tracking-wide">In Progress</p>
                                    <TrendingUp className="w-3 h-3 text-blue-400" />
                                </div>
                                <p className="text-3xl font-bold text-blue-600">{block.in_progress}</p>
                            </div>
                            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[10px] text-rose-700 font-bold uppercase tracking-wide">SLA Failures</p>
                                    <AlertCircle className="w-3 h-3 text-rose-400" />
                                </div>
                                <p className="text-3xl font-bold text-rose-600">{block.overdue}</p>
                            </div>
                            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-col justify-center">
                                <p className="text-[10px] text-indigo-700 font-bold uppercase tracking-wide">Performance Score</p>
                                <div className="flex items-end mt-1">
                                    <p className="text-3xl font-bold text-indigo-600 mr-2">
                                        {block.overdue === 0 ? '100' : Math.max(0, 100 - block.overdue * 10)}%
                                    </p>
                                    <CheckCircle className="w-4 h-4 text-emerald-500 mb-1.5" />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                            <button className="text-indigo-600 font-bold text-xs uppercase tracking-widest hover:text-indigo-800 transition-colors">Generate Block Report</button>
                        </div>
                    </div>
                ))}

                {blocks.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <Building2 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900">No Facilities Assigned</h3>
                        <p className="text-gray-500 mt-2 max-w-sm mx-auto">You haven't been assigned any facility blocks yet. Please contact the administrator.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssignedBlocks;
