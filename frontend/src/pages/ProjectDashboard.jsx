import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  File, User, ChevronRight, FileSpreadsheet, 
  AlertCircle, X, Eye, ChevronDown, ChevronUp,
  BarChart2, PieChart, TrendingUp, Mail, Send,
  CheckSquare, Filter, Download, RefreshCw, Folder,
  Layout, Database, Share2, Settings, Maximize2,
  Grid, List, Activity, Radar, ScatterChart as ScatterIcon,
  AreaChart as AreaIcon, Merge, Columns, Plus, Minus,
  Table, Layers, CheckCircle, Clock, AlertTriangle,
  Circle, DollarSign, Percent, TrendingDown
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart as RePieChart, Pie, Cell,
  LineChart, Line,
  AreaChart, Area,
  ResponsiveContainer
} from 'recharts';

import FileContentViewer from './Trackers/FileContentViewer';

// Enhanced Custom Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-4 py-3 border border-gray-200 rounded-lg shadow-lg max-w-xs">
        <p className="font-medium text-gray-900 mb-2 border-b pb-1">{label}</p>
        {payload.map((entry, index) => {
          const valueColor = entry.color || '#2563eb';
          return (
            <div key={index} className="flex items-center justify-between text-sm mb-1">
              <span style={{ color: valueColor }} className="font-medium">
                {entry.name}:
              </span>
              <span className="ml-4 font-mono font-semibold" style={{ color: valueColor }}>
                {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

// FileHeaderConfigItem component
const FileHeaderConfigItem = ({ fileModule, fileHeaderConfig, onConfigure }) => {
const [localRowCount, setLocalRowCount] = useState(fileHeaderConfig.rowCount);
const [localSelectedHeaders, setLocalSelectedHeaders] = useState(fileHeaderConfig.selectedHeaders || {});

// Preview first few rows
const previewRows = fileModule.fileData?.data?.slice(0, 5) || 
                   fileModule.fileData?.sheets?.[0]?.data?.slice(0, 5) || [];

const maxColumns = previewRows[0]?.length || 0;

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

  {/* Custom header names */}
  {maxColumns > 0 && (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">
        Custom column names (optional):
      </p>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: maxColumns }).map((_, colIndex) => {
          // Get header value from first header row
          const headerValue = previewRows[0]?.[colIndex] || `Column ${colIndex + 1}`;
          const currentValue = localSelectedHeaders[colIndex] || '';
          
          return (
            <div key={colIndex}>
              <label className="text-xs text-gray-500 mb-1 block">
                Column {colIndex + 1}:
              </label>
              <input
                type="text"
                value={currentValue}
                onChange={(e) => setLocalSelectedHeaders({
                  ...localSelectedHeaders,
                  [colIndex]: e.target.value
                })}
                placeholder={headerValue}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          );
        })}
      </div>
    </div>
  )}

  {/* Apply button */}
  <div className="mt-4 flex justify-end">
    <button
      onClick={() => onConfigure(fileModule.id, localRowCount, localSelectedHeaders)}
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

// Available departments from the project's files
const [availableDepartments, setAvailableDepartments] = useState([]);

const [selectedDepartment, setSelectedDepartment] = useState('');
const [departmentFiles, setDepartmentFiles] = useState([]);
const [xAxis, setXAxis] = useState('');
const [yAxis, setYAxis] = useState('');
const [chartType, setChartType] = useState('bar');
const [selectedEmployees, setSelectedEmployees] = useState([]);
const [chartData, setChartData] = useState([]);
const [departmentColumns, setDepartmentColumns] = useState([]);
const [departmentEmployees, setDepartmentEmployees] = useState([]);

// New state for enhanced visualization
const [statusDistribution, setStatusDistribution] = useState([]);
const [colorScheme, setColorScheme] = useState('status');

// Email state
const [emailSubject, setEmailSubject] = useState('');
const [emailBody, setEmailBody] = useState('');
const [showEmailModal, setShowEmailModal] = useState(false);
const [emailSending, setEmailSending] = useState(false);
const [emailStatus, setEmailStatus] = useState('');

// New state for multi-row header handling
const [headerRowCount, setHeaderRowCount] = useState(1);
const [showHeaderConfig, setShowHeaderConfig] = useState(false);
const [selectedHeaders, setSelectedHeaders] = useState({});

// Chart colors
const STATUS_COLORS = {
  completed: '#10b981',
  'in progress': '#f59e0b',
  pending: '#f59e0b',
  overdue: '#ef4444',
  planned: '#8b5cf6',
  review: '#06b6d4',
  other: '#94a3b8',
  default: '#2563eb'
};

const PIE_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

// Enhanced function to detect exact status from a value
const detectExactStatus = (value) => {
  if (!value || typeof value !== 'string') return 'other';
  
  const lowerValue = value.toLowerCase();
  
  const statusMap = {
    'completed': ['complete', 'completed', 'done', 'finished', 'approved', 'closed', 'released'],
    'in progress': ['in progress', 'progress', 'ongoing', 'started', 'active', 'waiting'],
    'pending': ['pending', 'waiting', 'hold', 'on hold'],
    'overdue': ['overdue', 'delay', 'late', 'behind', 'expired', 'past due'],
    'planned': ['planned', 'scheduled', 'upcoming', 'forecast', 'target'],
    'review': ['review', 'reviewed', 'qa', 'quality', 'check', 'audit']
  };

  for (const [status, keywords] of Object.entries(statusMap)) {
    if (keywords.some(keyword => lowerValue.includes(keyword))) {
      return status;
    }
  }
  
  return 'other';
};

// Enhanced function to detect status from a row
const detectRowStatus = (row) => {
  for (const [key, value] of Object.entries(row)) {
    if (typeof value === 'string') {
      const status = detectExactStatus(value);
      if (status !== 'other') {
        return status;
      }
    }
  }
  return 'other';
};

// Enhanced function to extract data rows considering multi-row headers
const extractDataRowsFromFile = (fileData, headerRowCount = 1) => {
  const rows = [];

  if (fileData.data && Array.isArray(fileData.data)) {
    // Skip header rows
    const dataRows = fileData.data.slice(headerRowCount);

    // Get headers (might be multi-row combined)
    const headers = extractHeadersFromFileData(fileData);

    dataRows.forEach(row => {
      if (Array.isArray(row)) {
        const rowObj = {};
        headers.forEach((header, index) => {
          if (index < row.length) {
            rowObj[header] = row[index];
          }
        });
        // Only add rows that have at least one non-empty value
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

// Enhanced function to extract headers considering multi-row structure
const extractHeadersFromFileData = (fileData) => {
const headers = [];

if (fileData.data && Array.isArray(fileData.data)) {
// Check if we have stored header configuration
if (fileData.headerConfig) {
  const { rowCount, selectedHeaders: configHeaders } = fileData.headerConfig;
  
  if (rowCount > 1) {
    // Multi-row header case
    const headerRows = fileData.data.slice(0, rowCount);
    
    // Create combined headers
    for (let colIndex = 0; colIndex < (headerRows[0]?.length || 0); colIndex++) {
      let combinedHeader = '';
      
      for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        const cellValue = headerRows[rowIndex]?.[colIndex] || '';
        if (cellValue) {
          combinedHeader += (combinedHeader ? ' - ' : '') + cellValue;
        }
      }
      
      // Check if there's a custom selected header
      const customHeader = configHeaders?.[colIndex];
      headers.push(customHeader || combinedHeader || `Column ${colIndex + 1}`);
    }
  } else {
    // Single row header case
    const headerRow = fileData.data[0];
    if (Array.isArray(headerRow)) {
      headerRow.forEach((cell, index) => {
        // Check if there's a custom selected header
        const customHeader = configHeaders?.[index];
        headers.push(customHeader || cell || `Column ${index + 1}`);
      });
    } else if (typeof headerRow === 'object') {
      Object.keys(headerRow).forEach(key => {
        headers.push(key);
      });
    }
  }
} else {
  // No header configuration - detect structure
  if (fileData.headers && Array.isArray(fileData.headers)) {
    // Simple headers array
    return fileData.headers;
  } else if (fileData.data.length > 0 && typeof fileData.data[0] === 'object') {
    // Object format
    return Object.keys(fileData.data[0]);
  } else {
    // Default - treat first row as headers
    const firstRow = fileData.data[0];
    if (Array.isArray(firstRow)) {
      firstRow.forEach((cell, index) => {
        headers.push(cell || `Column ${index + 1}`);
      });
    }
  }
}
} else if (fileData.sheets && fileData.sheets.length > 0) {
// Handle sheet-based data
const sheet = fileData.sheets[0];
if (sheet.headers && Array.isArray(sheet.headers)) {
  return sheet.headers;
}

if (sheet.data && sheet.data.length > 0) {
  // Check for header configuration in sheet
  if (sheet.headerConfig) {
    const { rowCount, selectedHeaders: configHeaders } = sheet.headerConfig;
    
    if (rowCount > 1) {
      const headerRows = sheet.data.slice(0, rowCount);
      
      for (let colIndex = 0; colIndex < (headerRows[0]?.length || 0); colIndex++) {
        let combinedHeader = '';
        
        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
          const cellValue = headerRows[rowIndex]?.[colIndex] || '';
          if (cellValue) {
            combinedHeader += (combinedHeader ? ' - ' : '') + cellValue;
          }
        }
        
        const customHeader = configHeaders?.[colIndex];
        headers.push(customHeader || combinedHeader || `Column ${colIndex + 1}`);
      }
    } else {
      const headerRow = sheet.data[0];
      if (Array.isArray(headerRow)) {
        headerRow.forEach((cell, index) => {
          const customHeader = configHeaders?.[index];
          headers.push(customHeader || cell || `Column ${index + 1}`);
        });
      }
    }
  } else {
    // Default - first row as headers
    const firstRow = sheet.data[0];
    if (Array.isArray(firstRow)) {
      firstRow.forEach((cell, index) => {
        headers.push(cell || `Column ${index + 1}`);
      });
    }
  }
}
}

return headers;
};

// Enhanced function to generate chart data with intelligent status detection
const generateEnhancedChartData = (departmentFiles, xAxis, yAxis) => {
  try {
    if (departmentFiles.length === 0 || !xAxis || !yAxis) {
      return [];
    }

    const aggregatedData = {};
    let isSimpleMode = true; // Track if we're in simple counting mode (no status grouping)

    departmentFiles.forEach((file) => {
      const fileHeaderCount = file.fileData?.headerConfig?.rowCount || 1;
      const dataRows = extractDataRowsFromFile(file.fileData, fileHeaderCount);

      dataRows.forEach((row) => {
        const xValue = row[xAxis];
        const yValue = row[yAxis];
        
        if (xValue === undefined || xValue === null || xValue === '') return;
        
        // Check if Y-axis is a status/text column
        const isStatusYAxis = yAxis.toLowerCase().includes('status') || 
                              ['status', 'state', 'condition', 'stage'].some(s => 
                                yAxis.toLowerCase().includes(s));
        
        // Check if Y-axis contains numeric values
        let isNumericYAxis = false;
        let numericValue = 0;
        
        if (typeof yValue === 'number') {
          isNumericYAxis = true;
          numericValue = yValue;
        } else if (typeof yValue === 'string') {
          const cleaned = yValue.replace(/[$€£¥,\s]/g, '');
          const match = cleaned.match(/^(\d+(\.\d+)?)/);
          if (match) {
            isNumericYAxis = true;
            numericValue = parseFloat(match[1]);
          }
        }
        
        // For Part Number vs Design Engineer scenario (or any non-status, non-numeric Y-axis)
        // We want to count occurrences per X value
        if (!isStatusYAxis && !isNumericYAxis) {
          // Simple counting mode - count occurrences of each X value
          const key = String(xValue);
          
          if (!aggregatedData[key]) {
            aggregatedData[key] = {
              name: String(xValue).substring(0, 30) + (String(xValue).length > 30 ? '...' : ''),
              xAxis: xValue,
              value: 0,
              count: 0
            };
          }
          
          aggregatedData[key].value += 1; // Count each occurrence
          aggregatedData[key].count += 1;
        }
        else if (isStatusYAxis) {
          // Status Y-axis - group by status
          isSimpleMode = false;
          const status = detectExactStatus(yValue);
          const key = `${xValue}|${status}`;
          
          if (!aggregatedData[key]) {
            aggregatedData[key] = {
              name: String(xValue).substring(0, 30) + (String(xValue).length > 30 ? '...' : ''),
              xAxis: xValue,
              status: status,
              count: 0,
              value: 0,
              records: []
            };
          }
          
          aggregatedData[key].value += 1; // Count occurrences
          aggregatedData[key].count += 1;
          aggregatedData[key].records.push(row);
        }
        else if (isNumericYAxis) {
          // Numeric Y-axis - sum the values by X, optionally detect status from other fields
          // Check if there are status-like columns in the data
          let hasStatusColumn = false;
          for (const key in row) {
            if (typeof row[key] === 'string' && 
                (key.toLowerCase().includes('status') || 
                 ['status', 'state', 'condition'].includes(key.toLowerCase()))) {
              hasStatusColumn = true;
              break;
            }
          }
          
          if (hasStatusColumn) {
            // If there are status columns, group by status
            isSimpleMode = false;
            const status = detectRowStatus(row);
            const key = `${xValue}|${status}`;
            
            if (!aggregatedData[key]) {
              aggregatedData[key] = {
                name: String(xValue).substring(0, 30) + (String(xValue).length > 30 ? '...' : ''),
                xAxis: xValue,
                status: status,
                count: 0,
                value: 0,
                records: []
              };
            }
            
            aggregatedData[key].value += numericValue;
            aggregatedData[key].count += 1;
            aggregatedData[key].records.push(row);
          } else {
            // Simple numeric aggregation by X only
            const key = String(xValue);
            
            if (!aggregatedData[key]) {
              aggregatedData[key] = {
                name: String(xValue).substring(0, 30) + (String(xValue).length > 30 ? '...' : ''),
                xAxis: xValue,
                value: 0,
                count: 0
              };
            }
            
            aggregatedData[key].value += numericValue;
            aggregatedData[key].count += 1;
          }
        }
      });
    });

    // Check if we're in simple mode (no status grouping)
    const firstKey = Object.keys(aggregatedData)[0];
    isSimpleMode = firstKey && !aggregatedData[firstKey].hasOwnProperty('status');

    if (isSimpleMode) {
      // Simple mode - just return array of x vs y values
      return Object.values(aggregatedData).map(item => ({
        name: item.name,
        value: item.value,
        count: item.count,
        average: item.count > 0 ? item.value / item.count : 0
      }));
    } else {
      // Status mode - transform to array format suitable for stacked charts
      const chartDataArray = [];
      const uniqueXValues = [...new Set(Object.values(aggregatedData).map(item => item.xAxis))];

      uniqueXValues.forEach(xValue => {
        const item = {
          name: String(xValue).substring(0, 30) + (String(xValue).length > 30 ? '...' : ''),
          xAxis: xValue,
          fullName: xValue
        };
        
        // Get all unique statuses for this X value
        const statusesForX = Object.values(aggregatedData).filter(d => d.xAxis === xValue);
        
        statusesForX.forEach(data => {
          if (data.status) {
            item[data.status] = data.value;
            item[`${data.status}Count`] = data.count;
            item[`${data.status}Avg`] = data.count > 0 ? data.value / data.count : 0;
          }
        });
        
        item.totalCount = statusesForX.reduce((sum, data) => sum + (data.count || 0), 0);
        item.totalValue = statusesForX.reduce((sum, data) => sum + (data.value || 0), 0);
        
        chartDataArray.push(item);
      });

      return chartDataArray;
    }
  } catch (error) {
    console.error('Error generating enhanced chart data:', error);
    return [];
  }
};

// Generate status distribution with improved categorization
const generateStatusDistribution = (chartData, yAxis) => {
  // If chart data is in simple mode (no status properties), return a single "Total" category
  if (chartData.length > 0 && !chartData[0].hasOwnProperty('completed') && 
      !chartData[0].hasOwnProperty('in progress') && !chartData[0].hasOwnProperty('pending') &&
      !chartData[0].hasOwnProperty('overdue') && !chartData[0].hasOwnProperty('planned') &&
      !chartData[0].hasOwnProperty('review') && !chartData[0].hasOwnProperty('other')) {
    
    // For simple mode, create a single "Total" category
    return [{
      name: 'Total',
      value: chartData.reduce((sum, item) => sum + (item.value || 0), 0),
      color: '#2563eb',
      count: chartData.length
    }];
  }

  const distribution = {};
  const isStatusColumn = yAxis.toLowerCase().includes('status') || 
                        ['status', 'state', 'condition', 'stage'].some(s => 
                          yAxis.toLowerCase().includes(s));
  
  chartData.forEach(item => {
    Object.keys(item).forEach(key => {
      // Skip metadata keys and count/avg fields
      if (key !== 'name' && key !== 'xAxis' && key !== 'fullName' && 
          key !== 'totalCount' && key !== 'totalValue' && 
          !key.includes('Count') && !key.includes('Avg') && 
          !key.includes('Records')) {
        
        if (!distribution[key]) {
          distribution[key] = 0;
        }
        
        // For status columns, each occurrence counts as 1
        // For numeric columns, sum the values
        distribution[key] += isStatusColumn ? (item[`${key}Count`] || item[key]) : item[key];
      }
    });
  });

  // Sort by value descending
  return Object.entries(distribution)
    .map(([status, value], index) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: Math.round(value * 100) / 100, // Round to 2 decimals
      color: STATUS_COLORS[status] || PIE_COLORS[index % PIE_COLORS.length],
      count: value
    }))
    .sort((a, b) => b.value - a.value);
};

// Handle project selection - updated to extract available departments
const handleProjectSelect = (projectId) => {
const project = projectModules.find(p => p.id === projectId);
setSelectedProjectId(projectId);
setSelectedProject(project);

// Extract unique departments from the project's files
const departments = new Set();
if (project && project.submodules && Array.isArray(project.submodules)) {
  project.submodules.forEach((fileModule) => {
    const trackerInfo = getTrackerInfo(fileModule.trackerId);
    if (trackerInfo && trackerInfo.department) {
      departments.add(trackerInfo.department);
    }
  });
}
setAvailableDepartments(Array.from(departments));

setSelectedDepartment('');
setDepartmentFiles([]);
setDepartmentColumns([]);
setDepartmentEmployees([]);
setXAxis('');
setYAxis('');
setChartData([]);
setStatusDistribution([]);
setSelectedEmployees([]);
setHeaderRowCount(1);
setSelectedHeaders({});
};

// Load department files
useEffect(() => {
if (selectedDepartment && selectedProject) {
const files = getDepartmentFilesFromSelectedProject();
  
  if (files.length > 0) {
    setDepartmentFiles(files);
    const columns = extractColumnsFromFiles(files);
    setDepartmentColumns(columns);
    const employees = extractEmployeesFromFiles(files);
    setDepartmentEmployees(employees);
    setXAxis('');
    setYAxis('');
  } else {
    setDepartmentFiles([]);
    setDepartmentColumns([]);
    setDepartmentEmployees([]);
    setXAxis('');
    setYAxis('');
    setChartData([]);
    setStatusDistribution([]);
  }
} else {
setDepartmentFiles([]);
setDepartmentColumns([]);
setDepartmentEmployees([]);
setXAxis('');
setYAxis('');
setChartData([]);
setStatusDistribution([]);
}
}, [selectedDepartment, selectedProject]);

const getDepartmentFilesFromSelectedProject = () => {
if (!selectedProject) return [];

const files = [];
if (selectedProject.submodules && Array.isArray(selectedProject.submodules)) {
selectedProject.submodules.forEach((fileModule) => {
  const trackerInfo = getTrackerInfo(fileModule.trackerId);
  if (trackerInfo && trackerInfo.department?.toLowerCase() === selectedDepartment.toLowerCase()) {
    const fileData = uploadedFilesData[fileModule.trackerId];
    files.push({
      ...fileModule,
      trackerInfo,
      fileData: fileData || null,
      projectName: selectedProject.name
    });
  }
});
}
return files;
};

// Enhanced function to extract columns from files with multi-row header support
const extractColumnsFromFiles = (files) => {
const columnsSet = new Set();

files.forEach((file) => {
if (!file.fileData) return;

const headers = extractHeadersFromFileData(file.fileData);
headers.forEach(col => {
  if (col && col.trim() !== '') {
    columnsSet.add(col);
  }
});
});

return Array.from(columnsSet);
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

// Function to configure headers for a file
const configureFileHeaders = (fileModule, rowCount, selectedHeaders) => {
// Filter out empty custom headers
const filteredHeaders = {};
Object.keys(selectedHeaders).forEach(key => {
if (selectedHeaders[key] && selectedHeaders[key].trim() !== '') {
  filteredHeaders[key] = selectedHeaders[key];
}
});

const updatedFileData = { 
...fileModule.fileData,
headerConfig: {
  rowCount,
  selectedHeaders: filteredHeaders
}
};

// Save to localStorage
const newFilesData = {
...uploadedFilesData,
[fileModule.trackerId]: updatedFileData
};

setUploadedFilesData(newFilesData);
localStorage.setItem('uploaded_files_data', JSON.stringify(newFilesData));

// Refresh department files and columns
const updatedFiles = departmentFiles.map(f => 
f.trackerId === fileModule.trackerId ? { ...f, fileData: updatedFileData } : f
);
setDepartmentFiles(updatedFiles);

// Immediately update columns based on new headers
const columns = extractColumnsFromFiles(updatedFiles);
setDepartmentColumns(columns);

// Close modal after configuration
setShowHeaderConfig(false);

// Force chart update if axes are already selected
if (xAxis && yAxis) {
  const newData = generateEnhancedChartData(updatedFiles, xAxis, yAxis);
  setChartData(newData);
  
  const distribution = generateStatusDistribution(newData, yAxis);
  setStatusDistribution(distribution);
}

// Show success message
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

const handleFileClick = (fileModule, projectModule) => {
if (selectedFile.isSelected && selectedFile.trackerInfo?.id === fileModule.trackerId) {
return;
}

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

const handleSaveFileData = (trackerId, updatedFileData) => {
const newFilesData = { ...uploadedFilesData, [trackerId]: updatedFileData };
setUploadedFilesData(newFilesData);
localStorage.setItem('uploaded_files_data', JSON.stringify(newFilesData));

if (selectedFile.trackerInfo?.id === trackerId) {
setSelectedFile(prev => ({ ...prev, fileData: updatedFileData }));
}

if (selectedDepartment && selectedProject) {
setDepartmentFiles(getDepartmentFilesFromSelectedProject());
}
};

const getTrackerInfo = (trackerId) => {
return trackers.find(t => t.id === trackerId);
};

// Generate chart data when axes change or when department files are updated
useEffect(() => {
  if (selectedDepartment && xAxis && yAxis && departmentFiles.length > 0) {
    const data = generateEnhancedChartData(departmentFiles, xAxis, yAxis);
    setChartData(data);
    
    const distribution = generateStatusDistribution(data, yAxis);
    setStatusDistribution(distribution);
    
    // Auto-select appropriate chart type based on data
    const isSimpleMode = data.length > 0 && !data[0].hasOwnProperty('completed') && 
                         !data[0].hasOwnProperty('in progress');
    
    if (isSimpleMode) {
      // For simple counting (like Part Number vs Design Engineer), use bar chart
      setChartType('bar');
    } else {
      // For status-based data
      if (distribution.length <= 6) {
        setChartType('pie');
      } else {
        setChartType('bar');
      }
    }
  } else {
    setChartData([]);
    setStatusDistribution([]);
  }
}, [selectedDepartment, xAxis, yAxis, departmentFiles]);

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
  <div className="bg-white border-b border-gray-200 px-6 py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Layout className="h-6 w-6 text-blue-600" />
        <h1 className="text-xl font-semibold text-gray-900">Project Analytics Dashboard</h1>
      </div>
      
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

  {/* Main Content */}
  <div className="p-6">
    {selectedProject ? (
      <div className="flex gap-6">
        {/* Left Panel - Controls */}
        {!selectedFile.isSelected && (
          <div className="w-96 flex-shrink-0 transition-all duration-300">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Project Info */}
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <h2 className="font-semibold text-gray-900 flex items-center">
                  <Folder className="h-4 w-4 mr-2 text-blue-600" />
                  {selectedProject.name}
                </h2>
                <p className="text-xs text-gray-600 mt-1">
                  {selectedProject.submodules?.length || 0} files • {selectedProject.projectStats?.contributors?.length || 0} contributors
                </p>
              </div>

              {/* Department Selection */}
              <div className="p-4 border-b border-gray-200">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 block">
                  Select Department
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableDepartments.length > 0 ? (
                    availableDepartments.map(dept => (
                      <button
                        key={dept}
                        onClick={() => setSelectedDepartment(dept)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          selectedDepartment === dept
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {dept}
                      </button>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-4 text-sm text-gray-500 bg-gray-50 rounded-lg">
                      No departments found
                    </div>
                  )}
                </div>
              </div>

              {/* Analysis Controls */}
              {selectedDepartment && (
                <div className="p-4">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                    Analysis Settings
                  </h3>

                  {/* Header Configuration Button */}
                  {departmentFiles.length > 0 && (
                    <div className="mb-4">
                      <button
                        onClick={() => setShowHeaderConfig(true)}
                        className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center justify-center"
                      >
                        <Columns className="h-4 w-4 mr-2" />
                        Configure Headers
                      </button>
                    </div>
                  )}

                  {/* Axis Selection */}
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">
                        X-Axis (Categories)
                      </label>
                      <select
                        value={xAxis}
                        onChange={(e) => {
                          setXAxis(e.target.value);
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="">Select column</option>
                        {departmentColumns.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">
                        Y-Axis (Values)
                      </label>
                      <select
                        value={yAxis}
                        onChange={(e) => {
                          setYAxis(e.target.value);
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="">Select column</option>
                        {departmentColumns.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Chart Type Selection - Only 4 charts */}
                  {chartData.length > 0 && (
                    <>
                      <div className="mb-4">
                        <label className="text-xs font-medium text-gray-600 mb-2 block">
                          Chart Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setChartType('bar')}
                            className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center ${
                              chartType === 'bar'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <BarChart2 className="h-3.5 w-3.5 mr-1" />
                            Bar Chart
                          </button>
                          <button
                            onClick={() => setChartType('pie')}
                            className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center ${
                              chartType === 'pie'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <PieChart className="h-3.5 w-3.5 mr-1" />
                            Pie Chart
                          </button>
                          <button
                            onClick={() => setChartType('line')}
                            className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center ${
                              chartType === 'line'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <TrendingUp className="h-3.5 w-3.5 mr-1" />
                            Line Chart
                          </button>
                          <button
                            onClick={() => setChartType('area')}
                            className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center ${
                              chartType === 'area'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <AreaIcon className="h-3.5 w-3.5 mr-1" />
                            Area Chart
                          </button>
                        </div>
                      </div>

                      {/* Distribution Summary - Only for bar/line/area charts */}
                      {chartType !== 'pie' && statusDistribution.length > 0 && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                            <PieChart className="h-3 w-3 mr-1 text-blue-600" />
                            {statusDistribution.length === 1 ? 'Total Summary' : 'Status Distribution'}
                          </h4>
                          <div className="space-y-2">
                            {statusDistribution.map((status, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: status.color }}></div>
                                  <span className="text-xs text-gray-600">{status.name}</span>
                                </div>
                                <span className="text-xs font-medium" style={{ color: status.color }}>
                                  {status.value.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Send Report Button */}
                  {chartData.length > 0 && (
                    <button
                      onClick={() => setShowEmailModal(true)}
                      className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Report ({departmentEmployees.length} recipients)
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Panel - Enhanced Chart/File Viewer */}
        <div className={`${!selectedFile.isSelected ? 'flex-1' : 'w-full'} transition-all duration-300`}>
          {selectedFile.isSelected && selectedFile.source === 'project-dashboard' ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full">
              <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between bg-gray-50">
                <button
                  onClick={handleCloseFileViewer}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                  Back to Dashboard
                </button>
                <h3 className="text-sm font-medium text-gray-700">
                  {selectedFile.trackerInfo?.fileName}
                </h3>
              </div>
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
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BarChart2 className="h-5 w-5 mr-2 text-blue-600" />
                  {chartType === 'bar' && 'Bar Chart'}
                  {chartType === 'pie' && 'Pie Chart'}
                  {chartType === 'line' && 'Line Chart'}
                  {chartType === 'area' && 'Area Chart'}
                </h2>
                {selectedDepartment && xAxis && yAxis && chartData.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full">
                      {xAxis}
                    </span>
                    <span className="text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full">
                      {yAxis}
                    </span>
                    {chartType !== 'pie' && (
                      <span className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-full">
                        {statusDistribution.length === 1 ? 'Total' : `${statusDistribution.length} groups`}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Enhanced Chart Container */}
              <div className="h-[500px] w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'bar' && (
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={80} 
                          interval={0}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                          wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                          layout="horizontal"
                          verticalAlign="bottom"
                          align="center"
                        />
                        {statusDistribution.length === 1 ? (
                          // Simple bar chart for single value
                          <Bar 
                            dataKey="value"
                            fill={statusDistribution[0].color}
                            name={yAxis}
                            radius={[4, 4, 0, 0]}
                          />
                        ) : (
                          // Stacked bar chart for multiple statuses
                          statusDistribution.map((status, index) => (
                            <Bar 
                              key={status.name}
                              dataKey={status.name.toLowerCase()}
                              stackId="a"
                              fill={status.color}
                              name={status.name}
                              radius={[index === statusDistribution.length - 1 ? 4 : 0, index === statusDistribution.length - 1 ? 4 : 0, 0, 0]}
                            />
                          ))
                        )}
                      </BarChart>
                    )}
                    {chartType === 'pie' && (
                      <RePieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={180}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RePieChart>
                    )}
                    {chartType === 'line' && (
                      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={80} 
                          interval={0}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        {statusDistribution.length === 1 ? (
                          <Line 
                            type="monotone"
                            dataKey="value"
                            stroke={statusDistribution[0].color}
                            strokeWidth={2}
                            dot={{ r: 3, fill: statusDistribution[0].color }}
                            name={yAxis}
                          />
                        ) : (
                          statusDistribution.map((status) => (
                            <Line 
                              key={status.name}
                              type="monotone"
                              dataKey={status.name.toLowerCase()}
                              stroke={status.color}
                              strokeWidth={2}
                              dot={{ r: 3, fill: status.color }}
                              name={status.name}
                            />
                          ))
                        )}
                      </LineChart>
                    )}
                    {chartType === 'area' && (
                      <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={80} 
                          interval={0}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        {statusDistribution.length === 1 ? (
                          <Area 
                            type="monotone"
                            dataKey="value"
                            stroke={statusDistribution[0].color}
                            fill={statusDistribution[0].color}
                            fillOpacity={0.6}
                            name={yAxis}
                          />
                        ) : (
                          statusDistribution.map((status) => (
                            <Area 
                              key={status.name}
                              type="monotone"
                              dataKey={status.name.toLowerCase()}
                              stackId="1"
                              stroke={status.color}
                              fill={status.color}
                              fillOpacity={0.6}
                              name={status.name}
                            />
                          ))
                        )}
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <div className="text-center px-4">
                      <BarChart2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No visualization data</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {!selectedDepartment ? "Select a department to begin" :
                         !xAxis || !yAxis ? "Select X and Y axes to visualize" :
                         "No data available for the selected configuration"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Stats Cards */}
              {chartData.length > 0 && (
                <div className="mt-6">
                  <div className="grid grid-cols-5 gap-4 mb-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <p className="text-xs text-blue-600 mb-1">Total Categories</p>
                      <p className="text-2xl font-semibold text-blue-900">{chartData.length}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                      <p className="text-xs text-purple-600 mb-1">Data Groups</p>
                      <p className="text-2xl font-semibold text-purple-900">{statusDistribution.length}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                      <p className="text-xs text-green-600 mb-1">Files Analyzed</p>
                      <p className="text-2xl font-semibold text-green-900">{departmentFiles.length}</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
                      <p className="text-xs text-amber-600 mb-1">X-Axis</p>
                      <p className="text-sm font-medium text-amber-900 truncate">{xAxis}</p>
                    </div>
                    <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-lg p-4 border border-rose-200">
                      <p className="text-xs text-rose-600 mb-1">Y-Axis</p>
                      <p className="text-sm font-medium text-rose-900 truncate">{yAxis}</p>
                    </div>
                  </div>

                  {/* Legend - Only for non-pie charts */}
                  {chartType !== 'pie' && (
                    <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {statusDistribution.map((status) => (
                        <div key={status.name} className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: status.color }}></div>
                          <span className="text-xs text-gray-700">{status.name}</span>
                          <span className="ml-2 text-xs font-medium" style={{ color: status.color }}>
                            {status.value.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    ) : (
      // Empty State
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
    )}
  </div>

  {/* Header Configuration Modal */}
  {showHeaderConfig && departmentFiles.length > 0 && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Merge className="h-5 w-5 mr-2 text-blue-600" />
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
              // Get existing config or use defaults
              const fileHeaderConfig = fileModule.fileData?.headerConfig || { 
                rowCount: 1, 
                selectedHeaders: {} 
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
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Mail className="h-5 w-5 mr-2 text-blue-600" />
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
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Recipients ({departmentEmployees.length} available)
            </label>
            <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
              <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <button
                  onClick={selectAllEmployees}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedEmployees.length === departmentEmployees.length ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-sm text-gray-600">
                  {selectedEmployees.length} selected
                </span>
              </div>
              {departmentEmployees.map((employee) => (
                <label
                  key={employee.id}
                  className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(employee.id)}
                    onChange={() => toggleEmployeeSelection(employee.id)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-3"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{employee.name}</p>
                    <p className="text-xs text-gray-500">{employee.email}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Subject
            </label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder={`${selectedProject?.name} - ${selectedDepartment} Report`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Message */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Message
            </label>
            <textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder="Add a message..."
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
            />
          </div>

          {/* Enhanced Chart Preview */}
          {chartData.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <BarChart2 className="h-4 w-4 mr-2" />
                Chart Preview ({xAxis} vs {yAxis})
              </p>
              <div className="h-48 bg-white rounded-lg border border-gray-200 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'pie' ? (
                    <RePieChart>
                      <Pie
                        data={statusDistribution.slice(0, 5)}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        dataKey="value"
                      >
                        {statusDistribution.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </RePieChart>
                  ) : (
                    <BarChart data={chartData.slice(0, 5)} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                      <YAxis tick={{ fontSize: 8 }} />
                      <Tooltip />
                      {statusDistribution.length === 1 ? (
                        <Bar 
                          dataKey="value"
                          fill={statusDistribution[0].color}
                          name={yAxis}
                        />
                      ) : (
                        statusDistribution.slice(0, 3).map((status) => (
                          <Bar 
                            key={status.name}
                            dataKey={status.name.toLowerCase()}
                            stackId="a"
                            fill={status.color}
                            name={status.name}
                          />
                        ))
                      )}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Status */}
          {emailStatus && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
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
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowEmailModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSendEmail}
              disabled={emailSending || selectedEmployees.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center"
            >
              {emailSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
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