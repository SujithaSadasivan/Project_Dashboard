import React, { useState, useEffect } from 'react';
import { 
  Package, Hash, Box, Tag, Filter, BarChart, 
  Plus, Search, Edit, Trash2, X, Check, 
  ChevronUp, ChevronDown, Download, Columns,
  AlertTriangle, TrendingUp, DollarSign
} from 'lucide-react';

const PartMaster = () => {
  // Initial columns configuration
  const initialColumns = [
    { id: 'id', label: 'Part ID', visible: true, sortable: true, type: 'text', required: true, deletable: false },
    { id: 'name', label: 'Part Name', visible: true, sortable: true, type: 'text', required: true, deletable: false },
    { id: 'category', label: 'Category', visible: true, sortable: true, type: 'text', required: false, deletable: false },
    { id: 'stock', label: 'Stock', visible: true, sortable: true, type: 'number', required: true, deletable: false },
    { id: 'reorderLevel', label: 'Reorder Level', visible: true, sortable: true, type: 'number', required: false, deletable: false },
    { id: 'price', label: 'Price', visible: true, sortable: true, type: 'number', required: true, deletable: false },
    { id: 'status', label: 'Status', visible: true, sortable: true, type: 'select', required: false, deletable: false },
  ];

  // Load parts from localStorage on component mount
  const [parts, setParts] = useState(() => {
    const savedParts = localStorage.getItem('parts');
    return savedParts ? JSON.parse(savedParts) : [
      { id: 'P001', name: 'CPU Processor', category: 'Electronics', stock: 150, reorderLevel: 50, price: 299.99, status: 'In Stock' },
      { id: 'P002', name: '16GB RAM Module', category: 'Memory', stock: 85, reorderLevel: 30, price: 89.99, status: 'In Stock' },
      { id: 'P003', name: '1TB SSD', category: 'Storage', stock: 42, reorderLevel: 20, price: 129.99, status: 'Reorder' },
    ];
  });
  
  const [newPart, setNewPart] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showDeletePrompt, setShowDeletePrompt] = useState(null);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('text');
  
  // Load columns from localStorage
  const [columns, setColumns] = useState(() => {
    const savedColumns = localStorage.getItem('part_columns');
    return savedColumns ? JSON.parse(savedColumns) : initialColumns;
  });
  
  const [editingColumn, setEditingColumn] = useState(null);
  const [tempColumnName, setTempColumnName] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  // Category filter state - Load from localStorage
  const [categoryFilter, setCategoryFilter] = useState(() => {
    const savedFilter = localStorage.getItem('category_filter');
    return savedFilter || "All Categories";
  });

  // Save parts and columns to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('parts', JSON.stringify(parts));
    localStorage.setItem('part_columns', JSON.stringify(columns));
  }, [parts, columns]);

  // Save category filter preference
  useEffect(() => {
    localStorage.setItem('category_filter', categoryFilter);
  }, [categoryFilter]);

  // Get unique categories from parts data
  const uniqueCategories = ["All Categories", ...new Set(parts.map(part => part.category).filter(Boolean))];

  // Filter parts based on search and category
  const filteredParts = parts.filter(part => {
    // Search filter
    const matchesSearch = Object.values(part).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Category filter
    const matchesCategory = 
      categoryFilter === "All Categories" || 
      part.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Calculate low stock parts
  const lowStockParts = parts.filter(part => part.stock <= part.reorderLevel);

  // Sort parts
  const sortedParts = React.useMemo(() => {
    if (!sortConfig.key) return filteredParts;

    return [...filteredParts].sort((a, b) => {
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
  }, [filteredParts, sortConfig]);

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

  // Validate part form
  const validatePartForm = (part) => {
    const requiredColumns = columns.filter(col => col.required && col.visible);
    
    for (const column of requiredColumns) {
      if (!part[column.id]?.toString().trim()) {
        return `${column.label} is required`;
      }
      if (column.type === 'number') {
        const numValue = parseFloat(part[column.id]);
        if (isNaN(numValue) || numValue < 0) {
          return `${column.label} must be a valid positive number`;
        }
      }
    }
    return '';
  };

  // Handle Add Part button click
  const handleAddPartClick = () => {
    setIsAddingNew(true);
    // Initialize empty new part with default values for all visible columns
    const initialPart = {};
    columns.filter(col => col.visible).forEach(col => {
      if (col.id === 'status') {
        initialPart[col.id] = 'In Stock';
      } else if (col.type === 'number') {
        initialPart[col.id] = 0;
      } else {
        initialPart[col.id] = '';
      }
    });
    setNewPart(initialPart);
  };

  // Save new part from bottom row
  const saveNewPart = () => {
    const error = validatePartForm(newPart);
    if (error) {
      alert(error);
      return;
    }

    // Generate unique ID if not provided
    let partId = newPart.id;
    if (!partId.trim()) {
      const maxId = parts.reduce((max, part) => {
        const num = parseInt(part.id.replace('P', ''));
        return num > max ? num : max;
      }, 0);
      partId = `P${String(maxId + 1).padStart(3, '0')}`;
    }

    const partToAdd = { 
      ...newPart,
      id: partId,
      stock: parseInt(newPart.stock) || 0,
      reorderLevel: parseInt(newPart.reorderLevel) || 0,
      price: parseFloat(newPart.price) || 0,
      status: newPart.stock <= newPart.reorderLevel ? 'Reorder' : 'In Stock'
    };
    
    // Ensure all columns have values
    columns.forEach(col => {
      if (!partToAdd.hasOwnProperty(col.id)) {
        if (col.id === 'status') {
          partToAdd[col.id] = 'In Stock';
        } else if (col.type === 'number') {
          partToAdd[col.id] = 0;
        } else {
          partToAdd[col.id] = '';
        }
      }
    });
    
    setParts([...parts, partToAdd]);
    
    // Reset new part form
    const emptyPart = {};
    columns.filter(col => col.visible).forEach(col => {
      if (col.id === 'status') {
        emptyPart[col.id] = 'In Stock';
      } else if (col.type === 'number') {
        emptyPart[col.id] = 0;
      } else {
        emptyPart[col.id] = '';
      }
    });
    setNewPart(emptyPart);
  };

  // Cancel adding new part
  const cancelNewPart = () => {
    setIsAddingNew(false);
    setNewPart({});
  };

  // Show delete prompt
  const showDeleteConfirmation = (id, name) => {
    setShowDeletePrompt({ id, name });
  };

  // Confirm delete part
  const confirmDeletePart = () => {
    if (showDeletePrompt) {
      setParts(parts.filter(part => part.id !== showDeletePrompt.id));
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
      
      // Add default value for this column to all existing parts
      let defaultValue = '';
      if (newColumnType === 'select') {
        defaultValue = 'In Stock';
      } else if (newColumnType === 'number') {
        defaultValue = 0;
      }
      
      setParts(parts.map(part => ({
        ...part,
        [newColumnId]: defaultValue
      })));
      
      // Also add to newPart if it exists
      if (isAddingNew) {
        setNewPart(prev => ({
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
    if (window.confirm('Are you sure you want to delete this column? This will remove this column from all parts.')) {
      setColumns(columns.filter(col => col.id !== columnId));
      
      // Remove this column from all parts
      setParts(parts.map(part => {
        const newPart = { ...part };
        delete newPart[columnId];
        return newPart;
      }));
      
      // Remove from newPart if it exists
      if (isAddingNew) {
        const newEmp = { ...newPart };
        delete newEmp[columnId];
        setNewPart(newEmp);
      }
    }
  };

  // Toggle column visibility
  const toggleColumnVisibility = (columnId) => {
    setColumns(columns.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  };

  // Start editing part
  const startEditing = (part) => {
    // Cancel any current add operation
    if (isAddingNew) {
      setIsAddingNew(false);
      setNewPart({});
    }
    
    setEditingId(part.id);
    const editData = { ...part };
    columns.forEach(col => {
      if (!editData.hasOwnProperty(col.id)) {
        if (col.id === 'status') {
          editData[col.id] = 'In Stock';
        } else if (col.type === 'number') {
          editData[col.id] = 0;
        } else {
          editData[col.id] = '';
        }
      }
    });
    setEditForm(editData);
  };

  // Save part edit
  const saveEdit = () => {
    const error = validatePartForm(editForm);
    if (error) {
      alert(error);
      return;
    }
    
    // Update status based on stock and reorder level
    const updatedEditForm = {
      ...editForm,
      status: editForm.stock <= editForm.reorderLevel ? 'Reorder' : 'In Stock'
    };
    
    setParts(parts.map(part => 
      part.id === editingId ? { ...part, ...updatedEditForm } : part
    ));
    setEditingId(null);
    setEditForm({});
  };

  // Cancel part edit
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Handle new part input change
  const handleNewPartChange = (field, value) => {
    const updatedPart = { ...newPart, [field]: value };
    
    // Auto-update status if stock or reorder level changes
    if (field === 'stock' || field === 'reorderLevel') {
      const stock = parseInt(updatedPart.stock) || 0;
      const reorderLevel = parseInt(updatedPart.reorderLevel) || 0;
      updatedPart.status = stock <= reorderLevel ? 'Reorder' : 'In Stock';
    }
    
    setNewPart(updatedPart);
  };

  // Handle edit form change
  const handleEditFormChange = (field, value) => {
    const updatedForm = { ...editForm, [field]: value };
    
    // Auto-update status if stock or reorder level changes
    if (field === 'stock' || field === 'reorderLevel') {
      const stock = parseInt(updatedForm.stock) || 0;
      const reorderLevel = parseInt(updatedForm.reorderLevel) || 0;
      updatedForm.status = stock <= reorderLevel ? 'Reorder' : 'In Stock';
    }
    
    setEditForm(updatedForm);
  };

  // Handle category filter change
  const handleCategoryFilterChange = (category) => {
    setCategoryFilter(category);
  };

  // Render input based on column type
  const renderInput = (column, value, onChange, placeholder = true) => {
    if (column.type === 'select' || column.id === 'status') {
      return (
        <select
          value={value || 'In Stock'}
          onChange={(e) => onChange(column.id, e.target.value)}
          className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
        >
          <option value="In Stock">In Stock</option>
          <option value="Reorder">Reorder</option>
          <option value="Out of Stock">Out of Stock</option>
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
          step={column.id === 'price' ? "0.01" : "1"}
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
  const renderCellContent = (column, value, part) => {
    if (column.id === 'status') {
      const isLowStock = part.stock <= part.reorderLevel;
      return (
        <div className="flex items-center">
          {isLowStock ? (
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 mr-1" />
          ) : (
            <Box className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1" />
          )}
          <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs ${
            isLowStock 
              ? 'bg-red-100 text-red-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {value || '-'}
          </span>
        </div>
      );
    } else if (column.id === 'price') {
      return (
        <div className="flex items-center">
          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 mr-1" />
          <span className="font-medium">${parseFloat(value || 0).toFixed(2)}</span>
        </div>
      );
    } else if (column.id === 'stock' || column.id === 'reorderLevel') {
      const isLowStock = column.id === 'stock' && part.stock <= part.reorderLevel;
      return (
        <div className="flex items-center">
          {column.id === 'stock' && (
            isLowStock ? (
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 mr-1" />
            ) : (
              <Box className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1" />
            )
          )}
          <span className={isLowStock ? 'text-red-600 font-medium' : ''}>
            {value || 0}
          </span>
        </div>
      );
    } else if (column.id === 'category') {
      return (
        <span className="px-2 py-1 bg-gray-100 rounded text-[10px] sm:text-xs">
          {value || '-'}
        </span>
      );
    } else if (column.id === 'id') {
      return (
        <span className="font-mono text-xs sm:text-sm">{value}</span>
      );
    }
    return value || '-';
  };

  // Calculate total inventory value
  const totalInventoryValue = parts.reduce((sum, part) => sum + (part.price * part.stock), 0);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Delete Part Prompt Modal */}
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
                Are you sure you want to delete part <span className="font-medium">{showDeletePrompt.name}</span>?
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
                onClick={confirmDeletePart}
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
            <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Part Master
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">Manage inventory, parts, and components</p>
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
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500">Total Parts</p>
            <p className="text-sm sm:text-base font-bold text-gray-900">{parts.length}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-300 rounded p-3 sm:p-4 flex items-center">
          <div className="bg-green-100 p-1.5 sm:p-2 rounded mr-2 sm:mr-3">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500">Total Value</p>
            <p className="text-sm sm:text-base font-bold text-green-600">
              ${totalInventoryValue.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-300 rounded p-3 sm:p-4 flex items-center">
          <div className="bg-red-100 p-1.5 sm:p-2 rounded mr-2 sm:mr-3">
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500">Low Stock</p>
            <p className="text-sm sm:text-base font-bold text-red-600">
              {lowStockParts.length}
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-300 rounded p-3 sm:p-4 flex items-center">
          <div className="bg-blue-100 p-1.5 sm:p-2 rounded mr-2 sm:mr-3">
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500">Categories</p>
            <p className="text-sm sm:text-base font-bold text-blue-600">
              {uniqueCategories.length - 1} {/* Subtract "All Categories" */}
            </p>
          </div>
        </div>
      </div>

      {/* Table Container with Toolbar */}
      <div className="bg-white border border-gray-300 rounded p-3 sm:p-4">
        {/* Toolbar with Search, Add Part, Add Columns */}
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
            
            {/* Add Part Button - Black */}
            <button
              onClick={handleAddPartClick}
              className="flex items-center justify-center space-x-1 px-3 py-2 text-xs sm:text-sm bg-black text-white rounded hover:bg-gray-800 w-full sm:w-auto"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Add Part</span>
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
          
          {/* Category Filter with Blue Icon */}
          <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => handleCategoryFilterChange(e.target.value)}
                className="w-full sm:w-auto pl-8 pr-8 py-2 text-xs sm:text-sm border border-gray-300 rounded appearance-none bg-white"
              >
                {uniqueCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
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

            {/* Low Stock Alert Button
            <button 
              onClick={() => setCategoryFilter("All Categories")}
              className={`px-3 py-2 text-xs sm:text-sm border rounded ${
                lowStockParts.length > 0 
                  ? 'bg-red-100 text-red-800 border-red-300' 
                  : 'bg-gray-100 text-gray-800 border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-1">
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Low Stock ({lowStockParts.length})</span>
              </div>
            </button> */}
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
              {/* Existing parts */}
              {sortedParts.map((part) => (
                <tr key={part.id} className="border-b border-gray-200 hover:bg-gray-50">
                  {editingId === part.id ? (
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
                            {renderCellContent(column, part[column.id], part)}
                          </td>
                        ))}
                      <td className="py-2 px-2 sm:px-3">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => startEditing(part)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                          <button 
                            onClick={() => showDeleteConfirmation(part.id, part.name)}
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

              {/* Add new part row at the bottom */}
              {isAddingNew && (
                <tr className="border-b border-gray-200 bg-blue-50">
                  {columns
                    .filter(col => col.visible)
                    .map((column) => (
                      <td key={column.id} className="py-2 px-2 sm:px-3">
                        {renderInput(column, newPart[column.id], handleNewPartChange)}
                      </td>
                    ))}
                  <td className="py-2 px-2 sm:px-3">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={saveNewPart}
                        className="p-1 text-green-600 hover:text-green-800"
                        title="Save"
                      >
                        <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                      <button 
                        onClick={cancelNewPart}
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
            Showing {sortedParts.length} of {parts.length} parts
            {categoryFilter !== "All Categories" && ` (Filtered by ${categoryFilter})`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartMaster;