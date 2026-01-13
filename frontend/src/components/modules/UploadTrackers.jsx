import React, { useState } from 'react';
import { Upload, File, CheckCircle, Clock, AlertCircle, Download, Trash2, Eye } from 'lucide-react';

const UploadTrackers = () => {
  const [trackers, setTrackers] = useState([
    { id: 1, name: 'Employee Data', type: 'CSV', size: '2.4 MB', status: 'Completed', date: '2024-01-15', records: 245 },
    { id: 2, name: 'Project Templates', type: 'Excel', size: '5.1 MB', status: 'Processing', date: '2024-01-14', records: 120 },
    { id: 3, name: 'Inventory Update', type: 'CSV', size: '1.8 MB', status: 'Failed', date: '2024-01-13', records: 0 },
  ]);
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploading(true);
      setProgress(0);
      
      // Simulate upload progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              const newTracker = {
                id: trackers.length + 1,
                name: file.name,
                type: file.name.split('.').pop().toUpperCase(),
                size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                status: 'Completed',
                date: new Date().toISOString().split('T')[0],
                records: Math.floor(Math.random() * 500)
              };
              setTrackers([newTracker, ...trackers]);
              setUploading(false);
              setProgress(0);
            }, 500);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
  };

  const statusConfig = {
    'Completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    'Processing': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    'Failed': { color: 'bg-red-100 text-red-800', icon: AlertCircle }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Upload className="h-6 w-6 mr-2" />
            Build & Upload Trackers
          </h2>
          <p className="text-gray-600 mt-1">Upload and manage data files with tracking</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="h-4 w-4" />
            <span>Template</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-300 rounded-xl p-4">
          <p className="text-sm text-gray-600">Total Uploads</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{trackers.length}</p>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl p-4">
          <p className="text-sm text-gray-600">Successful</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {trackers.filter(t => t.status === 'Completed').length}
          </p>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl p-4">
          <p className="text-sm text-gray-600">Total Records</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {trackers.reduce((sum, t) => sum + t.records, 0)}
          </p>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl p-4">
          <p className="text-sm text-gray-600">Failed</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {trackers.filter(t => t.status === 'Failed').length}
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white border border-gray-300 rounded-xl p-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Upload className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Data Files</h3>
          <p className="text-gray-600 mb-6">Upload CSV, Excel, or JSON files for processing</p>
          
          <label className="block">
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept=".csv,.xlsx,.xls,.json"
            />
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-gray-400 hover:bg-gray-50 cursor-pointer">
              <div className="space-y-3">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="font-medium">Drag & drop files or click to browse</p>
                  <p className="text-sm text-gray-500">Supports: CSV, Excel, JSON (Max 10MB)</p>
                </div>
              </div>
            </div>
          </label>

          {uploading && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Uploading...</span>
                <span className="text-sm text-gray-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Uploads */}
      <div className="bg-white border border-gray-300 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Uploads</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">File Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Size</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Records</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trackers.map((tracker) => {
                const StatusIcon = statusConfig[tracker.status].icon;
                return (
                  <tr key={tracker.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <File className="h-5 w-5 text-gray-500 mr-3" />
                        <span className="font-medium">{tracker.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {tracker.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">{tracker.size}</td>
                    <td className="py-3 px-4">{tracker.records}</td>
                    <td className="py-3 px-4">{tracker.date}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <StatusIcon className={`h-4 w-4 mr-2 ${
                          tracker.status === 'Completed' ? 'text-green-500' :
                          tracker.status === 'Processing' ? 'text-yellow-500' :
                          'text-red-500'
                        }`} />
                        <span className={`px-2 py-1 rounded-full text-xs ${statusConfig[tracker.status].color}`}>
                          {tracker.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-blue-600 hover:text-blue-800">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-green-600 hover:text-green-800">
                          <Download className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-red-600 hover:text-red-800">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">Upload Guidelines</h4>
        <ul className="space-y-2 text-gray-600">
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
            <span>Ensure CSV files have proper headers and consistent formatting</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
            <span>Excel files should have data in the first sheet</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
            <span>JSON files should follow the standard template structure</span>
          </li>
          <li className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
            <span>Large files may take longer to process. Please be patient</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default UploadTrackers;