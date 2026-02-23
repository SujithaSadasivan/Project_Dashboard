import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  File, User, ChevronRight, 
  AlertCircle, X, Eye, ChevronDown, ChevronUp,
  BarChart2, PieChart, TrendingUp, Mail, Send,
  CheckSquare, Filter, Download, RefreshCw, Folder,
  Layout, Database, Share2, Settings, Maximize2,
  Grid, List, Activity, Radar, ScatterChart as ScatterIcon,
  AreaChart as AreaIcon, Merge, Columns, Plus, Minus,
  Table, Layers, CheckCircle, Clock, AlertTriangle,
  Circle, DollarSign, Percent, TrendingDown, Flag,
  Calendar, Target, Shield, GitBranch, Users, Award,
  Settings2, Minimize2, Sliders
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart as RePieChart, Pie, Cell,
  LineChart, Line,
  AreaChart, Area,
  ResponsiveContainer
} from 'recharts';

import FileContentViewer from './Trackers/FileContentViewer';

// Dummy data for milestones - Updated structure with Plan and Actual/Outlook
const DUMMY_MILESTONES = [
  { id: 1, name: 'Requirements Gathering', plan: '2024-03-15', actual: '2024-03-14', outlook: 'Completed', status: 'Completed' },
  { id: 2, name: 'Design Phase', plan: '2024-04-01', actual: '2024-03-28', outlook: '2024-04-05', status: 'Ahead' },
  { id: 3, name: 'Development Sprint 1', plan: '2024-04-30', actual: 'In Progress', outlook: '2024-05-05', status: 'At Risk' },
  { id: 4, name: 'QA Testing', plan: '2024-05-15', actual: 'Not Started', outlook: '2024-05-20', status: 'Pending' },
  { id: 5, name: 'User Acceptance Testing', plan: '2024-05-30', actual: 'Not Started', outlook: '2024-06-05', status: 'Pending' },
  { id: 6, name: 'Production Release', plan: '2024-06-15', actual: 'Not Started', outlook: '2024-06-20', status: 'Planned' },
];

// Dummy data for critical issues
const DUMMY_ISSUES = [
  { id: 1, title: 'Database connection timeout', severity: 'High', status: 'In Progress', assignee: 'John Doe', dueDate: '2024-03-20' },
  { id: 2, title: 'API rate limiting exceeded', severity: 'Critical', status: 'Open', assignee: 'Jane Smith', dueDate: '2024-03-18' },
  { id: 3, title: 'Memory leak in production', severity: 'Critical', status: 'In Progress', assignee: 'Mike Johnson', dueDate: '2024-03-19' },
  { id: 4, title: 'UI rendering issue on mobile', severity: 'Medium', status: 'Open', assignee: 'Sarah Wilson', dueDate: '2024-03-25' },
  { id: 5, title: 'Security vulnerability in auth', severity: 'Critical', status: 'Open', assignee: 'Security Team', dueDate: '2024-03-17' },
];

// Enhanced Custom Tooltip with better formatting
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-4 py-3 border border-gray-200 rounded-lg shadow-lg max-w-xs">
        <p className="font-medium text-gray-900 mb-2 border-b pb-1">{label}</p>
        {payload.map((entry, index) => {
          const valueColor = entry.color || entry.fill || '#2563eb';
          const value = entry.value;
          
          // Format value based on type
          let formattedValue = value;
          if (typeof value === 'number') {
            if (Number.isInteger(value)) {
              formattedValue = value.toLocaleString();
            } else {
              formattedValue = value.toFixed(2);
            }
          }
          
          return (
            <div key={index} className="flex items-center justify-between text-sm mb-1">
              <span style={{ color: valueColor }} className="font-medium">
                {entry.name}:
              </span>
              <span className="ml-4 font-mono font-semibold" style={{ color: valueColor }}>
                {formattedValue}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

// MODIFIED: Stage Configuration Modal - Now accepts stage-specific columns
const StageConfigModal = ({ stage, isOpen, onClose, departmentColumns, stageSpecificColumns, onSave, currentConfig }) => {
  const [xAxis, setXAxis] = useState(currentConfig?.xAxis || '');
  const [yAxis, setYAxis] = useState(currentConfig?.yAxis || '');

  if (!isOpen) return null;

  // Use stage-specific columns if available, otherwise fall back to department columns
  const columnsToShow = stageSpecificColumns && stageSpecificColumns.length > 0 ? stageSpecificColumns : departmentColumns;

  console.log(`StageConfigModal for ${stage?.name}:`, {
    stageSpecificColumns,
    columnsToShow,
    departmentColumns
  });

  const handleSave = () => {
    onSave(stage.id, xAxis, yAxis);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Configure {stage.name} Chart
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-base font-medium text-gray-700 mb-2 block">
                X-Axis (Categories)
              </label>
              <select
                value={xAxis}
                onChange={(e) => setXAxis(e.target.value)}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Select column</option>
                {columnsToShow.map((col, index) => (
                  <option key={index} value={col}>
                    {col === null || col === undefined ? `Column ${index + 1}` : String(col)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-base font-medium text-gray-700 mb-2 block">
                Y-Axis (Values)
              </label>
              <select
                value={yAxis}
                onChange={(e) => setYAxis(e.target.value)}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Select column</option>
                {columnsToShow.map((col, index) => (
                  <option key={index} value={col}>
                    {col === null || col === undefined ? `Column ${index + 1}` : String(col)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-base"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!xAxis || !yAxis}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
            >
              Apply to Stage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Full Screen Chart Modal - Made bigger
const FullScreenChartModal = ({ stage, isOpen, onClose, chartData, distribution, chartType, onChartTypeChange }) => {
  const [localChartType, setLocalChartType] = useState(chartType);

  if (!isOpen) return null;

  const handleChartTypeChange = (type) => {
    setLocalChartType(type);
    onChartTypeChange(stage.id, type);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-[1000px] max-w-6xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {stage.name} - Full Screen View
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Minimize2 className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Chart Type Selector */}
          <div className="mb-6 flex items-center space-x-3">
            <span className="text-base text-gray-600">Chart Type:</span>
            <button
              onClick={() => handleChartTypeChange('bar')}
              className={`px-4 py-2 rounded-lg text-base flex items-center ${
                localChartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart2 className="h-4 w-4 mr-2" />
              Bar
            </button>
            <button
              onClick={() => handleChartTypeChange('pie')}
              className={`px-4 py-2 rounded-lg text-base flex items-center ${
                localChartType === 'pie' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <PieChart className="h-4 w-4 mr-2" />
              Pie
            </button>
            <button
              onClick={() => handleChartTypeChange('line')}
              className={`px-4 py-2 rounded-lg text-base flex items-center ${
                localChartType === 'line' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Line
            </button>
            <button
              onClick={() => handleChartTypeChange('area')}
              className={`px-4 py-2 rounded-lg text-base flex items-center ${
                localChartType === 'area' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <AreaIcon className="h-4 w-4 mr-2" />
              Area
            </button>
          </div>

          {/* Full Size Chart */}
          <div className="h-[500px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {localChartType === 'bar' && (
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      interval={0}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                    />
                    {distribution.map((item, index) => (
                      <Bar 
                        key={item.name}
                        dataKey={item.name}
                        stackId={item.name !== 'value' && item.name !== 'sum' && item.name !== 'average' ? "a" : undefined}
                        fill={item.color}
                        name={item.name}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                )}
                {localChartType === 'pie' && (
                  <RePieChart>
                    <Pie
                      data={distribution}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={200}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RePieChart>
                )}
                {localChartType === 'line' && (
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      interval={0}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    {distribution.map((item) => (
                      <Line 
                        key={item.name}
                        type="monotone"
                        dataKey={item.name}
                        stroke={item.color}
                        strokeWidth={2}
                        dot={{ r: 3, fill: item.color }}
                        name={item.name}
                      />
                    ))}
                  </LineChart>
                )}
                {localChartType === 'area' && (
                  <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      interval={0}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    {distribution.map((item) => (
                      <Area 
                        key={item.name}
                        type="monotone"
                        dataKey={item.name}
                        stackId="1"
                        stroke={item.color}
                        fill={item.color}
                        fillOpacity={0.6}
                        name={item.name}
                      />
                    ))}
                  </AreaChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500">No data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Mini Chart Component for Stage Boxes
const MiniChart = ({ chartData, statusDistribution, chartType = 'bar' }) => {
  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-24 flex items-center justify-center bg-gray-50 rounded border border-gray-200">
        <BarChart2 className="h-8 w-8 text-gray-300" />
      </div>
    );
  }

  // Limit data for mini chart
  const miniData = chartData.slice(0, 5);

  return (
    <div className="h-24 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {chartType === 'pie' ? (
          <RePieChart>
            <Pie
              data={statusDistribution.slice(0, 4)}
              cx="50%"
              cy="50%"
              innerRadius={20}
              outerRadius={35}
              dataKey="value"
              paddingAngle={2}
            >
              {statusDistribution.slice(0, 4).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </RePieChart>
        ) : chartType === 'line' ? (
          <LineChart data={miniData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <Line 
              type="monotone" 
              dataKey={statusDistribution[0]?.name || 'value'} 
              stroke={statusDistribution[0]?.color || '#2563eb'} 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        ) : chartType === 'area' ? (
          <AreaChart data={miniData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <Area 
              type="monotone" 
              dataKey={statusDistribution[0]?.name || 'value'} 
              stroke={statusDistribution[0]?.color || '#2563eb'} 
              fill={statusDistribution[0]?.color || '#2563eb'} 
              fillOpacity={0.3}
            />
          </AreaChart>
        ) : (
          <BarChart data={miniData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            {statusDistribution.map((item) => (
              <Bar 
                key={item.name}
                dataKey={item.name}
                stackId="a"
                fill={item.color}
                radius={[2, 2, 0, 0]}
              />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

// FIXED: Dashboard Configuration Modal - Now starts with all options unselected
const DashboardConfigModal = ({ isOpen, onClose, onApply, selectedProject, projectStages, currentConfig }) => {
  const [showMilestones, setShowMilestones] = useState(false);
  const [showCriticalIssues, setShowCriticalIssues] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState([]);

  // FIXED: Always reset to unselected when modal opens
  React.useEffect(() => {
    if (isOpen) {
      // Always reset to unchecked when modal opens
      setShowMilestones(false);
      setShowCriticalIssues(false);
      setShowMetrics(false);
      setSelectedMetrics([]);
    }
  }, [isOpen]); // Removed currentConfig dependency to ensure it always resets

  if (!isOpen) return null;

  const handleMetricToggle = (stageId) => {
    setSelectedMetrics(prev => 
      prev.includes(stageId) 
        ? prev.filter(id => id !== stageId)
        : [...prev, stageId]
    );
  };

  const handleApply = () => {
    onApply({
      milestones: showMilestones,
      criticalIssues: showCriticalIssues,
      metrics: showMetrics,
      selectedMetrics: selectedMetrics
    });
    onClose();
  };

  const selectAllMetrics = () => {
    if (selectedMetrics.length === projectStages.length) {
      setSelectedMetrics([]);
    } else {
      setSelectedMetrics(projectStages.map(s => s.id));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Stimulate Dashboard
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <p className="text-base text-gray-600 mb-6">
            Configure what to display for {selectedProject?.name}
          </p>

          <div className="space-y-6">
            {/* Main checkboxes */}
            <div className="space-y-3">
              <label className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMilestones}
                  onChange={(e) => setShowMilestones(e.target.checked)}
                  className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-3 text-base font-medium text-gray-700">Milestones</span>
              </label>

              <label className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCriticalIssues}
                  onChange={(e) => setShowCriticalIssues(e.target.checked)}
                  className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-3 text-base font-medium text-gray-700">Critical Issues</span>
              </label>

              <label className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMetrics}
                  onChange={(e) => {
                    setShowMetrics(e.target.checked);
                    if (!e.target.checked) {
                      setSelectedMetrics([]);
                    }
                  }}
                  className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-3 text-base font-medium text-gray-700">Metrics (Visuals)</span>
              </label>
            </div>

            {/* Metrics sub-checkboxes */}
            {showMetrics && (
              <div className="ml-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Select Metrics
                  </span>
                  <button
                    onClick={selectAllMetrics}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {selectedMetrics.length === projectStages.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {projectStages.map((stage) => {
                    return (
                      <label key={stage.id} className="flex items-center p-2 hover:bg-white rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedMetrics.includes(stage.id)}
                          onChange={() => handleMetricToggle(stage.id)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{stage.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-8">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-base"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-base"
            >
              Apply to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// FileHeaderConfigItem component (simplified - removed column selection)
const FileHeaderConfigItem = ({ fileModule, fileHeaderConfig, onConfigure }) => {
  const [localRowCount, setLocalRowCount] = useState(fileHeaderConfig.rowCount);

  // Preview first few rows
  const previewRows = fileModule.fileData?.data?.slice(0, 5) || 
                     fileModule.fileData?.sheets?.[0]?.data?.slice(0, 5) || [];

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 mb-3">
        {fileModule.displayName || fileModule.name}
      </h4>
      
      {/* Header row count selector */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Number of header rows:
        </label>
        <select
          value={localRowCount}
          onChange={(e) => setLocalRowCount(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value={1}>1 row</option>
          <option value={2}>2 rows</option>
          <option value={3}>3 rows</option>
        </select>
      </div>

      {/* Header preview */}
      {localRowCount > 1 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Header rows preview:
          </p>
          <div className="border border-gray-200 rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="divide-y divide-gray-200">
                {previewRows.slice(0, localRowCount).map((row, rowIndex) => (
                  <tr key={rowIndex} className="bg-gray-50">
                    {row.map((cell, colIndex) => (
                      <td key={colIndex} className="px-3 py-2 text-xs text-gray-600 border-r border-gray-200 whitespace-nowrap">
                        {cell || '(empty)'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Apply button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => onConfigure(fileModule.id, localRowCount, {})}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          Apply to this file
        </button>
      </div>
    </div>
  );
};

const ProjectDashboard = () => {
  const navigate = useNavigate();
  const [projectModules, setProjectModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackers, setTrackers] = useState([]);
  const [uploadedFilesData, setUploadedFilesData] = useState({});

  // Project selection
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);

  // Selected file state
  const [selectedFile, setSelectedFile] = useState({
    isSelected: false,
    fileData: null,
    trackerInfo: null,
    projectModuleId: null,
    source: null
  });

  // File data
  const [departmentFiles, setDepartmentFiles] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [departmentColumns, setDepartmentColumns] = useState([]);
  const [departmentEmployees, setDepartmentEmployees] = useState([]);

  // Store columns for each specific stage based on its file
  const [stageSpecificColumns, setStageSpecificColumns] = useState({});

  // Stage-specific chart configurations
  const [stageConfigs, setStageConfigs] = useState({});
  const [stageChartData, setStageChartData] = useState({});
  const [stageDistribution, setStageDistribution] = useState({});
  const [stageChartTypes, setStageChartTypes] = useState({});

  // Dashboard configuration
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [dashboardConfig, setDashboardConfig] = useState({
    milestones: false,
    criticalIssues: false,
    metrics: false,
    selectedMetrics: []
  });

  // Modal state
  const [configuringStage, setConfiguringStage] = useState(null);
  const [fullScreenStage, setFullScreenStage] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showHeaderConfig, setShowHeaderConfig] = useState(false);

  // Email state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState('');

  // Add a new state for dynamic project stages
  const [projectStages, setProjectStages] = useState([]);

  // Chart colors
  const PIE_COLORS = [
    '#2563eb', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6',
    '#f97316', '#6366f1', '#d946ef', '#0ea5e9',
    '#84cc16', '#a855f7', '#ec4899', '#64748b'
  ];

  // Helper function to get a color based on stage name or index
  const getStageColor = (index) => {
    const colors = ['blue', 'purple', 'green', 'orange', 'red', 'teal', 'indigo', 'pink', 'yellow', 'cyan'];
    return colors[index % colors.length];
  };

  // Function to generate a color based on string value
  const getColorForValue = (value, index) => {
    if (!value) return PIE_COLORS[index % PIE_COLORS.length];
    
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = ((hash << 5) - hash) + value.charCodeAt(i);
      hash = hash & hash;
    }
    
    const colorIndex = Math.abs(hash) % PIE_COLORS.length;
    return PIE_COLORS[colorIndex];
  };

  // Function to check if a column contains numeric values
  const isNumericColumn = (values) => {
    if (!values || values.length === 0) return false;
    
    let numericCount = 0;
    for (const val of values) {
      if (val === null || val === undefined || val === '') continue;
      
      if (typeof val === 'number') {
        numericCount++;
      } else if (typeof val === 'string') {
        const cleaned = val.replace(/[$€£¥,\s]/g, '');
        if (!isNaN(parseFloat(cleaned)) && isFinite(cleaned)) {
          numericCount++;
        }
      }
    }
    
    return numericCount > values.length * 0.3;
  };

  // Enhanced function to extract data rows considering multi-row headers
  const extractDataRowsFromFile = (fileData, headerRowCount = 1) => {
    const rows = [];

    if (fileData.data && Array.isArray(fileData.data)) {
      const dataRows = fileData.data.slice(headerRowCount);
      const headers = extractHeadersFromFileData(fileData);

      dataRows.forEach(row => {
        if (Array.isArray(row)) {
          const rowObj = {};
          headers.forEach((header, index) => {
            if (index < row.length) {
              rowObj[header] = row[index];
            }
          });
          if (Object.values(rowObj).some(v => v !== null && v !== undefined && v !== '')) {
            rows.push(rowObj);
          }
        } else if (typeof row === 'object' && row !== null) {
          rows.push(row);
        }
      });
    } else if (fileData.sheets && fileData.sheets.length > 0) {
      const sheet = fileData.sheets[0];
      if (sheet.data && Array.isArray(sheet.data)) {
        const dataRows = sheet.data.slice(headerRowCount);
        const headers = extractHeadersFromFileData(fileData);
        
        dataRows.forEach(row => {
          if (Array.isArray(row)) {
            const rowObj = {};
            headers.forEach((header, index) => {
              if (index < row.length) {
                rowObj[header] = row[index];
              }
            });
            if (Object.values(rowObj).some(v => v !== null && v !== undefined && v !== '')) {
              rows.push(rowObj);
            }
          } else if (typeof row === 'object' && row !== null) {
            rows.push(row);
          }
        });
      }
    }

    return rows;
  };

  // ==========================================================================
  // UPDATED: Extract headers from the table display (what user sees in UI)
  // This now prioritizes the displayHeaders which come from the "Add New Column" and "Manage Columns" UI
  // ==========================================================================
  const extractHeadersFromFileData = (fileData) => {
    console.log('📊 Extracting headers from table display for:', fileData?.fileName);
    
    // PRIORITY 1: Get headers from the table display (what user configured in UI)
    // This comes from the columns that are visible in the table after "Add New Column" and "Manage Columns"
    if (fileData.displayHeaders && Array.isArray(fileData.displayHeaders)) {
      console.log('✅ Using display headers from table UI:', fileData.displayHeaders);
      const cleanedHeaders = fileData.displayHeaders
        .map(h => h === null || h === undefined ? '' : String(h).trim())
        .filter(h => h !== '');
      
      console.log('🧹 Display headers:', cleanedHeaders);
      return cleanedHeaders;
    }
    
    // PRIORITY 2: If the fileData has a headers property (saved from FileContentViewer)
    if (fileData.headers && Array.isArray(fileData.headers)) {
      console.log('✅ Using saved headers from fileData:', fileData.headers);
      const cleanedHeaders = fileData.headers
        .map(h => h === null || h === undefined ? '' : String(h).trim())
        .filter(h => h !== '');
      
      console.log('🧹 Cleaned headers:', cleanedHeaders);
      return cleanedHeaders;
    }
    
    // PRIORITY 3: If it has sheets format with headers
    if (fileData.sheets && fileData.sheets[0]?.headers) {
      console.log('✅ Using sheet headers');
      const cleanedHeaders = fileData.sheets[0].headers
        .map(h => h === null || h === undefined ? '' : String(h).trim())
        .filter(h => h !== '');
      return cleanedHeaders;
    }
    
    // Fallback: Extract from data rows
    const headers = [];

    if (fileData.data && Array.isArray(fileData.data)) {
      if (fileData.headerConfig) {
        const { rowCount } = fileData.headerConfig;
        
        if (rowCount > 1) {
          const headerRows = fileData.data.slice(0, rowCount);
          
          for (let colIndex = 0; colIndex < (headerRows[0]?.length || 0); colIndex++) {
            let combinedHeader = '';
            
            for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
              const cellValue = headerRows[rowIndex]?.[colIndex] || '';
              if (cellValue) {
                combinedHeader += (combinedHeader ? ' - ' : '') + String(cellValue).trim();
              }
            }
            
            headers.push(combinedHeader || `Column ${colIndex + 1}`);
          }
        } else {
          const headerRow = fileData.data[0];
          if (Array.isArray(headerRow)) {
            headerRow.forEach((cell, index) => {
              headers.push(cell ? String(cell).trim() : `Column ${index + 1}`);
            });
          } else if (typeof headerRow === 'object') {
            Object.keys(headerRow).forEach(key => {
              headers.push(key);
            });
          }
        }
      } else {
        // If no headerConfig, try to get headers from the first row
        if (fileData.data.length > 0) {
          const firstRow = fileData.data[0];
          if (Array.isArray(firstRow)) {
            firstRow.forEach((cell, index) => {
              headers.push(cell ? String(cell).trim() : `Column ${index + 1}`);
            });
          } else if (typeof firstRow === 'object') {
            Object.keys(firstRow).forEach(key => {
              headers.push(key);
            });
          }
        }
      }
    } else if (fileData.sheets && fileData.sheets.length > 0) {
      const sheet = fileData.sheets[0];
      
      if (sheet.headerConfig) {
        const { rowCount } = sheet.headerConfig;
        
        if (rowCount > 1 && sheet.data && sheet.data.length > 0) {
          const headerRows = sheet.data.slice(0, rowCount);
          
          for (let colIndex = 0; colIndex < (headerRows[0]?.length || 0); colIndex++) {
            let combinedHeader = '';
            
            for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
              const cellValue = headerRows[rowIndex]?.[colIndex] || '';
              if (cellValue) {
                combinedHeader += (combinedHeader ? ' - ' : '') + String(cellValue).trim();
              }
            }
            
            headers.push(combinedHeader || `Column ${colIndex + 1}`);
          }
        } else if (sheet.data && sheet.data.length > 0) {
          const headerRow = sheet.data[0];
          if (Array.isArray(headerRow)) {
            headerRow.forEach((cell, index) => {
              headers.push(cell ? String(cell).trim() : `Column ${index + 1}`);
            });
          }
        }
      } else if (sheet.data && sheet.data.length > 0) {
        const firstRow = sheet.data[0];
        if (Array.isArray(firstRow)) {
          firstRow.forEach((cell, index) => {
            headers.push(cell ? String(cell).trim() : `Column ${index + 1}`);
          });
        }
      }
    }

    // Remove duplicates and empty headers
    const result = [...new Set(headers.filter(h => h && h !== null && h.trim() !== ''))];
    console.log('📋 Extracted headers (fallback):', result);
    return result;
  };

  // Function to extract all rows from department files
  const extractAllRows = () => {
    let allRows = [];
    
    departmentFiles.forEach((file) => {
      if (file.fileData) {
        const fileHeaderCount = file.fileData?.headerConfig?.rowCount || 1;
        const dataRows = extractDataRowsFromFile(file.fileData, fileHeaderCount);
        allRows = [...allRows, ...dataRows];
      }
    });
    
    return allRows;
  };

  // Enhanced function to generate chart data
  const generateEnhancedChartData = (departmentFiles, xAxis, yAxis) => {
    try {
      if (departmentFiles.length === 0 || !xAxis || !yAxis) {
        return [];
      }

      let allRows = [];
      departmentFiles.forEach((file) => {
        if (file.fileData) {
          const fileHeaderCount = file.fileData?.headerConfig?.rowCount || 1;
          const dataRows = extractDataRowsFromFile(file.fileData, fileHeaderCount);
          allRows = [...allRows, ...dataRows];
        }
      });

      // Filter rows that have both xAxis and yAxis values
      const validRows = allRows.filter(row => 
        row[xAxis] !== undefined && row[xAxis] !== null && String(row[xAxis]).trim() !== '' &&
        row[yAxis] !== undefined && row[yAxis] !== null && String(row[yAxis]).trim() !== ''
      );

      if (validRows.length === 0) {
        return [];
      }

      // Check if y-axis is numeric
      const yValues = validRows.map(row => row[yAxis]);
      const isYAxisNumeric = isNumericColumn(yValues);

      if (isYAxisNumeric) {
        // Group by x-axis values and aggregate numeric y-values
        const groupedData = {};
        
        validRows.forEach(row => {
          const xValue = String(row[xAxis]).trim();
          let yValue = row[yAxis];
          
          // Convert to number if possible
          let numericValue = 0;
          if (typeof yValue === 'number') {
            numericValue = yValue;
          } else if (typeof yValue === 'string') {
            const cleaned = yValue.replace(/[$€£¥,\s]/g, '');
            const parsed = parseFloat(cleaned);
            if (!isNaN(parsed)) {
              numericValue = parsed;
            }
          }
          
          if (!groupedData[xValue]) {
            groupedData[xValue] = {
              name: xValue.length > 30 ? xValue.substring(0, 30) + '...' : xValue,
              fullName: xValue,
              value: 0,
              count: 0,
              sum: 0
            };
          }
          
          groupedData[xValue].sum += numericValue;
          groupedData[xValue].count += 1;
        });

        // Calculate average and set value to sum (for bar charts)
        Object.values(groupedData).forEach(item => {
          item.average = item.count > 0 ? item.sum / item.count : 0;
          item.value = item.sum;
        });

        return Object.values(groupedData);
      } else {
        // For non-numeric y-axis, count occurrences of each combination
        const uniqueXValues = [...new Set(validRows.map(row => String(row[xAxis]).trim()))];
        const uniqueYValues = [...new Set(validRows.map(row => String(row[yAxis]).trim()))];

        // Initialize chart data
        const chartDataArray = uniqueXValues.map(xValue => {
          const item = {
            name: xValue.length > 30 ? xValue.substring(0, 30) + '...' : xValue,
            fullName: xValue,
            total: 0
          };
          
          uniqueYValues.forEach(yValue => {
            item[yValue] = 0;
          });
          
          return item;
        });

        // Count occurrences
        validRows.forEach(row => {
          const xValue = String(row[xAxis]).trim();
          const yValue = String(row[yAxis]).trim();
          
          const xIndex = uniqueXValues.findIndex(x => x === xValue);
          if (xIndex !== -1) {
            if (chartDataArray[xIndex][yValue] !== undefined) {
              chartDataArray[xIndex][yValue] += 1;
              chartDataArray[xIndex].total += 1;
            }
          }
        });

        return chartDataArray;
      }
    } catch (error) {
      console.error('Error generating enhanced chart data:', error);
      return [];
    }
  };

  // Generate distribution data
  const generateDistribution = (chartData, xAxis, yAxis, allRows) => {
    if (!chartData || chartData.length === 0) return [];
    
    // Check if y-axis is numeric by looking at actual data
    const yValues = allRows.map(row => row[yAxis]).filter(v => v !== undefined && v !== null && v !== '');
    const isYAxisNumeric = isNumericColumn(yValues);
    
    if (isYAxisNumeric) {
      // For numeric data, distribution shows each category with its aggregated value
      return chartData.map((item, index) => ({
        name: item.fullName || item.name,
        value: item.sum || item.value || 0,
        color: getColorForValue(item.fullName || item.name, index),
        count: item.count || 1
      }));
    } else {
      // For categorical data, distribution shows counts of each y-value category
      const distribution = {};
      
      chartData.forEach(item => {
        Object.keys(item).forEach(key => {
          if (key !== 'name' && key !== 'fullName' && key !== 'total' && typeof item[key] === 'number') {
            if (!distribution[key]) {
              distribution[key] = 0;
            }
            distribution[key] += item[key];
          }
        });
      });
      
      return Object.entries(distribution)
        .map(([name, value], index) => ({
          name,
          value,
          color: getColorForValue(name, index),
          count: value
        }))
        .sort((a, b) => b.value - a.value);
    }
  };

  // FIXED: handleProjectSelect function - Now resets dashboard config to all unselected
  const handleProjectSelect = (projectId) => {
    const project = projectModules.find(p => p.id === projectId);
    setSelectedProjectId(projectId);
    setSelectedProject(project);

    console.log('Selected project:', project);

    // DECLARE dynamicStages OUTSIDE the if block
    let dynamicStages = [];

    // Create dynamic stages from project submodules
    if (project && project.submodules && Array.isArray(project.submodules)) {
      dynamicStages = project.submodules.map((submodule, index) => {
        // CRITICAL: Use the correct ID to link stage to file
        const trackerId = submodule.trackerId;
        
        return {
          id: submodule.id || `stage-${index}`,
          name: submodule.displayName || submodule.name || `Stage ${index + 1}`,
          color: getStageColor(index),
          description: submodule.description || `${submodule.name} Phase`,
          trackerId: trackerId,
          fileModule: submodule
        };
      });
      setProjectStages(dynamicStages);
      
      console.log('Dynamic stages created:', dynamicStages);
      
      // FIXED: Reset dashboard config to all unchecked when selecting a new project
      setDashboardConfig({
        milestones: false,
        criticalIssues: false,
        metrics: false,
        selectedMetrics: []
      });
    } else {
      setProjectStages([]);
    }

    setSelectedFile({
      isSelected: false,
      fileData: null,
      trackerInfo: null,
      projectModuleId: null,
      source: null
    });

    // Get all files from the project
    if (project && project.submodules && Array.isArray(project.submodules)) {
      const files = [];
      project.submodules.forEach((fileModule) => {
        const trackerInfo = getTrackerInfo(fileModule.trackerId);
        const fileData = uploadedFilesData[fileModule.trackerId];
        if (trackerInfo && fileData) {
          files.push({
            ...fileModule,
            trackerInfo,
            fileData: fileData,
            projectName: project.name,
            trackerId: fileModule.trackerId
          });
        }
      });
      
      setDepartmentFiles(files);
      console.log('Files loaded:', files.map(f => ({ name: f.name, trackerId: f.trackerId })));
      
      // Extract columns from all files - now prioritizing displayHeaders
      const columns = extractColumnsFromFiles(files);
      setDepartmentColumns(columns);
      
      // CRITICAL FIX: Extract columns for each specific stage
      const stageColumnsMap = {};
      
      // Now dynamicStages is accessible here because we declared it outside
      dynamicStages.forEach(stage => {
        console.log(`Looking for file for stage: ${stage.name} with trackerId: ${stage.trackerId}`);
        
        // Find the file for this stage by trackerId
        const stageFile = files.find(f => f.trackerId === stage.trackerId);
        
        if (stageFile && stageFile.fileData) {
          // Try to get displayHeaders first (from UI), fallback to regular headers
          let stageHeaders = [];
          
          if (stageFile.fileData.displayHeaders && Array.isArray(stageFile.fileData.displayHeaders)) {
            stageHeaders = stageFile.fileData.displayHeaders;
            console.log(`✅ Stage "${stage.name}" using display headers from UI:`, stageHeaders);
          } else {
            stageHeaders = extractHeadersFromFileData(stageFile.fileData);
            console.log(`✅ Stage "${stage.name}" using extracted headers:`, stageHeaders);
          }
          
          stageColumnsMap[stage.id] = stageHeaders;
        } else {
          console.warn(`❌ No file found for stage: ${stage.name} with trackerId: ${stage.trackerId}`);
          console.log('Available files trackerIds:', files.map(f => f.trackerId));
          stageColumnsMap[stage.id] = []; // Empty array as fallback
        }
      });
      
      setStageSpecificColumns(stageColumnsMap);
      console.log('Stage-specific columns map:', stageColumnsMap);
      
      // Extract employees from all files
      const employees = extractEmployeesFromFiles(files);
      setDepartmentEmployees(employees);
      
      // Reset stage configs when changing project
      setStageConfigs({});
      setStageChartData({});
      setStageDistribution({});
      setStageChartTypes({});
    } else {
      setDepartmentFiles([]);
      setDepartmentColumns([]);
      setStageSpecificColumns({});
      setDepartmentEmployees([]);
    }

    setSelectedEmployees([]);
    // Show config modal after project selection
    setShowConfigModal(true);
  };

  // Handle dashboard configuration apply
  const handleDashboardConfigApply = (config) => {
    setDashboardConfig(config);
  };

  // Handle stage configuration
  const handleStageConfig = (stageId, xAxis, yAxis) => {
    const newConfigs = {
      ...stageConfigs,
      [stageId]: { xAxis, yAxis }
    };
    setStageConfigs(newConfigs);

    // Generate chart data for this stage
    if (departmentFiles.length > 0 && xAxis && yAxis) {
      const allRows = extractAllRows();
      const data = generateEnhancedChartData(departmentFiles, xAxis, yAxis);
      const distribution = generateDistribution(data, xAxis, yAxis, allRows);
      
      setStageChartData({
        ...stageChartData,
        [stageId]: data
      });
      
      setStageDistribution({
        ...stageDistribution,
        [stageId]: distribution
      });
    }
  };

  // Handle chart type change for a stage
  const handleChartTypeChange = (stageId, chartType) => {
    setStageChartTypes({
      ...stageChartTypes,
      [stageId]: chartType
    });
  };

  // Handle full screen view
  const handleFullScreen = (stage) => {
    setFullScreenStage(stage);
  };

  // Update handleDashboardClick to reset to all unselected
  const handleDashboardClick = () => {
    setSelectedFile({
      isSelected: false,
      fileData: null,
      trackerInfo: null,
      projectModuleId: null,
      source: null
    });
    
    setSelectedProjectId('');
    setSelectedProject(null);
    setDepartmentFiles([]);
    setDepartmentColumns([]);
    setStageSpecificColumns({});
    setDepartmentEmployees([]);
    setProjectStages([]);
    setStageConfigs({});
    setStageChartData({});
    setStageDistribution({});
    setStageChartTypes({});
    setSelectedEmployees([]);
    
    // FIXED: Reset dashboard config to all unchecked
    setDashboardConfig({
      milestones: false,
      criticalIssues: false,
      metrics: false,
      selectedMetrics: []
    });
  };

  // Extract columns from files - now prioritizing displayHeaders
  const extractColumnsFromFiles = (files) => {
    const columnsSet = new Set();

    files.forEach((file) => {
      if (!file.fileData) return;

      // Try to get headers from displayHeaders first (from UI)
      let headers = [];
      
      if (file.fileData.displayHeaders && Array.isArray(file.fileData.displayHeaders)) {
        headers = file.fileData.displayHeaders;
        console.log(`📋 Using display headers for ${file.name}:`, headers);
      } else {
        headers = extractHeadersFromFileData(file.fileData);
      }
      
      headers.forEach(col => {
        if (col && col.trim() !== '') {
          columnsSet.add(col);
        }
      });
    });

    return Array.from(columnsSet).sort();
  };

  const extractEmployeesFromFiles = (files) => {
    const employeesSet = new Set();
    files.forEach(file => {
      if (file.trackerInfo) {
        employeesSet.add(JSON.stringify({
          id: file.trackerInfo.id,
          name: file.trackerInfo.employeeName || 'Unknown',
          email: file.trackerInfo.employeeEmail || `${file.trackerInfo.employeeName?.toLowerCase().replace(/\s+/g, '.')}@company.com`,
          department: file.trackerInfo.department,
          project: selectedProject?.name,
          uploadDate: file.trackerInfo.uploadDate
        }));
      }
    });
    return Array.from(employeesSet).map(e => JSON.parse(e));
  };

  // Configure file headers
  const configureFileHeaders = (fileModule, rowCount, selectedHeaders) => {
    const updatedFileData = { 
      ...fileModule.fileData,
      headerConfig: {
        rowCount
      }
    };

    const newFilesData = {
      ...uploadedFilesData,
      [fileModule.trackerId]: updatedFileData
    };

    setUploadedFilesData(newFilesData);
    localStorage.setItem('uploaded_files_data', JSON.stringify(newFilesData));

    const updatedFiles = departmentFiles.map(f => 
      f.trackerId === fileModule.trackerId ? { ...f, fileData: updatedFileData } : f
    );
    setDepartmentFiles(updatedFiles);

    const columns = extractColumnsFromFiles(updatedFiles);
    setDepartmentColumns(columns);
    
    // FIXED: Update stage-specific columns for the affected file
    const updatedStageColumns = { ...stageSpecificColumns };
    Object.keys(stageSpecificColumns).forEach(stageId => {
      const stage = projectStages.find(s => s.id === stageId);
      if (stage && stage.trackerId === fileModule.trackerId) {
        const stageFile = updatedFiles.find(f => f.trackerId === stage.trackerId);
        if (stageFile && stageFile.fileData) {
          // Try to get displayHeaders first
          let stageHeaders = [];
          if (stageFile.fileData.displayHeaders && Array.isArray(stageFile.fileData.displayHeaders)) {
            stageHeaders = stageFile.fileData.displayHeaders;
          } else {
            stageHeaders = extractHeadersFromFileData(stageFile.fileData);
          }
          updatedStageColumns[stageId] = stageHeaders;
          console.log(`Updated stage "${stage.name}" headers after config:`, stageHeaders);
        }
      }
    });
    setStageSpecificColumns(updatedStageColumns);

    setShowHeaderConfig(false);

    // Regenerate all stage charts with new data
    const allRows = extractAllRows();
    const newStageChartData = {};
    const newStageDistribution = {};

    Object.entries(stageConfigs).forEach(([stageId, config]) => {
      if (config.xAxis && config.yAxis) {
        const data = generateEnhancedChartData(updatedFiles, config.xAxis, config.yAxis);
        const distribution = generateDistribution(data, config.xAxis, config.yAxis, allRows);
        newStageChartData[stageId] = data;
        newStageDistribution[stageId] = distribution;
      }
    });

    setStageChartData(newStageChartData);
    setStageDistribution(newStageDistribution);

    alert('Header configuration saved successfully!');
  };

  // Handle email sending
  const handleSendEmail = async () => {
    if (selectedEmployees.length === 0) {
      setEmailStatus('Please select at least one recipient');
      return;
    }

    setEmailSending(true);
    setEmailStatus('Sending...');

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setEmailStatus('Email sent successfully!');
      setTimeout(() => {
        setShowEmailModal(false);
        setEmailStatus('');
        setEmailSubject('');
        setEmailBody('');
        setSelectedEmployees([]);
      }, 2000);
    } catch (error) {
      setEmailStatus('Failed to send email');
    } finally {
      setEmailSending(false);
    }
  };

  const toggleEmployeeSelection = (employeeId) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const selectAllEmployees = () => {
    if (selectedEmployees.length === departmentEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(departmentEmployees.map(e => e.id));
    }
  };

  // Load data
  const loadProjectModules = () => {
    try {
      const savedModules = localStorage.getItem('project_dashboard_modules');
      const allModules = savedModules ? JSON.parse(savedModules) : [];

      const projectModules = allModules.filter(m => 
        m.type === 'project' && m.context === 'project-dashboard'
      );

      setProjectModules(projectModules);

      const savedTrackers = localStorage.getItem('upload_trackers');
      setTrackers(savedTrackers ? JSON.parse(savedTrackers) : []);

      const savedFilesData = localStorage.getItem('uploaded_files_data');
      setUploadedFilesData(savedFilesData ? JSON.parse(savedFilesData) : {});
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectModules();

    const handleUpdate = () => loadProjectModules();
    window.addEventListener('projectDashboardUpdate', handleUpdate);

    return () => window.removeEventListener('projectDashboardUpdate', handleUpdate);
  }, []);

  // File event handling
  useEffect(() => {
    const handleOpenFile = (event) => {
      const { trackerId, source } = event.detail;
      if (source && source !== 'project-dashboard') return;

      const tracker = trackers.find(t => t.id === trackerId);
      const fileData = uploadedFilesData[trackerId];

      if (!tracker || !fileData) return;

      let projectModule = null;
      for (const proj of projectModules) {
        if (proj.submodules?.some(f => f.trackerId === trackerId)) {
          projectModule = proj;
          break;
        }
      }

      setSelectedFile({
        isSelected: true,
        fileData: fileData,
        trackerInfo: tracker,
        projectModuleId: projectModule?.moduleId || null,
        source: 'project-dashboard'
      });

      if (projectModule) {
        setSelectedProjectId(projectModule.id);
        setSelectedProject(projectModule);
      }
    };

    window.addEventListener('openProjectDashboardFile', handleOpenFile);
    return () => window.removeEventListener('openProjectDashboardFile', handleOpenFile);
  }, [trackers, uploadedFilesData, projectModules]);

  // Handle file click
  const handleFileClick = (fileModule, projectModule) => {
    const trackerInfo = getTrackerInfo(fileModule.trackerId);
    const fileData = uploadedFilesData[fileModule.trackerId];

    if (!trackerInfo || !fileData) return;

    setSelectedFile({
      isSelected: true,
      fileData: fileData,
      trackerInfo: trackerInfo,
      projectModuleId: projectModule.moduleId,
      source: 'project-dashboard'
    });
  };

  const handleCloseFileViewer = () => {
    setSelectedFile({
      isSelected: false,
      fileData: null,
      trackerInfo: null,
      projectModuleId: null,
      source: null
    });
  };

  // FIXED: Handle save file data - update stage-specific columns
  const handleSaveFileData = (trackerId, updatedFileData) => {
    console.log('💾 SAVING FILE DATA - Tracker:', trackerId);
    console.log('Updated display headers:', updatedFileData?.displayHeaders);
    console.log('Updated headers:', updatedFileData?.headers);
    
    const newFilesData = { ...uploadedFilesData, [trackerId]: updatedFileData };
    setUploadedFilesData(newFilesData);
    localStorage.setItem('uploaded_files_data', JSON.stringify(newFilesData));

    if (selectedFile.trackerInfo?.id === trackerId) {
      setSelectedFile(prev => ({ ...prev, fileData: updatedFileData }));
    }

    if (selectedProject) {
      // Refresh files
      const files = [];
      if (selectedProject.submodules && Array.isArray(selectedProject.submodules)) {
        selectedProject.submodules.forEach((fileModule) => {
          const trackerInfo = getTrackerInfo(fileModule.trackerId);
          const fileData = newFilesData[fileModule.trackerId];
          if (trackerInfo && fileData) {
            files.push({
              ...fileModule,
              trackerInfo,
              fileData: fileData,
              projectName: selectedProject.name
            });
          }
        });
      }
      setDepartmentFiles(files);
      
      const columns = extractColumnsFromFiles(files);
      setDepartmentColumns(columns);
      
      // FIXED: Update stage-specific columns for the affected file
      const updatedStageColumns = { ...stageSpecificColumns };
      Object.keys(stageSpecificColumns).forEach(stageId => {
        const stage = projectStages.find(s => s.id === stageId);
        if (stage && stage.trackerId === trackerId) {
          const stageFile = files.find(f => f.trackerId === stage.trackerId);
          if (stageFile && stageFile.fileData) {
            // Try to get displayHeaders first
            let stageHeaders = [];
            if (stageFile.fileData.displayHeaders && Array.isArray(stageFile.fileData.displayHeaders)) {
              stageHeaders = stageFile.fileData.displayHeaders;
            } else {
              stageHeaders = extractHeadersFromFileData(stageFile.fileData);
            }
            updatedStageColumns[stageId] = stageHeaders;
            console.log(`Updated stage "${stage.name}" headers after save:`, stageHeaders);
          }
        }
      });
      setStageSpecificColumns(updatedStageColumns);
    }
  };

  const getTrackerInfo = (trackerId) => {
    return trackers.find(t => t.id === trackerId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900">Loading Projects...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {!selectedFile.isSelected && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            
            {/* Project Selector */}
            <div className="w-96">
              {projectModules.length === 0 ? (
                <button
                  onClick={() => navigate('/upload-trackers')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center"
                >
                  <File className="h-4 w-4 mr-2" />
                  Upload Trackers
                </button>
              ) : (
                <select
                  value={selectedProjectId}
                  onChange={(e) => handleProjectSelect(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                >
                  <option value="">Select a project</option>
                  {projectModules.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.submodules?.length || 0} files)
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6">
        {selectedProject ? (
          <div>
            {/* File Viewer (if file selected) */}
            {selectedFile.isSelected && selectedFile.source === 'project-dashboard' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="p-4 h-[calc(100vh-240px)] overflow-auto">
                  <FileContentViewer
                    fileData={selectedFile.fileData}
                    trackerInfo={selectedFile.trackerInfo}
                    onBack={handleCloseFileViewer}
                    onSaveData={(updatedData) => {
                      if (selectedFile.trackerInfo) {
                        handleSaveFileData(selectedFile.trackerInfo.id, updatedData);
                      }
                    }}
                    viewOnly={false}
                    context="project"
                  />
                </div>
              </div>
            )}

            {/* Main Project Container - Only show when no file is selected */}
            {!selectedFile.isSelected && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Project Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      
                      <h2 className="text-xl font-semibold text-white">{selectedProject.name}</h2>
                      
                    </div>
                    
                    {/* Controls inside header */}
                    <div className="flex items-center space-x-3">
                      {/* Stimulate Dashboard Button */}
                      <button
                        onClick={() => setShowConfigModal(true)}
                        className="px-4 py-1.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm flex items-center font-medium"
                      >
                        Stimulate Dashboard
                      </button>

                      {/* Send Report Button */}
                      <button
                        onClick={() => setShowEmailModal(true)}
                        className="px-4 py-1.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm flex items-center font-medium"
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Send Report
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content Area - Conditionally rendered based on dashboard config */}
                <div className="p-6 space-y-8">
                  {/* Milestones Section */}
                  {dashboardConfig.milestones && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Major Milestones
                      </h3>
                      <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-blue-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-1/4">Milestone</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-1/4">Plan</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-1/4">Actual/Outlook</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-1/4">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {DUMMY_MILESTONES.map((milestone) => (
                              <tr key={milestone.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{milestone.name}</td>
                                <td className="px-4 py-3 text-sm text-gray-600 text-center">{milestone.plan}</td>
                                <td className="px-4 py-3 text-sm text-gray-600 text-center">{milestone.actual}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                                    ${milestone.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                                      milestone.status === 'Ahead' ? 'bg-blue-100 text-blue-800' :
                                      milestone.status === 'At Risk' ? 'bg-orange-100 text-orange-800' :
                                      milestone.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'}`}>
                                    {milestone.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Critical Issues Section */}
                  {dashboardConfig.criticalIssues && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Critical Issues
                      </h3>
                      <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-blue-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Issue</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Severity</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Assignee</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Due Date</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {DUMMY_ISSUES.map((issue) => (
                              <tr key={issue.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">{issue.title}</td>
                                <td className="px-4 py-3">
                                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                                    ${issue.severity === 'Critical' ? 'bg-red-100 text-red-800' : 
                                      issue.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                                      'bg-yellow-100 text-yellow-800'}`}>
                                    {issue.severity}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                                    ${issue.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 
                                      'bg-gray-100 text-gray-800'}`}>
                                    {issue.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{issue.assignee}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{issue.dueDate}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Project Stages with Embedded Charts - Only show selected metrics */}
                  {dashboardConfig.metrics && dashboardConfig.selectedMetrics.length > 0 && departmentColumns.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Project Metrics
                      </h3>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {projectStages.filter(stage => dashboardConfig.selectedMetrics.includes(stage.id)).map((stage) => {
                          const stageConfig = stageConfigs[stage.id] || {};
                          const chartData = stageChartData[stage.id] || [];
                          const distribution = stageDistribution[stage.id] || [];
                          const chartType = stageChartTypes[stage.id] || 'bar';
                          const hasConfig = stageConfig.xAxis && stageConfig.yAxis;
                          
                          const colorClasses = {
                            blue: 'border-blue-200 bg-blue-50',
                            purple: 'border-purple-200 bg-purple-50',
                            green: 'border-green-200 bg-green-50',
                            orange: 'border-orange-200 bg-orange-50',
                            red: 'border-red-200 bg-red-50',
                            teal: 'border-teal-200 bg-teal-50',
                          };
                          
                          return (
                            <div 
                              key={stage.id}
                              className={`border rounded-xl overflow-hidden ${colorClasses[stage.color] || 'border-gray-200 bg-gray-50'}`}
                            >
                              {/* Stage Header */}
                              <div className="p-3 border-b border-gray-200 bg-white bg-opacity-50">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <h4 className="font-medium text-gray-900">{stage.name}</h4>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => handleFullScreen(stage)}
                                      className="p-1.5 bg-white rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                                      title="Full screen view"
                                    >
                                      <Maximize2 className="h-4 w-4 text-gray-600" />
                                    </button>
                                    <button
                                      onClick={() => setConfiguringStage(stage)}
                                      className="p-1.5 bg-white rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                                      title="Configure chart"
                                    >
                                      <Settings2 className="h-4 w-4 text-gray-600" />
                                    </button>
                                  </div>
                                </div>
                                {hasConfig && (
                                  <p className="text-xs text-gray-500 mt-1 truncate">
                                    {stageConfig.xAxis} vs {stageConfig.yAxis}
                                  </p>
                                )}
                              </div>
                              
                              {/* Chart Area */}
                              <div className="p-3">
                                {hasConfig ? (
                                  chartData.length > 0 ? (
                                    <MiniChart 
                                      chartData={chartData} 
                                      statusDistribution={distribution}
                                      chartType={chartType}
                                    />
                                  ) : (
                                    <div className="h-24 flex items-center justify-center bg-white bg-opacity-50 rounded border border-gray-200">
                                      <p className="text-xs text-gray-400">No data available for selected columns</p>
                                    </div>
                                  )
                                ) : (
                                  <div className="h-24 flex items-center justify-center bg-white bg-opacity-50 rounded border border-gray-200">
                                    <button
                                      onClick={() => setConfiguringStage(stage)}
                                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                    >
                                      <Settings2 className="h-3 w-3 mr-1" />
                                      Configure axes
                                    </button>
                                  </div>
                                )}
                              </div>
                              
                              {/* Stats Footer */}
                              {hasConfig && chartData.length > 0 && (
                                <div className="px-3 pb-3">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Categories:</span>
                                    <span className="font-medium text-gray-900">{chartData.length}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Groups:</span>
                                    <span className="font-medium text-gray-900">{distribution.length}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Empty State
          !selectedFile.isSelected && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <Layout className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
              <p className="text-gray-500 mb-6">Choose a project from the dropdown above to start analyzing data</p>
              {projectModules.length === 0 && (
                <button
                  onClick={() => navigate('/upload-trackers')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <File className="h-4 w-4 mr-2" />
                  Upload Trackers
                </button>
              )}
            </div>
          )
        )}
      </div>

      {/* Dashboard Configuration Modal */}
      {showConfigModal && (
        <DashboardConfigModal
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)}
          onApply={handleDashboardConfigApply}
          selectedProject={selectedProject}
          projectStages={projectStages}
          currentConfig={dashboardConfig}
        />
      )}

      {/* FIXED: Stage Configuration Modal - Now passes stage-specific columns */}
      {configuringStage && (
        <StageConfigModal
          stage={configuringStage}
          isOpen={true}
          onClose={() => setConfiguringStage(null)}
          departmentColumns={departmentColumns}
          stageSpecificColumns={stageSpecificColumns[configuringStage.id] || []}
          onSave={handleStageConfig}
          currentConfig={stageConfigs[configuringStage.id]}
        />
      )}

      {/* Full Screen Chart Modal */}
      {fullScreenStage && (
        <FullScreenChartModal
          stage={fullScreenStage}
          isOpen={true}
          onClose={() => setFullScreenStage(null)}
          chartData={stageChartData[fullScreenStage.id] || []}
          distribution={stageDistribution[fullScreenStage.id] || []}
          chartType={stageChartTypes[fullScreenStage.id] || 'bar'}
          onChartTypeChange={handleChartTypeChange}
        />
      )}

      {/* Header Configuration Modal */}
      {showHeaderConfig && departmentFiles.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Configure File Headers
                </h3>
                <button
                  onClick={() => setShowHeaderConfig(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                {departmentFiles.map((fileModule) => {
                  const fileHeaderConfig = fileModule.fileData?.headerConfig || { 
                    rowCount: 1
                  };
                  
                  return (
                    <FileHeaderConfigItem
                      key={fileModule.id}
                      fileModule={fileModule}
                      fileHeaderConfig={fileHeaderConfig}
                      onConfigure={(fileId, rowCount, selectedHeaders) => 
                        configureFileHeaders(fileModule, rowCount, selectedHeaders)
                      }
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Send Report
                </h3>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Recipients */}
              <div className="mb-6">
                <label className="text-base font-medium text-gray-700 mb-3 block">
                  Recipients ({departmentEmployees.length} available)
                </label>
                <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
                  <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <button
                      onClick={selectAllEmployees}
                      className="text-base text-blue-600 hover:text-blue-800"
                    >
                      {selectedEmployees.length === departmentEmployees.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <span className="text-base text-gray-600">
                      {selectedEmployees.length} selected
                    </span>
                  </div>
                  {departmentEmployees.map((employee) => (
                    <label
                      key={employee.id}
                      className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(employee.id)}
                        onChange={() => toggleEmployeeSelection(employee.id)}
                        className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-4"
                      />
                      <div className="flex-1">
                        <p className="text-base font-medium text-gray-700">{employee.name}</p>
                        <p className="text-sm text-gray-500">{employee.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="mb-6">
                <label className="text-base font-medium text-gray-700 mb-3 block">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder={`${selectedProject?.name} Report`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                />
              </div>

              {/* Message */}
              <div className="mb-6">
                <label className="text-base font-medium text-gray-700 mb-3 block">
                  Message
                </label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Add a message..."
                  rows="5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-none"
                />
              </div>

              {/* Status */}
              {emailStatus && (
                <div className={`mb-6 p-4 rounded-lg text-base ${
                  emailStatus.includes('success') 
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : emailStatus.includes('Failed')
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {emailStatus}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={emailSending || selectedEmployees.length === 0}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base flex items-center"
                >
                  {emailSending ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Send to {selectedEmployees.length} recipient(s)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDashboard;