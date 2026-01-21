import { Bell, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

const Header = () => {
    const { logout } = useAuth(); // Assuming logout function exists in context

    return (
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-20">
            <div className="flex items-center md:hidden">
                <button className="text-gray-500 hover:text-gray-700">
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            <div className="flex-1"></div> { /* Spacer */}

            <div className="flex items-center space-x-4">
                <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>

                <div className="h-6 w-px bg-gray-200 mx-2"></div>

                <button
                    onClick={logout}
                    className="flex items-center text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                </button>
            </div>
        </header>
    );
};

export default Header;
