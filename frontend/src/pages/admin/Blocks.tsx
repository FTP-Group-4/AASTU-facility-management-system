import { useState } from 'react';
import { Search, Plus, Building2, MapPin, Eye, Settings2, ShieldCheck } from 'lucide-react';

const Blocks = () => {
    // Mock data
    const [blocks] = useState([
        { id: 1, name: 'Block 57', type: 'Engineering', floors: 4, rooms: 120, status: 'Active' },
        { id: 2, name: 'Block 12', type: 'Library', floors: 3, rooms: 45, status: 'Active' },
        { id: 3, name: 'Block 09', type: 'Student Center', floors: 2, rooms: 32, status: 'Maintenance' },
        { id: 4, name: 'Block 01', type: 'Administration', floors: 5, rooms: 88, status: 'Active' },
    ]);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Facility Management</h1>
                    <p className="text-sm text-gray-500">Configure university blocks, room groupings, and operational status.</p>
                </div>
                <button className="flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition-all active:scale-95 text-sm">
                    <Plus className="w-5 h-5 mr-2" /> Register New Block
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blocks.map((block) => (
                    <div key={block.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-3.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${block.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {block.status}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-1">{block.name}</h3>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center mb-6">
                                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-indigo-500" /> {block.type} Facility
                            </p>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Floors</span>
                                    <span className="text-sm font-bold text-gray-800">{block.floors}</span>
                                </div>
                                <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Total Rooms</span>
                                    <span className="text-sm font-bold text-gray-800">{block.rooms}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                                <button className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                                    <Eye className="w-4 h-4" /> View Details
                                </button>
                                <button className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                                    <Settings2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Blocks;
