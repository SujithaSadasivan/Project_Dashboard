import React, { useState, useEffect } from 'react';
import { 
  Upload, File, CheckCircle, Clock, AlertCircle, Download, Trash2, Eye, Edit,
  Plus, Search, X, ChevronUp, ChevronDown, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  AlertTriangle, FileText, FileSpreadsheet, Database,
  HardDrive, Archive, Check, Calendar, Save, EyeOff, User,
  Edit2, Save as SaveIcon, Columns, Rows, CheckSquare, Square
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Utility function to manage sidebar modules
const sidebarManager = {
  loadDynamicModules: () => {
    try {
      const saved = localStorage.getItem('dynamic_modules');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading dynamic modules:', error);
      return [];
    }
  },

  saveDynamicModules: (modules) => {
    try {
      localStorage.setItem('dynamic_modules', JSON.stringify(modules));
    } catch (error) {
      console.error('Error saving dynamic modules:', error);
    }
  },

  createProjectModule: (projectName) => {
    const projectId = projectName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    return {
      id: `project-${projectId}`,
      name: projectName,
      type: 'project',
      parentId: 'upload-trackers',
      path: `/projects/${projectId}`,
      isExpanded: false,
      submodules: [],
      createdAt: new Date().toISOString()
    };
  },

  createFileModule: (fileName, trackerId, projectId) => {
    const normalizedProjectId = projectId
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    return {
      id: `file-${trackerId}`,
      name: fileName,
      type: 'file',
      parentId: `project-${normalizedProjectId}`,
      trackerId: trackerId,
      path: `/projects/${normalizedProjectId}/${trackerId}`,
      createdAt: new Date().toISOString()
    };
  },

  repairModules: () => {
    try {
      const dynamicModules = sidebarManager.loadDynamicModules();
      const savedTrackers = localStorage.getItem('upload_trackers');
      const trackers = savedTrackers ? JSON.parse(savedTrackers) : [];
      let modified = false;

      dynamicModules.forEach(project => {
        if (project.submodules) {
          project.submodules.forEach(file => {
            if (!file.name) {
              const tracker = trackers.find(t => t.id === file.trackerId);
              if (tracker) {
                file.name = tracker.fileName;
                modified = true;
              }
            }
          });
        }
      });

      if (modified) {
        sidebarManager.saveDynamicModules(dynamicModules);
        window.dispatchEvent(new CustomEvent('sidebarUpdate'));
      }
    } catch (error) {
      console.error('Error repairing modules:', error);
    }
  },

  addProjectWithFile: (projectName, fileName, trackerId) => {
    const dynamicModules = sidebarManager.loadDynamicModules();
    const projectId = projectName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    // Check if project exists
    let projectModule = dynamicModules.find(m => m.id === `project-${projectId}`);
    
    if (!projectModule) {
      // Create new project
      projectModule = sidebarManager.createProjectModule(projectName);
      dynamicModules.push(projectModule);
    }
    
    // Check if file already exists in this project
    const existingFile = projectModule.submodules.find(file => file.trackerId === trackerId);
    if (!existingFile) {
      // Add file to project
      const fileModule = sidebarManager.createFileModule(fileName, trackerId, projectId);
      projectModule.submodules.push(fileModule);
      
      // Sort files by creation date (newest first)
      projectModule.submodules.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Save to localStorage
      sidebarManager.saveDynamicModules(dynamicModules);
    }
    
    return dynamicModules;
  },

  deleteFileModule: (trackerId) => {
    const dynamicModules = sidebarManager.loadDynamicModules();
    let modified = false;
    
    for (const projectModule of dynamicModules) {
      const fileIndex = projectModule.submodules.findIndex(file => file.trackerId === trackerId);
      if (fileIndex !== -1) {
        projectModule.submodules.splice(fileIndex, 1);
        modified = true;
        
        // If project has no more files, remove it
        if (projectModule.submodules.length === 0) {
          const projectIndex = dynamicModules.findIndex(proj => proj.id === projectModule.id);
          if (projectIndex !== -1) {
            dynamicModules.splice(projectIndex, 1);
          }
        }
        
        sidebarManager.saveDynamicModules(dynamicModules);
        break;
      }
    }
    
    if (modified) {
      // Notify other components
      window.dispatchEvent(new CustomEvent('sidebarUpdate', { 
        detail: { type: 'delete', trackerId } 
      }));
    }
    
    return modified;
  },

  updateProjectName: (oldProjectName, newProjectName, trackerId) => {
    const dynamicModules = sidebarManager.loadDynamicModules();
    const oldProjectId = oldProjectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const newProjectId = newProjectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // Find the project
    const projectIndex = dynamicModules.findIndex(m => m.id === `project-${oldProjectId}`);
    
    if (projectIndex !== -1) {
      const projectModule = dynamicModules[projectIndex];
      
      // Update project name
      projectModule.name = newProjectName;
      projectModule.id = `project-${newProjectId}`;
      projectModule.path = `/projects/${newProjectId}`;
      
      // Update parentId for all submodules
      projectModule.submodules.forEach(file => {
        file.parentId = `project-${newProjectId}`;
        file.path = `/projects/${newProjectId}/${file.trackerId}`;
      });
      
      sidebarManager.saveDynamicModules(dynamicModules);
      window.dispatchEvent(new CustomEvent('sidebarUpdate'));
    }
  }
};

// Add Column Modal Component
const AddColumnModal = ({ isOpen, onClose, onSubmit }) => {
  const [columnName, setColumnName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!columnName.trim()) {
      setError('Column name is required');
      return;
    }
    onSubmit(columnName.trim());
    setColumnName('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Add New Column</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Column Name
          </label>
          <input
            type="text"
            value={columnName}
            onChange={(e) => {
              setColumnName(e.target.value);
              if (error) setError('');
            }}
            placeholder="Enter column name"
            className={`w-full px-3 py-2 border rounded ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            autoFocus
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Column
          </button>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, message, type = 'column' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Confirm Delete</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600">{message}</p>
          <p className="text-sm text-red-600 mt-2">This action cannot be undone.</p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// File Content Viewer Component - Updated with better error handling
const FileContentViewer = ({ fileData, trackerInfo, onBack, onSaveData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedHeaders, setEditedHeaders] = useState([]);
  const [editedRows, setEditedRows] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [showDeleteModal, setShowDeleteModal] = useState({ 
    isOpen: false, 
    type: '', 
    index: null, 
    onConfirm: null,
    message: '' 
  });
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [showAddRowModal, setShowAddRowModal] = useState(false);
  const [newRowData, setNewRowData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Checkbox state
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Action prompts state
  const [showBulkDeletePrompt, setShowBulkDeletePrompt] = useState(false);
  const [showExportConfirmPrompt, setShowExportConfirmPrompt] = useState(null);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [columnFilters, setColumnFilters] = useState({});

  const handleColumnFilterChange = (header, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [header]: value
    }));
  };

  // Debug logging
  /* console.log('FileContentViewer Props:', { 
    fileDataExists: !!fileData,
    fileDataSheets: fileData?.sheets?.length,
    trackerInfo: trackerInfo 
  }); */

  // Initialize data when fileData changes
  useEffect(() => {
    if (fileData && fileData.sheets && fileData.sheets.length > 0) {
      const currentSheet = fileData.sheets[0];
      setEditedHeaders([...currentSheet.headers]);
      setEditedRows(currentSheet.data.map(row => [...(row || [])]));
      
      // Initialize new row data object
      const initialRowData = {};
      currentSheet.headers.forEach(header => {
        initialRowData[header] = '';
      });
      setNewRowData(initialRowData);
      setIsLoading(false);
    } else if (fileData) {
      setIsLoading(false);
    }
  }, [fileData]);

  const currentSheet = fileData?.sheets?.[0] || {};
  const headers = isEditing ? editedHeaders : (currentSheet.headers || []);
  const rows = isEditing ? editedRows : (currentSheet.data || []);

  /* console.log('Current data state:', {
    headersCount: headers.length,
    //rowsCount: rows.length,
    isEditing,
    currentSheet: currentSheet
  }); */

  const getFileIcon = (fileType) => {
    switch(fileType?.toLowerCase()) {
    
      case 'xlsx':
      case 'xls': return <FileSpreadsheet className="h-6 w-6 text-green-500" />;
      case 'json': return <Database className="h-6 w-6 text-purple-500" />;
      case 'txt': return <FileText className="h-6 w-6 text-gray-500" />;
      default: return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  // ... rest of the FileContentViewer component remains the same ...
  // Sorting
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 opacity-30" />;
    }
    return sortConfig.direction === 'ascending' 
      ? <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" /> 
      : <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />;
  };

  // Checkbox Functions
  const toggleSelectAll = () => {
    if (selectAll) {
      // Deselect all
      setSelectedRows([]);
      setSelectAll(false);
    } else {
      // Select all currently visible rows
      const allVisibleIndices = sortedRows.map(item => item.originalIndex);
      setSelectedRows(allVisibleIndices);
      setSelectAll(true);
    }
  };

  const toggleRowSelection = (rowIndex) => {
    setSelectedRows(prev => {
      if (prev.includes(rowIndex)) {
        // Remove from selection
        const newSelection = prev.filter(idx => idx !== rowIndex);
        setSelectAll(false);
        return newSelection;
      } else {
        // Add to selection
        const newSelection = [...prev, rowIndex];
        // Check if all visible rows are now selected
        const allVisibleIndices = sortedRows.map(item => item.originalIndex);
        const allSelected = allVisibleIndices.every(idx => newSelection.includes(idx));
        
        if (allSelected && allVisibleIndices.length > 0) {
          setSelectAll(true);
        }
        return newSelection;
      }
    });
  };

  // Bulk delete function
  const handleBulkDelete = () => {
    if (selectedRows.length === 0) {
      showNotification('Please select at least one row to delete', 'error');
      return;
    }
    
    setShowBulkDeletePrompt({
      show: true,
      count: selectedRows.length
    });
  };

  const confirmBulkDelete = () => {
    // Delete all selected rows
    const newRows = rows.filter((_, index) => !selectedRows.includes(index));
    setEditedRows(newRows);
    
    // Clear selection
    setSelectedRows([]);
    setSelectAll(false);
    setShowBulkDeletePrompt({ show: false, count: 0 });
    showNotification(`${selectedRows.length} row${selectedRows.length > 1 ? 's' : ''} deleted successfully`);
  };

  // Prepare rows with original indices
  const rowsWithIndices = React.useMemo(() => {
    return rows.map((row, index) => ({ data: row, originalIndex: index }));
  }, [rows]);

  // Filter rows based on search and column filters
  const filteredRows = rowsWithIndices.filter(item => {
    // Global search
    const matchesSearch = item.data.some(cell => 
      String(cell).toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Column filters
    const matchesFilters = Object.entries(columnFilters).every(([header, filterValue]) => {
      if (!filterValue) return true;
      const colIndex = headers.findIndex(h => h === header);
      if (colIndex === -1) return true;
      const cellValue = item.data[colIndex];
      return String(cellValue || '').toLowerCase().includes(filterValue.toLowerCase());
    });

    return matchesSearch && matchesFilters;
  });

  // Sort rows
  const sortedRows = React.useMemo(() => {
    if (!sortConfig.key) return filteredRows;
    
    const colIndex = headers.findIndex(h => h === sortConfig.key);
    if (colIndex === -1) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      const aVal = a.data[colIndex] || '';
      const bVal = b.data[colIndex] || '';
      
      if (aVal < bVal) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredRows, sortConfig, headers]);

  // Pagination Logic
  useEffect(() => {
    setCurrentPage(1);
  }, [fileData, searchTerm, itemsPerPage]);

  const totalPages = Math.ceil(sortedRows.length / itemsPerPage);
  const currentRows = sortedRows.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Show loading or error state
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Loading File Data...</h3>
        <p className="text-gray-600">Please wait while we load your file content.</p>
      </div>
    );
  }

  if (!fileData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">File Data Not Found</h3>
        <p className="text-gray-600">The file data could not be loaded. Please try re-uploading the file.</p>
        {onBack && (
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Uploads
          </button>
        )}
      </div>
    );
  }

  if (!fileData.sheets || fileData.sheets.length === 0) {
    return (
      <div className="text-center py-12">
        <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-600">The uploaded file appears to be empty or could not be parsed.</p>
        {onBack && (
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Back to Uploads
          </button>
        )}
      </div>
    );
  }

  // Handle editing functions
  const handleEditToggle = () => {
    if (!isEditing) {
      // Entering edit mode - make a copy of current data
      setEditedHeaders([...headers]);
      setEditedRows(rows.map(row => [...(row || [])]));
      showNotification('You are now in edit mode', 'info');
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = () => {
    // Update the file data in parent component
    if (onSaveData) {
      const updatedFileData = {
        ...fileData,
        sheets: [{
          ...fileData.sheets[0],
          headers: editedHeaders,
          data: editedRows
        }]
      };
      onSaveData(updatedFileData);
      showNotification('Changes saved successfully!');
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    // Revert to original data
    const currentSheet = fileData.sheets[0];
    setEditedHeaders([...currentSheet.headers]);
    setEditedRows(currentSheet.data.map(row => [...(row || [])]));
    setIsEditing(false);
    showNotification('Edit cancelled', 'info');
  };

  const handleCellChange = (rowIndex, colIndex, value) => {
    if (!isEditing) return;
    
    const newRows = [...editedRows];
    if (!newRows[rowIndex]) {
      newRows[rowIndex] = new Array(editedHeaders.length).fill('');
    }
    newRows[rowIndex][colIndex] = value;
    setEditedRows(newRows);
  };

  const handleHeaderChange = (colIndex, value) => {
    if (!isEditing) return;
    
    const newHeaders = [...editedHeaders];
    newHeaders[colIndex] = value;
    setEditedHeaders(newHeaders);
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim()) {
      showNotification('Please enter a column name', 'error');
      return;
    }
    
    if (isEditing) {
      // Add new column header
      const newHeaders = [...editedHeaders, newColumnName];
      setEditedHeaders(newHeaders);
      
      // Add empty cells for all rows
      const newRows = editedRows.map(row => [...row, '']);
      setEditedRows(newRows);
      
      // Update new row data
      setNewRowData(prev => ({
        ...prev,
        [newColumnName]: ''
      }));
      
      showNotification(`Column "${newColumnName}" added`, 'success');
      setNewColumnName('');
      setShowAddColumnModal(false);
    }
  };

  const handleRemoveColumn = (colIndex) => {
    setShowDeleteModal({
      isOpen: true,
      type: 'column',
      index: colIndex,
      message: `Are you sure you want to remove column "${editedHeaders[colIndex]}"?`,
      onConfirm: () => {
        // Remove column header
        const newHeaders = editedHeaders.filter((_, index) => index !== colIndex);
        setEditedHeaders(newHeaders);
        
        // Remove column data from all rows
        const newRows = editedRows.map(row => row.filter((_, index) => index !== colIndex));
        setEditedRows(newRows);
        
        // Update new row data
        const headerName = editedHeaders[colIndex];
        const newRowDataCopy = { ...newRowData };
        delete newRowDataCopy[headerName];
        setNewRowData(newRowDataCopy);
        
        showNotification('Column removed', 'info');
      }
    });
  };

  const handleAddRow = () => {
    if (!isEditing) return;
    
    // Validate required fields if any
    const rowData = headers.map(header => newRowData[header] || '');
    setEditedRows([...editedRows, rowData]);
    
    // Reset new row data
    const resetRowData = {};
    headers.forEach(header => {
      resetRowData[header] = '';
    });
    setNewRowData(resetRowData);
    
    setShowAddRowModal(false);
    showNotification('New row added', 'success');
  };

  const handleRemoveRow = (rowIndex) => {
    setShowDeleteModal({
      isOpen: true,
      type: 'row',
      index: rowIndex,
      message: 'Are you sure you want to remove this row?',
      onConfirm: () => {
        const newRows = editedRows.filter((_, index) => index !== rowIndex);
        setEditedRows(newRows);
        showNotification('Row removed', 'info');
      }
    });
  };

  // Export functions
  const handleExportClick = (format) => {
    if (rows.length === 0) {
      showNotification('No data to export', 'error');
      return;
    }
    
    setShowExportConfirmPrompt({
      show: true,
      format: format,
      count: rows.length
    });
  };

  const handleExport = (format) => {
    const dataToExport = rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
    
    let content, mimeType, filename;
    
    switch(format) {
      case 'excel':
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, `${trackerInfo?.fileName?.split('.')[0] || 'data'}.xlsx`);
        showNotification('Export to Excel completed successfully');
        return;
      case 'csv':
        content = convertToCSV(dataToExport);
        mimeType = 'text/csv';
        filename = `${trackerInfo?.fileName?.split('.')[0] || 'data'}.csv`;
        break;
      case 'json':
        content = JSON.stringify(dataToExport, null, 2);
        mimeType = 'application/json';
        filename = `${trackerInfo?.fileName?.split('.')[0] || 'data'}.json`;
        break;
      case 'pdf':
        exportToPDF(dataToExport);
        showNotification('Export to PDF completed successfully');
        return;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification(`Export to ${format.toUpperCase()} completed successfully`);
  };

  const exportToPDF = (data) => {
    const doc = new jsPDF();
    const tableColumn = headers;
    const tableRows = data.map(row => 
      headers.map(header => row[header] || '')
    );

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save(`${trackerInfo?.fileName?.split('.')[0] || 'data'}.pdf`);
  };

  const convertToCSV = (data) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const cell = row[header];
          return typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n')) 
            ? `"${cell.replace(/"/g, '""')}"` 
            : cell;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  };

  return (
    <div className="space-y-4">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
          notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 
          notification.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' : 
          'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          <div className="flex items-center">
            <span className="text-sm font-medium">{notification.message}</span>
            <button 
              onClick={() => setNotification({ show: false, message: '', type: '' })} 
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Modals */}
      {showDeleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Confirm Delete</h3>
              <button onClick={() => setShowDeleteModal({ ...showDeleteModal, isOpen: false })} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4 sm:h-5 sm:w-5"/>
              </button>
            </div>
            <div className="mb-4">
              <p className="text-xs sm:text-sm text-gray-600">{showDeleteModal.message}</p>
              <p className="text-xs text-red-600 mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowDeleteModal({ ...showDeleteModal, isOpen: false })} className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
              <button onClick={() => {
                showDeleteModal.onConfirm();
                setShowDeleteModal({ ...showDeleteModal, isOpen: false });
              }} className="px-3 py-1.5 text-xs sm:text-sm bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Prompt */}
      {showBulkDeletePrompt.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Confirm Bulk Delete</h3>
              <button onClick={() => setShowBulkDeletePrompt({ show: false, count: 0 })} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4 sm:h-5 sm:w-5"/>
              </button>
            </div>
            <div className="mb-4">
              <p className="text-xs sm:text-sm text-gray-600">
                Are you sure you want to delete {showBulkDeletePrompt.count} selected row{showBulkDeletePrompt.count > 1 ? 's' : ''}?
              </p>
              <p className="text-xs text-red-600 mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowBulkDeletePrompt({ show: false, count: 0 })} className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
              <button onClick={confirmBulkDelete} className="px-3 py-1.5 text-xs sm:text-sm bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Export Confirmation Prompt */}
      {showExportConfirmPrompt?.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Confirm Export</h3>
              <button onClick={() => setShowExportConfirmPrompt(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4 sm:h-5 sm:w-5"/>
              </button>
            </div>
            <div className="mb-4">
              <p className="text-xs sm:text-sm text-gray-600">
                Export {showExportConfirmPrompt.count} row{showExportConfirmPrompt.count > 1 ? 's' : ''} as {showExportConfirmPrompt.format.toUpperCase()}?
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowExportConfirmPrompt(null)} className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
              <button onClick={() => {
                handleExport(showExportConfirmPrompt.format);
                setShowExportConfirmPrompt(null);
              }} className="px-3 py-1.5 text-xs sm:text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Export</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Column Modal */}
      {showAddColumnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm sm:text-base">
                <span className="bg-gray-200 px-2 py-0.5 rounded">
                  Add New Column
                </span>
              </h3>
              <button onClick={() => setShowAddColumnModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Column Name *</label>
                <input
                  type="text"
                  placeholder="Enter column name"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button onClick={() => setShowAddColumnModal(false)} className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddColumn} className="px-3 py-1.5 text-xs sm:text-sm bg-black text-white rounded hover:bg-gray-800">Add Column</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Row Modal */}
      {showAddRowModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm sm:text-base">
                <span className="bg-gray-200 px-2 py-0.5 rounded">
                  Add New Row
                </span>
              </h3>
              <button onClick={() => setShowAddRowModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {headers.map((header, index) => (
                <div key={index} className="col-span-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">{header}</label>
                  <input
                    type="text"
                    value={newRowData[header] || ''}
                    onChange={(e) => setNewRowData(prev => ({
                      ...prev,
                      [header]: e.target.value
                    }))}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder={`Enter ${header.toLowerCase()}`}
                  />
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowAddRowModal(false)} className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddRow} className="px-4 py-2 text-sm bg-black text-white rounded hover:bg-gray-800">Add Row</button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN BORDER CONTAINER - Matching EmployeeMaster Structure */}
      <div className="bg-white border border-gray-300 rounded mx-0">
        
        {/* TOOLBAR SECTION */}
        <div className="p-4 border-b border-gray-300">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            
            {/* LEFT SIDE */}
            <div className="flex flex-1 flex-col sm:flex-row gap-2 sm:gap-2 items-start sm:items-center">
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="h-10 pl-9 pr-3 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black w-full sm:w-48"
                />
              </div>

              {/* File Info */}
              <div className="flex items-center space-x-3">
                {/* <div className="p-2 bg-gray-100 rounded-lg">
                  {getFileIcon(trackerInfo?.fileType)}
                </div> */}
                <div>
                  {isEditing && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                      Editing Mode
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT SIDE - Action Buttons */}
            <div className="flex gap-2 mt-2 sm:mt-0">
              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1 h-10 px-3 text-xs sm:text-sm border rounded hover:bg-gray-50 ${
                  showFilters ? 'bg-gray-100 border-gray-400' : 'border-gray-300'
                }`}
                title="Toggle Filters"
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filter</span>
              </button>

              {/* Edit Mode Toggle */}
              {!isEditing ? (
                <button
                  onClick={handleEditToggle}
                  className="flex items-center gap-1 h-10 px-3 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  <Edit className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit Table</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSaveChanges}
                    className="flex items-center gap-1 h-10 px-3 text-xs sm:text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    <Check className="h-4 w-4" />
                    <span className="hidden sm:inline">Save</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1 h-10 px-3 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    <X className="h-4 w-4" />
                    <span className="hidden sm:inline">Cancel</span>
                  </button>
                </>
              )}

              {/* Export Button with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="flex items-center gap-1 h-10 px-3 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  <Download className="h-4 w-4" />
                </button>
                
                {/* Export Dropdown */}
                {showExportDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowExportDropdown(false)}
                    />
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-300 rounded shadow-lg z-50">
                      <button
                        onClick={() => handleExportClick('excel')}
                        className="block w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Export as Excel
                      </button>
                      <button
                        onClick={() => handleExportClick('csv')}
                        className="block w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Export as CSV
                      </button>
                      <button
                        onClick={() => handleExportClick('json')}
                        className="block w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Export as JSON
                      </button>
                      <button
                        onClick={() => handleExportClick('pdf')}
                        className="block w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Export as PDF
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Back Button */}
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-1 h-10 px-3 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TABLE SECTION */}
        <div className="flex-1 overflow-auto max-h-[calc(100vh-250px)] bg-white border-t border-b border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                {/* Checkbox column */}
                <th scope="col" className="px-4 py-3 text-center w-12 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-center">
                    <button
                      onClick={toggleSelectAll}
                      className="p-1 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                    >
                      {selectAll ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </th>
                {headers.map((header, index) => (
                  <th 
                    key={index} 
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-200 min-w-[150px]" 
                    onClick={() => handleSort(header)}
                  >
                    <div className="flex items-center space-x-1 group">
                      <span>{header}</span>
                      <span className="text-gray-400 group-hover:text-gray-600">
                        {getSortIcon(header)}
                      </span>
                    </div>
                  </th>
                ))}
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 w-20">
                  Actions
                </th>
              </tr>
              {/* Filter Row */}
              {showFilters && (
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 border-b border-gray-200"></th>
                  {headers.map((header, index) => (
                    <th key={`filter-${index}`} className="px-4 py-2 border-b border-gray-200">
                      <input
                        type="text"
                        placeholder={`Filter ${header}...`}
                        value={columnFilters[header] || ''}
                        onChange={(e) => handleColumnFilterChange(header, e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                  ))}
                  <th className="px-4 py-2 border-b border-gray-200"></th>
                </tr>
              )}
            </thead>
            
            <tbody className="bg-white divide-y divide-gray-200">
              {currentRows.map((item, _) => {
                const row = item.data;
                const rowIndex = item.originalIndex;
                const isSelected = selectedRows.includes(rowIndex);
                
                return (
                  <tr 
                    key={rowIndex} 
                    className={`transition-colors duration-150 hover:bg-gray-50 ${isSelected ? 'bg-blue-50 hover:bg-blue-100' : ''}`}
                  >
                    {/* Checkbox cell */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRowSelection(rowIndex)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </div>
                    </td>
                    {row.map((cell, colIndex) => (
                      <td key={colIndex} className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {isEditing ? (
                          <input
                            type="text"
                            value={cell || ''}
                            onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                            className="w-full px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                          />
                        ) : (
                          <span className="block truncate max-w-xs" title={cell}>{cell || ''}</span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      {isEditing && (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleRemoveRow(rowIndex)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                            title="Remove row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={headers.length + 2} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <FileSpreadsheet className="h-12 w-12 text-gray-300 mb-3" />
                      <p className="text-base font-medium text-gray-900">No data found</p>
                      <p className="text-sm text-gray-500">This file appears to be empty</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER SECTION - Pagination */}
        <div className="px-4 py-3 border-t border-gray-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
            </span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="ml-2 border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="First Page"
            >
              <ChevronsLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous Page"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next Page"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Last Page"
            >
              <ChevronsRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Existing Footer Info */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>
              Total {rows.length} rows
            </span>
            {selectedRows.length > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                {selectedRows.length} selected
              </span>
            )}
            
            {isEditing && (
              <>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-medium">
                  Editing Mode
                </span>
                <div className="flex gap-2">
                   <button
                    onClick={() => setShowAddRowModal(true)}
                    className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                  >
                    <Plus className="h-3 w-3" />
                    Add Row
                  </button>
                  <button
                    onClick={() => setShowAddColumnModal(true)}
                    className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                  >
                    <Columns className="h-3 w-3" />
                    Add Column
                  </button>
                   {selectedRows.length > 0 && (
                     <button
                      onClick={handleBulkDelete}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete ({selectedRows.length})
                    </button>
                   )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const UploadTrackers = ({ selectedFileId, onClearSelection }) => {
  // Get current user from localStorage or authentication context
  const getCurrentUser = () => {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      const user = JSON.parse(userData);
      return user.name || user.username || 'Unknown User';
    }
    return sessionStorage.getItem('username') || 'Demo User';
  };

  // Initial columns configuration
  const initialColumns = [
    { id: 'project', label: 'Project Name', sortable: true, type: 'text', required: true, visible: true },
    { id: 'department', label: 'Department', sortable: true, type: 'select', required: true, visible: true },
    { id: 'employeeName', label: 'Employee Name', sortable: true, type: 'text', required: true, visible: true },
    { id: 'fileName', label: 'File Name', sortable: true, type: 'text', required: true, visible: true },
  ];

  // Department options
  const departmentOptions = [
    'DAS',
    'Engineering',
    'Manufacturing',
    'Quality Control',
    'Research & Development',
    'Sales & Marketing',
    'Human Resources',
    'Finance',
    'IT'
  ];

  // Load columns
  const [availableColumns, setAvailableColumns] = useState(initialColumns);

  const [trackers, setTrackers] = useState(() => {
    const savedTrackers = localStorage.getItem('upload_trackers');
    return savedTrackers ? JSON.parse(savedTrackers) : [];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showDeletePrompt, setShowDeletePrompt] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  
  // Excel Viewer Modal State
  const [excelViewerData, setExcelViewerData] = useState(null);
  const [excelEditMode, setExcelEditMode] = useState(false);
  const [excelEditData, setExcelEditData] = useState([]);
  const [currentSheet, setCurrentSheet] = useState(0);
  const [excelHeaders, setExcelHeaders] = useState([]);
  
  // Upload Form Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    project: '',
    department: 'DAS',
    employeeName: '',
    file: null
  });
  const [uploadFormErrors, setUploadFormErrors] = useState({});
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  // Filter state
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Store uploaded file data
  const [uploadedFilesData, setUploadedFilesData] = useState(() => {
    const savedData = localStorage.getItem('uploaded_files_data');
    return savedData ? JSON.parse(savedData) : {};
  });

  // Selected file content state (for sidebar click)
  const [selectedFileContent, setSelectedFileContent] = useState(null);
  const [selectedFileTrackerInfo, setSelectedFileTrackerInfo] = useState(null);

  // New state for checkboxes and selection
  const [selectedTrackers, setSelectedTrackers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkDeletePrompt, setShowBulkDeletePrompt] = useState(false);
  const [showBulkEditPrompt, setShowBulkEditPrompt] = useState(false);
  const [showExportConfirmPrompt, setShowExportConfirmPrompt] = useState(null);

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Save trackers and file data to localStorage
  useEffect(() => {
    localStorage.setItem('upload_trackers', JSON.stringify(trackers));
    localStorage.setItem('uploaded_files_data', JSON.stringify(uploadedFilesData));
  }, [trackers, uploadedFilesData]);

  // Scroll position restoration
  useEffect(() => {
    // Restore scroll position
    const savedScrollY = sessionStorage.getItem('uploadTrackersScrollY');
    if (savedScrollY) {
      window.scrollTo(0, parseInt(savedScrollY, 10));
    }

    // Save scroll position on page reload/leave
    const handleBeforeUnload = () => {
      sessionStorage.setItem('uploadTrackersScrollY', window.scrollY.toString());
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Also save on component unmount (navigation within SPA)
      sessionStorage.setItem('uploadTrackersScrollY', window.scrollY.toString());
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Repair sidebar modules on mount
  useEffect(() => {
    sidebarManager.repairModules();
  }, []);

  // Load file content when selectedFileId changes (from sidebar click)
  useEffect(() => {
    if (selectedFileId) {
      // Find tracker info
      const tracker = trackers.find(t => t.id === selectedFileId);
      if (tracker) {
        setSelectedFileTrackerInfo(tracker);
      }
      
      // Load file data
      const fileData = uploadedFilesData[selectedFileId];
      if (fileData) {
        setSelectedFileContent(fileData);
      } else {
        // Try to load from localStorage
        const allFilesData = JSON.parse(localStorage.getItem('uploaded_files_data') || '{}');
        if (allFilesData[selectedFileId]) {
          setSelectedFileContent(allFilesData[selectedFileId]);
        } else {
          setSelectedFileContent(null);
          showNotification('File data not found. Please re-upload the file.', 'error');
        }
      }
    } else {
      setSelectedFileContent(null);
      setSelectedFileTrackerInfo(null);
    }
  }, [selectedFileId, trackers, uploadedFilesData]);

  // Handle saving edited file data
  const handleSaveFileData = (trackerId, updatedFileData) => {
    setUploadedFilesData(prev => ({
      ...prev,
      [trackerId]: updatedFileData
    }));
    
    // Also update localStorage
    const allFilesData = JSON.parse(localStorage.getItem('uploaded_files_data') || '{}');
    allFilesData[trackerId] = updatedFileData;
    localStorage.setItem('uploaded_files_data', JSON.stringify(allFilesData));
    
    showNotification('File changes saved successfully!');
  };

  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  // Get current date in readable format
  const getFormattedDate = () => {
    const now = new Date();
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return now.toLocaleDateString('en-US', options);
  };

  // Get visible columns for table
  const visibleColumns = availableColumns.filter(col => col.visible);

  // Get unique departments from trackers data
  const uniqueDepartments = [...new Set(trackers.map(tracker => tracker.department).filter(Boolean))];

  // Filter trackers based on search and filters
  const filteredTrackers = trackers.filter(tracker => {
    const matchesSearch = Object.values(tracker).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesDept = !departmentFilter || tracker.department?.toLowerCase().includes(departmentFilter.toLowerCase());
    
    return matchesSearch && matchesDept;
  });

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

  // Checkbox Functions
  const toggleSelectAll = () => {
    if (selectAll) {
      // Deselect all
      setSelectedTrackers([]);
      setSelectAll(false);
    } else {
      // Select all currently visible trackers
      const allVisibleIds = sortedTrackers.map(tracker => tracker.id);
      setSelectedTrackers(allVisibleIds);
      setSelectAll(true);
    }
  };

  const toggleTrackerSelection = (trackerId) => {
    setSelectedTrackers(prev => {
      if (prev.includes(trackerId)) {
        // Remove from selection
        const newSelection = prev.filter(id => id !== trackerId);
        setSelectAll(false);
        return newSelection;
      } else {
        // Add to selection
        const newSelection = [...prev, trackerId];
        // Check if all visible trackers are now selected
        const allVisibleIds = sortedTrackers.map(tracker => tracker.id);
        if (newSelection.length === allVisibleIds.length) {
          setSelectAll(true);
        }
        return newSelection;
      }
    });
  };

  // Bulk edit function
  const handleBulkEdit = () => {
    if (selectedTrackers.length === 0) {
      showNotification('Please select at least one upload to edit', 'error');
      return;
    }
    
    if (selectedTrackers.length === 1) {
      const tracker = trackers.find(t => t.id === selectedTrackers[0]);
      if (tracker) {
        startEditing(tracker);
      }
    } else {
      // For multiple selection, implement bulk edit logic here
      showNotification(`${selectedTrackers.length} uploads marked for bulk edit`, 'info');
    }
    setShowBulkEditPrompt(false);
  };

  // Bulk delete function
  const handleBulkDelete = () => {
    if (selectedTrackers.length === 0) {
      showNotification('Please select at least one upload to delete', 'error');
      return;
    }
    
    setShowBulkDeletePrompt({
      show: true,
      count: selectedTrackers.length
    });
  };

  const confirmBulkDelete = () => {
    // Delete all selected trackers
    const newTrackers = trackers.filter(tracker => !selectedTrackers.includes(tracker.id));
    setTrackers(newTrackers);
    
    // Remove from uploaded files data
    const newFileData = { ...uploadedFilesData };
    selectedTrackers.forEach(id => {
      delete newFileData[id];
      // Remove from sidebar modules
      sidebarManager.deleteFileModule(id);
    });
    setUploadedFilesData(newFileData);
    
    // Clear selection
    setSelectedTrackers([]);
    setSelectAll(false);
    setShowBulkDeletePrompt({ show: false, count: 0 });
    showNotification(`${selectedTrackers.length} upload${selectedTrackers.length > 1 ? 's' : ''} deleted successfully`);
  };

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

  // Validation
  const validateEditForm = (tracker) => {
    const errors = {};
    for (const col of availableColumns) {
      if (col.required && !tracker[col.id]?.toString().trim()) {
        errors[col.id] = `${col.label} is required`;
      }
    }
    return errors;
  };

  // Start editing tracker
  const startEditing = (tracker) => {
    setEditingId(tracker.id);
    const editData = { ...tracker };
    availableColumns.forEach(col => {
      if (!editData.hasOwnProperty(col.id)) {
        editData[col.id] = col.type === 'select' ? 'Pending' : '';
      }
    });
    setEditForm(editData);
    setValidationErrors({});
  };

  const saveEdit = () => {
    const errors = validateEditForm(editForm);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Get old project name for sidebar update
    const oldTracker = trackers.find(t => t.id === editingId);
    const oldProjectName = oldTracker?.project;
    const newProjectName = editForm.project;

    // Update tracker in state
    setTrackers(trackers.map(tracker => 
      tracker.id === editingId ? { ...tracker, ...editForm } : tracker
    ));

    // Update sidebar module if project name changed
    if (oldProjectName && newProjectName && oldProjectName !== newProjectName) {
      sidebarManager.updateProjectName(oldProjectName, newProjectName, editingId);
    }

    setEditingId(null);
    setEditForm({});
    setValidationErrors({});
    showNotification('Upload record updated successfully');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
    setValidationErrors({});
  };

  // Delete tracker
  const showDeleteConfirmation = (id, name) => setShowDeletePrompt({ id, name });

  const confirmDeleteTracker = () => {
    if (showDeletePrompt) {
      const { id } = showDeletePrompt;
      
      // Remove from trackers
      setTrackers(trackers.filter(tracker => tracker.id !== id));
      
      // Remove from uploaded files data
      const newFileData = { ...uploadedFilesData };
      delete newFileData[id];
      setUploadedFilesData(newFileData);
      
      // Remove from sidebar modules
      sidebarManager.deleteFileModule(id);
      
      setShowDeletePrompt(null);
      showNotification('Upload record deleted successfully');
    }
  };

  const cancelDelete = () => setShowDeletePrompt(null);

  // Upload functions
  const openUploadModal = () => {
    setShowUploadModal(true);
    setUploadForm({
      project: '',
      department: 'DAS',
      employeeName: '',
      file: null
    });
    setUploadFormErrors({});
  };

  const readFileData = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const fileExtension = file.name.split('.').pop().toLowerCase();
          
          if (fileExtension === 'csv') {
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
      
      if (file.name.endsWith('.json') || file.name.endsWith('.txt')) {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    });
  };

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

  const handleUploadSubmit = async () => {
    const errors = {};
    if (!uploadForm.project.trim()) errors.project = 'Project is required';
    if (!uploadForm.department.trim()) errors.department = 'Department is required';
    if (!uploadForm.employeeName.trim()) errors.employeeName = 'Employee name is required';
    if (!uploadForm.file) errors.file = 'File is required';
    
    if (Object.keys(errors).length > 0) {
      setUploadFormErrors(errors);
      return;
    }
    
    setShowUploadModal(false);
    await handleFileUpload(uploadForm.file);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    
    setUploading(true);
    setProgress(0);
    setSelectedFile(file);
    
    try {
      const fileData = await readFileData(file);
      
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            
            // Get current user and date
            const currentUser = getCurrentUser();
            const currentDate = getCurrentDate();
            const formattedDate = getFormattedDate();
            
            // Create new tracker
            const newTracker = {
              id: Math.max(...trackers.map(t => t.id), 0) + 1,
              project: uploadForm.project,
              department: uploadForm.department,
              employeeName: uploadForm.employeeName,
              fileName: file.name,
              uploadedBy: currentUser,
              uploadDate: formattedDate,
              fileType: file.name.split('.').pop().toUpperCase(),
              records: fileData.data.length,
              status: 'Completed',
              uploadDateISO: currentDate
            };
            
            // Store file data
            setUploadedFilesData(prev => ({
              ...prev,
              [newTracker.id]: fileData
            }));
            
            // Add to trackers
            setTrackers([newTracker, ...trackers]);
            
            // Create sidebar module
            sidebarManager.addProjectWithFile(uploadForm.project, file.name, newTracker.id);
            
            // Notify other components about the update
            window.dispatchEvent(new CustomEvent('sidebarUpdate', { 
              detail: { type: 'create', tracker: newTracker } 
            }));
            
            setUploading(false);
            setProgress(0);
            setSelectedFile(null);
            setUploadForm({
              project: '',
              department: 'DAS',
              employeeName: '',
              file: null
            });
            
            showNotification('File uploaded successfully');
            
            return 100;
          }
          return prev + 20;
        });
      }, 300);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploading(false);
      setProgress(0);
      showNotification(`Error reading file: ${error.message}. Please make sure it's a valid file format.`, 'error');
    }
  };

  // Excel viewer functions (modal view - for Eye button)
  const showExcelViewer = (tracker) => {
    const fileData = uploadedFilesData[tracker.id];
    
    if (!fileData) {
      showNotification('No file data available. Please re-upload the file.', 'error');
      return;
    }
    
    setExcelViewerData({
      ...tracker,
      sheets: fileData.sheets
    });
    
    const currentSheetData = fileData.sheets[0];
    setExcelEditData(currentSheetData.data.map(row => [...(row || [])]));
    setExcelHeaders(currentSheetData.headers || []);
    setExcelEditMode(false);
    setCurrentSheet(0);
  };

  const closeExcelViewer = () => {
    setExcelViewerData(null);
    setExcelEditMode(false);
    setExcelEditData([]);
    setExcelHeaders([]);
  };

  // Export functions
  const handleExportClick = (format) => {
    if (sortedTrackers.length === 0) {
      showNotification('No data to export', 'error');
      return;
    }
    
    setShowExportConfirmPrompt({
      show: true,
      format: format,
      count: sortedTrackers.length
    });
  };

  const handleExport = (format) => {
    const dataToExport = sortedTrackers.map(tracker => {
      const row = {};
      availableColumns.forEach(col => {
        row[col.label] = tracker[col.id] || '';
      });
      return row;
    });
    
    let content, mimeType, filename;
    
    switch(format) {
      case 'excel':
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "UploadTrackers");
        XLSX.writeFile(wb, "upload_trackers.xlsx");
        setShowExportDropdown(false);
        showNotification('Export to Excel completed successfully');
        return;
      case 'csv':
        content = convertToCSV(dataToExport);
        mimeType = 'text/csv';
        filename = 'upload_trackers.csv';
        break;
      case 'json':
        content = JSON.stringify(dataToExport, null, 2);
        mimeType = 'application/json';
        filename = 'upload_trackers.json';
        break;
      case 'pdf':
        exportToPDF(dataToExport);
        setShowExportDropdown(false);
        showNotification('Export to PDF completed successfully');
        return;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    setShowExportDropdown(false);
    showNotification(`Export to ${format.toUpperCase()} completed successfully`);
  };

  const exportToPDF = (data) => {
    const doc = new jsPDF();
    const tableColumn = availableColumns.map(col => col.label);
    const tableRows = data.map(tracker => 
      availableColumns.map(col => tracker[col.label] || '')
    );

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save("upload_trackers.pdf");
  };

  const convertToCSV = (data) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const cell = row[header];
          return typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  };

  // Render Input Fields
  const handleInputChange = (field, value, isEdit=false) => {
    if (isEdit) {
      setEditForm({ ...editForm, [field]: value });
    }
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderInput = (col, value, onChange, error) => {
    const inputClass = `w-full px-2 py-1 text-xs sm:text-sm border ${error ? 'border-red-500' : 'border-gray-300'} rounded`;
    
    if (col.id === 'department' && col.type === 'select') return (
      <div>
        <select value={value||'DAS'} onChange={e=>onChange(col.id,e.target.value)} className={inputClass}>
          <option value="">Select Department</option>
          {departmentOptions.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
    
    return (
      <div>
        <input type="text" value={value||''} onChange={e=>onChange(col.id,e.target.value)} className={inputClass} />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  };

  // Helper to remove file extension
  const removeExtension = (fileName) => {
    if (!fileName) return '';
    return fileName.replace(/\.[^/.]+$/, "");
  };

  const renderCellContent = (col, value, tracker) => {
    if (col.id === 'fileName') {
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
          <File className="h-4 w-4 text-gray-500 mr-2" />
          <span className={`font-medium ${getFileColor(tracker.fileType)}`}>{removeExtension(value) || '-'}</span>
        </div>
      );
    } else if (col.id === 'employeeName') {
      return (
        <div className="flex items-center">
          <User className="h-4 w-4 text-gray-500 mr-1" />
          <span className="font-medium">{value || '-'}</span>
        </div>
      );
    } else if (col.id === 'department') {
      return (
        <div className="flex items-center">
          <span className="font-medium">{value || '-'}</span>
        </div>
      );
    } else if (col.id === 'project') {
      return (
        <div className="flex items-center">
          <span className="font-medium">{value || '-'}</span>
        </div>
      );
    }
    return value || '-';
  };

  return (
    <div className="space-y-3 sm:space-y-4 px-0">
      {/* Notification Banner */}
      {notification.show && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
          notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 
          notification.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' : 
          'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          <div className="flex items-center">
            <span className="text-sm font-medium">{notification.message}</span>
            <button 
              onClick={() => setNotification({ show: false, message: '', type: '' })} 
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Tracker Modal */}
      {showDeletePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Confirm Delete</h3>
              <button onClick={cancelDelete} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4 sm:h-5 sm:w-5"/></button>
            </div>
            <div className="mb-4">
              <p className="text-xs sm:text-sm text-gray-600">Delete upload record <span className="font-medium">{showDeletePrompt.name}</span>?</p>
              <p className="text-xs text-red-600 mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={cancelDelete} className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDeleteTracker} className="px-3 py-1.5 text-xs sm:text-sm bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Prompt */}
      {showBulkDeletePrompt.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Confirm Bulk Delete</h3>
              <button onClick={() => setShowBulkDeletePrompt({ show: false, count: 0 })} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4 sm:h-5 sm:w-5"/>
              </button>
            </div>
            <div className="mb-4">
              <p className="text-xs sm:text-sm text-gray-600">
                Are you sure you want to delete {showBulkDeletePrompt.count} selected upload{showBulkDeletePrompt.count > 1 ? 's' : ''}?
              </p>
              <p className="text-xs text-red-600 mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowBulkDeletePrompt({ show: false, count: 0 })} className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
              <button onClick={confirmBulkDelete} className="px-3 py-1.5 text-xs sm:text-sm bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Export Confirmation Prompt */}
      {showExportConfirmPrompt?.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Confirm Export</h3>
              <button onClick={() => setShowExportConfirmPrompt(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4 sm:h-5 sm:w-5"/>
              </button>
            </div>
            <div className="mb-4">
              <p className="text-xs sm:text-sm text-gray-600">
                Export {showExportConfirmPrompt.count} upload{showExportConfirmPrompt.count > 1 ? 's' : ''} as {showExportConfirmPrompt.format.toUpperCase()}?
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowExportConfirmPrompt(null)} className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
              <button onClick={() => {
                handleExport(showExportConfirmPrompt.format);
                setShowExportConfirmPrompt(null);
              }} className="px-3 py-1.5 text-xs sm:text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Export</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Form Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm sm:text-base">
                <span className="bg-gray-100 text-gray-900 px-2 py-1 rounded">
                  Upload Details
                </span>
              </h3>

              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Project */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Project *</label>
                <input
                  type="text"
                  placeholder="Enter project name"
                  value={uploadForm.project}
                  onChange={(e) => {
                    setUploadForm({...uploadForm, project: e.target.value});
                    if (uploadFormErrors.project) setUploadFormErrors({...uploadFormErrors, project: ''});
                  }}
                  className={`w-full px-3 py-2 text-xs sm:text-sm border rounded ${
                    uploadFormErrors.project ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {uploadFormErrors.project && <p className="mt-1 text-xs text-red-600">{uploadFormErrors.project}</p>}
              </div>
              
              {/* Department */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Department *</label>
                <select
                  value={uploadForm.department}
                  onChange={(e) => {
                    setUploadForm({...uploadForm, department: e.target.value});
                    if (uploadFormErrors.department) setUploadFormErrors({...uploadFormErrors, department: ''});
                  }}
                  className={`w-full px-3 py-2 text-xs sm:text-sm border rounded ${
                    uploadFormErrors.department ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select department</option>
                  {departmentOptions.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {uploadFormErrors.department && <p className="mt-1 text-xs text-red-600">{uploadFormErrors.department}</p>}
              </div>
              
              {/* Employee Name */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Employee Name *</label>
                <input
                  type="text"
                  placeholder="Enter employee name"
                  value={uploadForm.employeeName}
                  onChange={(e) => {
                    setUploadForm({...uploadForm, employeeName: e.target.value});
                    if (uploadFormErrors.employeeName) setUploadFormErrors({...uploadFormErrors, employeeName: ''});
                  }}
                  className={`w-full px-3 py-2 text-xs sm:text-sm border rounded ${
                    uploadFormErrors.employeeName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {uploadFormErrors.employeeName && <p className="mt-1 text-xs text-red-600">{uploadFormErrors.employeeName}</p>}
              </div>
              
              {/* File Upload */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">File *</label>
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
                        {uploadForm.file ? removeExtension(uploadForm.file.name) : 'Click to select file'}
                      </p>
                      <p className="text-xs text-gray-500">Supports: CSV, Excel, JSON, TXT (Max 50MB)</p>
                    </div>
                  </label>
                </div>
                {uploadFormErrors.file && <p className="mt-1 text-xs text-red-600">{uploadFormErrors.file}</p>}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button onClick={() => setShowUploadModal(false)} className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
              <button onClick={handleUploadSubmit} className="px-3 py-1.5 text-xs sm:text-sm bg-black text-white rounded hover:bg-gray-800">Upload File</button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Viewer Modal (for Eye button) */}
      {excelViewerData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-300 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <FileSpreadsheet className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base">{removeExtension(excelViewerData.fileName)}</h3>
                  <p className="text-xs text-gray-600">
                    {excelViewerData.project} • Uploaded by {excelViewerData.uploadedBy} on {excelViewerData.uploadDate}
                  </p>
                </div>
              </div>
              <button onClick={closeExcelViewer} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {excelHeaders.length > 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-max table-auto text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          {excelHeaders.map((header, colIndex) => (
                            <th
                              key={colIndex}
                              className="px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider text-xs whitespace-nowrap"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {excelEditData.map((row, rowIndex) => (
                          <tr
                            key={rowIndex}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            {excelHeaders.map((_, colIndex) => (
                              <td
                                key={colIndex}
                                className="px-6 py-4 text-gray-700 whitespace-nowrap"
                              >
                                {row[colIndex] ?? ''}
                              </td>
                            ))}
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
            </div>

            <div className="p-3 sm:p-4 border-t border-gray-300 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="text-xs text-gray-600">
                Showing {excelEditData.length} rows, {excelHeaders.length} columns
              </div>
              <button onClick={closeExcelViewer} className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-100">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT: If a file is selected from sidebar, show file content as MAIN CONTAINER */}
      {selectedFileId ? (
        <FileContentViewer 
          fileData={selectedFileContent} 
          trackerInfo={selectedFileTrackerInfo} 
          onBack={onClearSelection}
          onSaveData={(updatedData) => handleSaveFileData(selectedFileId, updatedData)}
        />
      ) : (
        /* Original Upload Trackers content when no file is selected */
        <>
          {/* UPLOAD AREA */}
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
                      <span className="text-sm font-medium">{removeExtension(selectedFile.name)}</span>
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

          {/* MAIN BORDER CONTAINER */}
          <div className="bg-white border border-gray-300 rounded mx-0">
            
            {/* TOOLBAR SECTION */}
            <div className="p-4 border-b border-gray-300">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                
                {/* LEFT SIDE - Search */}
                <div className="flex flex-1 flex-col sm:flex-row gap-2 sm:gap-2 items-start sm:items-center">
                  {/* Search */}
                  <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full sm:w-48 h-10 pl-9 pr-3 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>

                {/* RIGHT SIDE - Filter and Export */}
                <div className="flex gap-2 mt-2 sm:mt-0">
                  {/* Department Filter as text input */}
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="h-10 pl-9 pr-3 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black w-full sm:w-48"
                    />
                    {departmentFilter && (
                      <button
                        onClick={() => setDepartmentFilter('')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    )}
                  </div>

                  {/* Export Button with Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowExportDropdown(!showExportDropdown)}
                      className="flex items-center gap-1 h-10 px-3 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    
                    {/* Export Dropdown */}
                    {showExportDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowExportDropdown(false)}
                        />
                        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-300 rounded shadow-lg z-50">
                          <button
                            onClick={() => handleExportClick('excel')}
                            className="block w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Export as Excel
                          </button>
                          <button
                            onClick={() => handleExportClick('csv')}
                            className="block w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Export as CSV
                          </button>
                          <button
                            onClick={() => handleExportClick('json')}
                            className="block w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Export as JSON
                          </button>
                          <button
                            onClick={() => handleExportClick('pdf')}
                            className="block w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Export as PDF
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* TABLE SECTION */}
            <div className="overflow-auto max-h-[calc(100vh-300px)] bg-white rounded-lg shadow-sm border border-gray-200">
              <table className="min-w-full text-xs sm:text-sm">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr className="border-b border-gray-200">
                    {/* Checkbox column */}
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 cursor-pointer whitespace-nowrap w-10">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={toggleSelectAll}
                          className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {selectAll ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </th>
                    {visibleColumns.map(col => (
                      <th 
                        key={col.id} 
                        className="text-left py-3 px-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap" 
                        onClick={() => col.sortable && handleSort(col.id)}
                      >
                        <div className="flex items-center space-x-1">
                          <span className="uppercase tracking-wider text-xs">{col.label}</span>
                          {col.required && <span className="text-red-500">*</span>}
                          {col.sortable && getSortIcon(col.id)}
                        </div>
                      </th>
                    ))}
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 whitespace-nowrap uppercase tracking-wider text-xs">Actions</th>
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-gray-100">
                  {sortedTrackers.map((tracker) => (
                    <tr 
                      key={tracker.id} 
                      className={`hover:bg-gray-50 transition-colors ${selectedTrackers.includes(tracker.id) ? 'bg-blue-50' : ''}`}
                    >
                      {/* Checkbox cell */}
                      <td className="py-3 px-4 whitespace-nowrap w-10">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={selectedTrackers.includes(tracker.id)}
                            onChange={() => toggleTrackerSelection(tracker.id)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                      </td>
                      {editingId === tracker.id ? 
                        visibleColumns.map(col => (
                          <td key={col.id} className="py-3 px-4 whitespace-nowrap">
                            {renderInput(col, editForm[col.id], (f,v) => handleInputChange(f,v,true), validationErrors[col.id])}
                          </td>
                        )) : 
                        visibleColumns.map(col => (
                          <td key={col.id} className="py-3 px-4 whitespace-nowrap">
                            {renderCellContent(col, tracker[col.id], tracker)}
                          </td>
                        ))
                      }
                      <td className="py-3 px-4 whitespace-nowrap">
                        {editingId === tracker.id ? (
                          <div className="flex items-center space-x-2">
                            <button onClick={saveEdit} className="p-1 text-green-600 hover:text-green-800">
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={cancelEdit} className="p-1 text-red-600 hover:text-red-800">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <button onClick={() => showExcelViewer(tracker)} className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button onClick={() => startEditing(tracker)} className="p-1.5 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-full transition-colors">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => showDeleteConfirmation(tracker.id, tracker.fileName)} className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* FOOTER SECTION with Upload and Action buttons on LEFT */}
            <div className="px-4 py-3 border-t border-gray-300 text-xs text-gray-900 flex flex-col sm:flex-row items-center justify-between gap-2 bg-white">
              {/* LEFT SIDE - Upload and Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={openUploadModal}
                  className="flex items-center gap-1 h-10 px-3 text-xs border border-gray-300 rounded hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
                
                {/* Edit and Delete buttons - only show when trackers are selected */}
                {selectedTrackers.length > 0 && (
                  <div className="flex items-center gap-1 ml-1">
                    <button
                      onClick={handleBulkEdit}
                      className="flex items-center gap-1 h-10 px-3 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50"
                      title={selectedTrackers.length === 1 ? "Edit selected upload" : "Edit selected uploads"}
                    >
                      <Edit className="h-4 w-4" />
                      {selectedTrackers.length > 1 && <span>Edit ({selectedTrackers.length})</span>}
                    </button>
                    
                    <button
                      onClick={handleBulkDelete}
                      className="flex items-center gap-1 h-10 px-3 text-xs sm:text-sm border border-gray-300 rounded hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                      title={selectedTrackers.length === 1 ? "Delete selected upload" : "Delete selected uploads"}
                    >
                      <Trash2 className="h-4 w-4" />
                      {selectedTrackers.length > 1 && <span>Delete ({selectedTrackers.length})</span>}
                    </button>
                  </div>
                )}
              </div>
              
              {/* RIGHT SIDE - Info and Column Count */}
              <div className="flex items-center gap-4">
                <span>
                  Showing {sortedTrackers.length} of {trackers.length} uploads
                  {departmentFilter && ` (Filtered by Dept: ${departmentFilter})`}
                </span>
                {selectedTrackers.length > 0 && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    {selectedTrackers.length} selected
                  </span>
                )}
                <span className="text-blue-600">
                  ({visibleColumns.length} columns)
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UploadTrackers;
