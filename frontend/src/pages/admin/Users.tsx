import { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Plus, User, Mail, ShieldCheck, Wrench, UserCheck, Loader2, AlertCircle } from 'lucide-react';
import { adminService } from '../../services/adminService';
import type { User as UserType } from '../../types/admin';

const Users = () => {
    const [users, setUsers] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Edit User State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
    const [editForm, setEditForm] = useState({
        role: 'admin',
        is_active: true
    });
    const [isUpdating, setIsUpdating] = useState(false);

    // Create User State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'reporter',
        phone: '',
        department: ''
    });
    const [isCreating, setIsCreating] = useState(false);

    // Delete User State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserType | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleCreateUser = async () => {
        try {
            setIsCreating(true);
            await adminService.createUser(createForm as any);
            await fetchUsers();
            setIsCreateModalOpen(false);
            setCreateForm({
                full_name: '',
                email: '',
                password: '',
                role: 'reporter',
                phone: '',
                department: ''
            });
        } catch (err: any) {
            console.error('Failed to create user:', err);
            const msg = err.response?.data?.message || 'Failed to create user.';
            alert(msg);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteClick = (user: UserType) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;
        try {
            setIsDeleting(true);
            await adminService.deleteUser(userToDelete.id);
            await fetchUsers();
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
        } catch (err: any) {
            console.error('Failed to delete user:', err);

            // Check for 404 - axios interceptor returns flat error object with err.status
            const status = err.status || err.response?.status;

            if (status === 404) {
                // Could be "User not found" or "Endpoint not found"
                if (err.code === 'ENDPOINT_NOT_FOUND') {
                    alert('Server error: Delete endpoint not available. Please restart the backend server.');
                } else {
                    alert('User was already deleted.');
                }
                await fetchUsers();
                setIsDeleteModalOpen(false);
                setUserToDelete(null);
                return;
            }

            // Get error message from transformed error object or original response
            const msg = err.message || err.response?.data?.message || 'Failed to delete user.';
            alert(msg);
        } finally {
            setIsDeleting(false);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data: any = await adminService.getAllUsers();
            const userList = Array.isArray(data) ? data : (data.users || data.data || []);
            setUsers(userList);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setError('Failed to load users. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleEditClick = (user: UserType) => {
        setSelectedUser(user);
        setEditForm({
            role: user.role,
            is_active: user.is_active
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateUser = async () => {
        if (!selectedUser) return;

        try {
            setIsUpdating(true);
            await adminService.updateUser(selectedUser.id, {
                role: editForm.role as any,
                is_active: editForm.is_active
            });

            // Refresh list or update local state
            await fetchUsers();
            setIsEditModalOpen(false);
            setSelectedUser(null);
        } catch (err) {
            console.error('Failed to update user:', err);
            // Optionally set an error state for the modal
            alert('Failed to update user. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin': return <ShieldCheck size={14} className="mr-1.5" />;
            case 'coordinator': return <UserCheck size={14} className="mr-1.5" />;
            case 'fixer': return <Wrench size={14} className="mr-1.5" />;
            default: return <User size={14} className="mr-1.5" />;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-indigo-100 text-indigo-700';
            case 'coordinator': return 'bg-blue-100 text-blue-700';
            case 'fixer': return 'bg-emerald-100 text-emerald-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusColor = (is_active: boolean) => {
        return is_active ? 'bg-green-500' : 'bg-gray-300';
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const filteredUsers = users.filter(user =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h1>
                    <p className="text-sm text-gray-500">Manage system access, roles, and account statuses for all personnel.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition-all active:scale-95 text-sm"
                >
                    <Plus className="w-5 h-5 mr-2" /> Add New User
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 bg-gray-50/30">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
                        <input
                            type="text"
                            placeholder="Search by name, email or role..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                        />
                    </div>
                    <button
                        onClick={fetchUsers}
                        className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition-all text-sm shadow-sm"
                    >
                        <Filter className="w-4 h-4 mr-2 text-gray-400" /> Refresh
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User Info</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">System Role</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
                                        <p>Loading users...</p>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-red-500">
                                        <p>{error}</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        No users found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                                                    {getInitials(user.full_name || 'Unknown User')}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{user.full_name}</p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Mail className="w-3 h-3" /> {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize ${getRoleColor(user.role)}`}>
                                                {getRoleIcon(user.role)} {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${getStatusColor(user.is_active)}`} />
                                                <span className="text-xs font-medium text-gray-700 capitalize">
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-400 flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEditClick(user)}
                                                className="p-1.5 hover:bg-indigo-50 rounded-lg transition-colors text-indigo-600 hover:text-indigo-800 text-xs font-bold"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(user)}
                                                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-500 hover:text-red-700 text-xs font-bold"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit User Modal */}
            {isEditModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">Edit User</h2>
                            <p className="text-sm text-gray-500">Update account details for <span className="font-semibold">{selectedUser.full_name}</span></p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">System Role</label>
                                <select
                                    value={editForm.role}
                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                >
                                    <option value="admin">Administrator</option>
                                    <option value="coordinator">Coordinator</option>
                                    <option value="electrical_fixer">Electrical Fixer</option>
                                    <option value="mechanical_fixer">Mechanical Fixer</option>
                                    <option value="reporter">Reporter</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Changes permissions and access levels.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={editForm.is_active}
                                            onChange={() => setEditForm({ ...editForm, is_active: true })}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-700">Active</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={!editForm.is_active}
                                            onChange={() => setEditForm({ ...editForm, is_active: false })}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-700">Inactive</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all text-sm"
                                disabled={isUpdating}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateUser}
                                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all text-sm flex items-center gap-2"
                                disabled={isUpdating}
                            >
                                {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isUpdating ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Create User Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900">Create New User</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold p-1">X</button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={createForm.full_name}
                                        onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={createForm.email}
                                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        placeholder="john@aastu.edu.et"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-0.5">Must be @aastu.edu.et</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    value={createForm.password}
                                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    placeholder="Strong password"
                                />
                                <p className="text-[10px] text-gray-500 mt-0.5">Min 8 chars, 1 uppercase, 1 lowercase, 1 number.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                                    <select
                                        value={createForm.role}
                                        onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    >
                                        <option value="reporter">Reporter</option>
                                        <option value="admin">Administrator</option>
                                        <option value="coordinator">Coordinator</option>
                                        <option value="electrical_fixer">Electrical Fixer</option>
                                        <option value="mechanical_fixer">Mechanical Fixer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={createForm.phone}
                                        onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        placeholder="+251..."
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Department</label>
                                <input
                                    type="text"
                                    value={createForm.department}
                                    onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    placeholder="Engineering"
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
                                onClick={handleCreateUser}
                                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all text-sm flex items-center gap-2"
                                disabled={isCreating}
                            >
                                {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isCreating ? 'Creating...' : 'Create User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && userToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete User?</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Are you sure you want to delete <span className="font-bold text-gray-800">{userToDelete.full_name}</span>? This action cannot be undone.
                            </p>
                            <div className="flex justify-center gap-3">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-all text-sm"
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all text-sm flex items-center gap-2"
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
