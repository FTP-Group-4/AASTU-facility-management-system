import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    PlusCircle,
    List,
    CheckSquare,
    Building2,
    Users,
    Settings,
    Briefcase
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

const Sidebar = () => {
    const { user } = useAuth();
    const role = user?.role || 'reporter';

    const getLinks = () => {
        switch (role) {
            case 'reporter':
                return [
                    { to: '/reporter/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                    { to: '/reporter/new-report', icon: PlusCircle, label: 'New Report' },
                    { to: '/reporter/reports', icon: List, label: 'My Reports' },
                ];
            case 'coordinator':
                return [
                    { to: '/coordinator/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                    { to: '/coordinator/pending', icon: CheckSquare, label: 'Pending Approvals' },
                    { to: '/coordinator/blocks', icon: Building2, label: 'My Blocks' },
                ];
            case 'electrical_fixer':
            case 'mechanical_fixer':
                return [
                    { to: '/fixer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                    { to: '/fixer/queue', icon: List, label: 'Job Queue' },
                    { to: '/fixer/jobs', icon: Briefcase, label: 'My Jobs' },
                ];
            case 'admin':
                return [
                    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                    { to: '/admin/users', icon: Users, label: 'Users' },
                    { to: '/admin/blocks', icon: Building2, label: 'Blocks' },
                    { to: '/admin/assignments', icon: CheckSquare, label: 'Assignments' },
                    { to: '/admin/config', icon: Settings, label: 'System Config' },
                ];
            default:
                return [];
        }
    };

    return (
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen hidden md:block">
            <div className="p-6">
                <h2 className="text-xl font-bold text-indigo-600 flex items-center">
                    <Building2 className="w-6 h-6 mr-2" />
                    AASTU FMS
                </h2>
            </div>

            <nav className="mt-2 px-4 space-y-1">
                {getLinks().map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                        }
                    >
                        <link.icon className="w-5 h-5 mr-3" />
                        {link.label}
                    </NavLink>
                ))}
            </nav>

            <div className="absolute bottom-0 w-64 p-4 border-t border-gray-100 bg-white">
                <NavLink
                    to={`/${role === 'electrical_fixer' || role === 'mechanical_fixer' ? 'fixer' : role}/profile`}
                    className={({ isActive }) =>
                        `flex items-center p-2 mb-4 rounded-lg transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'}`
                    }
                >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                        {user?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="ml-3 overflow-hidden">
                        <p className="text-sm font-medium text-gray-700 truncate">{user?.full_name || 'User'}</p>
                        <p className="text-xs text-gray-500 capitalize">{role.replace('_', ' ')}</p>
                    </div>
                </NavLink>
            </div>
        </aside>
    );
};

export default Sidebar;
