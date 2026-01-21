import { Building2, AlertCircle, CheckCircle } from 'lucide-react';

const AssignedBlocks = () => {
    // Mock Data
    const blocks = [
        {
            id: 57,
            name: "Engineering Building",
            stats: { pending: 3, inProgress: 5, completed: 42, slaCompliance: 92 },
            status: "active"
        },
        {
            id: 12,
            name: "Library",
            stats: { pending: 2, inProgress: 1, completed: 15, slaCompliance: 98 },
            status: "active"
        }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">My Blocks</h1>
                <p className="text-gray-500">Overview of facilities under your supervision.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {blocks.map(block => (
                    <div key={block.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-700 mr-3">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">{block.name}</h3>
                                    <p className="text-xs text-gray-500 font-medium">Block #{block.id}</p>
                                </div>
                            </div>
                            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full uppercase">Active</span>
                        </div>

                        <div className="p-6 grid grid-cols-2 gap-4">
                            <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                                <p className="text-sm text-gray-500 font-medium">Pending</p>
                                <p className="text-2xl font-bold text-orange-600">{block.stats.pending}</p>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-sm text-gray-500 font-medium">Active Jobs</p>
                                <p className="text-2xl font-bold text-blue-600">{block.stats.inProgress}</p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                <p className="text-sm text-gray-500 font-medium">Completed</p>
                                <p className="text-2xl font-bold text-green-600">{block.stats.completed}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-sm text-gray-500 font-medium">SLA Score</p>
                                <div className="flex items-center">
                                    <p className="text-2xl font-bold text-gray-800 mr-2">{block.stats.slaCompliance}%</p>
                                    {block.stats.slaCompliance < 95 ? (
                                        <AlertCircle className="w-4 h-4 text-orange-500" />
                                    ) : (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                            <button className="text-indigo-600 font-medium text-sm hover:text-indigo-800 transition-colors">View Detailed Report Log</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AssignedBlocks;
