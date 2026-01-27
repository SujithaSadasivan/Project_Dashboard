import React, { useState, useEffect } from 'react';
import { 
  Upload, File, CheckCircle, Clock, AlertCircle, Download, Trash2, Eye, Edit,
  Plus, Search, X, ChevronUp, ChevronDown, Columns,
  AlertTriangle, FileText, FileSpreadsheet, Database,
  HardDrive, Archive, Check, Calendar, Save
} from 'lucide-react';
import * as XLSX from 'xlsx';

const UploadTrackers = () => {
  // Initial columns configuration
  const initialColumns = [
    { id: 'name', label: 'File Name', visible: true, sortable: true, type: 'text', required: true, deletable: false },
    
    // { id: 'size', label: 'Size', visible: true, sortable: true, type: 'text', required: true, deletable: false },
    // { id: 'records', label: 'Records', visible: true, sortable: true, type: 'number', required: true, deletable: false },
    { id: 'date', label: 'Upload Date', visible: true, sortable: true, type: 'date', required: true, deletable: false },
    // { id: 'status', label: 'Status', visible: true, sortable: true, type: 'select', required: true, deletable: false },
    { id: 'uploadedBy', label: 'Uploaded By', visible: true, sortable: true, type: 'text', required: false, deletable: false },
  ];

  // Load trackers from localStorage on component mount
  const [trackers, setTrackers] = useState(() => {
    const savedTrackers = localStorage.getItem('upload_trackers');
    return savedTrackers ? JSON.parse(savedTrackers) : [
     
      
      { id: 3, name: 'Inventory Update.csv', type: 'CSV', size: '1.8 MB', status: 'Failed', date: '2024-01-13', records: 0, uploadedBy: 'Bob Johnson' },
    ];
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeletePrompt, setShowDeletePrompt] = useState(null);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('text');
  
  // Load columns from localStorage
  const [columns, setColumns] = useState(() => {
    const savedColumns = localStorage.getItem('upload_columns');
    return savedColumns ? JSON.parse(savedColumns) : initialColumns;
  });
  
  const [editingColumn, setEditingColumn] = useState(null);
  const [tempColumnName, setTempColumnName] = useState('');
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  
  // Excel Viewer State
  const [excelViewerData, setExcelViewerData] = useState(null);
  const [excelEditMode, setExcelEditMode] = useState(false);
  const [excelEditData, setExcelEditData] = useState([]);
  const [currentSheet, setCurrentSheet] = useState(0);
  const [excelHeaders, setExcelHeaders] = useState([]);
  
  // Upload Form Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    id: '',
    name: '',
    department: '',
    file: null
  });
  const [uploadFormErrors, setUploadFormErrors] = useState({});
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  // Status filter state
  const [statusFilter, setStatusFilter] = useState("All Status");

  // Status configuration
  const statusConfig = {
    'Completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle, bgColor: 'bg-green-50' },
    'Processing': { color: 'bg-yellow-100 text-yellow-800', icon: Clock, bgColor: 'bg-yellow-50' },
    'Failed': { color: 'bg-red-100 text-red-800', icon: AlertCircle, bgColor: 'bg-red-50' },
    'Pending': { color: 'bg-blue-100 text-blue-800', icon: Clock, bgColor: 'bg-blue-50' },
    'Queued': { color: 'bg-purple-100 text-purple-800', icon: Clock, bgColor: 'bg-purple-50' }
  };

  const statusOptions = ['Completed', 'Processing', 'Failed', 'Pending', 'Queued'];

  // Store uploaded file data
  const [uploadedFilesData, setUploadedFilesData] = useState(() => {
    const savedData = localStorage.getItem('uploaded_files_data');
    return savedData ? JSON.parse(savedData) : {};
  });

  // Save trackers, columns, and file data to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('upload_trackers', JSON.stringify(trackers));
    localStorage.setItem('upload_columns', JSON.stringify(columns));
    localStorage.setItem('uploaded_files_data', JSON.stringify(uploadedFilesData));
  }, [trackers, columns, uploadedFilesData]);

  // Get unique status from trackers data
  const uniqueStatus = ["All Status", ...new Set(trackers.map(tracker => tracker.status).filter(Boolean))];

  // Filter trackers based on search and status
  const filteredTrackers = trackers.filter(tracker => {
    // Search filter
    const matchesSearch = Object.values(tracker).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Status filter
    const matchesStatus = 
      statusFilter === "All Status" || 
      tracker.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalUploads = trackers.length;
  const successfulUploads = trackers.filter(t => t.status === 'Completed').length;
  const totalRecords = trackers.reduce((sum, t) => sum + (t.records || 0), 0);
  const failedUploads = trackers.filter(t => t.status === 'Failed').length;

  // Sort trackers
  const sortedTrackers = React.useMemo(() => {
    if (!sortConfig.key) return filteredTrackers;

    return [...filteredTrackers].sort((a, b) => {
      const aVal = a[sortConfig.key] || '';
      const bVal = b[sortConfig.key] || '';
      
      if (aVal < bVal) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredTrackers, sortConfig]);

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Get sort icon for a column
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 opacity-30" />;
    }
    return sortConfig.direction === 'ascending' 
      ? <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" /> 
      : <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />;
  };

  // Open upload modal
  const openUploadModal = () => {
    setShowUploadModal(true);
    setUploadForm({
      id: '',
      name: '',
      department: '',
      file: null
    });
    setUploadFormErrors({});
  };

  // Validate upload form
  const validateUploadForm = () => {
    const errors = {};
    if (!uploadForm.id.trim()) errors.id = 'ID is required';
    if (!uploadForm.name.trim()) errors.name = 'Name is required';
    if (!uploadForm.department.trim()) errors.department = 'Department is required';
    if (!uploadForm.file) errors.file = 'File is required';
    return errors;
  };

  // Read Excel/CSV file - SIMPLIFIED VERSION
  const readFileData = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const fileExtension = file.name.split('.').pop().toLowerCase();
          
          if (fileExtension === 'csv') {
            // Parse CSV using XLSX
            const workbook = XLSX.read(data, { type: 'binary' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length > 0) {
              const headers = jsonData[0];
              const rows = jsonData.slice(1);
              
              resolve({
                headers,
                data: rows,
                sheets: [{
                  name: 'Sheet1',
                  headers: headers,
                  data: rows
                }]
              });
            } else {
              resolve({
                headers: ['No Data'],
                data: [],
                sheets: [{
                  name: 'Sheet1',
                  headers: ['No Data'],
                  data: []
                }]
              });
            }
          } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            // Parse Excel
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheets = workbook.SheetNames.map(sheetName => {
              const worksheet = workbook.Sheets[sheetName];
              const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
              
              if (jsonData.length > 0) {
                return {
                  name: sheetName,
                  headers: jsonData[0],
                  data: jsonData.slice(1)
                };
              } else {
                return {
                  name: sheetName,
                  headers: ['No Data'],
                  data: []
                };
              }
            });
            
            resolve({
              headers: sheets[0].headers,
              data: sheets[0].data,
              sheets: sheets
            });
          } else if (fileExtension === 'json') {
            // Parse JSON
            const jsonData = JSON.parse(data);
            let headers = [];
            let rows = [];
            
            if (Array.isArray(jsonData) && jsonData.length > 0) {
              headers = Object.keys(jsonData[0]);
              rows = jsonData.map(item => Object.values(item));
            } else if (typeof jsonData === 'object') {
              headers = ['Key', 'Value'];
              rows = Object.entries(jsonData);
            }
            
            resolve({
              headers,
              data: rows,
              sheets: [{
                name: 'Data',
                headers: headers,
                data: rows
              }]
            });
          } else {
            // For text files
            const lines = data.split('\n').filter(line => line.trim() !== '');
            const headers = ['Line', 'Content'];
            const rows = lines.map((line, index) => [index + 1, line.trim()]);
            
            resolve({
              headers,
              data: rows,
              sheets: [{
                name: 'Content',
                headers: headers,
                data: rows
              }]
            });
          }
        } catch (error) {
          console.error('Error parsing file:', error);
          reject(new Error(`Error parsing file: ${error.message}`));
        }
      };
      
      reader.onerror = (error) => {
        reject(new Error(`File reading error: ${error.target.error}`));
      };
      
      // Read based on file type
      if (file.name.endsWith('.json') || file.name.endsWith('.txt')) {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    });
  };

  // Handle modal file selection
  const handleModalFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileType = file.name.split('.').pop().toUpperCase();
      const allowedTypes = ['CSV', 'XLSX', 'XLS', 'JSON', 'TXT'];
      
      if (!allowedTypes.includes(fileType)) {
        setUploadFormErrors({...uploadFormErrors, file: 'Please upload CSV, Excel, or JSON files only'});
        return;
      }
      
      if (file.size > 50 * 1024 * 1024) {
        setUploadFormErrors({...uploadFormErrors, file: 'File size must be less than 50MB'});
        return;
      }
      
      setUploadForm({...uploadForm, file});
      setUploadFormErrors({...uploadFormErrors, file: ''});
    }
  };

  // Handle upload form submission
  const handleUploadSubmit = async () => {
    const errors = validateUploadForm();
    if (Object.keys(errors).length > 0) {
      setUploadFormErrors(errors);
      return;
    }
    
    // Close modal and start upload
    setShowUploadModal(false);
    await handleFileUpload(uploadForm.file);
  };

  // Handle file upload
  const handleFileUpload = async (file) => {
    if (!file) return;
    
    setUploading(true);
    setProgress(0);
    setSelectedFile(file);
    
    try {
      // Read and parse the file first
      const fileData = await readFileData(file);
      const recordCount = fileData.data.length;
      
      // Then simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            
            // Create new tracker after upload completes
            const newTracker = {
  id: Math.max(...trackers.map(t => t.id), 0) + 1,
  name: file.name,
  type: file.name.split('.').pop().toUpperCase(),
  // Remove size, status, records
  date: new Date().toISOString().split('T')[0],
  uploadedBy: 'Current User',
  uploadId: uploadForm.id,
  uploadName: uploadForm.name,
  uploadDepartment: uploadForm.department
};
            // Store the file data
            setUploadedFilesData(prev => ({
              ...prev,
              [newTracker.id]: fileData
            }));
            
            // Add to trackers
            setTrackers([newTracker, ...trackers]);
            
            // Reset states
            setUploading(false);
            setProgress(0);
            setSelectedFile(null);
            setUploadForm({
              id: '',
              name: '',
              department: '',
              file: null
            });
            
            return 100;
          }
          return prev + 20; // Faster progress for better UX
        });
      }, 300);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploading(false);
      setProgress(0);
      alert(`Error reading file: ${error.message}. Please make sure it's a valid file format.`);
    }
  };

  // Show delete prompt
  const showDeleteConfirmation = (id, name) => {
    setShowDeletePrompt({ id, name });
  };

  // Confirm delete tracker
  const confirmDeleteTracker = () => {
    if (showDeletePrompt) {
      // Remove from trackers
      setTrackers(trackers.filter(tracker => tracker.id !== showDeletePrompt.id));
      
      // Remove from uploaded files data
      const newFileData = { ...uploadedFilesData };
      delete newFileData[showDeletePrompt.id];
      setUploadedFilesData(newFileData);
      
      setShowDeletePrompt(null);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeletePrompt(null);
  };

  // Start editing tracker
  const startEditing = (tracker) => {
    setEditingId(tracker.id);
    const editData = { ...tracker };
    columns.forEach(col => {
      if (!editData.hasOwnProperty(col.id)) {
        editData[col.id] = col.type === 'select' ? 'Pending' : '';
      }
    });
    setEditForm(editData);
  };

  // Save tracker edit
  const saveEdit = () => {
    if (editingId) {
      if (window.confirm('Are you sure you want to save changes to this upload record?')) {
        setTrackers(trackers.map(tracker => 
          tracker.id === editingId ? { ...tracker, ...editForm } : tracker
        ));
        setEditingId(null);
        setEditForm({});
      }
    }
  };

  // Cancel tracker edit
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Handle edit form change
  const handleEditFormChange = (field, value) => {
    setEditForm({...editForm, [field]: value});
  };

  // Show Excel viewer
  const showExcelViewer = (tracker) => {
    const fileData = uploadedFilesData[tracker.id];
    
    if (!fileData) {
      alert('No file data available. Please re-upload the file.');
      return;
    }
    
    setExcelViewerData({
      ...tracker,
      sheets: fileData.sheets
    });
    
    // Initialize edit data with the first sheet
    const currentSheetData = fileData.sheets[0];
    setExcelEditData(currentSheetData.data.map(row => [...(row || [])]));
    setExcelHeaders(currentSheetData.headers || []);
    setExcelEditMode(false);
    setCurrentSheet(0);
  };

  // Close Excel viewer
  const closeExcelViewer = () => {
    setExcelViewerData(null);
    setExcelEditMode(false);
    setExcelEditData([]);
    setExcelHeaders([]);
  };

  // Toggle Excel edit mode
  const toggleExcelEditMode = () => {
    setExcelEditMode(!excelEditMode);
  };

  // Handle Excel cell edit
  const handleExcelCellEdit = (rowIndex, colIndex, value) => {
    const newData = [...excelEditData];
    if (!newData[rowIndex]) {
      newData[rowIndex] = new Array(excelHeaders.length).fill('');
    }
    newData[rowIndex][colIndex] = value;
    setExcelEditData(newData);
  };

  // Save Excel changes
  const saveExcelChanges = () => {
    if (window.confirm('Are you sure you want to save changes to this file?')) {
      if (excelViewerData) {
        const updatedSheets = [...excelViewerData.sheets];
        updatedSheets[currentSheet] = {
          ...updatedSheets[currentSheet],
          data: excelEditData
        };
        
        const newFileData = {
          ...uploadedFilesData[excelViewerData.id],
          sheets: updatedSheets,
          data: excelEditData,
          headers: excelHeaders
        };
        
        setUploadedFilesData(prev => ({
          ...prev,
          [excelViewerData.id]: newFileData
        }));
        
        // Update record count in tracker
        setTrackers(trackers.map(tracker => 
          tracker.id === excelViewerData.id 
            ? { ...tracker, records: excelEditData.length }
            : tracker
        ));
        
        // Update viewer data
        setExcelViewerData(prev => ({
          ...prev,
          sheets: updatedSheets,
          records: excelEditData.length
        }));
        
        setExcelEditMode(false);
        alert('Changes saved successfully!');
      }
    }
  };

  // Switch sheet
  const switchSheet = (index) => {
    setCurrentSheet(index);
    if (excelViewerData) {
      const sheetData = excelViewerData.sheets[index];
      setExcelEditData(sheetData.data.map(row => [...(row || [])]));
      setExcelHeaders(sheetData.headers || []);
    }
  };

  // Add new row
  const addNewRow = () => {
    const newRow = new Array(excelHeaders.length).fill('');
    const newData = [...excelEditData, newRow];
    setExcelEditData(newData);
  };

  // Delete row
  const deleteRow = (rowIndex) => {
    if (window.confirm('Are you sure you want to delete this row?')) {
      const newData = excelEditData.filter((_, index) => index !== rowIndex);
      setExcelEditData(newData);
    }
  };

  // Export file data
  const exportFileData = () => {
    if (!excelViewerData) return;
    
    const fileData = uploadedFilesData[excelViewerData.id];
    if (!fileData) return;
    
    try {
      // Create worksheet from current sheet data
      const currentSheetData = fileData.sheets[currentSheet];
      const worksheetData = [
        currentSheetData.headers,
        ...currentSheetData.data
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, currentSheetData.name || "Sheet1");
      
      // Generate filename
      const originalName = excelViewerData.name.split('.').slice(0, -1).join('.');
      const extension = excelViewerData.name.split('.').pop();
      const exportName = `${originalName}_modified.${extension}`;
      
      XLSX.writeFile(wb, exportName);
      alert(`File exported as ${exportName}`);
    } catch (error) {
      console.error('Error exporting file:', error);
      alert('Error exporting file. Please try again.');
    }
  };

  // Add new column
  const handleAddColumn = () => {
    if (newColumnName.trim()) {
      const newColumnId = newColumnName.toLowerCase().replace(/\s+/g, '_');
      
      // Check if column already exists
      if (columns.find(col => col.id === newColumnId)) {
        alert('Column with this name already exists');
        return;
      }
      
      const newColumn = {
        id: newColumnId,
        label: newColumnName,
        visible: true,
        sortable: true,
        type: newColumnType,
        editable: true,
        deletable: true,
        required: false
      };
      
      setColumns([...columns, newColumn]);
      
      // Add default value for this column to all existing trackers
      let defaultValue = '';
      if (newColumnType === 'select') {
        defaultValue = 'Pending';
      } else if (newColumnType === 'number') {
        defaultValue = 0;
      }
      
      setTrackers(trackers.map(tracker => ({
        ...tracker,
        [newColumnId]: defaultValue
      })));
      
      setNewColumnName('');
      setNewColumnType('text');
    }
  };

  // Edit column name
  const startEditColumn = (columnId, currentLabel) => {
    setEditingColumn(columnId);
    setTempColumnName(currentLabel);
  };

  // Save column edit
  const saveEditColumn = (columnId) => {
    if (tempColumnName.trim()) {
      setColumns(columns.map(col => 
        col.id === columnId ? { ...col, label: tempColumnName } : col
      ));
      setEditingColumn(null);
      setTempColumnName('');
    }
  };

  // Cancel column edit
  const cancelEditColumn = () => {
    setEditingColumn(null);
    setTempColumnName('');
  };

  // Delete column
  const handleDeleteColumn = (columnId) => {
    if (window.confirm('Are you sure you want to delete this column? This will remove this column from all upload records.')) {
      setColumns(columns.filter(col => col.id !== columnId));
      
      // Remove this column from all trackers
      setTrackers(trackers.map(tracker => {
        const newTracker = { ...tracker };
        delete newTracker[columnId];
        return newTracker;
      }));
    }
  };

  // Toggle column visibility
  const toggleColumnVisibility = (columnId) => {
    setColumns(columns.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  };

  // Handle status filter change
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
  };

  // Render input based on column type
  const renderInput = (column, value, onChange, placeholder = true) => {
    if (column.id === 'status') {
      return (
        <select
          value={value || 'Pending'}
          onChange={(e) => onChange(column.id, e.target.value)}
          className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
        >
          {statusOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );
    } else if (column.type === 'select') {
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(column.id, e.target.value)}
          className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
        >
          <option value="">Select...</option>
          <option value="CSV">CSV</option>
          <option value="Excel">Excel</option>
          <option value="JSON">JSON</option>
          <option value="TXT">TXT</option>
        </select>
      );
    } else if (column.type === 'number') {
      return (
        <input
          type="number"
          placeholder={placeholder ? `Enter ${column.label.toLowerCase()}` : ''}
          value={value || ''}
          onChange={(e) => onChange(column.id, e.target.value)}
          className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
        />
      );
    } else if (column.type === 'date') {
      return (
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(column.id, e.target.value)}
          className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
        />
      );
    } else {
      return (
        <input
          type="text"
          placeholder={placeholder ? `Enter ${column.label.toLowerCase()}` : ''}
          value={value || ''}
          onChange={(e) => onChange(column.id, e.target.value)}
          className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
        />
      );
    }
  };

  // Render cell content based on column type
  const renderCellContent = (column, value, tracker) => {
    if (column.id === 'status') {
      const StatusIcon = statusConfig[value]?.icon || AlertCircle;
      const statusColor = statusConfig[value]?.color || 'bg-gray-100 text-gray-800';
      
      return (
        <div className="flex items-center">
          <StatusIcon className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 ${
            value === 'Completed' ? 'text-green-500' :
            value === 'Processing' ? 'text-yellow-500' :
            value === 'Failed' ? 'text-red-500' :
            'text-gray-500'
          }`} />
          <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs ${statusColor}`}>
            {value || '-'}
          </span>
        </div>
      );
    } else if (column.id === 'type') {
      const getFileIcon = (type) => {
        switch(type) {
          case 'CSV': return FileText;
          case 'XLS':
          case 'XLSX': return FileSpreadsheet;
          case 'JSON': return Database;
          default: return File;
        }
      };
      const FileTypeIcon = getFileIcon(value);
      
      return (
        <div className="flex items-center">
          <FileTypeIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 mr-1" />
          <span className="px-2 py-1 bg-gray-100 rounded text-[10px] sm:text-xs">
            {value || '-'}
          </span>
        </div>
      );
    } else if (column.id === 'name') {
      const getFileColor = (type) => {
        switch(type) {
          case 'CSV': return 'text-blue-600';
          case 'XLS':
          case 'XLSX': return 'text-green-600';
          case 'JSON': return 'text-purple-600';
          default: return 'text-gray-600';
        }
      };
      
      return (
        <div className="flex items-center">
          <File className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 mr-2" />
          <span className={`font-medium ${getFileColor(tracker.type)}`}>{value || '-'}</span>
        </div>
      );
    } else if (column.id === 'size') {
      return (
        <div className="flex items-center">
          <HardDrive className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 mr-1" />
          <span className="font-mono text-xs sm:text-sm">{value}</span>
        </div>
      );
    } else if (column.id === 'records') {
      return (
        <div className="flex items-center">
          <Database className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 mr-1" />
          <span className="font-medium">{value || 0}</span>
        </div>
      );
    } else if (column.id === 'date') {
      return (
        <div className="flex items-center">
          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 mr-1" />
          <span>{value || '-'}</span>
        </div>
      );
    } else if (column.id === 'uploadedBy') {
      return (
        <div className="flex items-center">
          <span className="font-medium">{value || '-'}</span>
        </div>
      );
    }
    return value || '-';
  };

  // Clear all data (for testing)
  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      localStorage.removeItem('upload_trackers');
      localStorage.removeItem('upload_columns');
      localStorage.removeItem('uploaded_files_data');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Delete Tracker Prompt Modal */}
      {showDeletePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Confirm Delete</h3>
              <button onClick={cancelDelete} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-xs sm:text-sm text-gray-600">
                Are you sure you want to delete <span className="font-medium">{showDeletePrompt.name}</span>?
              </p>
              <p className="text-xs text-red-600 mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelDelete}
                className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTracker}
                className="px-3 py-1.5 text-xs sm:text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Form Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Upload Details</h3>
              <button 
                onClick={() => setShowUploadModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* ID Field */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  ID *
                </label>
                <input
                  type="text"
                  placeholder="Enter ID"
                  value={uploadForm.id}
                  onChange={(e) => {
                    setUploadForm({...uploadForm, id: e.target.value});
                    if (uploadFormErrors.id) setUploadFormErrors({...uploadFormErrors, id: ''});
                  }}
                  className={`w-full px-3 py-2 text-xs sm:text-sm border rounded ${
                    uploadFormErrors.id ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {uploadFormErrors.id && (
                  <p className="mt-1 text-xs text-red-600">{uploadFormErrors.id}</p>
                )}
              </div>
              
              {/* Name Field */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter Name"
                  value={uploadForm.name}
                  onChange={(e) => {
                    setUploadForm({...uploadForm, name: e.target.value});
                    if (uploadFormErrors.name) setUploadFormErrors({...uploadFormErrors, name: ''});
                  }}
                  className={`w-full px-3 py-2 text-xs sm:text-sm border rounded ${
                    uploadFormErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {uploadFormErrors.name && (
                  <p className="mt-1 text-xs text-red-600">{uploadFormErrors.name}</p>
                )}
              </div>
              
              {/* Department Field */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <input
                  type="text"
                  placeholder="Enter Department"
                  value={uploadForm.department}
                  onChange={(e) => {
                    setUploadForm({...uploadForm, department: e.target.value});
                    if (uploadFormErrors.department) setUploadFormErrors({...uploadFormErrors, department: ''});
                  }}
                  className={`w-full px-3 py-2 text-xs sm:text-sm border rounded ${
                    uploadFormErrors.department ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {uploadFormErrors.department && (
                  <p className="mt-1 text-xs text-red-600">{uploadFormErrors.department}</p>
                )}
              </div>
              
              {/* File Upload Field */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  File *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleModalFileSelect}
                      accept=".csv,.xlsx,.xls,.json,.txt"
                    />
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">
                        {uploadForm.file ? uploadForm.file.name : 'Click to select file'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Supports: CSV, Excel, JSON, TXT (Max 50MB)
                      </p>
                    </div>
                  </label>
                </div>
                {uploadFormErrors.file && (
                  <p className="mt-1 text-xs text-red-600">{uploadFormErrors.file}</p>
                )}
                {uploadForm.file && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <File className="h-4 w-4 text-blue-600" />
                        <span className="text-xs sm:text-sm">{uploadForm.file.name}</span>
                      </div>
                      <span className="text-xs text-gray-600">
                        {(uploadForm.file.size / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadSubmit}
                className="px-3 py-1.5 text-xs sm:text-sm bg-black text-white rounded hover:bg-gray-800 flex items-center space-x-1"
              >
                <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Upload File</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Viewer Modal */}
      {excelViewerData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-300 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <FileSpreadsheet className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base">{excelViewerData.name}</h3>
                  <p className="text-xs text-gray-600">
                    {excelViewerData.type} • {excelViewerData.size} • {excelEditData.length} records
                  </p>
                </div>
              </div>
              <button onClick={closeExcelViewer} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 sm:p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-2">
                {/* Sheet Tabs */}
                {excelViewerData.sheets && excelViewerData.sheets.length > 1 && (
                  <div className="flex space-x-1 overflow-x-auto">
                    {excelViewerData.sheets.map((sheet, index) => (
                      <button
                        key={index}
                        onClick={() => switchSheet(index)}
                        className={`px-3 py-1.5 text-xs rounded whitespace-nowrap ${
                          currentSheet === index
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {sheet.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {excelEditMode ? (
                  <>
                    <button
                      onClick={saveExcelChanges}
                      className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      <Save className="h-3 w-3" />
                      <span>Save Changes</span>
                    </button>
                    <button
                      onClick={() => setExcelEditMode(false)}
                      className="flex items-center space-x-1 px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50"
                    >
                      <X className="h-3 w-3" />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={addNewRow}
                      className="flex items-center space-x-1 px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Row</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={toggleExcelEditMode}
                      className="flex items-center space-x-1 px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50"
                    >
                      <Edit className="h-3 w-3" />
                      <span>Edit Mode</span>
                    </button>
                    <button 
                      onClick={exportFileData}
                      className="flex items-center space-x-1 px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50"
                    >
                      <Download className="h-3 w-3" />
                      <span>Export</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Excel Table */}
            <div className="flex-1 overflow-auto p-4">
              {excelHeaders.length > 0 ? (
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          {excelHeaders.map((header, colIndex) => (
                            <th 
                              key={colIndex} 
                              className="px-4 py-3 text-left font-medium text-gray-700 border-r border-gray-300 last:border-r-0 min-w-[100px]"
                            >
                              <div className="flex items-center justify-between">
                                <span>{header}</span>
                              </div>
                            </th>
                          ))}
                          {excelEditMode && (
                            <th className="px-4 py-3 text-left font-medium text-gray-700 bg-gray-100 min-w-[80px]">
                              Actions
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {excelEditData.map((row, rowIndex) => (
                          <tr 
                            key={rowIndex} 
                            className={`border-t border-gray-200 hover:bg-gray-50 ${
                              rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            }`}
                          >
                            {excelHeaders.map((_, colIndex) => (
                              <td 
                                key={colIndex} 
                                className="px-4 py-3 border-r border-gray-200 last:border-r-0"
                              >
                                {excelEditMode ? (
                                  <input
                                    type="text"
                                    value={row[colIndex] || ''}
                                    onChange={(e) => handleExcelCellEdit(rowIndex, colIndex, e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                  />
                                ) : (
                                  <span>{row[colIndex] || ''}</span>
                                )}
                              </td>
                            ))}
                            {excelEditMode && (
                              <td className="px-4 py-3 bg-gray-50">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => deleteRow(rowIndex)}
                                    className="p-1 text-red-600 hover:text-red-800"
                                    title="Delete Row"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
                  <p className="text-gray-600">The uploaded file appears to be empty or could not be parsed.</p>
                </div>
              )}
              
              {/* Status Bar */}
              <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-gray-600">
                <div className="flex items-center space-x-4">
                  <span>Sheet: {excelViewerData.sheets?.[currentSheet]?.name || 'Sheet1'}</span>
                  <span>Rows: {excelEditData.length}</span>
                  <span>Columns: {excelHeaders.length}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {excelEditMode ? (
                    <div className="flex items-center space-x-1 text-green-600">
                      <Edit className="h-3 w-3" />
                      <span>Editing Mode</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-gray-600">
                      <Eye className="h-3 w-3" />
                      <span>View Mode</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 sm:p-4 border-t border-gray-300 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="text-xs text-gray-600">
                File: {excelViewerData.name} | Type: {excelViewerData.type} | 
                Uploaded: {excelViewerData.date} by {excelViewerData.uploadedBy}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={closeExcelViewer}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-100"
                >
                  Close
                </button>
                {excelEditMode && (
                  <button
                    onClick={saveExcelChanges}
                    className="px-3 py-1.5 text-xs bg-black text-white rounded hover:bg-gray-800"
                  >
                    Save File
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Column Management Modal */}
      {showColumnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Manage Columns</h3>
              <button onClick={() => setShowColumnModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            
            {/* Add New Column Form */}
            <div className="mb-4 p-3 border border-gray-300 rounded">
              <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Add New Column</h4>
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Column name (e.g., Processor)"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  className="flex-grow px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded"
                />
                <button
                  onClick={handleAddColumn}
                  className="px-3 py-2 text-xs sm:text-sm bg-black text-white rounded hover:bg-gray-800 whitespace-nowrap"
                >
                  Add Column
                </button>
              </div>
            </div>
            
            {/* Existing Columns List */}
            <div className="mb-4">
              <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Available Columns</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {columns.map((column) => (
                  <div key={column.id} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={column.visible}
                        onChange={() => toggleColumnVisibility(column.id)}
                        className="h-3 w-3 sm:h-4 sm:w-4"
                      />
                      {editingColumn === column.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={tempColumnName}
                            onChange={(e) => setTempColumnName(e.target.value)}
                            className="px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
                          />
                          <button
                            onClick={() => saveEditColumn(column.id)}
                            className="text-green-600 hover:text-green-800"
                            title="Save"
                          >
                            <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            onClick={cancelEditColumn}
                            className="text-red-600 hover:text-red-800"
                            title="Cancel"
                          >
                            <X className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="text-xs sm:text-sm text-gray-700">{column.label}</span>
                          {column.required && (
                            <span className="text-[8px] px-1 py-0.5 bg-red-100 text-red-800 rounded">
                              Required
                            </span>
                          )}
                          {column.deletable && (
                            <span className="text-[8px] px-1 py-0.5 bg-gray-100 text-gray-600 rounded">
                              Custom
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {column.deletable && (
                        <>
                          <button
                            onClick={() => startEditColumn(column.id, column.label)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteColumn(column.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowColumnModal(false)}
                className="px-3 py-1.5 text-xs sm:text-sm bg-black text-white rounded hover:bg-gray-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
            <Upload className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Build & Upload Trackers
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">Upload and manage data files with tracking</p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={clearAllData}
            className="px-3 py-1.5 text-xs sm:text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
          >
            Clear All Data
          </button>
          <button className="flex items-center justify-center sm:justify-start space-x-1 px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50">
            <Download className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Compact Stats - Responsive */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-white border border-gray-300 rounded p-3 sm:p-4 flex items-center">
          <div className="bg-gray-100 p-1.5 sm:p-2 rounded mr-2 sm:mr-3">
            <Archive className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500">Total Uploads</p>
            <p className="text-sm sm:text-base font-bold text-gray-900">{totalUploads}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-300 rounded p-3 sm:p-4 flex items-center">
          <div className="bg-green-100 p-1.5 sm:p-2 rounded mr-2 sm:mr-3">
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500">Successful</p>
            <p className="text-sm sm:text-base font-bold text-green-600">
              {successfulUploads}
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-300 rounded p-3 sm:p-4 flex items-center">
          <div className="bg-blue-100 p-1.5 sm:p-2 rounded mr-2 sm:mr-3">
            <Database className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500">Total Records</p>
            <p className="text-sm sm:text-base font-bold text-blue-600">
              {totalRecords.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-300 rounded p-3 sm:p-4 flex items-center">
          <div className="bg-red-100 p-1.5 sm:p-2 rounded mr-2 sm:mr-3">
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500">Failed</p>
            <p className="text-sm sm:text-base font-bold text-red-600">
              {failedUploads}
            </p>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white border border-gray-300 rounded p-4 sm:p-6">
        <div className="text-center">
          <div 
            className="border-2 border-dashed border-gray-300 rounded-xl p-4 sm:p-8 hover:border-gray-400 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={openUploadModal}
          >
            <div className="space-y-2 sm:space-y-3">
              <Upload className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto" />
              <div>
                <p className="font-medium text-sm sm:text-base">Drag & drop files or click to browse</p>
                <p className="text-xs text-gray-500">Supports: CSV, Excel, JSON, TXT (Max 50MB)</p>
              </div>
            </div>
          </div>

          {selectedFile && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <File className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                </div>
                <span className="text-xs text-gray-600">
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>
            </div>
          )}

          {uploading && (
            <div className="mt-4 sm:mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium">Uploading...</span>
                <span className="text-xs sm:text-sm text-gray-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                <div 
                  className="bg-blue-600 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table Container with Toolbar */}
      <div className="bg-white border border-gray-300 rounded p-3 sm:p-4">
        {/* Toolbar with Search, Add Columns */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded"
              />
            </div>
            
            {/* Add Columns Button */}
            <button 
              onClick={() => setShowColumnModal(true)}
              className="flex items-center justify-center space-x-1 px-3 py-2 text-xs sm:text-sm bg-black text-white rounded hover:bg-gray-800 w-full sm:w-auto"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Add Column</span>
            </button>
          </div>
          
          {/* Status Filter with Blue Icon */}
          <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="w-full sm:w-auto pl-8 pr-8 py-2 text-xs sm:text-sm border border-gray-300 rounded appearance-none bg-white"
              >
                {uniqueStatus.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {/* Blue filter icon */}
              <svg 
                className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500 pointer-events-none"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {/* Dropdown arrow */}
              <svg 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-300">
                {/* Render only visible columns */}
                {columns
                  .filter(col => col.visible)
                  .map((column) => (
                    <th 
                      key={column.id}
                      className="text-left py-2 px-2 sm:px-3 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                      onClick={() => column.sortable && handleSort(column.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <span>{column.label}</span>
                          {column.required && <span className="text-red-500">*</span>}
                          {column.sortable && getSortIcon(column.id)}
                        </div>
                      </div>
                    </th>
                  ))}
                <th className="text-left py-2 px-2 sm:px-3 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Existing trackers */}
              {sortedTrackers.map((tracker) => {
                const StatusIcon = statusConfig[tracker.status]?.icon || AlertCircle;
                
                return editingId === tracker.id ? (
                  // Edit mode
                  <tr key={tracker.id} className="border-b border-gray-200 bg-blue-50">
                    {columns
                      .filter(col => col.visible)
                      .map((column) => (
                        <td key={column.id} className="py-2 px-2 sm:px-3">
                          {renderInput(column, editForm[column.id], handleEditFormChange, false)}
                        </td>
                      ))}
                    <td className="py-2 px-2 sm:px-3">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={saveEdit}
                          className="p-1 text-green-600 hover:text-green-800"
                          title="Save"
                        >
                          <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                        <button 
                          onClick={cancelEdit}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Cancel"
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // View mode
                  <tr key={tracker.id} className="border-b border-gray-200 hover:bg-gray-50">
                    {columns
                      .filter(col => col.visible)
                      .map((column) => (
                        <td key={column.id} className="py-2 px-2 sm:px-3">
                          {renderCellContent(column, tracker[column.id], tracker)}
                        </td>
                      ))}
                    <td className="py-2 px-2 sm:px-3">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => showExcelViewer(tracker)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="View File"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                        <button 
                          onClick={() => startEditing(tracker)}
                          className="p-1 text-yellow-600 hover:text-yellow-800"
                          title="Edit Record"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                        <button 
                          className="p-1 text-green-600 hover:text-green-800"
                          title="Download"
                        >
                          <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                        <button 
                          onClick={() => showDeleteConfirmation(tracker.id, tracker.name)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Compact Pagination - Responsive */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 mt-3 pt-3 border-t border-gray-300">
          <div className="text-[10px] sm:text-xs text-gray-600">
            Showing {sortedTrackers.length} of {trackers.length} uploads
            {statusFilter !== "All Status" && ` (Filtered by ${statusFilter})`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadTrackers;