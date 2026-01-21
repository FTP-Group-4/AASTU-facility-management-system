import { Save, Bell, Clock, Shield, AlertCircle, Zap, Hourglass, Sliders, Mail, Smartphone } from 'lucide-react';

const Settings = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Settings</h1>
                <p className="text-sm text-gray-500">Global configuration for application behavior, security, and notification policies.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* SLA Section */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                            <Clock className="w-5 h-5 text-indigo-600" />
                            <h2 className="font-bold text-gray-800">SLA Policy Configuration</h2>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">High Priority Deadline</label>
                                    <div className="relative">
                                        <input type="number" defaultValue={24} className="w-full bg-white border border-gray-200 rounded-lg pl-4 pr-12 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-700 transition-all" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Hours</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400">Target resolution time for critical/urgent reports.</p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Standard Deadline</label>
                                    <div className="relative">
                                        <input type="number" defaultValue={72} className="w-full bg-white border border-gray-200 rounded-lg pl-4 pr-12 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-700 transition-all" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Hours</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400">Default timeline for non-emergency issues.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                            <Bell className="w-5 h-5 text-indigo-600" />
                            <h2 className="font-bold text-gray-800">Notification Channels</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            {[
                                { label: 'In-app Alert for Critical Issues', status: true, icon: AlertCircle },
                                { label: 'SLA Breach Email Notification', status: true, icon: Mail },
                                { label: 'Daily System Status Report', status: false, icon: Smartphone },
                                { label: 'Assignment Change Notifications', status: true, icon: User },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg border border-gray-100 hover:bg-white hover:shadow-sm transition-all group">
                                    <div className="flex items-center gap-3">
                                        <item.icon className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                                        <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                                    </div>
                                    <button className={`w-10 h-5 rounded-full p-1 transition-all ${item.status ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                        <div className={`w-3 h-3 rounded-full bg-white transition-all transform ${item.status ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-indigo-900 rounded-xl p-6 text-white shadow-lg overflow-hidden relative">
                        <div className="relative z-10">
                            <h3 className="font-bold mb-3 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-indigo-400" /> Maintenance Options
                            </h3>
                            <button className="w-full py-3 bg-white/10 border border-white/20 rounded-lg text-white font-bold text-xs uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                                System Audit Log <Sliders className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-6">
                        <div className="flex items-start gap-4 mb-5">
                            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5" />
                            <div>
                                <h3 className="text-rose-900 font-bold text-sm">Danger Zone</h3>
                                <p className="text-rose-600 text-[10px] font-semibold mt-1">Changes here affect the entire campus network.</p>
                            </div>
                        </div>
                        <button className="w-full py-2.5 bg-rose-600 text-white font-bold rounded-lg text-[11px] uppercase tracking-wider shadow-md hover:bg-rose-700 transition-all">
                            Enable Maintenance Mode
                        </button>
                    </div>

                    <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95">
                        <Save className="w-5 h-5" /> Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
};

// Mock User icon
const User = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);

export default Settings;
