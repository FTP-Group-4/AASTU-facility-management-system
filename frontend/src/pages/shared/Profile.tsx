import { useState } from 'react';
import { User, Mail, Phone, Shield, Camera, Save, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Profile = () => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        phone: '', // Mock data as it might not be in user object yet
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Saving profile:', formData);
        setIsEditing(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Avatar & Basic Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                        <div className="relative inline-block mb-4">
                            <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-3xl font-bold border-4 border-white shadow-sm">
                                {user?.full_name?.charAt(0) || 'U'}
                            </div>
                            <button className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full border border-gray-200 text-gray-500 hover:text-indigo-600 shadow-sm transition-colors">
                                <Camera className="w-4 h-4" />
                            </button>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{user?.full_name}</h2>
                        <p className="text-sm text-gray-500 capitalize mb-4">{user?.role?.replace('_', ' ')}</p>

                        <div className="flex items-center justify-center space-x-2 text-xs font-semibold px-2 py-1 bg-green-50 text-green-700 rounded-full inline-flex">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span>Active Account</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                            <Shield className="w-4 h-4 mr-2 text-indigo-600" />
                            Permissions
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {user?.permissions?.map((p, i) => (
                                <span key={i} className="text-[10px] uppercase font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                    {p.replace(':', ' ')}
                                </span>
                            ))}
                            {user?.permissions?.length === 0 && <span className="text-xs text-gray-400 italic">No special permissions</span>}
                        </div>
                    </div>
                </div>

                {/* Right Column - Edit Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Account Details</h3>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                            >
                                {isEditing ? 'Cancel' : 'Edit Profile'}
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex items-center">
                                        <User className="w-4 h-4 mr-2 text-gray-400" />
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex items-center">
                                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        disabled={true}
                                        value={user?.email || ''}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 outline-none text-gray-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex items-center">
                                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                        Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        placeholder="+251 XXX XXX XXX"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50 transition-all"
                                    />
                                </div>
                            </div>

                            {isEditing && (
                                <div className="pt-4 flex justify-end">
                                    <button type="submit" className="flex items-center px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="font-bold text-gray-800 flex items-center">
                                <Lock className="w-4 h-4 mr-2 text-indigo-600" />
                                Security Settings
                            </h3>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">New Password</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                                    Update Password
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
