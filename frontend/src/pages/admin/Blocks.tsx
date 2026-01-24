import { useState, useEffect } from 'react';
import { Search, Plus, Building2, MapPin, Eye, Settings2, ShieldCheck, Loader2 } from 'lucide-react';
import { adminService } from '../../services/adminService';
import type { Block } from '../../types/admin';

const Blocks = () => {
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Create Block State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        block_number: '',
        name: '',
        description: ''
    });
    const [isCreating, setIsCreating] = useState(false);

    // Edit Block State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
    const [editForm, setEditForm] = useState({ name: '', description: '' });
    const [isUpdating, setIsUpdating] = useState(false);

    // Delete Block State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [blockToDelete, setBlockToDelete] = useState<Block | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // View Details State
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewBlock, setViewBlock] = useState<Block | null>(null);

    const fetchBlocks = async () => {
        try {
            setLoading(true);
            const limit = 50;
            const response: any = await adminService.getAllBlocks({ page: 1, limit });

            // Extract data securely based on API structure
            const responseData = response.data || response; // successResponse.data
            let allBlocks = responseData.blocks || [];
            const pagination = responseData.pagination;

            // If there are more pages, fetch them in parallel
            if (pagination && pagination.pages > 1) {
                const promises = [];
                for (let i = 2; i <= pagination.pages; i++) {
                    promises.push(adminService.getAllBlocks({ page: i, limit }));
                }

                const responses = await Promise.all(promises);
                responses.forEach((res: any) => {
                    const pageResponseData = res.data || res;
                    const pageBlocks = pageResponseData.blocks || [];
                    allBlocks = [...allBlocks, ...pageBlocks];
                });
            }

            // Sort by block number just in case
            allBlocks.sort((a: any, b: any) => (a.block_number || 0) - (b.block_number || 0));

            setBlocks(allBlocks);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch blocks:', err);
            setError('Failed to load blocks. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlocks();
    }, []);

    const handleCreateBlock = async () => {
        if (!createForm.block_number || isNaN(parseInt(createForm.block_number))) {
            alert('Please enter a valid block number.');
            return;
        }

        try {
            setIsCreating(true);
            await adminService.createBlock({
                ...createForm,
                block_number: parseInt(createForm.block_number)
            });
            await fetchBlocks();
            setIsCreateModalOpen(false);
            setCreateForm({ block_number: '', name: '', description: '' });
        } catch (err: any) {
            console.error('Failed to create block:', err);
            const msg = err.response?.data?.message || 'Failed to create block.';
            alert(msg);
        } finally {
            setIsCreating(false);
        }
    };

    const handleEditClick = (block: Block) => {
        setSelectedBlock(block);
        setEditForm({
            name: block.name,
            description: block.description || ''
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateBlock = async () => {
        if (!selectedBlock) return;
        try {
            setIsUpdating(true);
            await adminService.updateBlock(selectedBlock.id, editForm);
            await fetchBlocks();
            setIsEditModalOpen(false);
            setSelectedBlock(null);
        } catch (err: any) {
            console.error('Failed to update block:', err);
            alert(err.response?.data?.message || 'Failed to update block');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteClick = (block: Block) => {
        setBlockToDelete(block);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!blockToDelete) return;
        try {
            setIsDeleting(true);
            await adminService.deleteBlock(blockToDelete.id);
            await fetchBlocks();
            setIsDeleteModalOpen(false);
            setBlockToDelete(null);
        } catch (err: any) {
            console.error('Failed to delete block:', err);
            alert(err.response?.data?.message || 'Failed to delete block');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleViewClick = (block: Block) => {
        setViewBlock(block);
        setIsViewModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 p-4 rounded-lg text-red-800 text-center">
                <p>{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-2 text-sm font-semibold underline"
                >
                    Retry
                </button>
            </div>
        );
    }



    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Facility Management</h1>
                    <p className="text-sm text-gray-500">Configure university blocks, room groupings, and operational status.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition-all active:scale-95 text-sm"
                >
                    <Plus className="w-5 h-5 mr-2" /> Register New Block
                </button>
            </div>

            {blocks.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No Blocks Found</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mt-1">Get started by registering a new facility block for the campus.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {blocks.map((block) => (
                        <div key={block.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
                                            Active
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-400">#{block.block_number}</span>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-1">{block.name}</h3>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center mb-6">
                                    <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-indigo-500" /> Facility
                                </p>

                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                                        <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Reports</span>
                                        <span className="text-sm font-bold text-gray-800">{block.report_count || 0}</span>
                                    </div>
                                    <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                                        <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Coordinators</span>
                                        <span className="text-sm font-bold text-gray-800">{block.coordinators?.length || 0}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                                    <button
                                        onClick={() => handleViewClick(block)}
                                        className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Eye className="w-4 h-4" /> View
                                    </button>
                                    <button
                                        onClick={() => handleEditClick(block)}
                                        className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                        title="Edit Block"
                                    >
                                        <Settings2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(block)}
                                        className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                        title="Delete Block"
                                    >
                                        <div className="relative">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-0.5 bg-current rotate-45 transform origin-center transition-all group-hover:rotate-0"></div>
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-0.5 bg-current -rotate-45 transform origin-center transition-all group-hover:rotate-0"></div>
                                            X
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Block Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900">Register New Block</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold p-1">X</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Block Number</label>
                                <input
                                    type="number"
                                    value={createForm.block_number}
                                    onChange={(e) => setCreateForm({ ...createForm, block_number: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    placeholder="e.g. 57"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Block Name</label>
                                <input
                                    type="text"
                                    value={createForm.name}
                                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    placeholder="e.g. Freshman Building"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Description (Optional)</label>
                                <textarea
                                    value={createForm.description}
                                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm h-24 resize-none"
                                    placeholder="Brief details about the block..."
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-all text-sm"
                                disabled={isCreating}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateBlock}
                                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all text-sm flex items-center gap-2"
                                disabled={isCreating}
                            >
                                {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isCreating ? 'Creating...' : 'Create Block'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Block Modal */}
            {isEditModalOpen && selectedBlock && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900">Edit Block #{selectedBlock.block_number}</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold p-1">X</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Block Name</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm h-24 resize-none"
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg text-sm">Cancel</button>
                            <button onClick={handleUpdateBlock} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg text-sm flex items-center gap-2" disabled={isUpdating}>
                                {isUpdating ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Block Modal */}
            {isDeleteModalOpen && blockToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Block #{blockToDelete.block_number}?</h3>
                        <p className="text-sm text-gray-500 mb-6">This will delete the block and unassign any coordinators. Reports will remain archived.</p>
                        <div className="flex justify-center gap-3">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg text-sm">Cancel</button>
                            <button onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg text-sm flex items-center gap-2" disabled={isDeleting}>
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {isViewModalOpen && viewBlock && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{viewBlock.name}</h2>
                                <p className="text-sm text-gray-500">Block #{viewBlock.block_number} Details</p>
                            </div>
                            <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold p-1">X</button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description</h4>
                                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    {viewBlock.description || 'No description provided.'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                    <span className="block text-[10px] font-bold text-indigo-400 uppercase mb-1">Active Reports</span>
                                    <span className="text-2xl font-bold text-indigo-900">{viewBlock.report_count || 0}</span>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <span className="block text-[10px] font-bold text-blue-400 uppercase mb-1">Coordinators</span>
                                    <span className="text-2xl font-bold text-blue-900">{viewBlock.coordinators?.length || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Blocks;
