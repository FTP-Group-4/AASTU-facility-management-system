import { useState } from 'react';
import { Search, Filter, MoreVertical, Plus, User, Mail, Shield, ShieldCheck, Wrench, UserCheck } from 'lucide-react';

const Users = () => {
    // Mock data
    const [users] = useState([
        { id: 1, name: 'Abebe Kebede', email: 'abebe.k@aastu.edu.et', role: 'admin', status: 'active', initials: 'AK' },
        { id: 2, name: 'Marta Solomun', email: 'marta.s@aastu.edu.et', role: 'coordinator', status: 'active', initials: 'MS' },
        { id: 3, name: 'Chala Muhe', email: 'chala.m@aastu.edu.et', role: 'fixer', status: 'busy', initials: 'CM' },
        { id: 4, name: 'Sara Daniel', email: 'sara.d@aastu.edu.et', role: 'coordinator', status: 'inactive', initials: 'SD' },
    ]);

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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500';
            case 'busy': return 'bg-amber-500';
            case 'inactive': return 'bg-gray-300';
            default: return 'bg-gray-300';
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h1>
                    <p className="text-sm text-gray-500">Manage system access, roles, and account statuses for all personnel.</p>
                </div>
                <button className="flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition-all active:scale-95 text-sm">
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
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                        />
                    </div>
                    <button className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition-all text-sm shadow-sm">
                        <Filter className="w-4 h-4 mr-2 text-gray-400" /> Filter
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
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                                                {user.initials}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{user.name}</p>
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
                                            <div className={`w-2 h-2 rounded-full ${getStatusColor(user.status)}`} />
                                            <span className="text-xs font-medium text-gray-700 capitalize">{user.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-400">
                                        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Users;
