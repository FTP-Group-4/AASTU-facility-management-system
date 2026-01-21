import { useState } from 'react';
import { CheckCircle, Clock, AlertTriangle, ChevronRight, Building2, User, MapPin, X, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const CoordinatorDashboard = () => {
  const [selectedReport, setSelectedReport] = useState<any>(null);

  // Mock Data
  const stats = {
    pending: 5,
    approvedToday: 8,
    slaCompliance: 94.2
  };

  const assignedBlocks = [
    { id: 57, name: "Engineering Building", pending: 3, inProgress: 5, overdue: 1 },
    { id: 12, name: "Library", pending: 2, inProgress: 1, overdue: 0 }
  ];

  const pendingReports = [
    {
      id: "AASTU-FIX-20240320-0046",
      summary: "Broken window in Room 305",
      description: "A large glass pane is shattered in Room 305, likely due to heavy wind. Needs immediate board-up and replacement.",
      location: "Block 57, Room 305",
      reporter: "Abebe Daniel",
      category: "Carpentry/Glass",
      time: "15 mins ago",
      duplicate: true
    },
    {
      id: "AASTU-FIX-20240320-0048",
      summary: "AC not working in Lab 2",
      description: "The main AC unit in Computer Lab 2 is not blowing cold air. Students are complaining about the heat during labs.",
      location: "Block 57, Lab 2",
      reporter: "Marta Solomon",
      category: "Electrical/HVAC",
      time: "1 hour ago",
      duplicate: false
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-2">Coordinator Dashboard</h1>
        <p className="text-blue-100 italic">Oversee facility integrity and approve repair workflows for your assigned zones.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Pending Approvals', value: stats.pending, color: 'text-orange-600', bg: 'bg-orange-50', icon: Clock },
          { label: 'Approved Today', value: stats.approvedToday, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
          { label: 'SLA Compliance', value: `${stats.slaCompliance}%`, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: Building2 },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</h3>
            </div>
            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content: Pending Reports */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <Info size={18} className="text-indigo-600" /> Awaiting Review
              </h2>
              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-tighter">{pendingReports.length} Active</span>
            </div>
            <div className="divide-y divide-gray-50">
              {pendingReports.map(report => (
                <div key={report.id} className="p-5 hover:bg-gray-50 transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{report.summary}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} /> {report.location}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{report.time}</span>
                  </div>

                  {report.duplicate && (
                    <div className="mb-4 inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                      SYSTEM DETECTED POTENTIAL DUPLICATE
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 border border-gray-200">
                        {report.reporter.charAt(0)}
                      </div>
                      <span className="text-xs font-semibold text-gray-600">By: {report.reporter}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-50 transition-all shadow-sm"
                      >
                        Quick Look
                      </button>
                      <Link
                        to={`/coordinator/reports/${report.id}`}
                        className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition-all flex items-center"
                      >
                        Propose Fix
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              {pendingReports.length === 0 && (
                <div className="p-12 text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-100 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">No reports awaiting verification.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Assigned Blocks Status */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/30">
              <h2 className="font-bold text-gray-800">Assigned Facility Nodes</h2>
            </div>
            <div className="p-5 space-y-4">
              {assignedBlocks.map(block => (
                <div key={block.id} className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 text-indigo-500 mr-2" />
                      <span className="font-bold text-gray-800 text-sm">{block.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">#{block.id}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white rounded-lg p-2 text-center border border-gray-100 shadow-sm">
                      <span className="block text-sm font-bold text-orange-600">{block.pending}</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase">Wait</span>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center border border-gray-100 shadow-sm">
                      <span className="block text-sm font-bold text-blue-600">{block.inProgress}</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase">Active</span>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center border border-gray-100 shadow-sm">
                      <span className={`block text-sm font-bold ${block.overdue > 0 ? 'text-rose-600' : 'text-gray-300'}`}>{block.overdue}</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">SLA Fail</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in duration-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Report Details - Quick View</h3>
              <button onClick={() => setSelectedReport(null)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">#{selectedReport.id}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{selectedReport.category}</span>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">{selectedReport.summary}</h4>
                <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600 italic leading-relaxed border border-gray-100">
                  "{selectedReport.description}"
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Location</p>
                    <p className="text-xs font-bold text-gray-800">{selectedReport.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Reporter</p>
                    <p className="text-xs font-bold text-gray-800">{selectedReport.reporter}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setSelectedReport(null)}
                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-gray-50 transition-all"
              >
                Close
              </button>
              <Link
                to={`/coordinator/reports/${selectedReport.id}`}
                className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md flex items-center justify-center"
              >
                Review Full Report
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorDashboard;
