import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import NotificationCenter from '../../notifications/NotificationCenter';

interface HeaderProps {
    toggleSidebar: () => void;
}

const Header = ({ toggleSidebar }: HeaderProps) => {
    const { logout } = useAuth();

    return (
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30">
            <div className="flex items-center md:hidden">
                <button 
                    onClick={toggleSidebar}
                    className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            <div className="flex-1"></div> { /* Spacer */}

            <div className="flex items-center space-x-2">
                <NotificationCenter />

                <div className="h-6 w-px bg-gray-200 mx-2"></div>

                <button
                    onClick={logout}
                    className="flex items-center px-3 py-2 text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Sign Out</span>
                </button>
            </div>
        </header>
    );
};

export default Header;