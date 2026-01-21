import { useState, useEffect } from 'react';
import { User as UserIcon, Mail, Phone, Shield, Camera, Save, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../api/auth/authApi';
import Button from '../../components/common/UI/Button';

const Profile = () => {
    const { user, refreshUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        phone: user?.phone || '',
        avatar: user?.avatar || ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                phone: user.phone || '',
                avatar: user.avatar || ''
            });
        }
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            await authApi.updateProfile({
                full_name: formData.full_name,
                phone: formData.phone,
                avatar: formData.avatar
            });
            await refreshUser();
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setIsEditing(false);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">My Profile</h1>
            </div>

            {message && (
                <div className={`p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Avatar & Basic Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                        <div className="relative inline-block mb-4">
                            <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-3xl font-bold border-4 border-white shadow-sm overflow-hidden">
                                {formData.avatar ? (
                                    <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    user?.full_name?.charAt(0) || 'U'
                                )}
                            </div>
                            <button className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full border border-gray-200 text-gray-500 hover:text-indigo-600 shadow-sm transition-colors">
                                <Camera className="w-4 h-4" />
                            </button>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{user?.full_name}</h2>
                        <p className="text-sm text-gray-500 capitalize mb-4">{user?.role?.replace('_', ' ')}</p>

                        <div className="flex items-center justify-center space-x-2 text-xs font-semibold px-3 py-1 bg-green-50 text-green-700 rounded-full inline-flex border border-green-100 mb-6">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <span>Active Account</span>
                        </div>

                        {user?.role === 'reporter' && (
                            <div className="pt-6 border-t border-gray-100 space-y-4 text-left">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Reporter Stats</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <p className="text-lg font-bold text-indigo-600">{(user as any).stats?.reports_submitted || 0}</p>
                                        <p className="text-[10px] text-gray-500 font-medium uppercase">Submitted</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <p className="text-lg font-bold text-orange-600">{(user as any).stats?.reports_pending || 0}</p>
                                        <p className="text-[10px] text-gray-500 font-medium uppercase">Pending</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {user?.role === 'coordinator' && (
                            <div className="pt-6 border-t border-gray-100 space-y-4 text-left">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Coordinator Stats</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <p className="text-lg font-bold text-emerald-600">{(user as any).stats?.approvals_made || 0}</p>
                                        <p className="text-[10px] text-gray-500 font-medium uppercase">Approved</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <p className="text-lg font-bold text-red-600">{(user as any).stats?.rejections_made || 0}</p>
                                        <p className="text-[10px] text-gray-500 font-medium uppercase">Rejected</p>
                                    </div>
                                </div>
                                <div className="bg-indigo-50 p-3 rounded-lg">
                                    <p className="text-lg font-bold text-indigo-600">{(user as any).stats?.pending_reviews || 0}</p>
                                    <p className="text-[10px] text-gray-500 font-medium uppercase">Pending Review</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                            <Shield className="w-4 h-4 mr-2 text-indigo-600" />
                            Account Access
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {user?.permissions?.map((p: string, i: number) => (
                                <span key={i} className="text-[10px] uppercase font-bold px-2.5 py-1 bg-gray-50 text-gray-600 rounded border border-gray-100">
                                    {p.split(':').join(' ')}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column - Edit Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                            <h3 className="font-bold text-gray-800">Account Details</h3>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`text-sm font-medium ${isEditing ? 'text-gray-500 hover:text-gray-700' : 'text-indigo-600 hover:text-indigo-800'}`}
                            >
                                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center">
                                        <UserIcon className="w-3.5 h-3.5 mr-2 text-gray-400" />
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center">
                                        <Mail className="w-3.5 h-3.5 mr-2 text-gray-400" />
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        disabled={true}
                                        value={user?.email || ''}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 outline-none text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center">
                                        <Phone className="w-3.5 h-3.5 mr-2 text-gray-400" />
                                        Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        placeholder="+251 XXX XXX XXX"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                                    />
                                </div>
                            </div>

                            {isEditing && (
                                <div className="pt-4 flex justify-end">
                                    <Button type="submit" disabled={isLoading} className="shadow-md">
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </form>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-bold text-gray-800 flex items-center">
                                <Lock className="w-4 h-4 mr-2 text-indigo-600" />
                                Password & Security
                            </h3>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">New Password</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Confirm Password</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button variant="outline" className="text-sm font-bold border-gray-200 hover:bg-gray-50">
                                    Update Password
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
