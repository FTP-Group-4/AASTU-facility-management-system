import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, Clock, Check, X } from 'lucide-react';
import { notificationApi } from '../../api/notifications/notificationApi';
import type { Notification } from '../../api/notifications/types';
import { formatDate } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

const NotificationCenter = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const data = await notificationApi.getNotifications();
            setNotifications(data.notifications);
            setUnreadCount(data.unread_count);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll for notifications every 2 minutes
        const interval = setInterval(fetchNotifications, 2 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await notificationApi.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }

        if (notification.action_url) {
            setIsOpen(false);
            navigate(notification.action_url);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
            case 'error': return <X className="w-5 h-5 text-red-500" />;
            case 'info':
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 hover:text-indigo-600 transition-colors rounded-full hover:bg-gray-100 outline-none"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden transform origin-top-right transition-all">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h3 className="font-bold text-gray-800">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                            >
                                <Check className="w-3 h-3" />
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {notifications.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3 ${!n.is_read ? 'bg-indigo-50/30' : ''}`}
                                    >
                                        <div className="mt-1 flex-shrink-0">
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className={`text-sm font-bold ${!n.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {n.title}
                                                </h4>
                                                {!n.is_read && (
                                                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-600 leading-relaxed">
                                                {n.message}
                                            </p>
                                            <div className="flex items-center gap-1 text-[10px] text-gray-400 pt-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDate(n.created_at, 'relative')}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Bell className="w-6 h-6 text-gray-300" />
                                </div>
                                <p className="text-sm text-gray-500 font-medium">All caught up!</p>
                                <p className="text-xs text-gray-400 mt-1">No new notifications for you.</p>
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t border-gray-100 text-center bg-gray-50/30">
                        <button className="text-xs font-bold text-gray-500 hover:text-indigo-600 transition-colors">
                            View all activity
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
