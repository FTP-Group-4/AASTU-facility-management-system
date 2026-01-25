import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    PlusCircle,
    List,
    CheckSquare,
    CheckCircle,
    XCircle,
    Building2,
    Users,
    Settings,
    Briefcase,
    Clock,
    X
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useEffect } from 'react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const { user } = useAuth();
    const role = user?.role || 'reporter';

    // Close sidebar when clicking outside on mobile
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

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
                    { to: '/coordinator/approved', icon: CheckCircle, label: 'Approved Reports' },
                    { to: '/coordinator/rejected', icon: XCircle, label: 'Rejected Reports' },
                    { to: '/coordinator/blocks', icon: Building2, label: 'My Blocks' },
                ];
            case 'electrical_fixer':
            case 'mechanical_fixer':
                return [
                    { to: '/fixer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                    { to: '/fixer/queue', icon: List, label: 'Job Queue' },
                    { to: '/fixer/jobs', icon: Briefcase, label: 'My Jobs' },
                    { to: '/fixer/history', icon: Clock, label: 'Job History' }, // Added Job History link
                ];
            case 'admin':
                return [
                    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                    { to: '/admin/users', icon: Users, label: 'Users' },
                    { to: '/admin/blocks', icon: Building2, label: 'Blocks' },
                    { to: '/admin/reports', icon: List, label: 'Reports' },
                    { to: '/admin/assignments', icon: CheckSquare, label: 'Assignments' },
                    { to: '/admin/config', icon: Settings, label: 'System Config' },
                ];
            default:
                return [];
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 backdrop-blur-xs bg-white/40 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:relative md:translate-x-0 md:w-64 md:min-h-screen md:block
                w-64
            `}>
                {/* Mobile Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 md:hidden">
                    <h2 className="text-xl font-bold text-indigo-600 flex items-center">
                        <Building2 className="w-6 h-6 mr-2" />
                        AASTU FMS
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Desktop Header */}
                <div className="p-6 hidden md:block">
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
                            onClick={() => {
                                // Close sidebar on mobile when a link is clicked
                                if (window.innerWidth < 768) {
                                    onClose();
                                }
                            }}
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

                <div className="absolute bottom-0 w-full p-4 border-t border-gray-100 bg-white">
                    <NavLink
                        to={`/${role === 'electrical_fixer' || role === 'mechanical_fixer' ? 'fixer' : role}/profile`}
                        onClick={() => {
                            if (window.innerWidth < 768) {
                                onClose();
                            }
                        }}
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
        </>
    );
};

export default Sidebar;