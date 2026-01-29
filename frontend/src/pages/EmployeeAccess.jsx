import React, { useState, useEffect } from 'react';
import { 
  Key, Shield, Plus, Search, Filter, 
  Edit, Trash2, X, Check, 
  ChevronUp, ChevronDown, CheckCircle, XCircle, Download,
  Columns
} from 'lucide-react';

const EmployeeAccess = () => {
  // Initial columns configuration
  const initialColumns = [
    { id: 'employee', label: 'Employee', visible: true, sortable: true, type: 'text', required: true, deletable: false },
    { id: 'department', label: 'Department', visible: true, sortable: true, type: 'text', required: true, deletable: false },
    { id: 'accessLevel', label: 'Access Level', visible: true, sortable: true, type: 'select', required: true, deletable: false },
    { id: 'modules', label: 'Modules', visible: true, sortable: false, type: 'modules', required: false, deletable: false },
    { id: 'status', label: 'Status', visible: true, sortable: true, type: 'select', required: true, deletable: false },
  ];

  // Load access rules from localStorage on component mount
  const [accessRules, setAccessRules] = useState(() => {
    const savedRules = localStorage.getItem('access_rules');
    return savedRules ? JSON.parse(savedRules) : [];
  });
  
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
    const savedColumns = localStorage.getItem('access_columns');
    return savedColumns ? JSON.parse(savedColumns) : initialColumns;
  });
  
  const [editingColumn, setEditingColumn] = useState(null);
  const [tempColumnName, setTempColumnName] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  // Department filter state - Load from localStorage
  const [departmentFilter, setDepartmentFilter] = useState(() => {
    const savedFilter = localStorage.getItem('access_department_filter');
    return savedFilter || "All Departments";
  });

  // Access Level filter state
  const [accessLevelFilter, setAccessLevelFilter] = useState("All Access Levels");

  const accessLevels = ['Admin', 'Manager', 'User', 'Viewer'];
  const modulesList = ['Dashboard', 'Employee Master', 'Project Master', 'Reports', 'Settings', 'Analytics'];

  // Save access rules and columns to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('access_rules', JSON.stringify(accessRules));
    localStorage.setItem('access_columns', JSON.stringify(columns));
  }, [accessRules, columns]);

  // Save department filter preference
  useEffect(() => {
    localStorage.setItem('access_department_filter', departmentFilter);
  }, [departmentFilter]);

  // Get unique departments from access rules data
  const uniqueDepartments = ["All Departments", ...new Set(accessRules.map(rule => rule.department).filter(Boolean))];

  // Filter access rules based on search, department, and access level
  const filteredRules = accessRules.filter(rule => {
    // Search filter
    const matchesSearch = Object.values(rule).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Department filter
    const matchesDepartment = 
      departmentFilter === "All Departments" || 
      rule.department === departmentFilter;
    
    // Access Level filter
    const matchesAccessLevel = 
      accessLevelFilter === "All Access Levels" || 
      rule.accessLevel === accessLevelFilter;
    
    return matchesSearch && matchesDepartment && matchesAccessLevel;
  });

  // Sort rules
  const sortedRules = React.useMemo(() => {
    if (!sortConfig.key) return filteredRules;

    return [...filteredRules].sort((a, b) => {
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
  }, [filteredRules, sortConfig]);

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

  // Validate access rule form
  const validateRuleForm = (rule) => {
    const requiredColumns = columns.filter(col => col.required && col.visible);
    
    for (const column of requiredColumns) {
      if (!rule[column.id]?.toString().trim()) {
        return `${column.label} is required`;
      }
    }
    return '';
  };

  // Handle Add Rule button click
  const handleAddRuleClick = () => {
    setIsAddingNew(true);
    // Initialize empty new rule with default values for all visible columns
    const initialRule = {};
    columns.filter(col => col.visible).forEach(col => {
      if (col.id === 'accessLevel') {
        initialRule[col.id] = 'User';
      } else if (col.id === 'status') {
        initialRule[col.id] = 'Active';
      } else if (col.id === 'modules') {
        initialRule[col.id] = [];
      } else {
        initialRule[col.id] = '';
      }
    });
    setNewRule(initialRule);
  };

  // Save new rule from bottom row
  const saveNewRule = () => {
    const error = validateRuleForm(newRule);
    if (error) {
      alert(error);
      return;
    }

    const newId = Math.max(...accessRules.map(r => r.id), 0) + 1;
    const ruleToAdd = { 
      ...newRule, 
      id: newId 
    };
    
    // Ensure all columns have values
    columns.forEach(col => {
      if (!ruleToAdd.hasOwnProperty(col.id)) {
        if (col.id === 'accessLevel') {
          ruleToAdd[col.id] = 'User';
        } else if (col.id === 'status') {
          ruleToAdd[col.id] = 'Active';
        } else if (col.id === 'modules') {
          ruleToAdd[col.id] = [];
        } else {
          ruleToAdd[col.id] = '';
        }
      }
    });
    
    setAccessRules([...accessRules, ruleToAdd]);
    
    // Reset new rule form
    const emptyRule = {};
    columns.filter(col => col.visible).forEach(col => {
      if (col.id === 'accessLevel') {
        emptyRule[col.id] = 'User';
      } else if (col.id === 'status') {
        emptyRule[col.id] = 'Active';
      } else if (col.id === 'modules') {
        emptyRule[col.id] = [];
      } else {
        emptyRule[col.id] = '';
      }
    });
    setNewRule(emptyRule);
  };

  // Cancel adding new rule
  const cancelNewRule = () => {
    setIsAddingNew(false);
    setNewRule({});
  };

  // Toggle module selection for new rule
  const toggleModule = (module) => {
    const currentModules = newRule.modules || [];
    if (currentModules.includes(module)) {
      setNewRule({...newRule, modules: currentModules.filter(m => m !== module)});
    } else {
      setNewRule({...newRule, modules: [...currentModules, module]});
    }
  };

  // Toggle module in edit form
  const toggleEditModule = (module) => {
    const currentModules = editForm.modules || [];
    if (currentModules.includes(module)) {
      setEditForm({...editForm, modules: currentModules.filter(m => m !== module)});
    } else {
      setEditForm({...editForm, modules: [...currentModules, module]});
    }
  };

  // Show delete prompt
  const showDeleteConfirmation = (id, employee) => {
    setShowDeletePrompt({ id, employee });
  };

  // Confirm delete rule
  const confirmDeleteRule = () => {
    if (showDeletePrompt) {
      setAccessRules(accessRules.filter(rule => rule.id !== showDeletePrompt.id));
      setShowDeletePrompt(null);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeletePrompt(null);
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
      
      // Add default value for this column to all existing rules
      let defaultValue = '';
      if (newColumnType === 'select') {
        defaultValue = 'Active';
      } else if (newColumnType === 'modules') {
        defaultValue = [];
      }
      
      setAccessRules(accessRules.map(rule => ({
        ...rule,
        [newColumnId]: defaultValue
      })));
      
      // Also add to newRule if it exists
      if (isAddingNew) {
        setNewRule(prev => ({
          ...prev,
          [newColumnId]: defaultValue
        }));
      }
      
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
    if (window.confirm('Are you sure you want to delete this column? This will remove this column from all access rules.')) {
      setColumns(columns.filter(col => col.id !== columnId));
      
      // Remove this column from all rules
      setAccessRules(accessRules.map(rule => {
        const newRule = { ...rule };
        delete newRule[columnId];
        return newRule;
      }));
      
      // Remove from newRule if it exists
      if (isAddingNew) {
        const newEmp = { ...newRule };
        delete newEmp[columnId];
        setNewRule(newEmp);
      }
    }
  };

  // Toggle column visibility
  const toggleColumnVisibility = (columnId) => {
    setColumns(columns.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  };

  // Start editing rule
  const startEditing = (rule) => {
    // Cancel any current add operation
    if (isAddingNew) {
      setIsAddingNew(false);
      setNewRule({});
    }
    
    setEditingId(rule.id);
    const editData = { ...rule };
    columns.forEach(col => {
      if (!editData.hasOwnProperty(col.id)) {
        if (col.id === 'accessLevel') {
          editData[col.id] = 'User';
        } else if (col.id === 'status') {
          editData[col.id] = 'Active';
        } else if (col.id === 'modules') {
          editData[col.id] = [];
        } else {
          editData[col.id] = '';
        }
      }
    });
    setEditForm(editData);
  };

  // Save rule edit
  const saveEdit = () => {
    const error = validateRuleForm(editForm);
    if (error) {
      alert(error);
      return;
    }
    
    setAccessRules(accessRules.map(rule => 
      rule.id === editingId ? { ...rule, ...editForm } : rule
    ));
    setEditingId(null);
    setEditForm({});
  };

  // Cancel rule edit
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Handle new rule input change
  const handleNewRuleChange = (field, value) => {
    setNewRule({...newRule, [field]: value});
  };

  // Handle edit form change
  const handleEditFormChange = (field, value) => {
    setEditForm({...editForm, [field]: value});
  };

  // Handle department filter change
  const handleDepartmentFilterChange = (dept) => {
    setDepartmentFilter(dept);
  };

  // Handle access level filter change
  const handleAccessLevelFilterChange = (level) => {
    setAccessLevelFilter(level);
  };

  // Render input based on column type
  const renderInput = (column, value, onChange, placeholder = true, isEditMode = false) => {
    if (column.id === 'accessLevel') {
      return (
        <select
          value={value || 'User'}
          onChange={(e) => onChange(column.id, e.target.value)}
          className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
        >
          {accessLevels.map(level => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      );
    } else if (column.id === 'modules') {
      if (isEditMode) {
        return (
          <div className="flex flex-wrap gap-1">
            {modulesList.map(module => (
              <button
                key={module}
                type="button"
                onClick={() => toggleEditModule(module)}
                className={`px-2 py-0.5 rounded text-[10px] sm:text-xs border ${
                  (editForm.modules || []).includes(module)
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-gray-100 text-gray-700 border-gray-300'
                }`}
              >
                {module}
              </button>
            ))}
          </div>
        );
      }
      return null;
    } else if (column.id === 'status') {
      return (
        <select
          value={value || 'Active'}
          onChange={(e) => onChange(column.id, e.target.value)}
          className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Pending">Pending</option>
        </select>
      );
    } else if (column.type === 'select') {
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(column.id, e.target.value)}
          className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
        >
          <option value="">Select {column.label}</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
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
  const renderCellContent = (column, value, rule) => {
    if (column.id === 'accessLevel') {
      return (
        <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs whitespace-nowrap ${
          value === 'Admin' ? 'bg-red-100 text-red-800' :
          value === 'Manager' ? 'bg-blue-100 text-blue-800' :
          value === 'User' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value || '-'}
        </span>
      );
    } else if (column.id === 'modules') {
      const modules = rule.modules || [];
      return (
        <div className="flex flex-wrap gap-1">
          {modules.slice(0, 2).map(module => (
            <span key={module} className="px-2 py-0.5 bg-gray-100 rounded text-[10px] sm:text-xs">
              {module}
            </span>
          ))}
          {modules.length > 2 && (
            <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] sm:text-xs">
              +{modules.length - 2}
            </span>
          )}
          {modules.length === 0 && <span>-</span>}
        </div>
      );
    } else if (column.id === 'status' || column.type === 'select') {
      return (
        <div className="flex items-center">
          {value === 'Active' ? (
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1" />
          ) : value === 'Inactive' ? (
            <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 mr-1" />
          ) : (
            <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mr-1" />
          )}
          <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs ${
            value === 'Active' 
              ? 'bg-green-100 text-green-800' 
              : value === 'Inactive'
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {value || '-'}
          </span>
        </div>
      );
    }
    return value || '-';
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Delete Rule Prompt Modal */}
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
                Are you sure you want to delete access rule for <span className="font-medium">{showDeletePrompt.employee}</span>?
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
                onClick={confirmDeleteRule}
                className="px-3 py-1.5 text-xs sm:text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
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
              {/* Removed the deletable check so all columns show edit/delete */}
            </>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {/* Edit button for all columns */}
          <button
            onClick={() => startEditColumn(column.id, column.label)}
            className="text-blue-600 hover:text-blue-800"
            title="Edit"
          >
            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
          
          {/* Delete button - show warning for required columns */}
          <button
            onClick={() => {
              if (column.required) {
                if (window.confirm(`Warning: ${column.label} is a required column. Are you sure you want to delete it? This may affect data validation.`)) {
                  handleDeleteColumn(column.id);
                }
              } else {
                handleDeleteColumn(column.id);
              }
            }}
            className="text-red-600 hover:text-red-800"
            title="Delete"
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
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
            <Key className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Employee Access
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">Manage employee permissions and access controls</p>
        </div>
        <button className="flex items-center justify-center sm:justify-start space-x-1 px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50 w-full sm:w-auto">
          <Download className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>Export</span>
        </button>
      </div>

      {/* Compact Stats - Responsive */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-white border border-gray-300 rounded p-3 sm:p-4 flex items-center">
          <div className="bg-gray-100 p-1.5 sm:p-2 rounded mr-2 sm:mr-3">
            <Key className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500">Access Rules</p>
            <p className="text-sm sm:text-base font-bold text-gray-900">{accessRules.length}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-300 rounded p-3 sm:p-4 flex items-center">
          <div className="bg-green-100 p-1.5 sm:p-2 rounded mr-2 sm:mr-3">
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500">Active Access</p>
            <p className="text-sm sm:text-base font-bold text-green-600">
              {accessRules.filter(r => r.status === 'Active').length}
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-300 rounded p-3 sm:p-4 flex items-center">
          <div className="bg-blue-100 p-1.5 sm:p-2 rounded mr-2 sm:mr-3">
            <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500">Admin Users</p>
            <p className="text-sm sm:text-base font-bold text-blue-600">
              {accessRules.filter(r => r.accessLevel === 'Admin').length}
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-300 rounded p-3 sm:p-4 flex items-center">
          <div className="bg-yellow-100 p-1.5 sm:p-2 rounded mr-2 sm:mr-3">
            <Key className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500">Departments</p>
            <p className="text-sm sm:text-base font-bold text-gray-900">
              {uniqueDepartments.length - 1} {/* Subtract "All Departments" */}
            </p>
          </div>
        </div>
      </div>

      {/* Table Container with Toolbar */}
      <div className="bg-white border border-gray-300 rounded p-3 sm:p-4">
        {/* Toolbar with Search, Add Rule, Add Columns */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded"
              />
            </div>
            
            {/* Add Rule Button - Black */}
            <button
              onClick={handleAddRuleClick}
              className="flex items-center justify-center space-x-1 px-3 py-2 text-xs sm:text-sm bg-black text-white rounded hover:bg-gray-800 w-full sm:w-auto"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Add Access Rule</span>
            </button>

            {/* Add Columns Button */}
            <button 
              onClick={() => setShowColumnModal(true)}
              className="flex items-center justify-center space-x-1 px-3 py-2 text-xs sm:text-sm bg-black text-white rounded hover:bg-gray-800 w-full sm:w-auto"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Add Column</span>
            </button>
            
          </div>
          
          {/* Department Filter with Blue Icon */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <div className="relative w-full sm:w-48">
              <select
                value={departmentFilter}
                onChange={(e) => handleDepartmentFilterChange(e.target.value)}
                className="w-full pl-8 pr-8 py-2 text-xs sm:text-sm border border-gray-300 rounded appearance-none bg-white"
              >
                {uniqueDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
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

            {/* Access Level Filter */}
            <div className="relative w-full sm:w-48">
              <select
                value={accessLevelFilter}
                onChange={(e) => handleAccessLevelFilterChange(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-xs sm:text-sm border border-gray-300 rounded appearance-none bg-white"
              >
                <option value="All Access Levels">All Access Levels</option>
                {accessLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
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
              {/* Existing rules */}
              {sortedRules.map((rule) => (
                <tr key={rule.id} className="border-b border-gray-200 hover:bg-gray-50">
                  {editingId === rule.id ? (
                    <>
                      {/* Edit mode for visible columns */}
                      {columns
                        .filter(col => col.visible)
                        .map((column) => (
                          <td key={column.id} className="py-2 px-2 sm:px-3">
                            {renderInput(column, editForm[column.id], handleEditFormChange, false, true)}
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
                    </>
                  ) : (
                    <>
                      {/* View mode for visible columns */}
                      {columns
                        .filter(col => col.visible)
                        .map((column) => (
                          <td key={column.id} className="py-2 px-2 sm:px-3">
                            {renderCellContent(column, rule[column.id], rule)}
                          </td>
                        ))}
                      <td className="py-2 px-2 sm:px-3">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => startEditing(rule)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                          <button 
                            onClick={() => showDeleteConfirmation(rule.id, rule.employee)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}

              {/* Add new rule row at the bottom */}
              {isAddingNew && (
                <tr className="border-b border-gray-200 bg-blue-50">
                  {columns
                    .filter(col => col.visible)
                    .map((column) => (
                      <td key={column.id} className="py-2 px-2 sm:px-3">
                        {column.id === 'modules' ? (
                          <div className="flex flex-wrap gap-1">
                            {modulesList.slice(0, 2).map(module => (
                              <span key={module} className="px-2 py-0.5 bg-gray-100 rounded text-[10px] sm:text-xs">
                                {module}
                              </span>
                            ))}
                            {newRule.modules && newRule.modules.length > 2 && (
                              <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] sm:text-xs">
                                +{newRule.modules.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          renderInput(column, newRule[column.id], handleNewRuleChange)
                        )}
                      </td>
                    ))}
                  <td className="py-2 px-2 sm:px-3">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={saveNewRule}
                        className="p-1 text-green-600 hover:text-green-800"
                        title="Save"
                      >
                        <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                      <button 
                        onClick={cancelNewRule}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Cancel"
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Compact Pagination - Responsive */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 mt-3 pt-3 border-t border-gray-300">
          <div className="text-[10px] sm:text-xs text-gray-600">
            Showing {sortedRules.length} of {accessRules.length} access rules
            {departmentFilter !== "All Departments" && ` (Filtered by ${departmentFilter})`}
            {accessLevelFilter !== "All Access Levels" && ` and ${accessLevelFilter}`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAccess;