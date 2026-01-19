import React, { useState, useEffect } from 'react';
import {
  Upload,
  File,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Trash2,
  Eye
} from 'lucide-react';

import ChartBuilder from "./ChartBuilder";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const UploadTrackers = () => {
  const [trackers, setTrackers] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // 🔹 Chart state
  const [selectedDatasetId, setSelectedDatasetId] = useState(null);
  const [datasetSchema, setDatasetSchema] = useState([]);
  const [showChart, setShowChart] = useState(false);

  // 🔹 LOAD DATASETS ON PAGE LOAD
  useEffect(() => {
    const fetchTrackers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/datasets`);
        if (!res.ok) throw new Error("API not found");

        const data = await res.json();

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.datasets)
          ? data.datasets
          : [];

        setTrackers(list);
      } catch (err) {
        console.error("Failed to load datasets", err);
        setTrackers([]); // prevents .filter crash
      }
    };

    fetchTrackers();
  }, []);

  // 🔹 LOAD SCHEMA → SHOW CHART
  const loadSchema = async (datasetId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/datasets/${datasetId}/schema`);
      if (!res.ok) throw new Error("Schema load failed");

      const data = await res.json();
      setDatasetSchema(data);
      setSelectedDatasetId(datasetId);
      setShowChart(true);
    } catch (err) {
      console.error("Failed to load schema", err);
      alert("Failed to load dataset schema");
    }
  };

  // 🔹 UPLOAD FILE
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setProgress(10);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setProgress(60);

      const res = await fetch(`${API_BASE_URL}/datasets/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();

      const newTracker = {
        id: data.dataset_id,
        name: file.name,
        type: file.name.split('.').pop().toUpperCase(),
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        status: 'Completed',
        date: new Date().toISOString().split('T')[0],
        records: data.rows
      };

      setTrackers(prev => [newTracker, ...prev]);
      setProgress(100);
    } catch (error) {
      setTrackers(prev => [{
        id: Date.now(),
        name: file.name,
        type: file.name.split('.').pop().toUpperCase(),
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        status: 'Failed',
        date: new Date().toISOString().split('T')[0],
        records: 0
      }, ...prev]);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  // 🔹 DOWNLOAD DATASET
const handleDownload = async (datasetId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/datasets/${datasetId}/download`);
    if (!res.ok) throw new Error("Download failed");

    // Get the filename from headers if provided
    const filename =
      res.headers.get("content-disposition")?.split("filename=")[1] ||
      `dataset_${datasetId}.csv`;

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    // Create a temporary link and trigger download
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename.replace(/"/g, ""));
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Download error:", err);
    alert("Failed to download dataset");
  }
};


  // 🔹 DELETE DATASET (DB + UI)
  const handleDelete = async (id) => {
    if (!confirm("Delete this dataset?")) return;

    try {
      await fetch(`${API_BASE_URL}/datasets/${id}`, { method: "DELETE" });
      setTrackers(prev => prev.filter(t => t.id !== id));

      if (id === selectedDatasetId) {
        setShowChart(false);
        setSelectedDatasetId(null);
        setDatasetSchema([]);
      }
    } catch (err) {
      alert("Delete failed");
    }
  };

  const statusConfig = {
    Completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    Processing: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    Failed: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
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
            {trackers.reduce((sum, t) => sum + (t.records || 0), 0)}
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
          <input
            type="file"
            className="hidden"
            id="fileInput"
            onChange={handleFileUpload}
            accept=".csv,.xlsx,.xls,.json"
          />
          <label htmlFor="fileInput" className="cursor-pointer block">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-gray-400 hover:bg-gray-50">
              <Upload className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="font-medium mt-2">Drag & drop files or click to browse</p>
              <p className="text-sm text-gray-500">Supports: CSV, Excel, JSON (Max 10MB)</p>
            </div>
          </label>

          {uploading && (
            <div className="mt-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Uploading...</span>
                <span className="text-sm text-gray-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Uploads */}
<div className="bg-white border border-gray-300 rounded-xl p-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Uploads</h3>

  <div className="overflow-x-auto">
    <table className="w-full min-w-[700px]">
      <thead>
        <tr className="border-b border-gray-300">
          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">File Name</th>
          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Type</th>
          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Records</th>
          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
        </tr>
      </thead>

      <tbody>
        {trackers.map((tracker) => {
          const StatusIcon = statusConfig[tracker.status]?.icon || Clock;

          return (
            <tr key={tracker.id} className="border-b border-gray-200 hover:bg-gray-50">
              {/* File Name */}
              <td className="py-3 px-4 flex items-center">
                <File className="h-5 w-5 text-gray-500 mr-3" />
                <span className="font-medium">{tracker.name}</span>
              </td>

              {/* Type */}
              <td className="py-3 px-4">
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">{tracker.type}</span>
              </td>

              {/* Records */}
              <td className="py-3 px-4">{tracker.records}</td>

              {/* Status */}
              <td className="py-3 px-4 flex items-center">
                <StatusIcon
                  className={`h-4 w-4 mr-2 ${
                    tracker.status === 'Completed'
                      ? 'text-green-500'
                      : tracker.status === 'Processing'
                      ? 'text-yellow-500'
                      : 'text-red-500'
                  }`}
                />
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    statusConfig[tracker.status]?.color || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {tracker.status}
                </span>
              </td>

              {/* Actions */}
              <td className="py-3 px-4">
                <div className="flex items-center space-x-3">
                  <button
                    className="p-1 text-blue-600 hover:text-blue-800"
                    onClick={() => loadSchema(tracker.id)}
                    title="View Chart"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    className="p-1 text-green-600 hover:text-green-800"
                    onClick={() => handleDownload(tracker.id)}
                    title="Download Dataset"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    className="p-1 text-red-600 hover:text-red-800"
                    onClick={() => handleDelete(tracker.id)}
                    title="Delete Dataset"
                  >
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

  {/* Chart UI */}
  {showChart && selectedDatasetId && (
    <div className="mt-6 bg-white border border-gray-300 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Chart Builder – Dataset #{selectedDatasetId}
        </h3>
        <button
          className="text-sm text-gray-500 hover:text-gray-800"
          onClick={() => setShowChart(false)}
        >
          ✕ Close
        </button>
      </div>

      <ChartBuilder datasetId={selectedDatasetId} columns={datasetSchema} />
    </div>
  )}
</div>
    </div>
  );
};

export default UploadTrackers;
