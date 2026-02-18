import React, { useState, useEffect } from 'react';
import { 
  Upload, File, CheckCircle, Clock, AlertCircle, Download, Trash2, Eye, Edit,
  Plus, Search, X, ChevronUp, ChevronDown, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  AlertTriangle, FileText, FileSpreadsheet, Database,
  HardDrive, Archive, Check, Calendar, Save, EyeOff, User,
  Edit2, Save as SaveIcon, Columns, Rows, CheckSquare, Square, FolderTree, Layout
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

// ============================================================================
// Helper function to capitalize first letter of column names
// ============================================================================
const capitalizeFirstLetter = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// ============================================================================
// FILE CONTENT VIEWER COMPONENT - FIXED VERSION
// ============================================================================

const FileContentViewer = ({ fileData, trackerInfo, onBack, onSaveData, viewOnly = false, context = 'upload' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [editingColumnIndex, setEditingColumnIndex] = useState(null);
  const [tempColumnName, setTempColumnName] = useState('');
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
  
  // Checkbox state - ONLY used when viewOnly is false
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Action prompts state
  const [showBulkDeletePrompt, setShowBulkDeletePrompt] = useState(false);
  const [showExportConfirmPrompt, setShowExportConfirmPrompt] = useState(null);
  
  // Filter state - ONLY for project context
  const [columnFilter, setColumnFilter] = useState('');

  // ==========================================================================
  // Function to capitalize headers
  // ==========================================================================
  const capitalizeHeaders = (headers) => {
    if (!headers || !Array.isArray(headers)) return headers;
    return headers.map(header => capitalizeFirstLetter(header));
  };

  // Initialize data when fileData changes
  useEffect(() => {
    console.log('📥 FileContentViewer received fileData:', {
      type: typeof fileData,
      isArray: Array.isArray(fileData),
      keys: fileData ? Object.keys(fileData) : [],
      hasSheets: !!fileData?.sheets,
      hasData: !!fileData?.data,
      hasRows: !!fileData?.rows
    });

    if (!fileData) {
      setIsLoading(false);
      return;
    }

    // CASE 1: Already has sheets format
    if (fileData.sheets && Array.isArray(fileData.sheets) && fileData.sheets.length > 0) {
      console.log('📊 CASE 1: Using sheets format');
      const currentSheet = fileData.sheets[0];
      // Capitalize headers
      const capitalizedHeaders = capitalizeHeaders([...currentSheet.headers]);
      setEditedHeaders(capitalizedHeaders);
      setEditedRows(currentSheet.data.map(row => [...(row || [])]));
      
      const initialRowData = {};
      capitalizedHeaders.forEach(header => {
        initialRowData[header] = '';
      });
      setNewRowData(initialRowData);
      setIsLoading(false);
      return;
    }
    
    // CASE 2: Has headers and data at root level (YOUR FORMAT FROM PROJECTDASHBOARD)
    if (fileData.headers && fileData.data && Array.isArray(fileData.data)) {
      console.log('📊 CASE 2: Using headers/data root format');
      console.log('Headers found:', fileData.headers);
      console.log(`Data rows: ${fileData.data.length}`);
      
      // Capitalize headers
      const capitalizedHeaders = capitalizeHeaders([...fileData.headers]);
      setEditedHeaders(capitalizedHeaders);
      setEditedRows(fileData.data.map(row => [...(row || [])]));
      
      const initialRowData = {};
      capitalizedHeaders.forEach(header => {
        initialRowData[header] = '';
      });
      setNewRowData(initialRowData);
      setIsLoading(false);
      return;
    }
    
    // CASE 3: Is an array of objects
    if (Array.isArray(fileData) && fileData.length > 0) {
      console.log('📊 CASE 3: Converting array of objects to sheets format');
      console.log('Sample first row:', fileData[0]);
      
      const headers = Object.keys(fileData[0]);
      console.log('Headers found:', headers);
      
      // Capitalize headers
      const capitalizedHeaders = capitalizeHeaders(headers);
      
      const data = fileData.map(row => capitalizedHeaders.map((h, index) => {
        const originalHeader = headers[index];
        return row[originalHeader] !== undefined ? row[originalHeader] : '';
      }));
      console.log(`Converted ${data.length} rows`);
      
      setEditedHeaders(capitalizedHeaders);
      setEditedRows(data);
      
      const initialRowData = {};
      capitalizedHeaders.forEach(header => {
        initialRowData[header] = '';
      });
      setNewRowData(initialRowData);
      setIsLoading(false);
      return;
    }
    
    // CASE 4: Has data property that's an array of objects
    if (fileData.data && Array.isArray(fileData.data) && fileData.data.length > 0) {
      console.log('📊 CASE 4: Using fileData.data format');
      
      if (typeof fileData.data[0] === 'object' && !Array.isArray(fileData.data[0])) {
        const headers = Object.keys(fileData.data[0]);
        // Capitalize headers
        const capitalizedHeaders = capitalizeHeaders(headers);
        
        const data = fileData.data.map(row => capitalizedHeaders.map((h, index) => {
          const originalHeader = headers[index];
          return row[originalHeader] || '';
        }));
        
        setEditedHeaders(capitalizedHeaders);
        setEditedRows(data);
        
        const initialRowData = {};
        capitalizedHeaders.forEach(header => {
          initialRowData[header] = '';
        });
        setNewRowData(initialRowData);
        setIsLoading(false);
        return;
      }
      
      if (Array.isArray(fileData.data[0])) {
        const headers = fileData.headers || Array.from({ length: fileData.data[0].length }, (_, i) => `Column ${i + 1}`);
        // Capitalize headers
        const capitalizedHeaders = capitalizeHeaders([...headers]);
        setEditedHeaders(capitalizedHeaders);
        setEditedRows(fileData.data.map(row => [...(row || [])]));
        
        const initialRowData = {};
        capitalizedHeaders.forEach(header => {
          initialRowData[header] = '';
        });
        setNewRowData(initialRowData);
        setIsLoading(false);
        return;
      }
    }
    
    // CASE 5: Has rows property
    if (fileData.rows && Array.isArray(fileData.rows) && fileData.rows.length > 0) {
      console.log('📊 CASE 5: Using fileData.rows format');
      
      if (typeof fileData.rows[0] === 'object' && !Array.isArray(fileData.rows[0])) {
        const headers = Object.keys(fileData.rows[0]);
        // Capitalize headers
        const capitalizedHeaders = capitalizeHeaders(headers);
        
        const data = fileData.rows.map(row => capitalizedHeaders.map((h, index) => {
          const originalHeader = headers[index];
          return row[originalHeader] || '';
        }));
        
        setEditedHeaders(capitalizedHeaders);
        setEditedRows(data);
        
        const initialRowData = {};
        capitalizedHeaders.forEach(header => {
          initialRowData[header] = '';
        });
        setNewRowData(initialRowData);
        setIsLoading(false);
        return;
      }
    }
    
    // CASE 6: CSV content string
    if (fileData.content && typeof fileData.content === 'string') {
      console.log('📊 CASE 6: Parsing CSV content');
      try {
        const lines = fileData.content.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.trim());
          // Capitalize headers
          const capitalizedHeaders = capitalizeHeaders(headers);
          
          const data = lines.slice(1)
            .filter(line => line.trim())
            .map(line => line.split(',').map(cell => cell.trim()));
          
          setEditedHeaders(capitalizedHeaders);
          setEditedRows(data);
          
          const initialRowData = {};
          capitalizedHeaders.forEach(header => {
            initialRowData[header] = '';
          });
          setNewRowData(initialRowData);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.error('Error parsing CSV:', e);
      }
    }
    
    // If we get here, we couldn't parse the data
    console.warn('⚠️ Could not parse fileData format:', fileData);
    setIsLoading(false);
    
  }, [fileData]);

  // ==========================================================================
  // FIXED: Force rows and headers to be REAL arrays with map function
  // ==========================================================================
  const currentSheet = fileData?.sheets?.[0] || {};

  const headers = React.useMemo(() => {
    // Get raw headers
    let rawHeaders = isEditing ? editedHeaders : (currentSheet.headers || editedHeaders || fileData?.headers || []);
    
    // If null/undefined, return empty array
    if (!rawHeaders) return [];
    
    // If already a real array with map, return it
    if (Array.isArray(rawHeaders) && typeof rawHeaders.map === 'function') {
      return rawHeaders;
    }
    
    // If it has length, convert to real array
    if (rawHeaders.length !== undefined) {
      try {
        console.log('🔄 Converting headers to real array, length:', rawHeaders.length);
        return Array.from(rawHeaders);
      } catch (e) {
        console.error('❌ Failed to convert headers:', e);
        return [];
      }
    }
    
    return [];
  }, [isEditing, editedHeaders, currentSheet.headers, fileData?.headers]);

  const rows = React.useMemo(() => {
    // Get raw rows
    let rawRows = isEditing ? editedRows : (currentSheet.data || editedRows || fileData?.data || []);
    
    // If null/undefined, return empty array
    if (!rawRows) return [];
    
    // If already a real array with map, return it
    if (Array.isArray(rawRows) && typeof rawRows.map === 'function') {
      return rawRows;
    }
    
    // If it has length, convert to real array
    if (rawRows.length !== undefined) {
      try {
        console.log('🔄 Converting rows to real array, length:', rawRows.length);
        return Array.from(rawRows);
      } catch (e) {
        console.error('❌ Failed to convert rows:', e);
        return [];
      }
    }
    
    return [];
  }, [isEditing, editedRows, currentSheet.data, fileData?.data]);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Column edit handlers
  const handleStartColumnEdit = (colIndex, header) => {
    if (viewOnly) return;
    setEditingColumnIndex(colIndex);
    setTempColumnName(header);
  };

  const handleSaveColumnEdit = (colIndex) => {
    if (viewOnly) return;
    if (!tempColumnName.trim()) {
      showNotification('Column name cannot be empty', 'error');
      return;
    }

    if (tempColumnName !== editedHeaders[colIndex]) {
      if (editedHeaders.includes(tempColumnName)) {
        showNotification('Column name already exists', 'error');
        return;
      }

      const newHeaders = [...editedHeaders];
      newHeaders[colIndex] = tempColumnName.trim();
      setEditedHeaders(newHeaders);
      showNotification('Column name updated', 'success');
    }

    setEditingColumnIndex(null);
    setTempColumnName('');
  };

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
      return <ChevronUp className="h-4 w-4 opacity-30" />;
    }
    return sortConfig.direction === 'ascending' 
      ? <ChevronUp className="h-4 w-4" /> 
      : <ChevronDown className="h-4 w-4" />;
  };

  // Checkbox Functions - ONLY available when viewOnly is false
  const toggleSelectAll = () => {
    if (viewOnly) return;
    if (selectAll) {
      setSelectedRows([]);
      setSelectAll(false);
    } else {
      const allVisibleIndices = sortedRows.map(item => item.originalIndex);
      setSelectedRows(allVisibleIndices);
      setSelectAll(true);
    }
  };

  const toggleRowSelection = (rowIndex) => {
    if (viewOnly) return;
    setSelectedRows(prev => {
      if (prev.includes(rowIndex)) {
        const newSelection = prev.filter(idx => idx !== rowIndex);
        setSelectAll(false);
        return newSelection;
      } else {
        const newSelection = [...prev, rowIndex];
        const allVisibleIndices = sortedRows.map(item => item.originalIndex);
        const allSelected = allVisibleIndices.every(idx => newSelection.includes(idx));
        
        if (allSelected && allVisibleIndices.length > 0) {
          setSelectAll(true);
        }
        return newSelection;
      }
    });
  };

  // Bulk delete function - ONLY available when viewOnly is false
  const handleBulkDelete = () => {
    if (viewOnly) return;
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
    if (viewOnly) return;
    const newRows = rows.filter((_, index) => !selectedRows.includes(index));
    setEditedRows(newRows);
    setSelectedRows([]);
    setSelectAll(false);
    setShowBulkDeletePrompt({ show: false, count: 0 });
    showNotification(`${selectedRows.length} row${selectedRows.length > 1 ? 's' : ''} deleted successfully`);
  };

  // ==========================================================================
  // FIXED: rowsWithIndices with safety check
  // ==========================================================================
  const rowsWithIndices = React.useMemo(() => {
    if (!rows || !Array.isArray(rows) || typeof rows.map !== 'function') {
      console.warn('⚠️ rowsWithIndices: rows is not a valid array', rows);
      return [];
    }
    
    try {
      return rows.map((row, index) => ({ 
        data: row, 
        originalIndex: index 
      }));
    } catch (e) {
      console.error('❌ rows.map failed in rowsWithIndices:', e);
      return [];
    }
  }, [rows]);

  // ==========================================================================
  // FIXED: Filter logic with empty string protection
  // ==========================================================================
  const filteredRows = React.useMemo(() => {
    if (!rowsWithIndices || rowsWithIndices.length === 0) return [];
    
    return rowsWithIndices.filter(item => {
      // Only apply search if searchTerm has a value
      const matchesSearch = !searchTerm || searchTerm.trim() === '' || 
        item.data.some(cell => 
          String(cell).toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      // Only apply column filter for project context and when columnFilter has value AND NOT VIEWONLY
      const matchesColumnFilter = !(!viewOnly && context === 'project') || 
        !columnFilter || columnFilter.trim() === '' ||
        item.data.some(cell => 
          String(cell).toLowerCase().includes(columnFilter.toLowerCase())
        );
        
      return matchesSearch && matchesColumnFilter;
    });
  }, [rowsWithIndices, searchTerm, columnFilter, context, viewOnly]);

  // Sort rows
  const sortedRows = React.useMemo(() => {
    if (!filteredRows || filteredRows.length === 0) return [];
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

  // Only shows "No Data" if we have no headers AND no rows
  if (headers.length === 0 && rows.length === 0 && !isLoading) {
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

  // ==========================================================================
  // Editing functions - NO MORE fileData.sheets REFERENCES
  // ==========================================================================
  const handleEditRow = () => {
    if (viewOnly) return;
    if (selectedRows.length === 0) {
      showNotification('Please select a row to edit', 'error');
      return;
    }
    
    if (selectedRows.length > 1) {
      showNotification('Please select only one row to edit at a time', 'error');
      return;
    }
    
    const rowIndex = selectedRows[0];
    setIsEditing(true);
    setEditingRowIndex(rowIndex);
    showNotification('Editing mode enabled for selected row', 'info');
  };

  const handleSaveChanges = () => {
    if (viewOnly) return;
    if (onSaveData) {
      // Create updated file data WITHOUT assuming sheets property
      const updatedFileData = Array.isArray(fileData) 
        ? rows.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          })
        : {
            ...fileData,
            headers: headers,
            data: rows
          };
      
      onSaveData(updatedFileData);
      showNotification('Changes saved successfully!');
    }
    setIsEditing(false);
    setEditingRowIndex(null);
  };

  const handleCancelEdit = () => {
    if (viewOnly) return;
    // Reset to original data
    if (fileData.headers && fileData.data) {
      setEditedHeaders([...fileData.headers]);
      setEditedRows(fileData.data.map(row => [...(row || [])]));
    } else if (Array.isArray(fileData)) {
      const headers = Object.keys(fileData[0]);
      const data = fileData.map(row => headers.map(h => row[h] || ''));
      setEditedHeaders(headers);
      setEditedRows(data);
    } else if (fileData.data && Array.isArray(fileData.data)) {
      if (typeof fileData.data[0] === 'object') {
        const headers = Object.keys(fileData.data[0]);
        const data = fileData.data.map(row => headers.map(h => row[h] || ''));
        setEditedHeaders(headers);
        setEditedRows(data);
      }
    }
    setIsEditing(false);
    setEditingRowIndex(null);
    showNotification('Edit cancelled', 'info');
  };

  const handleCellChange = (rowIndex, colIndex, value) => {
    if (viewOnly) return;
    if (!isEditing || rowIndex !== editingRowIndex) return;
    
    const newRows = [...editedRows];
    if (!newRows[rowIndex]) {
      newRows[rowIndex] = new Array(editedHeaders.length).fill('');
    }
    newRows[rowIndex][colIndex] = value;
    setEditedRows(newRows);
  };

  const handleAddColumn = () => {
    if (viewOnly) return;
    if (!newColumnName.trim()) {
      showNotification('Please enter a column name', 'error');
      return;
    }
    
    if (editedHeaders.includes(newColumnName)) {
      showNotification('Column name already exists', 'error');
      return;
    }
    
    const newHeaders = [...editedHeaders, newColumnName];
    setEditedHeaders(newHeaders);
    
    const newRows = editedRows.map(row => [...row, '']);
    setEditedRows(newRows);
    
    setNewRowData(prev => ({
      ...prev,
      [newColumnName]: ''
    }));
    
    showNotification(`Column "${newColumnName}" added`, 'success');
    setNewColumnName('');
    setShowAddColumnModal(false);
  };

  const handleRemoveColumn = (colIndex) => {
    if (viewOnly) return;
    setShowDeleteModal({
      isOpen: true,
      type: 'column',
      index: colIndex,
      message: `Are you sure you want to remove column "${editedHeaders[colIndex]}"?`,
      onConfirm: () => {
        const newHeaders = editedHeaders.filter((_, index) => index !== colIndex);
        setEditedHeaders(newHeaders);
        
        const newRows = editedRows.map(row => row.filter((_, index) => index !== colIndex));
        setEditedRows(newRows);
        
        const headerName = editedHeaders[colIndex];
        const newRowDataCopy = { ...newRowData };
        delete newRowDataCopy[headerName];
        setNewRowData(newRowDataCopy);
        
        showNotification('Column removed', 'info');
      }
    });
  };

  const handleAddRow = () => {
    if (viewOnly) return;
    const rowData = headers.map(header => newRowData[header] || '');
    const newRows = [...editedRows, rowData];
    setEditedRows(newRows);
    
    const resetRowData = {};
    headers.forEach(header => {
      resetRowData[header] = '';
    });
    setNewRowData(resetRowData);
    
    setShowAddRowModal(false);
    showNotification('New row added', 'success');
  };

  const handleRemoveRow = (rowIndex) => {
    if (viewOnly) return;
    setShowDeleteModal({
      isOpen: true,
      type: 'row',
      index: rowIndex,
      message: 'Are you sure you want to remove this row?',
      onConfirm: () => {
        const newRows = editedRows.filter((_, index) => index !== rowIndex);
        setEditedRows(newRows);
        setSelectedRows(prev => prev.filter(idx => idx !== rowIndex));
        showNotification('Row removed', 'info');
      }
    });
  };

  // Export functions - ONLY for project context and not viewOnly
  const handleExportClick = (format) => {
    if (viewOnly) return;
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
    if (viewOnly) return;
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
    if (viewOnly) return;
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
    <div className="h-full flex flex-col overflow-hidden">
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
        <DeleteConfirmationModal
          isOpen={showDeleteModal.isOpen}
          onClose={() => setShowDeleteModal({ ...showDeleteModal, isOpen: false })}
          onConfirm={showDeleteModal.onConfirm}
          message={showDeleteModal.message}
          type={showDeleteModal.type}
        />
      )}

      {/* Bulk Delete Prompt - ONLY show when not viewOnly */}
      {!viewOnly && showBulkDeletePrompt.show && (
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

      {/* Export Confirmation Prompt - ONLY show for project context and not viewOnly */}
      {!viewOnly && context === 'project' && showExportConfirmPrompt?.show && (
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

      {/* Column Management Modal - ONLY show when not viewOnly */}
      {!viewOnly && showAddColumnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <div></div>
              <button onClick={() => setShowAddColumnModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          
            <div className="mb-4 p-3 rounded">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base -mt-5 mb-2">
                <span className="bg-gray-200 px-2 py-0.5 rounded flex items-center gap-1">
                  Add New Column
                </span>
              </h3>

              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Enter column name"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  className="flex-grow px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                />
                <button
                  onClick={handleAddColumn}
                  className="px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1 whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  Add Column
                </button>
              </div>
            </div>            
            
            {/* Existing columns management section */}
            <div className="mb-4">
              <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Manage Columns</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {editedHeaders.map((header, index) => {
                  const isFixedColumn = ['project', 'department', 'employeeName', 'fileName'].includes(header.toLowerCase().replace(/\s+/g, ''));
                  const isEditingCol = editingColumnIndex === index;
                
                  return (
                    <div key={index} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                      <div className="flex items-center space-x-2">
                        {isEditingCol ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={tempColumnName}
                              onChange={(e) => setTempColumnName(e.target.value)}
                              className="px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveColumnEdit(index)}
                              className="p-1 text-green-600 hover:text-green-800"
                              title="Save"
                            >
                              <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                            <button
                              onClick={() => setEditingColumnIndex(null)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Cancel"
                            >
                              <X className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="font-medium text-xs sm:text-sm">{header}</span>
                            {isFixedColumn && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                Fixed
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    
                      <div className="flex items-center space-x-2">
                        {!isEditingCol && (
                          <button
                            onClick={() => handleStartColumnEdit(index, header)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Edit column name"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        )}
                      
                        <button
                          onClick={() => handleRemoveColumn(index)}
                          className={`p-1 ${isFixedColumn ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-800'}`}
                          title={isFixedColumn ? "Cannot delete fixed column" : "Delete column"}
                          disabled={isFixedColumn}
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          
            <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-200">
              <button 
                onClick={() => setShowAddColumnModal(false)} 
                className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Row Modal - ONLY show when not viewOnly */}
      {!viewOnly && showAddRowModal && (
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
              <button onClick={handleAddRow} className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN BORDER CONTAINER */}
      <div className={`flex-1 flex flex-col min-h-0 ${
        context === 'project' && !viewOnly
          ? 'border border-gray-200 rounded shadow-sm' 
          : 'bg-white border border-gray-300 rounded mx-0'
      }`}>
        
        {/* TOOLBAR SECTION */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            
            {/* LEFT SIDE - Search Box ONLY */}
            <div className="flex flex-1 flex-col sm:flex-row gap-2 sm:gap-2 items-start sm:items-center">
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

            {/* RIGHT SIDE - Action Buttons - COMPLETELY HIDDEN FOR VIEWONLY MODE except Back button */}
            <div className="flex gap-2 mt-2 sm:mt-0">
              
              {/* FILTER BUTTON - ONLY SHOW FOR PROJECT CONTEXT AND NOT VIEWONLY
              {!viewOnly && context === 'project' && (
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Filter..."
                    value={columnFilter}
                    onChange={(e) => setColumnFilter(e.target.value)}
                    className="h-10 pl-9 pr-3 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black w-full sm:w-48"
                  />
                  {columnFilter && (
                    <button
                      onClick={() => setColumnFilter('')}
                      className="p-1 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  )}
                </div>
              )} */}

              {/* Add Column Button - HIDE when viewOnly */}
              {!viewOnly && (
                <button
                  onClick={() => setShowAddColumnModal(true)}
                  className="flex items-center gap-1 h-10 px-3 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
              
              {/* EXPORT BUTTON - ONLY SHOW FOR PROJECT CONTEXT AND NOT VIEWONLY */}
              {!viewOnly && context === 'project' && (
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
              )}

              {/* Back Button - SHOW FOR BOTH CONTEXTS when onBack is provided */}
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-1 h-10 px-3 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TABLE SECTION - FLEXIBLE HEIGHT */}
        <div className="flex-1 relative min-h-0">
          <div className="absolute inset-0 overflow-auto">
            <table className={`min-w-full border-collapse ${
              context === 'project' && !viewOnly ? 'text-base' : 'text-xs sm:text-sm'
            }`}>
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-gray-200">
                  {/* Checkbox column - ONLY show when not viewOnly */}
                  {!viewOnly && (
                    <th 
                      className={`
                        text-left py-3 px-6 font-medium cursor-pointer whitespace-nowrap
                        ${context === 'project' && !viewOnly
                          ? 'bg-blue-100 text-gray-700 hover:bg-blue-200 w-12' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-r border-gray-300 w-10'
                        }
                      `}
                    >
                      <div className="flex items-center justify-center">
                        <button
                          onClick={toggleSelectAll}
                          className={`p-1 transition-colors ${
                            context === 'project' && !viewOnly
                              ? 'text-gray-600 hover:text-gray-800' 
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          {selectAll ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </th>
                  )}
                  {headers.map((header, index) => (
                    <th 
                      key={index} 
                      scope="col"
                      className={`
                        text-left py-3 px-6 font-medium cursor-pointer whitespace-nowrap
                        ${context === 'project' && !viewOnly
                          ? 'bg-blue-100 text-gray-700 hover:bg-blue-200' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-r border-gray-300'
                        }
                        ${viewOnly && index === headers.length - 1 ? 'border-r-0' : ''}
                      `}
                      onClick={() => handleSort(header)}
                    >
                      <div className="flex items-center space-x-1">
                        <span className={context === 'project' && !viewOnly ? 'text-base' : 'text-xs sm:text-sm'}>
                          {header}
                        </span>
                        {getSortIcon(header)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              
              <tbody>
                {sortedRows && sortedRows.length > 0 ? (
                  sortedRows.map((item) => {
                    const row = item.data;
                    const rowIndex = item.originalIndex;
                    const isSelected = !viewOnly && selectedRows.includes(rowIndex);
                    const isEditingThisRow = !viewOnly && isEditing && editingRowIndex === rowIndex;
                    
                    return (
                      <tr 
                        key={rowIndex} 
                        className={`
                          border-b border-gray-200 transition-colors 
                          ${!viewOnly && isSelected && context === 'project' && !viewOnly ? 'bg-blue-50' : ''} 
                          ${!viewOnly && isSelected && viewOnly ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'} 
                          ${!viewOnly && isEditingThisRow ? 'bg-yellow-50 hover:bg-yellow-100' : ''}
                          ${context === 'project' && !viewOnly && rowIndex % 2 === 0 ? 'bg-white' : ''}
                          ${context === 'project' && !viewOnly && rowIndex % 2 === 1 ? 'bg-gray-50/30' : ''}
                        `}
                      >
                        {/* Checkbox cell - ONLY show when not viewOnly */}
                        {!viewOnly && (
                          <td className={`
                            py-3 px-6 whitespace-nowrap
                            ${context === 'project' && !viewOnly ? '' : 'border-r border-gray-300'}
                            ${context === 'project' && !viewOnly && isSelected ? 'bg-blue-100' : ''}
                            ${context === 'project' && !viewOnly ? 'w-12' : 'w-10'}
                          `}>
                            <div className="flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleRowSelection(rowIndex)}
                                className={`
                                  h-4 w-4 border-gray-300 rounded focus:ring-blue-500 cursor-pointer
                                  ${context === 'project' && !viewOnly ? 'text-blue-600' : 'text-blue-600'}
                                `}
                              />
                            </div>
                          </td>
                        )}
                        {row && row.map((cell, colIndex) => (
                          <td 
                            key={colIndex} 
                            className={`
                              py-3 px-6 whitespace-nowrap
                              ${context === 'project' && !viewOnly ? '' : 'border-r border-gray-300'}
                              ${context === 'project' && !viewOnly ? 'hover:bg-blue-50/30' : ''}
                              ${context === 'project' && !viewOnly && isSelected ? 'bg-blue-50/30' : ''}
                              ${viewOnly && colIndex === row.length - 1 ? 'border-r-0' : ''}
                              ${context === 'project' && !viewOnly ? 'min-w-[160px]' : ''}
                            `}
                          >
                            {!viewOnly && isEditingThisRow ? (
                              <input
                                type="text"
                                value={cell || ''}
                                onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                              />
                            ) : (
                              <span className={`block truncate max-w-xs ${
                                context === 'project' && !viewOnly ? 'text-base' : 'text-xs sm:text-sm'
                              }`} title={cell}>
                                {cell !== undefined && cell !== null ? cell : ''}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={viewOnly ? headers.length : headers.length + 1} className="px-4 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <FileSpreadsheet className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-base font-medium text-gray-900">No data found</p>
                        <p className="text-sm text-gray-500">This file appears to be empty</p>
                        <p className="text-xs text-gray-400 mt-2">
                          Debug: rows={rows?.length}, sortedRows={sortedRows?.length}, headers={headers?.length}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER SECTION */}
        <div className="px-4 py-3 border-t border-gray-200 text-xs text-gray-900 flex flex-col sm:flex-row items-center justify-between gap-2 bg-white flex-shrink-0">
          {/* LEFT SIDE - Add Row and Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Add Row Button - HIDE when viewOnly */}
            {!viewOnly && (
              <button
                onClick={() => setShowAddRowModal(true)}
                className="flex items-center gap-1 h-10 px-3 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
            
            {/* Edit, Done, Cancel and Delete buttons - HIDE when viewOnly */}
            {!viewOnly && (selectedRows.length > 0 || isEditing) && (
              <div className="flex items-center gap-1 ml-1">
                {!isEditing ? (
                  <button
                    onClick={handleEditRow}
                    className="flex items-center gap-1 h-10 px-3 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50"
                    title={selectedRows.length === 1 ? "Edit selected row" : "Edit selected rows"}
                  >
                    <Edit className="h-4 w-4" />
                    {selectedRows.length > 1 && <span>Edit ({selectedRows.length})</span>}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSaveChanges}
                      className="flex items-center gap-1 h-10 px-3 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-1 h-10 px-3 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                )}
                
                {!isEditing && (
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1 h-10 px-3 text-xs sm:text-sm border border-gray-300 rounded hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                    title={selectedRows.length === 1 ? "Delete selected row" : "Delete selected rows"}
                  >
                    <Trash2 className="h-4 w-4" />
                    {selectedRows.length > 1 && <span>Delete ({selectedRows.length})</span>}
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* RIGHT SIDE - Info and Column Count */}
          <div className="flex items-center gap-4">
            <span className={context === 'project' && !viewOnly ? 'text-sm' : 'text-xs'}>
              {viewOnly ? 'Viewing' : 'Showing'} {sortedRows.length} of {rows.length} rows
              {!viewOnly && context === 'project' && columnFilter && ` (Filtered by: ${columnFilter})`}
            </span>
            {!viewOnly && selectedRows.length > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                {selectedRows.length} selected
              </span>
            )}
            {!viewOnly && isEditing && editingRowIndex !== null && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                Editing row {editingRowIndex + 1}
              </span>
            )}
            <span className="text-blue-600 text-sm">
              ({headers.length} columns)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileContentViewer;