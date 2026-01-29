import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X, Check, ChevronUp, ChevronDown, Filter } from 'lucide-react';
import axios from 'axios';

const EmployeeMaster = () => {
  // Fixed columns matching backend Employee model
  const columns = [
    { id: 'name', label: 'Name', sortable: true, type: 'text', required: true },
    { id: 'email', label: 'Email', sortable: true, type: 'email', required: true },
    { id: 'department', label: 'Department', sortable: true, type: 'text', required: false },
    { id: 'role', label: 'Role', sortable: true, type: 'text', required: false },
    { id: 'status', label: 'Status', sortable: true, type: 'select', required: true },
  ];

  // Load columns from localStorage for column management
  const [availableColumns, setAvailableColumns] = useState(() => {
    const savedColumns = localStorage.getItem('employee_columns');
    return savedColumns ? JSON.parse(savedColumns) : columns;
  });

  const [employees, setEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState({});
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showDeletePrompt, setShowDeletePrompt] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('text');
  const [editingColumn, setEditingColumn] = useState(null);
  const [tempColumnName, setTempColumnName] = useState('');

  const API_URL = 'http://localhost:8000/api/employees';

  // Fetch employees from backend
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Save columns to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('employee_columns', JSON.stringify(availableColumns));
  }, [availableColumns]);

  const fetchEmployees = () => {
    axios.get(API_URL)
      .then(res => setEmployees(res.data))
      .catch(err => console.error('Error fetching employees:', err));
  };

  // Column editing functions
  const startEditColumn = (columnId, currentLabel) => {
    setEditingColumn(columnId);
    setTempColumnName(currentLabel);
  };

  const saveEditColumn = (columnId) => {
    if (tempColumnName.trim()) {
      setAvailableColumns(availableColumns.map(col => 
        col.id === columnId ? { ...col, label: tempColumnName } : col
      ));
      setEditingColumn(null);
      setTempColumnName('');
    }
  };

  const cancelEditColumn = () => {
    setEditingColumn(null);
    setTempColumnName('');
  };

  const handleDeleteColumn = (columnId) => {
    const column = availableColumns.find(col => col.id === columnId);
    const isFixedColumn = ['name', 'email', 'status', 'department', 'role'].includes(columnId);
    
    if (isFixedColumn) {
      alert(`Cannot delete fixed column: ${column.label}. Fixed columns are required for the Employee Master.`);
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete column "${column.label}"? This will remove this column from all employees.`)) {
      setAvailableColumns(availableColumns.filter(col => col.id !== columnId));
      
      // Remove this column from newEmployee if it exists
      if (isAddingNew) {
        const newEmployeeData = { ...newEmployee };
        delete newEmployeeData[columnId];
        setNewEmployee(newEmployeeData);
      }
    }
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

  // Validation
  const validateEmployeeForm = (employee) => {
    for (const col of availableColumns) {
      if (col.required && !employee[col.id]?.toString().trim()) return `${col.label} is required`;
      if (col.type === 'email' && !employee[col.id].includes('@')) return 'Please enter a valid email address';
    }
    return '';
  };

  // Add Employee
  const handleAddEmployeeClick = () => {
    setIsAddingNew(true);
    const initialEmployee = {};
    availableColumns.forEach(col => {
      if (col.id === 'status') {
        initialEmployee[col.id] = 'Active';
      } else {
        initialEmployee[col.id] = '';
      }
    });
    setNewEmployee(initialEmployee);
  };

  const saveNewEmployee = () => {
    const error = validateEmployeeForm(newEmployee);
    if (error) { alert(error); return; }

    axios.post(API_URL, newEmployee)
      .then(() => { fetchEmployees(); setIsAddingNew(false); 
        const initialEmployee = {};
        availableColumns.forEach(col => {
          if (col.id === 'status') {
            initialEmployee[col.id] = 'Active';
          } else {
            initialEmployee[col.id] = '';
          }
        });
        setNewEmployee(initialEmployee);
      })
      .catch(err => alert('Error saving employee: ' + err.message));
  };

  const cancelNewEmployee = () => { 
    setIsAddingNew(false); 
    const initialEmployee = {};
    availableColumns.forEach(col => {
      if (col.id === 'status') {
        initialEmployee[col.id] = 'Active';
      } else {
        initialEmployee[col.id] = '';
      }
    });
    setNewEmployee(initialEmployee);
  };

  // Edit Employee
  const startEditing = (emp) => {
    if (isAddingNew) cancelNewEmployee();
    setEditingId(emp.id);
    setEditForm({ ...emp });
  };

  const saveEdit = () => {
    const error = validateEmployeeForm(editForm);
    if (error) { alert(error); return; }

    axios.put(`${API_URL}/${editingId}`, editForm)
      .then(() => { fetchEmployees(); setEditingId(null); setEditForm({}); })
      .catch(err => alert('Error updating employee: ' + err.message));
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  // Delete Employee
  const showDeleteConfirmation = (id, name) => setShowDeletePrompt({ id, name });

  const confirmDeleteEmployee = () => {
    if (!showDeletePrompt) return;

    axios.delete(`${API_URL}/${showDeletePrompt.id}`)
      .then(() => { fetchEmployees(); setShowDeletePrompt(null); })
      .catch(err => alert('Error deleting employee: ' + err.message));
  };

  const cancelDelete = () => setShowDeletePrompt(null);

  // Add new column
  const handleAddColumn = () => {
    if (newColumnName.trim()) {
      const newColumnId = newColumnName.toLowerCase().replace(/\s+/g, '_');
      
      // Check if column already exists
      if (availableColumns.find(col => col.id === newColumnId)) {
        alert('Column with this name already exists');
        return;
      }
      
      const newColumn = {
        id: newColumnId,
        label: newColumnName,
        sortable: true,
        type: newColumnType,
        required: false
      };
      
      setAvailableColumns([...availableColumns, newColumn]);
      
      // Reset form
      setNewColumnName('');
      setNewColumnType('text');
    }
  };

  // Render Input Fields
  const handleInputChange = (field, value, isEdit=false) => {
    isEdit ? setEditForm({ ...editForm, [field]: value }) : setNewEmployee({ ...newEmployee, [field]: value });
  };

  const renderInput = (col, value, onChange) => {
    if (col.id === 'status' || col.type === 'select') return (
      <select value={value||'Active'} onChange={e=>onChange(col.id,e.target.value)} className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded">
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
        <option value="Pending">Pending</option>
      </select>
    );
    if (col.type === 'email') return (
      <input type="email" value={value||''} onChange={e=>onChange(col.id,e.target.value)} className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded" />
    );
    if (col.type === 'number') return (
      <input type="number" value={value||''} onChange={e=>onChange(col.id,e.target.value)} className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded" min="0" />
    );
    return <input type="text" value={value||''} onChange={e=>onChange(col.id,e.target.value)} className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded" />;
  };

  const renderCellContent = (col, value) => {
    if (col.id === 'status') return <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs ${value==='Active'?'bg-green-100 text-green-800':value==='Inactive'?'bg-red-100 text-red-800':'bg-gray-100 text-gray-800'}`}>{value||'-'}</span>;
    return value||'-';
  };

  // Filter & Sort
  const uniqueDepartments = ["All Departments", ...new Set(employees.map(emp=>emp.department).filter(Boolean))];
  const statusOptions = ['All Status', 'Active', 'Inactive', 'Pending'];

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = Object.values(emp).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDept = departmentFilter === 'All Departments' || emp.department === departmentFilter;
    const matchesStatus = statusFilter === 'All Status' || emp.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const sortedEmployees = React.useMemo(() => {
    if (!sortConfig.key) return filteredEmployees;
    return [...filteredEmployees].sort((a,b)=>{
      const aVal = a[sortConfig.key]||'';
      const bVal = b[sortConfig.key]||'';
      if(aVal<bVal) return sortConfig.direction==='ascending'?-1:1;
      if(aVal>bVal) return sortConfig.direction==='ascending'?1:-1;
      return 0;
    });
  }, [filteredEmployees, sortConfig]);

  return (
    <div className="space-y-3 sm:space-y-4">

      {/* Delete Modal */}
      {showDeletePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Confirm Delete</h3>
              <button onClick={cancelDelete} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4 sm:h-5 sm:w-5"/></button>
            </div>
            <div className="mb-4">
              <p className="text-xs sm:text-sm text-gray-600">Delete employee <span className="font-medium">{showDeletePrompt.name}</span>?</p>
              <p className="text-xs text-red-600 mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={cancelDelete} className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDeleteEmployee} className="px-3 py-1.5 text-xs sm:text-sm bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
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
              <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Add New Custom Column</h4>
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
                {availableColumns.map((column) => {
                  const isFixedColumn = ['name', 'email', 'status', 'department', 'role'].includes(column.id);
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
                        {/* Edit button for all columns */}
                        {!isEditing && (
                          <button
                            onClick={() => startEditColumn(column.id, column.label)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        )}
                        
                        {/* Delete button - show warning for required columns */}
                        <button
                          onClick={() => {
                            if (isFixedColumn) {
                              alert(`Cannot delete fixed column: ${column.label}. Fixed columns are required for the Employee Master.`);
                              return;
                            }
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
                  );
                })}
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

      {/* Toolbar with Search, Add Employee, Add Columns */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={e=>setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded"
            />
          </div>
          
          {/* Add Employee Button - Black */}
          <button
            onClick={handleAddEmployeeClick}
            className="flex items-center justify-center space-x-1 px-3 py-2 text-xs sm:text-sm bg-black text-white rounded hover:bg-gray-800 w-full sm:w-auto"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Add Employee</span>
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
        
         {/* Department Search Filter */}
          <div className="relative w-full sm:w-48">
            <svg 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-blue-500 pointer-events-none"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <input
              type="text"
              placeholder="Filter by department..."
              value={departmentFilter === 'All Departments' ? '' : departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value || 'All Departments')}
              className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded"
            />
            {departmentFilter !== 'All Departments' && departmentFilter !== '' && (
              <button
                onClick={() => setDepartmentFilter('All Departments')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            )}
          </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-300 rounded p-3 sm:p-4">
        <div className="table-scroll-container">
          <table className="min-w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-300 bg-white">
                {availableColumns.map(col=>(
                  <th key={col.id} className="text-left py-2 px-2 sm:px-3 font-medium text-gray-700 cursor-pointer hover:bg-gray-50 whitespace-nowrap min-w-[150px]" onClick={()=>col.sortable&&handleSort(col.id)}>
                    <div className="flex items-center justify-between">
                      <span>{col.label}</span>
                      {col.required && <span className="text-red-500">*</span>}
                      {col.sortable && getSortIcon(col.id)}
                    </div>
                  </th>
                ))}
                <th className="text-left py-2 px-2 sm:px-3 font-medium text-gray-700 whitespace-nowrap min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedEmployees.map((emp) => (
                <tr 
                  key={emp.id} 
                  className="bg-gray-100 border-b border-gray-200 hover:bg-gray-200 transition-colors"
                >
                  {editingId===emp.id ? 
                    availableColumns.map(col=>(
                      <td key={col.id} className="py-2 px-2 sm:px-3 whitespace-nowrap">
                        {renderInput(col, editForm[col.id], (f,v)=>handleInputChange(f,v,true))}
                      </td>
                    )) : 
                    availableColumns.map(col=>(
                      <td key={col.id} className="py-2 px-2 sm:px-3 whitespace-nowrap">
                        {renderCellContent(col, emp[col.id])}
                      </td>
                    ))
                  }
                  <td className="py-2 px-2 sm:px-3 whitespace-nowrap">
                    {editingId===emp.id?(
                      <div className="flex items-center space-x-2">
                        <button onClick={saveEdit} className="p-1 text-green-600 hover:text-green-800"><Check className="h-3 w-3 sm:h-4 sm:w-4"/></button>
                        <button onClick={cancelEdit} className="p-1 text-red-600 hover:text-red-800"><X className="h-3 w-3 sm:h-4 sm:w-4"/></button>
                      </div>
                    ):(
                      <div className="flex items-center space-x-2">
                        <button onClick={()=>startEditing(emp)} className="p-1 text-blue-600 hover:text-blue-800"><Edit className="h-3 w-3 sm:h-4 sm:w-4"/></button>
                        <button onClick={()=>showDeleteConfirmation(emp.id, emp.name)} className="p-1 text-red-600 hover:text-red-800"><Trash2 className="h-3 w-3 sm:h-4 sm:w-4"/></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {/* Add New Employee Row */}
              {isAddingNew && (
                <tr className="border-b border-gray-200 bg-gray-100">
                  {availableColumns.map(col=>(
                    <td key={col.id} className="py-2 px-2 sm:px-3 whitespace-nowrap">
                      {renderInput(col, newEmployee[col.id], (f,v)=>handleInputChange(f,v))}
                    </td>
                  ))}
                  <td className="py-2 px-2 sm:px-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button onClick={saveNewEmployee} className="p-1 text-green-600 hover:text-green-800"><Check className="h-3 w-3 sm:h-4 sm:w-4"/></button>
                      <button onClick={cancelNewEmployee} className="p-1 text-red-600 hover:text-red-800"><X className="h-3 w-3 sm:h-4 sm:w-4"/></button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Info */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 mt-3 pt-3 border-t border-gray-300">
          <div className="text-[10px] sm:text-xs text-gray-600">
            Showing {sortedEmployees.length} of {employees.length} employees
            {(departmentFilter !== "All Departments" || statusFilter !== "All Status") && 
              ` (Filtered${departmentFilter !== "All Departments" ? ` by Dept: ${departmentFilter}` : ''}${statusFilter !== "All Status" ? ` by Status: ${statusFilter}` : ''})`
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeMaster;