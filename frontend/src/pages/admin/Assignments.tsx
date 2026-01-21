import { useState } from 'react';
import { Plus, User, Building, ArrowRight, RefreshCcw, ShieldCheck } from 'lucide-react';

const Assignments = () => {
    // Mock data
    const [assignments] = useState([
        { block: 'Block 57', coordinator: 'Marta Solomun', primary: true, lastAudit: '2 days ago' },
        { block: 'Block 12', coordinator: 'Sara Daniel', primary: true, lastAudit: '1 week ago' },
        { block: 'Block 09', coordinator: 'Abebe Kebede', primary: false, lastAudit: 'Just now' },
        { block: 'Block 01', coordinator: 'Marta Solomun', primary: false, lastAudit: '3 days ago' },
    ]);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Coordinator Assignments</h1>
                    <p className="text-sm text-gray-500">Assign responsible coordinators to specific university blocks for oversight.</p>
                </div>
                <button className="flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition-all active:scale-95 text-sm">
                    <Plus className="w-5 h-5 mr-2" /> New Assignment
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {assignments.map((item, i) => (
                    <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        {item.primary && (
                            <div className="absolute top-0 right-0">
                                <div className="bg-indigo-600 text-white text-[8px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-sm">
                                    Primary Lead
                                </div>
                            </div>
                        )}

                        <div className="flex-shrink-0">
                            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner group-hover:bg-indigo-50 transition-colors">
                                <Building className="w-8 h-8 text-gray-400 group-hover:text-indigo-600" />
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-3">
                                <h3 className="text-lg font-bold text-gray-900">{item.block}</h3>
                                <div className="h-1 w-1 rounded-full bg-gray-300"></div>
                                <span className="text-xs font-semibold text-gray-400">Campus North</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                    <User className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div className="truncate">
                                    <p className="text-sm font-bold text-gray-800 truncate">{item.coordinator}</p>
                                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-tight">Assigned Coordinator</p>
                                </div>
                            </div>
                        </div>

                        <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between gap-4 pl-0 sm:pl-6 border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0">
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center justify-end gap-1 mb-1">
                                    <RefreshCcw className="w-2.5 h-2.5" /> Updated {item.lastAudit}
                                </span>
                            </div>
                            <button className="px-4 py-1.5 bg-white border border-gray-200 text-xs font-bold text-gray-600 rounded-lg hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm">
                                Reassign
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Assignments;
