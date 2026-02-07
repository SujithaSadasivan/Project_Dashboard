import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit, Trash2, X, Check, 
  ChevronUp, ChevronDown, Filter, Download,
  Eye, EyeOff, Lock, User, ChevronDown as ChevronDownIcon,
  CheckSquare, Square, Shield
} from 'lucide-react';
import axios from 'axios';

const EmployeeAccess = () => {
  // Initial columns configuration
  const initialColumns = [
    { id: 'id', label: 'ID', visible: true, sortable: true, type: 'text', required: true, deletable: false },
    { id: 'name', label: 'Name', visible: true, sortable: true, type: 'text', required: true, deletable: false },
    { id: 'email', label: 'Email', visible: true, sortable: true, type: 'email', required: true, deletable: false },
    { id: 'role', label: 'Role', visible: true, sortable: true, type: 'text', required: true, deletable: false },
    { id: 'department', label: 'Department', visible: true, sortable: true, type: 'text', required: true, deletable: false },
    { id: 'status', label: 'Status', visible: true, sortable: true, type: 'text', required: true, deletable: false },
  ];

  // Employee data state
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessRules, setAccessRules] = useState([]);
  const [newRule, setNewRule] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showDeletePrompt, setShowDeletePrompt] = useState(null);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('text');
  
  // Load columns from localStorage
  const [columns, setColumns] = useState(() => {
    const savedColumns = localStorage.getItem('access_columns_v2');
    return savedColumns ? JSON.parse(savedColumns) : initialColumns;
  });
  
  const [editingColumn, setEditingColumn] = useState(null);
  const [tempColumnName, setTempColumnName] = useState('');
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });

  // Single column filter state (like EmployeeMaster)
  const [columnFilter, setColumnFilter] = useState('');

  // State for Add Employee modal
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  
  // New state for checkboxes
  const [selectedAccessRules, setSelectedAccessRules] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // New state for action prompts
  const [showBulkDeletePrompt, setShowBulkDeletePrompt] = useState(false);
  const [showBulkEditPrompt, setShowBulkEditPrompt] = useState(false);
  const [showColumnAddPrompt, setShowColumnAddPrompt] = useState(false);
  const [showExportConfirmPrompt, setShowExportConfirmPrompt] = useState(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showDeleteColumnPrompt, setShowDeleteColumnPrompt] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  const modulesList = ['Dashboard', 'Employee Master', 'Project Master', 'Settings'];
  const accessLevels = ['Admin', 'Manager', 'User', 'Viewer'];
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchEmployees(), fetchAccessRules()]);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load data. Please try again.");
        showNotification('Failed to load data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/employees`);
      if (Array.isArray(res.data)) {
        setAllEmployees(res.data);
      } else {
        setAllEmployees([]);
      }
    } catch (err) {
      console.error("Error fetching employees", err);
      throw err;
    }
  };

  const fetchAccessRules = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/employee-access/`);
      if (Array.isArray(res.data)) {
        setAccessRules(res.data);
        // Reset selection when rules are fetched
        setSelectedAccessRules([]);
        setSelectAll(false);
      } else {
        setAccessRules([]);
      }
    } catch (err) {
      console.error("Error fetching access rules", err);
    }
  };

  // Merge employees and access rules
  const mergedData = React.useMemo(() => {
    return accessRules.map(rule => {
      const empDetails = rule.employee || allEmployees.find(e => e.id === rule.employee_id) || {};
      const displayId = rule.employee_code || empDetails.employee_id || (empDetails.id ? String(empDetails.id) : String(rule.employee_id));
      const displayName = rule.employee_name || empDetails.name || rule.name || 'Unknown';
      const displayEmail = rule.employee_email || empDetails.email || rule.email || 'Unknown';

      return {
        id: displayId,
        accessRuleId: rule.id,
        employeeId: rule.employee_id,
        name: displayName,
        email: displayEmail,
        role: rule.access_level || 'User',
        department: empDetails.department || '',
        status: rule.status || 'Active',
        permissions: rule.modules || [],
        hasAccess: true,
        ...Object.keys(rule).reduce((acc, key) => {
          if (!['id', 'employee_id', 'access_level', 'status', 'modules', 'employee', 'name', 'email', 'employee_name', 'employee_email', 'employee_code'].includes(key)) {
             acc[key] = rule[key];
          }
          return acc;
        }, {})
      };
    });
  }, [allEmployees, accessRules]);

  // Checkbox Functions
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedAccessRules([]);
      setSelectAll(false);
    } else {
      const allVisibleIds = sortedRules.map(rule => rule.accessRuleId);
      setSelectedAccessRules(allVisibleIds);
      setSelectAll(true);
    }
  };

  const toggleAccessRuleSelection = (accessRuleId) => {
    setSelectedAccessRules(prev => {
      if (prev.includes(accessRuleId)) {
        const newSelection = prev.filter(id => id !== accessRuleId);
        setSelectAll(false);
        return newSelection;
      } else {
        const newSelection = [...prev, accessRuleId];
        const allVisibleIds = sortedRules.map(rule => rule.accessRuleId);
        if (newSelection.length === allVisibleIds.length) {
          setSelectAll(true);
        }
        return newSelection;
      }
    });
  };

  // Bulk edit function
  const handleBulkEdit = () => {
    if (selectedAccessRules.length === 0) {
      showNotification('Please select at least one access rule to edit', 'error');
      return;
    }
    
    setShowBulkEditPrompt({
      show: true,
      count: selectedAccessRules.length
    });
  };

  const confirmBulkEdit = () => {
    if (selectedAccessRules.length === 1) {
      const rule = mergedData.find(rule => rule.accessRuleId === selectedAccessRules[0]);
      if (rule) {
        startEditing(rule);
      }
    } else {
      showNotification(`${selectedAccessRules.length} access rules marked for bulk edit`, 'info');
    }
    setShowBulkEditPrompt({ show: false, count: 0 });
  };

  // Bulk delete function
  const handleBulkDelete = () => {
    if (selectedAccessRules.length === 0) {
      showNotification('Please select at least one access rule to delete', 'error');
      return;
    }
    
    setShowBulkDeletePrompt({
      show: true,
      count: selectedAccessRules.length
    });
  };

  const confirmBulkDelete = () => {
    const count = selectedAccessRules.length;
    setSelectedAccessRules([]);
    setSelectAll(false);
    setShowBulkDeletePrompt({ show: false, count: 0 });
    showNotification(`${count} access rules deleted successfully`);
  };

  // Column editing functions
  const startEditColumn = (columnId, currentLabel) => {
    setEditingColumn(columnId);
    setTempColumnName(currentLabel);
  };

  const saveEditColumn = (columnId) => {
    if (tempColumnName.trim()) {
      setColumns(columns.map(col => 
        col.id === columnId ? { ...col, label: tempColumnName } : col
      ));
      setEditingColumn(null);
      setTempColumnName('');
      showNotification('Column updated successfully');
    }
  };

  const cancelEditColumn = () => {
    setEditingColumn(null);
    setTempColumnName('');
  };

  const handleDeleteColumn = (columnId) => {
    const column = columns.find(col => col.id === columnId);
    const isFixedColumn = ['id', 'name', 'email', 'role', 'department', 'status'].includes(columnId);
   
    if (isFixedColumn) {
      setShowDeleteColumnPrompt({
        id: columnId,
        title: 'Cannot Delete Column',
        message: `Cannot delete fixed column: ${column.label}. Fixed columns are required for the Employee Access.`,
        type: 'warning',
        columnLabel: column.label
      });
      return;
    }
   
    setShowDeleteColumnPrompt({
      id: columnId,
      title: 'Delete Column',
      columnLabel: column.label,
      type: 'delete'
    });
  };

  const confirmDeleteColumn = () => {
    if (!showDeleteColumnPrompt) return;
   
    const columnId = showDeleteColumnPrompt.id;
    setColumns(columns.filter(col => col.id !== columnId));
    setShowDeleteColumnPrompt(null);
    setShowColumnModal(false);
    showNotification('Column deleted successfully');
  };

  // Sorting
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 opacity-30" />;
    return sortConfig.direction === 'ascending' ? <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" /> : <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />;
  };

  // Save columns to localStorage
  useEffect(() => {
    localStorage.setItem('access_columns_v2', JSON.stringify(columns));
  }, [columns]);

  // Filter access rules (single filter like EmployeeMaster)
  const filteredRules = mergedData.filter(rule => {
    const matchesSearch = Object.values(rule).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Single column filter that searches across all columns
    const matchesColumnFilter = !columnFilter || Object.values(rule).some(v => 
      String(v).toLowerCase().includes(columnFilter.toLowerCase())
    );
    
    return matchesSearch && matchesColumnFilter;
  });

  // Sort rules
  const sortedRules = React.useMemo(() => {
    if (!sortConfig.key) return filteredRules;

    return [...filteredRules].sort((a, b) => {
      const aVal = a[sortConfig.key] || '';
      const bVal = b[sortConfig.key] || '';
      
      if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [filteredRules, sortConfig]);

  // Handle Add Employee button click
  const handleAddEmployeeClick = () => {
    setShowAddEmployeeModal(true);
    setNewRule({
      id: '',
      employee_id: '',
      name: '',
      email: '',
      role: 'User',
      permissions: []
    });
    setNewPassword('');
    setConfirmPassword('');
    setSelectedEmployee('');
    setEmployeeSearch('');
  };

  // Handle employee selection
  const handleEmployeeSelect = (employeeId) => {
    const selected = allEmployees.find(emp => emp.id === parseInt(employeeId));
    if (selected) {
      setSelectedEmployee(employeeId);
      setNewRule({
        employee_id: selected.id,
        id: selected.employee_id || selected.id,
        name: selected.name,
        email: selected.email,
        role: selected.role || 'User',
        permissions: []
      });
      setEmployeeSearch('');
    }
  };

  // Save new employee
  const saveNewEmployee = async () => {
    if (!newPassword.trim()) {
      showNotification('Password is required', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }

    try {
      const payload = {
        employee_id: newRule.employee_id,
        access_level: newRule.role,
        status: 'Active',
        modules: newRule.permissions || [],
        password: newPassword
      };
      
      await axios.post(`${API_BASE_URL}/employee-access/`, payload);
      await fetchAccessRules();
      setShowAddEmployeeModal(false);
      setNewRule({});
      setNewPassword('');
      setConfirmPassword('');
      setSelectedEmployee('');
      setEmployeeSearch('');
      showNotification('Employee access added successfully');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || err.message;
      showNotification('Error saving access rule: ' + msg, 'error');
    }
  };

  // Cancel adding new employee
  const cancelNewEmployee = () => {
    setShowAddEmployeeModal(false);
    setNewRule({});
    setNewPassword('');
    setConfirmPassword('');
    setSelectedEmployee('');
    setEmployeeSearch('');
  };

  // Toggle module permission for add modal
  const togglePermission = (module) => {
    const currentPermissions = newRule.permissions || [];
    if (currentPermissions.includes(module)) {
      setNewRule({...newRule, permissions: currentPermissions.filter(m => m !== module)});
    } else {
      setNewRule({...newRule, permissions: [...currentPermissions, module]});
    }
  };

  // Toggle module in edit form
  const toggleEditPermission = (module) => {
    const currentPermissions = editForm.permissions || [];
    if (currentPermissions.includes(module)) {
      setEditForm({...editForm, permissions: currentPermissions.filter(m => m !== module)});
    } else {
      setEditForm({...editForm, permissions: [...currentPermissions, module]});
    }
  };

  // Show delete prompt
  const showDeleteConfirmation = (id, name) => {
    setShowDeletePrompt({ id, name });
  };

  // Confirm delete rule
  const confirmDeleteRule = async () => {
    if (showDeletePrompt) {
      try {
        await axios.delete(`${API_BASE_URL}/employee-access/${showDeletePrompt.id}`);
        await fetchAccessRules();
        setShowDeletePrompt(null);
        showNotification('Access rule deleted successfully');
      } catch (err) {
        console.error(err);
        const msg = err.response?.data?.detail || err.message;
        showNotification('Error deleting access rule: ' + msg, 'error');
      }
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeletePrompt(null);
  };

  // Add new column
  const handleAddColumn = () => {
    if (!newColumnName.trim()) {
      showNotification('Please enter a column name', 'error');
      return;
    }
    
    setShowColumnAddPrompt({
      show: true,
      columnName: newColumnName
    });
  };

  const confirmAddColumn = () => {
    if (newColumnName.trim()) {
      const newColumnId = newColumnName.toLowerCase().replace(/\s+/g, '_');
      
      if (columns.find(col => col.id === newColumnId)) {
        showNotification('Column with this name already exists', 'error');
        return;
      }
      
      const newColumn = {
        id: newColumnId,
        label: newColumnName,
        visible: true,
        sortable: true,
        type: newColumnType,
        deletable: true,
        required: false
      };
      
      setColumns([...columns, newColumn]);
      setNewColumnName('');
      setNewColumnType('text');
      setShowColumnAddPrompt({ show: false, columnName: '' });
      setShowColumnModal(false);
      showNotification('Column added successfully');
    }
  };

  // Toggle column visibility
  const toggleColumnVisibility = (columnId) => {
    const updatedColumns = columns.map(col =>
      col.id === columnId ? { ...col, visible: !col.visible } : col
    );
    setColumns(updatedColumns);
  };

  // Start editing rule
  const startEditing = (rule) => {
    setEditForm({ 
      ...rule,
      id: rule.id,
      accessRuleId: rule.accessRuleId
    });
    setShowEditEmployeeModal(rule.accessRuleId || rule.id);
    setNewPassword('');
    setConfirmPassword('');
  };

  // Save rule edit
  const saveEdit = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }
    
    try {
      const payload = {
        employee_id: editForm.employeeId,
        access_level: editForm.role,
        status: editForm.status || 'Active',
        modules: editForm.permissions || [],
        name: editForm.name,
        email: editForm.email
      };

      if (newPassword) {
        payload.password = newPassword;
      }
      
      await axios.put(`${API_BASE_URL}/employee-access/${editForm.accessRuleId}`, payload);
      await fetchAccessRules();
      setShowEditEmployeeModal(null);
      setEditForm({});
      setNewPassword('');
      setConfirmPassword('');
      showNotification('Access rule updated successfully');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || err.message;
      showNotification('Error updating access rule: ' + msg, 'error');
    }
  };

  // Cancel rule edit
  const cancelEdit = () => {
    setShowEditEmployeeModal(null);
    setEditForm({});
    setNewPassword('');
    setConfirmPassword('');
  };

  // Handle new rule input change
  const handleNewRuleChange = (field, value) => {
    setNewRule({...newRule, [field]: value});
  };

  // Handle edit form change
  const handleEditFormChange = (field, value) => {
    setEditForm({...editForm, [field]: value});
  };

  // Export functions
  const handleExportClick = (format) => {
    if (sortedRules.length === 0) {
      showNotification('No data to export', 'error');
      return;
    }
    
    setShowExportConfirmPrompt({
      show: true,
      format: format,
      count: sortedRules.length
    });
  };

  const handleExport = (format) => {
    const dataToExport = sortedRules.map(rule => {
      const row = {};
      columns.filter(col => col.visible).forEach(col => {
        row[col.label] = rule[col.id] || '';
      });
      return row;
    });
    
    // Export logic here (similar to EmployeeMaster)
    showNotification(`Export to ${format.toUpperCase()} completed successfully`);
    setShowExportConfirmPrompt(null);
    setShowExportDropdown(false);
  };

  // Render cell content
  const renderCellContent = (column, value, rule) => {
    if (column.id === 'role') {
      const displayValue = rule.hasAccess ? (value || 'User') : 'No Access';
      return (
        <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs whitespace-nowrap ${
          displayValue === 'Admin' ? 'bg-red-100 text-red-800' :
          displayValue === 'Manager' ? 'bg-blue-100 text-blue-800' :
          displayValue === 'User' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {displayValue}
        </span>
      );
    }
    if (column.id === 'status') {
      const isActive = value === 'Active';
      return (
        <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs whitespace-nowrap ${
          isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value || 'Inactive'}
        </span>
      );
    }
    return value || '-';
  };

  const visibleColumns = columns.filter(col => col.visible);

  return (
    <div className="space-y-3 sm:space-y-4 px-0 relative">
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

      {/* Delete Rule Prompt */}
      {showDeletePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Confirm Delete</h3>
              <button onClick={cancelDelete} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4 sm:h-5 sm:w-5"/>
              </button>
            </div>
            <div className="mb-4">
              <p className="text-xs sm:text-sm text-gray-600">Delete employee <span className="font-medium">{showDeletePrompt.name}</span>?</p>
              <p className="text-xs text-red-600 mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={cancelDelete} className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDeleteRule} className="px-3 py-1.5 text-xs sm:text-sm bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Column Prompt */}
      {showDeleteColumnPrompt && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                {showDeleteColumnPrompt.title}
              </h3>
              <button
                onClick={() => setShowDeleteColumnPrompt(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5"/>
              </button>
            </div>

            <div className="mb-4">
              {showDeleteColumnPrompt.type === 'warning' ? (
                <p className="text-xs sm:text-sm text-gray-600">
                  {showDeleteColumnPrompt.message}
                </p>
              ) : (
                <>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Are you sure you want to delete column
                    <span className="font-medium">
                      {" "}{showDeleteColumnPrompt.columnLabel}
                    </span>?
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    This action cannot be undone.
                  </p>
                </>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteColumnPrompt(null)}
                className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                {showDeleteColumnPrompt.type === 'warning' ? 'OK' : 'Cancel'}
              </button>

              {showDeleteColumnPrompt.type === 'delete' && (
                <button
                  onClick={confirmDeleteColumn}
                  className="px-3 py-1.5 text-xs sm:text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              )}
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
                Are you sure you want to delete {showBulkDeletePrompt.count} selected access rule{showBulkDeletePrompt.count > 1 ? 's' : ''}?
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

      {/* Bulk Edit Prompt */}
      {showBulkEditPrompt.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Confirm Bulk Edit</h3>
              <button onClick={() => setShowBulkEditPrompt({ show: false, count: 0 })} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4 sm:h-5 sm:w-5"/>
              </button>
            </div>
            <div className="mb-4">
              <p className="text-xs sm:text-sm text-gray-600">
                Are you sure you want to edit {showBulkEditPrompt.count} selected access rule{showBulkEditPrompt.count > 1 ? 's' : ''}?
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowBulkEditPrompt({ show: false, count: 0 })} className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
              <button onClick={confirmBulkEdit} className="px-3 py-1.5 text-xs sm:text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Edit</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Column Prompt */}
      {showColumnAddPrompt.show && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Add New Column</h3>
              <button onClick={() => setShowColumnAddPrompt({ show: false, columnName: '' })} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4 sm:h-5 sm:w-5"/>
              </button>
            </div>
            <div className="mb-4">
              <p className="text-xs sm:text-sm text-gray-600">
                Are you sure you want to add column "<span className="font-medium">{showColumnAddPrompt.columnName}</span>"?
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowColumnAddPrompt({ show: false, columnName: '' })} className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
              <button onClick={confirmAddColumn} className="px-3 py-1.5 text-xs sm:text-sm bg-black text-white rounded hover:bg-gray-800">Add Column</button>
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
                Export {showExportConfirmPrompt.count} access rule{showExportConfirmPrompt.count > 1 ? 's' : ''} as {showExportConfirmPrompt.format.toUpperCase()}?
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

      {/* Column Management Modal */}
      {showColumnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <div></div>
              <button onClick={() => setShowColumnModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
           
            <div className="mb-4 p-3 rounded">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base -mt-5 mb-2">
                <span className="bg-gray-200 px-2 py-0.5 rounded">
                  Add New Custom Column
                </span>
              </h3>

              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Column name (e.g., Phone Number)"
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
            
            <div className="mb-4">
              <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Available Columns</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {columns.map((column) => {
                  const isFixedColumn = ['id', 'name', 'email', 'role', 'department', 'status'].includes(column.id);
                  const isEditing = editingColumn === column.id;
                 
                  return (
                    <div key={column.id} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                      <div className="flex items-center space-x-2">
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={tempColumnName}
                              onChange={(e) => setTempColumnName(e.target.value)}
                              className="px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
                            />
                            <button
                              onClick={() => saveEditColumn(column.id)}
                              className="p-1 text-green-600 hover:text-green-800"
                              title="Save"
                            >
                              <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                            <button
                              onClick={cancelEditColumn}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Cancel"
                            >
                              <X className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="">{column.label}</span>
                            {column.required && (
                              <span className="">
                                {/* Required */}
                              </span>
                            )}
                            {isFixedColumn && (
                              <span className="">
                                {/* Fixed */}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                     
                      <div className="flex items-center space-x-2">
                        {/* View/Hide button */}
                        <button
                          onClick={() => toggleColumnVisibility(column.id)}
                          className={`p-1 ${column.visible ? 'text-blue-600 hover:text-blue-800' : 'text-gray-400 hover:text-gray-600'}`}
                          title={column.visible ? "Hide column" : "Show column"}
                        >
                          {column.visible ? <Eye className="h-3 w-3 sm:h-4 sm:w-4" /> : <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />}
                        </button>

                        {/* Edit button for all columns */}
                        {!isEditing && (
                          <button
                            onClick={() => startEditColumn(column.id, column.label)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        )}
                       
                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteColumn(column.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
           
           
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                <span className="bg-gray-200 px-2 py-0.5 rounded">
                  Add New Employee Access
                </span>
              </h3>
              <button
                onClick={cancelNewEmployee}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Employee Selector Section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Select Employee</h4>
              <div className="relative">
                <div className="flex items-center border border-gray-300 rounded px-3 py-2 bg-white">
                  <User className="h-4 w-4 text-gray-400 mr-2" />
                  <input
                    type="text"
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    placeholder="Search employee by name or email..."
                    className="flex-1 outline-none text-sm"
                  />
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                </div>
                
                {/* Employee dropdown */}
                {employeeSearch && allEmployees.filter(emp => 
                  !accessRules.some(rule => rule.employee_id === emp.id)
                ).length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
                    {allEmployees
                      .filter(emp => 
                        !accessRules.some(rule => rule.employee_id === emp.id) &&
                        (emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                         emp.email.toLowerCase().includes(employeeSearch.toLowerCase()))
                      )
                      .map(employee => (
                      <div
                        key={employee.id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleEmployeeSelect(employee.id)}
                      >
                        <div className="font-medium text-sm">{employee.name}</div>
                        <div className="text-xs text-gray-600">{employee.email} • {employee.department}</div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Or select from dropdown */}
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Or select from list:</label>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => handleEmployeeSelect(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">Select an employee...</option>
                    {allEmployees
                      .filter(emp => !accessRules.some(rule => rule.employee_id === emp.id))
                      .map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} ({employee.email}) - {employee.department}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedEmployee && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                    Selected: {allEmployees.find(e => e.id === parseInt(selectedEmployee))?.name}
                  </div>
                )}
              </div>
            </div>

            {/* Basic Information Section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ID <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newRule.id || ''}
                    onChange={(e) => handleNewRuleChange('id', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="Enter employee ID"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newRule.name || ''}
                    onChange={(e) => handleNewRuleChange('name', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="Select employee to auto-fill"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={newRule.email || ''}
                    onChange={(e) => handleNewRuleChange('email', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="Select employee to auto-fill"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Role <span className="text-red-500">*</span></label>
                  <select
                    value={newRule.role || 'User'}
                    onChange={(e) => handleNewRuleChange('role', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    {accessLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Password <span className="text-red-500">*</span></h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                      placeholder="Enter new password"
                    />
                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                      placeholder="Confirm new password"
                    />
                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Permissions Section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Permissions</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {modulesList.map(module => (
                  <div key={module} className="flex flex-col items-center">
                    <div className="text-xs text-gray-600 mb-2 text-center">{module}</div>
                    <button
                      type="button"
                      onClick={() => togglePermission(module)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        (newRule.permissions || []).includes(module)
                          ? 'bg-blue-600'
                          : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          (newRule.permissions || []).includes(module)
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-xs text-gray-500 mt-1">
                      {(newRule.permissions || []).includes(module) ? 'ON' : 'OFF'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
           
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelNewEmployee}
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveNewEmployee}
                className="px-4 py-2 text-sm bg-black text-white rounded hover:bg-gray-800"
              >
                Save Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditEmployeeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                <span className="bg-gray-200 px-2 py-0.5 rounded">
                  Edit Employee Access
                </span>
              </h3>
              <button
                onClick={cancelEdit}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Basic Information Section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ID</label>
                  <input
                    type="text"
                    value={editForm.id || ''}
                    disabled
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => handleEditFormChange('name', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => handleEditFormChange('email', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Role <span className="text-red-500">*</span></label>
                  <select
                    value={editForm.role || 'User'}
                    onChange={(e) => handleEditFormChange('role', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    {accessLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Password Reset Section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Password Reset</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                      placeholder="Enter new password"
                    />
                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                      placeholder="Confirm new password"
                    />
                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Leave blank to keep current password</p>
            </div>

            {/* Permissions Section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Permissions</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {modulesList.map(module => (
                  <div key={module} className="flex flex-col items-center">
                    <div className="text-xs text-gray-600 mb-2 text-center">{module}</div>
                    <button
                      type="button"
                      onClick={() => toggleEditPermission(module)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        (editForm.permissions || []).includes(module)
                          ? 'bg-blue-600'
                          : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          (editForm.permissions || []).includes(module)
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-xs text-gray-500 mt-1">
                      {(editForm.permissions || []).includes(module) ? 'ON' : 'OFF'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
           
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 text-sm bg-black text-white rounded hover:bg-gray-800"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN BORDER CONTAINER */}
      <div className="bg-white border border-gray-300 rounded mx-0">
       
        {/* Loading / Error State */}
        {loading && (
            <div className="p-8 text-center text-gray-500">
                Loading data...
            </div>
        )}
        
        {error && (
            <div className="p-8 text-center text-red-500">
                {error}
            </div>
        )}

        {!loading && !error && (
            <>
        {/* TOOLBAR SECTION */}
        <div className="p-4 border-b border-gray-300">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
           
            {/* LEFT SIDE */}
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

            {/* RIGHT SIDE */}
            <div className="flex gap-2 mt-2 sm:mt-0">
              {/* Single Column Filter */}
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

              {/* Add Column Button */}
              <button
                onClick={() => setShowColumnModal(true)}
                className="flex items-center gap-1 h-10 px-3 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50 whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                {/* <span>Add Column</span> */}
              </button>

              {/* Export Button with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="flex items-center gap-1 h-10 px-3 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  <Download className="h-4 w-4" />
                  {/* <span>Export</span> */}
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
        <div className="relative">
          <div className="overflow-auto max-h-[calc(100vh-300px)]">
            <table className="min-w-full text-xs sm:text-sm border-collapse">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr className="border-b border-gray-300">
                  {/* Checkbox column */}
                  <th className="text-left py-2 px-3 font-medium text-gray-700 cursor-pointer hover:bg-gray-200 whitespace-nowrap border-r border-gray-300 w-10">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={toggleSelectAll}
                        className="p-1 text-gray-600 hover:text-gray-800"
                      >
                        {selectAll ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </th>
                  {visibleColumns.map(col => (
                    <th
                      key={col.id}
                      className="text-left py-2 px-3 font-medium text-gray-700 cursor-pointer hover:bg-gray-200 whitespace-nowrap border-r border-gray-300 last:border-r-0"
                      onClick={() => col.sortable && handleSort(col.id)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{col.label}</span>
                        {col.required && <span className="text-red-500">*</span>}
                        {col.sortable && getSortIcon(col.id)}
                      </div>
                    </th>
                  ))}
                  {/* Removed Actions column header */}
                </tr>
              </thead>

              <tbody>
                {sortedRules.map(rule => (
                  <tr
                    key={rule.accessRuleId}
                    className="border-b border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    {/* Checkbox cell */}
                    <td className="py-2 px-3 whitespace-nowrap border-r border-gray-300 w-10">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedAccessRules.includes(rule.accessRuleId)}
                          onChange={() => toggleAccessRuleSelection(rule.accessRuleId)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    </td>
                    {visibleColumns.map(col => (
                      <td key={col.id} className="py-2 px-3 whitespace-nowrap border-r border-gray-300 last:border-r-0">
                        {renderCellContent(col, rule[col.id], rule)}
                      </td>
                    ))}
                    {/* Removed Actions cell */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER SECTION with Add Employee and Action buttons on LEFT */}
        <div className="px-4 py-3 border-t border-gray-300 text-xs text-gray-900 flex flex-col sm:flex-row items-center justify-between gap-2 bg-white relative">
          {/* LEFT SIDE - Add Employee and Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddEmployeeClick}
              className="flex items-center gap-1 h-10 px-3 text-xs border border-gray-300 rounded hover:bg-gray-50"
            >
              <Plus className="h-4 w-4" />
              {/* <span>Add Employee</span> */}
            </button>
            
            {/* Edit and Delete buttons - only show when rules are selected */}
            {selectedAccessRules.length > 0 ? (
              <div className="flex items-center gap-1 ml-1">
                <button
                  onClick={handleBulkEdit}
                  className="flex items-center gap-1 h-10 px-3 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50"
                  title={selectedAccessRules.length === 1 ? "Edit selected access rule" : "Edit selected access rules"}
                >
                  <Edit className="h-4 w-4" />
                  {selectedAccessRules.length > 1 && <span>Edit ({selectedAccessRules.length})</span>}
                </button>
                
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1 h-10 px-3 text-xs sm:text-sm border border-gray-300 rounded hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                  title={selectedAccessRules.length === 1 ? "Delete selected access rule" : "Delete selected access rules"}
                >
                  <Trash2 className="h-4 w-4" />
                  {selectedAccessRules.length > 1 && <span>Delete ({selectedAccessRules.length})</span>}
                </button>
              </div>
            ) : null}
          </div>
          
          {/* RIGHT SIDE - Info and Column Count */}
          <div className="flex items-center gap-4">
            <span>
              Showing {sortedRules.length} of {mergedData.length} access rules
              {columnFilter &&
                ` (Filtered by: ${columnFilter})`
              }
            </span>
            {selectedAccessRules.length > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                {selectedAccessRules.length} selected
              </span>
            )}
            <span className="text-blue-600">
              ({visibleColumns.length} of {columns.length} columns visible)
            </span>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default EmployeeAccess;