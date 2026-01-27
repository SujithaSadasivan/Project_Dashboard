import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Calendar, DollarSign, Users, TrendingUp, MoreVertical,
  Plus, Search, Edit, Trash2, X, Check, 
  ChevronUp, ChevronDown, Download, Columns, Filter,
  CheckCircle, Clock, AlertTriangle, FileText
} from 'lucide-react';

const ProjectMaster = () => {
  // Initial columns configuration
  const initialColumns = [
    { id: 'name', label: 'Project Name', visible: true, sortable: true, type: 'text', required: true, deletable: false },
    { id: 'manager', label: 'Project Manager', visible: true, sortable: true, type: 'text', required: true, deletable: false },
    { id: 'status', label: 'Status', visible: true, sortable: true, type: 'select', required: true, deletable: false },
    { id: 'budget', label: 'Budget', visible: true, sortable: true, type: 'number', required: true, deletable: false },
    { id: 'timeline', label: 'Timeline', visible: true, sortable: true, type: 'text', required: false, deletable: false },
    { id: 'teamSize', label: 'Team Size', visible: true, sortable: true, type: 'number', required: false, deletable: false },
  ];

  // Load projects from localStorage on component mount
  const [projects, setProjects] = useState(() => {
    const savedProjects = localStorage.getItem('projects');
    return savedProjects ? JSON.parse(savedProjects) : [
      { id: 1, name: 'Website Redesign', manager: 'John Doe', status: 'In Progress', budget: 50000, timeline: '3 months', teamSize: 8 },
      { id: 2, name: 'Mobile App Development', manager: 'Jane Smith', status: 'Planning', budget: 75000, timeline: '6 months', teamSize: 12 },
      { id: 3, name: 'CRM Implementation', manager: 'Bob Johnson', status: 'Completed', budget: 30000, timeline: '2 months', teamSize: 5 },
    ];
  });
  
  const [newProject, setNewProject] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showDeletePrompt, setShowDeletePrompt] = useState(null);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('text');
  
  // Load columns from localStorage
  const [columns, setColumns] = useState(() => {
    const savedColumns = localStorage.getItem('project_columns');
    return savedColumns ? JSON.parse(savedColumns) : initialColumns;
  });
  
  const [editingColumn, setEditingColumn] = useState(null);
  const [tempColumnName, setTempColumnName] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  // Status filter state - Load from localStorage
  const [statusFilter, setStatusFilter] = useState(() => {
    const savedFilter = localStorage.getItem('status_filter');
    return savedFilter || "All Status";
  });

  // Status colors mapping
  const statusColors = {
    'Planning': 'bg-blue-100 text-blue-800',
    'In Progress': 'bg-yellow-100 text-yellow-800',
    'Completed': 'bg-green-100 text-green-800',
    'On Hold': 'bg-gray-100 text-gray-800',
    'Delayed': 'bg-red-100 text-red-800'
  };

  // Status icons mapping
  const statusIcons = {
    'Planning': Clock,
    'In Progress': AlertTriangle,
    'Completed': CheckCircle,
    'On Hold': Clock,
    'Delayed': AlertTriangle
  };

  const statusOptions = ['Planning', 'In Progress', 'Completed', 'On Hold', 'Delayed'];

  // Save projects and columns to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('projects', JSON.stringify(projects));
    localStorage.setItem('project_columns', JSON.stringify(columns));
  }, [projects, columns]);

  // Save status filter preference
  useEffect(() => {
    localStorage.setItem('status_filter', statusFilter);
  }, [statusFilter]);

  // Get unique status from projects data
  const uniqueStatus = ["All Status", ...new Set(projects.map(project => project.status).filter(Boolean))];

  // Filter projects based on search and status
  const filteredProjects = projects.filter(project => {
    // Search filter
    const matchesSearch = Object.values(project).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Status filter
    const matchesStatus = 
      statusFilter === "All Status" || 
      project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate project statistics
  const activeProjects = projects.filter(p => p.status === 'In Progress').length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const completionRate = projects.length > 0 
    ? Math.round((completedProjects / projects.length) * 100)
    : 0;

  // Sort projects
  const sortedProjects = React.useMemo(() => {
    if (!sortConfig.key) return filteredProjects;

    return [...filteredProjects].sort((a, b) => {
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
  }, [filteredProjects, sortConfig]);

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

  // Validate project form
  const validateProjectForm = (project) => {
    const requiredColumns = columns.filter(col => col.required && col.visible);
    
    for (const column of requiredColumns) {
      if (!project[column.id]?.toString().trim()) {
        return `${column.label} is required`;
      }
      if (column.type === 'number') {
        const numValue = parseFloat(project[column.id]);
        if (isNaN(numValue) || numValue < 0) {
          return `${column.label} must be a valid positive number`;
        }
      }
    }
    return '';
  };

  // Handle Add Project button click
  const handleAddProjectClick = () => {
    setIsAddingNew(true);
    // Initialize empty new project with default values for all visible columns
    const initialProject = {};
    columns.filter(col => col.visible).forEach(col => {
      if (col.id === 'status') {
        initialProject[col.id] = 'Planning';
      } else if (col.type === 'number') {
        initialProject[col.id] = 0;
      } else {
        initialProject[col.id] = '';
      }
    });
    setNewProject(initialProject);
  };

  // Save new project from bottom row
  const saveNewProject = () => {
    const error = validateProjectForm(newProject);
    if (error) {
      alert(error);
      return;
    }

    const newId = Math.max(...projects.map(p => p.id), 0) + 1;
    const projectToAdd = { 
      ...newProject,
      id: newId,
      budget: parseFloat(newProject.budget) || 0,
      teamSize: parseInt(newProject.teamSize) || 0
    };
    
    // Ensure all columns have values
    columns.forEach(col => {
      if (!projectToAdd.hasOwnProperty(col.id)) {
        if (col.id === 'status') {
          projectToAdd[col.id] = 'Planning';
        } else if (col.type === 'number') {
          projectToAdd[col.id] = 0;
        } else {
          projectToAdd[col.id] = '';
        }
      }
    });
    
    setProjects([...projects, projectToAdd]);
    
    // Reset new project form
    const emptyProject = {};
    columns.filter(col => col.visible).forEach(col => {
      if (col.id === 'status') {
        emptyProject[col.id] = 'Planning';
      } else if (col.type === 'number') {
        emptyProject[col.id] = 0;
      } else {
        emptyProject[col.id] = '';
      }
    });
    setNewProject(emptyProject);
  };

  // Cancel adding new project
  const cancelNewProject = () => {
    setIsAddingNew(false);
    setNewProject({});
  };

  // Show delete prompt
  const showDeleteConfirmation = (id, name) => {
    setShowDeletePrompt({ id, name });
  };

  // Confirm delete project
  const confirmDeleteProject = () => {
    if (showDeletePrompt) {
      setProjects(projects.filter(project => project.id !== showDeletePrompt.id));
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
      
      // Add default value for this column to all existing projects
      let defaultValue = '';
      if (newColumnType === 'select') {
        defaultValue = 'Planning';
      } else if (newColumnType === 'number') {
        defaultValue = 0;
      }
      
      setProjects(projects.map(project => ({
        ...project,
        [newColumnId]: defaultValue
      })));
      
      // Also add to newProject if it exists
      if (isAddingNew) {
        setNewProject(prev => ({
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
    if (window.confirm('Are you sure you want to delete this column? This will remove this column from all projects.')) {
      setColumns(columns.filter(col => col.id !== columnId));
      
      // Remove this column from all projects
      setProjects(projects.map(project => {
        const newProject = { ...project };
        delete newProject[columnId];
        return newProject;
      }));
      
      // Remove from newProject if it exists
      if (isAddingNew) {
        const newProj = { ...newProject };
        delete newProj[columnId];
        setNewProject(newProj);
      }
    }
  };

  // Toggle column visibility
  const toggleColumnVisibility = (columnId) => {
    setColumns(columns.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  };

  // Start editing project
  const startEditing = (project) => {
    // Cancel any current add operation
    if (isAddingNew) {
      setIsAddingNew(false);
      setNewProject({});
    }
    
    setEditingId(project.id);
    const editData = { ...project };
    columns.forEach(col => {
      if (!editData.hasOwnProperty(col.id)) {
        if (col.id === 'status') {
          editData[col.id] = 'Planning';
        } else if (col.type === 'number') {
          editData[col.id] = 0;
        } else {
          editData[col.id] = '';
        }
      }
    });
    setEditForm(editData);
  };

  // Save project edit
  const saveEdit = () => {
    const error = validateProjectForm(editForm);
    if (error) {
      alert(error);
      return;
    }
    
    setProjects(projects.map(project => 
      project.id === editingId ? { ...project, ...editForm } : project
    ));
    setEditingId(null);
    setEditForm({});
  };

  // Cancel project edit
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Handle new project input change
  const handleNewProjectChange = (field, value) => {
    setNewProject({...newProject, [field]: value});
  };

  // Handle edit form change
  const handleEditFormChange = (field, value) => {
    setEditForm({...editForm, [field]: value});
  };

  // Handle status filter change
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
  };

  // Render input based on column type
  const renderInput = (column, value, onChange, placeholder = true) => {
    if (column.id === 'status' || column.type === 'select') {
      return (
        <select
          value={value || 'Planning'}
          onChange={(e) => onChange(column.id, e.target.value)}
          className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
        >
          {statusOptions.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
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
          min="0"
          step={column.id === 'budget' ? "1000" : "1"}
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
  const renderCellContent = (column, value, project) => {
    if (column.id === 'status') {
      const StatusIcon = statusIcons[value] || Clock;
      return (
        <div className="flex items-center">
          <StatusIcon className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 ${
            value === 'Completed' ? 'text-green-500' :
            value === 'In Progress' ? 'text-yellow-500' :
            value === 'Planning' ? 'text-blue-500' :
            value === 'Delayed' ? 'text-red-500' : 'text-gray-500'
          }`} />
          <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs ${statusColors[value] || 'bg-gray-100 text-gray-800'}`}>
            {value || '-'}
          </span>
        </div>
      );
    } else if (column.id === 'budget') {
      return (
        <div className="flex items-center">
          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 mr-1" />
          <span className="font-medium">${(value || 0).toLocaleString()}</span>
        </div>
      );
    } else if (column.id === 'teamSize') {
      return (
        <div className="flex items-center">
          <Users className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 mr-1" />
          <span>{value || 0}</span>
        </div>
      );
    } else if (column.id === 'timeline') {
      return (
        <div className="flex items-center">
          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 mr-1" />
          <span>{value || '-'}</span>
        </div>
      );
    }
    return value || '-';
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Delete Project Prompt Modal */}
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
                Are you sure you want to delete project <span className="font-medium">{showDeletePrompt.name}</span>?
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
                onClick={confirmDeleteProject}
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
            <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Project Master
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">Manage all projects, budgets, and timelines</p>
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
            <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500">Total Projects</p>
            <p className="text-sm sm:text-base font-bold text-gray-900">{projects.length}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-300 rounded p-3 sm:p-4 flex items-center">
          <div className="bg-blue-100 p-1.5 sm:p-2 rounded mr-2 sm:mr-3">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500">Active</p>
            <p className="text-sm sm:text-base font-bold text-blue-600">
              {activeProjects}
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-300 rounded p-3 sm:p-4 flex items-center">
          <div className="bg-green-100 p-1.5 sm:p-2 rounded mr-2 sm:mr-3">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500">Total Budget</p>
            <p className="text-sm sm:text-base font-bold text-green-600">
              ${totalBudget.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-300 rounded p-3 sm:p-4 flex items-center">
          <div className="bg-purple-100 p-1.5 sm:p-2 rounded mr-2 sm:mr-3">
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500">Completion Rate</p>
            <p className="text-sm sm:text-base font-bold text-purple-600">
              {completionRate}%
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <button className="flex items-center space-x-2 p-3 bg-white border border-gray-300 rounded hover:bg-gray-50">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          <span className="text-xs sm:text-sm">Project Calendar</span>
        </button>
        <button className="flex items-center space-x-2 p-3 bg-white border border-gray-300 rounded hover:bg-gray-50">
          <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
          <span className="text-xs sm:text-sm">Budget Reports</span>
        </button>
        <button className="flex items-center space-x-2 p-3 bg-white border border-gray-300 rounded hover:bg-gray-50">
          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
          <span className="text-xs sm:text-sm">Assign Team</span>
        </button>
        <button className="flex items-center space-x-2 p-3 bg-white border border-gray-300 rounded hover:bg-gray-50">
          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
          <span className="text-xs sm:text-sm">Reports</span>
        </button>
      </div> */}

      {/* Table Container with Toolbar */}
      <div className="bg-white border border-gray-300 rounded p-3 sm:p-4">
        {/* Toolbar with Search, Add Project, Add Columns */}
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
            
            {/* Add Project Button - Black */}
            <button
              onClick={handleAddProjectClick}
              className="flex items-center justify-center space-x-1 px-3 py-2 text-xs sm:text-sm bg-black text-white rounded hover:bg-gray-800 w-full sm:w-auto"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Add Project</span>
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
              {/* Existing projects */}
              {sortedProjects.map((project) => (
                <tr key={project.id} className="border-b border-gray-200 hover:bg-gray-50">
                  {editingId === project.id ? (
                    <>
                      {/* Edit mode for visible columns */}
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
                    </>
                  ) : (
                    <>
                      {/* View mode for visible columns */}
                      {columns
                        .filter(col => col.visible)
                        .map((column) => (
                          <td key={column.id} className="py-2 px-2 sm:px-3">
                            {renderCellContent(column, project[column.id], project)}
                          </td>
                        ))}
                      <td className="py-2 px-2 sm:px-3">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => startEditing(project)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                          <button 
                            onClick={() => showDeleteConfirmation(project.id, project.name)}
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

              {/* Add new project row at the bottom */}
              {isAddingNew && (
                <tr className="border-b border-gray-200 bg-blue-50">
                  {columns
                    .filter(col => col.visible)
                    .map((column) => (
                      <td key={column.id} className="py-2 px-2 sm:px-3">
                        {renderInput(column, newProject[column.id], handleNewProjectChange)}
                      </td>
                    ))}
                  <td className="py-2 px-2 sm:px-3">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={saveNewProject}
                        className="p-1 text-green-600 hover:text-green-800"
                        title="Save"
                      >
                        <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                      <button 
                        onClick={cancelNewProject}
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
            Showing {sortedProjects.length} of {projects.length} projects
            {statusFilter !== "All Status" && ` (Filtered by ${statusFilter})`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectMaster;