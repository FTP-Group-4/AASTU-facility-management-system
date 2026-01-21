import { useState } from 'react';
import { Search, Filter, AlertTriangle, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { mockReports } from './mockData';

const MyReports = () => {
  const [filter, setFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState<typeof mockReports[0] | null>(null);

  const filteredReports = filter === 'all'
    ? mockReports
    : mockReports.filter(r => r.status === filter);

  return (
    <div className="space-y-6">
      {selectedReport ? (
        // Report Detail View
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <button
              onClick={() => setSelectedReport(null)}
              className="text-sm font-medium text-gray-500 hover:text-indigo-600 flex items-center"
            >
              <ChevronRight className="w-4 h-4 mr-1 rotate-180" /> Back to List
            </button>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${selectedReport.status === 'pending' ? 'bg-orange-100 text-orange-700' :
              selectedReport.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
              {selectedReport.status}
            </span>
          </div>

          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedReport.summary}</h2>
            <p className="text-gray-500 mb-6 flex items-center">
              <Clock className="w-4 h-4 mr-2" /> Submitted on {selectedReport.date}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase mb-3">Description</h3>
                <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg">
                  {selectedReport.description}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase mb-3">Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Location</span>
                    <span className="font-medium text-gray-900">{selectedReport.location}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Category</span>
                    <span className="font-medium text-gray-900">{selectedReport.category}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Assigned To</span>
                    <span className="font-medium text-gray-900">{selectedReport.assignedTo || 'Pending Assignment'}</span>
                  </div>
                </div>

                {selectedReport.photos && selectedReport.photos.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-bold text-gray-900 uppercase mb-3">Photos</h3>
                    <div className="flex gap-2">
                      {selectedReport.photos.map((photo, i) => (
                        <img key={i} src={photo} className="w-24 h-24 object-cover rounded-lg border border-gray-200" alt="Issue" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // List View
        <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">My Reports</h1>
              <p className="text-gray-500">Track status of your submitted issues.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'pending' ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 hover:bg-orange-50'}`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'completed' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-green-50'}`}
              >
                Resolved
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 relative">
              <Search className="absolute left-7 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search reports..."
                className="w-full md:w-96 pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="divide-y divide-gray-100">
              {filteredReports.map(report => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${report.status === 'pending' ? 'bg-orange-500' :
                        report.status === 'in_progress' ? 'bg-blue-500' : 'bg-green-500'
                        }`}></span>
                      <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{report.summary}</h3>
                    </div>
                    <span className="text-xs text-gray-400">{report.date}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3 pl-5">{report.location}</p>
                  <div className="pl-5 flex items-center gap-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${report.status === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                      report.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-green-50 text-green-700 border-green-100'
                      }`}>
                      {report.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-400 font-medium capitalize">{report.category}</span>
                  </div>
                </div>
              ))}
              {filteredReports.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  No reports found matching your filter.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MyReports;