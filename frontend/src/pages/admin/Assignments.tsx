import { useState, useEffect } from 'react';
import { Plus, User, Building, ArrowRight, RefreshCcw, ShieldCheck, Loader2, X, Trash2 } from 'lucide-react';
import { adminService } from '../../services/adminService';
import type { User as UserType, Block } from '../../types/admin';

const Assignments = () => {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Assignment Modal State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignForm, setAssignForm] = useState({
        block_id: '',
        coordinator_id: ''
    });
    const [coordinators, setCoordinators] = useState<UserType[]>([]);
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete Assignment State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [assignData, blocksData, usersData] = await Promise.all([
                adminService.getAssignments(), // Correct endpoint
                adminService.getAllBlocks(),
                adminService.getAllUsers({ role: 'coordinator' })
            ]);

            // Handle assignments matrix
            const matrix = (assignData as any).data?.matrix || (assignData as any).matrix || [];

            // Flatten matrix for display
            const flatList: any[] = [];
            matrix.forEach((block: any) => {
                if (block.coordinators && block.coordinators.length > 0) {
                    block.coordinators.forEach((c: any) => {
                        flatList.push({
                            block_id: block.block_id,
                            block_name: block.block_name,
                            coordinator_id: c.id,
                            coordinator_name: c.name,
                            coordinator_email: c.email,
                            is_primary: c.is_primary
                        });
                    });
                }
            });

            setAssignments(flatList);
            setBlocks(Array.isArray(blocksData) ? blocksData : (blocksData as any).blocks || []);
            setCoordinators(Array.isArray(usersData) ? usersData : (usersData as any).users || []);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch assignment data:', err);
            setError('Failed to load data. Please refresh.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAssign = async () => {
        if (!assignForm.block_id || !assignForm.coordinator_id) {
            alert('Please select both a block and a coordinator.');
            return;
        }

        try {
            setIsSubmitting(true);
            await adminService.assignCoordinator(assignForm.block_id, assignForm.coordinator_id);
            await fetchData();
            setIsAssignModalOpen(false);
            setAssignForm({ block_id: '', coordinator_id: '' });
        } catch (err: any) {
            console.error('Assignment failed:', err);
            alert(err.response?.data?.message || 'Failed to assign coordinator.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (assignment: any) => {
        setSelectedAssignment(assignment);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedAssignment) return;
        try {
            setIsDeleting(true);
            await adminService.removeCoordinatorAssignment(selectedAssignment.block_id, selectedAssignment.coordinator_id);
            await fetchData();
            setIsDeleteModalOpen(false);
            setSelectedAssignment(null);
        } catch (err: any) {
            console.error('Unassign failed:', err);
            alert(err.response?.data?.message || 'Failed to remove assignment.');
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600 w-8 h-8" /></div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Coordinator Assignments</h1>
                    <p className="text-sm text-gray-500">Assign responsible coordinators to specific university blocks for oversight.</p>
                </div>
                <button
                    onClick={() => setIsAssignModalOpen(true)}
                    className="flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition-all active:scale-95 text-sm"
                >
                    <Plus className="w-5 h-5 mr-2" /> New Assignment
                </button>
            </div>

            {assignments.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500">No active assignments found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {assignments.map((item, i) => (
                        <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center gap-6 group">
                            <div className="flex-shrink-0">
                                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner group-hover:bg-indigo-50 transition-colors">
                                    <Building className="w-8 h-8 text-gray-400 group-hover:text-indigo-600" />
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-3">
                                    <h3 className="text-lg font-bold text-gray-900">{item.block_name}</h3>
                                    <div className="h-1 w-1 rounded-full bg-gray-300"></div>
                                    <span className="text-xs font-semibold text-gray-400">Campus Facility</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                        <User className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <div className="truncate">
                                        <p className="text-sm font-bold text-gray-800 truncate">{item.coordinator_name}</p>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-tight">{item.coordinator_email}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between gap-4 pl-0 sm:pl-6 border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0">
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-green-600 uppercase flex items-center justify-end gap-1 mb-1">
                                        <ShieldCheck className="w-3 h-3" /> Active
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDeleteClick(item)}
                                    className="px-4 py-1.5 bg-white border border-gray-200 text-xs font-bold text-red-500 rounded-lg hover:bg-red-50 hover:border-red-200 transition-all shadow-sm flex items-center gap-2"
                                >
                                    <Trash2 className="w-3 h-3" /> Unassign
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* New Assignment Modal */}
            {isAssignModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900">New Assignment</h2>
                            <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold p-1">X</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Select Block</label>
                                <select
                                    value={assignForm.block_id}
                                    onChange={(e) => setAssignForm({ ...assignForm, block_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                >
                                    <option value="">-- Choose a block --</option>
                                    {blocks.map(b => (
                                        <option key={b.id} value={b.id}>{b.name} (Block {b.block_number})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Select Coordinator</label>
                                <select
                                    value={assignForm.coordinator_id}
                                    onChange={(e) => setAssignForm({ ...assignForm, coordinator_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                >
                                    <option value="">-- Choose a coordinator --</option>
                                    {coordinators.map(c => (
                                        <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsAssignModalOpen(false)}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-all text-sm"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssign}
                                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all text-sm flex items-center gap-2"
                                disabled={isSubmitting}
                            >
                                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isSubmitting ? 'Assigning...' : 'Assign'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Assignment Modal */}
            {isDeleteModalOpen && selectedAssignment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Remove Assignment?</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Are you sure you want to unassign <span className="font-bold">{selectedAssignment.coordinator_name}</span> from <span className="font-bold">{selectedAssignment.block_name}</span>?
                        </p>
                        <div className="flex justify-center gap-3">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg text-sm">Cancel</button>
                            <button onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg text-sm flex items-center gap-2" disabled={isDeleting}>
                                {isDeleting ? 'Removing...' : 'Remove'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Assignments;
