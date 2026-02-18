import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LogOut, 
  Users,
  Shield,
  FolderKanban,
  Package,
  Building,
  Upload,
  Settings,
  Database,
  MessageSquare,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Home,
  FileText,
  ChevronDown,
  ChevronRight,
  Bell,
  Search,
  Calendar,
  Clock,
  User,
  Briefcase,
  Layout,
  Layers,
  Grid,
  FolderTree,
  FileUp,
  FileCog,
  BarChart3
} from 'lucide-react';

import EmployeeMaster from "../pages/Masters/EmployeeMaster";
import EmployeeAccess from "../pages/Masters/EmployeeAccess";
import ProjectMaster from "../pages/Masters/ProjectMaster";
import PartMaster from "../pages/Masters/PartMaster";
import DepartmentMaster from "../pages/Masters/DepartmentMaster";
import Masters from "../pages/Masters/Masters";
import ProjectDashboard from "./ProjectDashboard";
import UploadTrackers from "../pages/Trackers/UploadTrackers";
import SystemSettings from "../pages/Settings/SystemSettings";
import MOMModule from "../pages/mom/MOMModule";

// ============================================================================
// SIDEBAR MANAGER
// ============================================================================
const sidebarManager = {
  loadUploadTrackerModules: () => {
    try {
      const saved = localStorage.getItem('upload_tracker_modules');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading upload tracker modules:', error);
      return [];
    }
  },
  
  loadProjectDashboardModules: () => {
    try {
      const saved = localStorage.getItem('project_dashboard_modules');
      const allModules = saved ? JSON.parse(saved) : [];
      return Array.isArray(allModules) ? allModules.filter(m => m && m.type === 'project' && m.context === 'project-dashboard') : [];
    } catch (error) {
      console.error('Error loading project dashboard modules:', error);
      return [];
    }
  }
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  
  // ==========================================================================
  // DEFAULT STATE - PROJECT DASHBOARD SELECTED, ALL SUBMODULES CLOSED
  // ==========================================================================
  const [activeModule, setActiveModule] = useState(() => {
    const saved = localStorage.getItem('active_module');
    return saved || 'project-dashboard';
  });
  
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  
  // Dynamic modules
  const [uploadTrackerModules, setUploadTrackerModules] = useState([]);
  const [projectDashboardModules, setProjectDashboardModules] = useState([]);
  
  // ==========================================================================
  // EXPANDED MODULES STATE - ALL CLOSED BY DEFAULT
  // ==========================================================================
  const [expandedModules, setExpandedModules] = useState(() => {
    // Try to load from sessionStorage first, otherwise use defaults
    const saved = sessionStorage.getItem('expanded_modules');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing expanded modules:', e);
      }
    }
    return {
      'project-dashboard': false,
      'masters': false,
      'upload-trackers': false
    };
  });
  
  const [selectedFileId, setSelectedFileId] = useState(() => {
    const saved = localStorage.getItem('selected_file_id');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return saved;
    }
  });
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifications] = useState(3);
  const [hoveredModule, setHoveredModule] = useState(null);
  
  const profileMenuRef = useRef(null);
  const sidebarRef = useRef(null);
  const [profileMenuPosition, setProfileMenuPosition] = useState({ top: 0, right: 0 });

  // ==========================================================================
  // HELPER FUNCTION TO CAPITALIZE FIRST LETTER
  // ==========================================================================
  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // ==========================================================================
  // LOAD MODULES
  // ==========================================================================
  const loadDynamicModules = () => {
    const uploadModules = sidebarManager.loadUploadTrackerModules();
    const projectModules = sidebarManager.loadProjectDashboardModules();
    
    // Capitalize project names when loading
    const capitalizedProjectModules = (Array.isArray(projectModules) ? projectModules : []).map(module => ({
      ...module,
      name: capitalizeFirstLetter(module.name || ''),
      submodules: (module.submodules || []).map(sub => ({
        ...sub,
        displayName: capitalizeFirstLetter(sub.displayName || sub.name || '')
      }))
    }));
    
    const capitalizedUploadModules = (Array.isArray(uploadModules) ? uploadModules : []).map(module => ({
      ...module,
      name: capitalizeFirstLetter(module.name || ''),
      submodules: (module.submodules || []).map(sub => ({
        ...sub,
        displayName: capitalizeFirstLetter(sub.displayName || sub.name || '')
      }))
    }));
    
    setUploadTrackerModules(capitalizedUploadModules);
    setProjectDashboardModules(capitalizedProjectModules);
  };

  useEffect(() => {
    loadDynamicModules();
  }, []);

  // Storage listeners
  useEffect(() => {
    const handleUploadTrackerUpdate = () => loadDynamicModules();
    const handleProjectDashboardUpdate = () => loadDynamicModules();
    const handleStorageChange = (e) => {
      if (e.key === 'upload_tracker_modules' || e.key === 'project_dashboard_modules') {
        loadDynamicModules();
      }
    };

    window.addEventListener('uploadTrackerUpdate', handleUploadTrackerUpdate);
    window.addEventListener('projectDashboardUpdate', handleProjectDashboardUpdate);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('uploadTrackerUpdate', handleUploadTrackerUpdate);
      window.removeEventListener('projectDashboardUpdate', handleProjectDashboardUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Save expanded state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('expanded_modules', JSON.stringify(expandedModules));
  }, [expandedModules]);

  // Save active module to localStorage
  useEffect(() => {
    localStorage.setItem('active_module', activeModule);
  }, [activeModule]);

  // Save selected file ID to localStorage
  useEffect(() => {
    if (selectedFileId !== null) {
      localStorage.setItem('selected_file_id', JSON.stringify(selectedFileId));
    } else {
      localStorage.removeItem('selected_file_id');
    }
  }, [selectedFileId]);

  // Save sidebar collapsed state
  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // DateTime
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }));
      setCurrentDate(now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }));
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Click outside for profile menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update profile menu position when opened
  useEffect(() => {
    if (profileMenuOpen && profileMenuRef.current) {
      const rect = profileMenuRef.current.getBoundingClientRect();
      setProfileMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, [profileMenuOpen]);

  // Handle window resize for profile menu
  useEffect(() => {
    const handleResize = () => {
      if (profileMenuOpen && profileMenuRef.current) {
        const rect = profileMenuRef.current.getBoundingClientRect();
        setProfileMenuPosition({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [profileMenuOpen]);

  // Open master submodule
  useEffect(() => {
    const handleOpenMasterSubmodule = (event) => {
      const { masterModuleId } = event.detail;
      handleModuleClick(masterModuleId);
      setExpandedModules(prev => ({ ...prev, 'masters': true }));
    };

    window.addEventListener('openMasterSubmodule', handleOpenMasterSubmodule);
    return () => window.removeEventListener('openMasterSubmodule', handleOpenMasterSubmodule);
  }, []);

  // Handle project dashboard file open events
  useEffect(() => {
    const handleOpenProjectDashboardFile = (event) => {
      const { trackerId, fileModule } = event.detail;
      setSelectedFileId(trackerId);
      
      // Ensure project dashboard is active and expanded
      if (activeModule !== 'project-dashboard') {
        setActiveModule('project-dashboard');
      }
      setExpandedModules(prev => ({ ...prev, 'project-dashboard': true }));
    };

    window.addEventListener('openProjectDashboardFile', handleOpenProjectDashboardFile);
    return () => window.removeEventListener('openProjectDashboardFile', handleOpenProjectDashboardFile);
  }, [activeModule]);

  // Masters submodules
  const mastersSubmodules = [
    { id: 'employee-master', name: 'Employee Master', component: <EmployeeMaster />, icon: <Users className="h-5 w-5" />, color: '#000000' },
    { id: 'employee-access', name: 'Employee Access', component: <EmployeeAccess />, icon: <Shield className="h-5 w-5" />, color: '#1a1a1a' },
    { id: 'project-master', name: 'Project Master', component: <ProjectMaster />, icon: <FolderKanban className="h-5 w-5" />, color: '#333333' },
    { id: 'part-master', name: 'Part Master', component: <PartMaster />, icon: <Package className="h-5 w-5" />, color: '#4d4d4d' },
    { id: 'department-master', name: 'Department Master', component: <DepartmentMaster />, icon: <Building className="h-5 w-5" />, color: '#666666' },
  ];

  const mastersModules = [
    { id: 'masters-main', name: 'Masters', component: <Masters />, icon: <Database className="h-5 w-5" /> },
  ];

  const otherModules = [
    { id: 'upload-trackers', name: 'Upload Trackers', component: <UploadTrackers selectedFileId={selectedFileId} onClearSelection={() => setSelectedFileId(null)} />, icon: <FileUp className="h-5 w-5" /> },
    { id: 'system-settings', name: 'Settings', component: <SystemSettings />, icon: <Settings className="h-5 w-5" /> },
  ];

  // Helper functions
  const getUserInitial = () => {
    if (user?.full_name) {
      const names = user.full_name.split(' ');
      if (names.length > 1) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return user.full_name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getAvatarColor = () => {
    return 'bg-black';
  };

  const getActiveComponent = () => {
    // Check masters submodules first
    const mastersSubmodule = mastersSubmodules.find(m => m.id === activeModule);
    if (mastersSubmodule) return mastersSubmodule.component;
    
    // Check masters main module
    const masterModule = mastersModules.find(m => m.id === activeModule);
    if (masterModule) return masterModule.component;
    
    // Check other modules
    const otherModule = otherModules.find(m => m.id === activeModule);
    if (otherModule) return otherModule.component;
    
    // Check MOM module
    if (activeModule === 'mom-module') return <MOMModule />;
    
    // Default to Project Dashboard
    return <ProjectDashboard selectedFileId={selectedFileId} />;
  };

  const getActiveModuleName = () => {
    if (activeModule === 'project-dashboard') return 'Project Dashboard';
    if (activeModule === 'masters-main') return 'Masters';
    if (activeModule === 'mom-module') return 'Minutes of Meeting';
    
    const allModules = [...mastersModules, ...mastersSubmodules, ...otherModules];
    const module = allModules.find(m => m.id === activeModule);
    return module ? module.name : 'Project Dashboard';
  };

  const getHeaderTitle = () => {
    if (activeModule === 'upload-trackers' && selectedFileId) {
      for (const proj of uploadTrackerModules) {
        const file = proj.submodules?.find(s => s.trackerId === selectedFileId);
        if (file) {
          return capitalizeFirstLetter((file.displayName || file.name || '').replace(/\.(xlsx|xls|csv|json|txt)$/i, ''));
        }
      }
      return 'File Viewer';
    }
    if (activeModule === 'project-dashboard' && selectedFileId) {
      for (const proj of projectDashboardModules) {
        const file = proj.submodules?.find(s => s.trackerId === selectedFileId);
        if (file) {
          return capitalizeFirstLetter((file.displayName || file.name || '').replace(/\.(xlsx|xls|csv|json|txt)$/i, ''));
        }
      }
    }
    return getActiveModuleName();
  };

  // ==========================================================================
  // HANDLE MODULE CLICK
  // ==========================================================================
  const handleModuleClick = (moduleId) => {
    setActiveModule(moduleId);
    
    // Clear selected file ID when switching away from project-dashboard or upload-trackers
    if (moduleId !== 'project-dashboard' && moduleId !== 'upload-trackers') {
      setSelectedFileId(null);
    }
    
    // For main modules with submodules, toggle expansion
    if (moduleId === 'project-dashboard') {
      setExpandedModules(prev => ({
        ...prev,
        'project-dashboard': !prev['project-dashboard']
      }));
    } else if (moduleId === 'masters-main') {
      setExpandedModules(prev => ({
        ...prev,
        'masters': !prev['masters']
      }));
    } else if (moduleId === 'upload-trackers') {
      setExpandedModules(prev => ({
        ...prev,
        'upload-trackers': !prev['upload-trackers']
      }));
    }
  };

  // ==========================================================================
  // TOGGLE MODULE EXPANSION
  // ==========================================================================
  const toggleModuleExpansion = (moduleId, e) => {
    if (e) {
      e.stopPropagation();
    }
    setExpandedModules(prev => ({ 
      ...prev, 
      [moduleId]: !prev[moduleId] 
    }));
  };

  const handleFileModuleClick = (fileModule) => {
    setActiveModule('upload-trackers');
    setSelectedFileId(fileModule.trackerId);
  };

  const handleProjectFileClick = (fileModule) => {
    // Set the selected file ID
    setSelectedFileId(fileModule.trackerId);
    
    // Dispatch event for ProjectDashboard to handle
    window.dispatchEvent(new CustomEvent('openProjectDashboardFile', { 
      detail: { 
        trackerId: fileModule.trackerId,
        fileModule: fileModule,
        projectName: fileModule.projectName || 'Unknown'
      } 
    }));
    
    // Ensure we're on project dashboard and it's expanded
    if (activeModule !== 'project-dashboard') {
      setActiveModule('project-dashboard');
    }
    setExpandedModules(prev => ({ ...prev, 'project-dashboard': true }));
  };

  // ==========================================================================
  // RENDER FUNCTIONS - ALL WITH BLACK TEXT
  // ==========================================================================

  const renderProjectDashboardModule = () => {
    const isActive = activeModule === 'project-dashboard';
    const isExpanded = expandedModules['project-dashboard'];
    const hasDynamicModules = projectDashboardModules.length > 0;
    const isHovered = hoveredModule === 'project-dashboard';
    
    return (
      <div key="project-dashboard" className="mb-1.5">
        <div
          onMouseEnter={() => setHoveredModule('project-dashboard')}
          onMouseLeave={() => setHoveredModule(null)}
          onClick={() => handleModuleClick('project-dashboard')}
          className={`w-full flex items-center cursor-pointer transition-all duration-300 ${
            sidebarCollapsed ? 'justify-center px-2 py-3.5' : 'justify-between px-4 py-3.5'
          } rounded-xl ${
            isActive 
              ? 'bg-white shadow-md text-black' 
              : isHovered 
                ? 'bg-white/90 shadow-sm text-black' 
                : 'hover:bg-white/70 text-black'
          }`}
        >
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3.5'}`}>
            <div className={`transition-colors ${
              isActive ? 'text-black' : isHovered ? 'text-black' : 'text-black'
            }`}>
              <BarChart3 className={`${sidebarCollapsed ? 'h-5 w-5' : 'h-5 w-5'}`} />
            </div>
            {!sidebarCollapsed && (
              <span className={`font-semibold text-base ${
                isActive ? 'text-black' : isHovered ? 'text-black' : 'text-black'
              }`}>
                Dashboard
              </span>
            )}
          </div>
          {!sidebarCollapsed && hasDynamicModules && (
            <button
              onClick={(e) => toggleModuleExpansion('project-dashboard', e)}
              className={`p-1.5 rounded-lg ${
                isActive ? 'hover:bg-gray-100 text-black' : 
                isHovered ? 'hover:bg-white text-black' : 
                'hover:bg-white/70 text-black'
              }`}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}
        </div>
        
        {!sidebarCollapsed && isExpanded && hasDynamicModules && (
          <div className="ml-7 mt-1.5 space-y-1.5">
            {projectDashboardModules.map(projectModule => renderProjectModule(projectModule, 'project-dashboard'))}
          </div>
        )}
      </div>
    );
  };

  const renderUploadTrackersModule = () => {
    const isActive = activeModule === 'upload-trackers';
    const isExpanded = expandedModules['upload-trackers'];
    const hasDynamicModules = uploadTrackerModules.length > 0;
    const isHovered = hoveredModule === 'upload-trackers';
    
    return (
      <div key="upload-trackers" className="mb-1.5">
        <div
          onMouseEnter={() => setHoveredModule('upload-trackers')}
          onMouseLeave={() => setHoveredModule(null)}
          onClick={() => handleModuleClick('upload-trackers')}
          className={`w-full flex items-center cursor-pointer transition-all duration-300 ${
            sidebarCollapsed ? 'justify-center px-2 py-3.5' : 'justify-between px-4 py-3.5'
          } rounded-xl ${
            isActive 
              ? 'bg-white shadow-md text-black' 
              : isHovered 
                ? 'bg-white/90 shadow-sm text-black' 
                : 'hover:bg-white/70 text-black'
          }`}
        >
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3.5'}`}>
            <div className={`transition-colors ${
              isActive ? 'text-black' : isHovered ? 'text-black' : 'text-black'
            }`}>
              <FileUp className={`${sidebarCollapsed ? 'h-5 w-5' : 'h-5 w-5'}`} />
            </div>
            {!sidebarCollapsed && (
              <span className={`font-semibold text-base ${
                isActive ? 'text-black' : isHovered ? 'text-black' : 'text-black'
              }`}>
                Upload Trackers
              </span>
            )}
          </div>
          {!sidebarCollapsed && hasDynamicModules && (
            <button
              onClick={(e) => toggleModuleExpansion('upload-trackers', e)}
              className={`p-1.5 rounded-lg ${
                isActive ? 'hover:bg-gray-100 text-black' : 
                isHovered ? 'hover:bg-white text-black' : 
                'hover:bg-white/70 text-black'
              }`}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}
        </div>
        
        {!sidebarCollapsed && isExpanded && hasDynamicModules && (
          <div className="ml-7 mt-1.5 space-y-1.5">
            {uploadTrackerModules.map(projectModule => renderProjectModule(projectModule, 'upload-trackers'))}
          </div>
        )}
      </div>
    );
  };

  const renderMOMModule = () => {
    const isActive = activeModule === 'mom-module';
    const isHovered = hoveredModule === 'mom-module';
    
    return (
      <button
        key="mom-module"
        onMouseEnter={() => setHoveredModule('mom-module')}
        onMouseLeave={() => setHoveredModule(null)}
        onClick={() => handleModuleClick('mom-module')}
        className={`w-full flex items-center transition-all duration-300 ${
          sidebarCollapsed ? 'justify-center px-2 py-3.5' : 'px-4 py-3.5 space-x-3.5'
        } rounded-xl ${
          isActive 
            ? 'bg-white shadow-md text-black' 
            : isHovered 
              ? 'bg-white/90 shadow-sm text-black' 
              : 'hover:bg-white/70 text-black'
        }`}
      >
        <div className={`transition-colors ${
          isActive ? 'text-black' : isHovered ? 'text-black' : 'text-black'
        }`}>
          <MessageSquare className={`${sidebarCollapsed ? 'h-5 w-5' : 'h-5 w-5'}`} />
        </div>
        {!sidebarCollapsed && (
          <span className={`font-semibold text-base ${
            isActive ? 'text-black' : isHovered ? 'text-black' : 'text-black'
          }`}>
            MOM
          </span>
        )}
      </button>
    );
  };

  const renderMastersModule = () => {
    const isExpanded = expandedModules['masters'];
    const isActive = activeModule === 'masters-main' || mastersSubmodules.some(s => s.id === activeModule);
    const isHovered = hoveredModule === 'masters-main';
    
    return (
      <div key="masters" className="mb-1.5">
        <div
          onMouseEnter={() => setHoveredModule('masters-main')}
          onMouseLeave={() => setHoveredModule(null)}
          onClick={() => handleModuleClick('masters-main')}
          className={`w-full flex items-center cursor-pointer transition-all duration-300 ${
            sidebarCollapsed ? 'justify-center px-2 py-3.5' : 'justify-between px-4 py-3.5'
          } rounded-xl ${
            isActive 
              ? 'bg-white shadow-md text-black' 
              : isHovered 
                ? 'bg-white/90 shadow-sm text-black' 
                : 'hover:bg-white/70 text-black'
          }`}
        >
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3.5'}`}>
            <div className={`transition-colors ${
              isActive ? 'text-black' : isHovered ? 'text-black' : 'text-black'
            }`}>
              <FolderTree className={`${sidebarCollapsed ? 'h-5 w-5' : 'h-5 w-5'}`} />
            </div>
            {!sidebarCollapsed && (
              <span className={`font-semibold text-base ${
                isActive ? 'text-black' : isHovered ? 'text-black' : 'text-black'
              }`}>
                Masters
              </span>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={(e) => toggleModuleExpansion('masters', e)}
              className={`p-1.5 rounded-lg ${
                isActive ? 'hover:bg-gray-100 text-black' : 
                isHovered ? 'hover:bg-white text-black' : 
                'hover:bg-white/70 text-black'
              }`}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}
        </div>
        
        {!sidebarCollapsed && isExpanded && (
          <div className="ml-7 mt-1.5 space-y-1.5">
            {mastersSubmodules.map((submodule, index) => {
              const isSubmoduleActive = activeModule === submodule.id;
              const isSubmoduleHovered = hoveredModule === submodule.id;
              
              return (
                <button
                  key={submodule.id}
                  onMouseEnter={() => setHoveredModule(submodule.id)}
                  onMouseLeave={() => setHoveredModule(null)}
                  onClick={() => handleModuleClick(submodule.id)}
                  className={`w-full flex items-center space-x-3.5 rounded-lg px-3 py-2.5 transition-all duration-300 ${
                    isSubmoduleActive 
                      ? 'bg-white shadow-sm text-black' 
                      : isSubmoduleHovered 
                        ? 'bg-white/90 shadow-sm text-black' 
                        : 'hover:bg-white/70 text-black'
                  }`}
                >
                  <div className={`${
                    isSubmoduleActive ? 'text-black' : 
                    isSubmoduleHovered ? 'text-black' : 
                    'text-black'
                  }`}>
                    {submodule.icon}
                  </div>
                  <span className={`text-sm font-medium truncate ${
                    isSubmoduleActive ? 'text-black' : 
                    isSubmoduleHovered ? 'text-black' : 
                    'text-black'
                  }`}>
                    {submodule.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderProjectModule = (projectModule, context) => {
    const uniqueId = `${context}-${projectModule.id}`;
    const isExpanded = expandedModules[uniqueId] || false;
    const hasFiles = projectModule.submodules?.length > 0;
    const isHovered = hoveredModule === uniqueId;
    
    return (
      <div key={uniqueId} className="group">
        <div className="flex items-center justify-between">
          <div
            onMouseEnter={() => setHoveredModule(uniqueId)}
            onMouseLeave={() => setHoveredModule(null)}
            onClick={(e) => toggleModuleExpansion(uniqueId, e)}
            className={`flex-1 flex items-center space-x-2.5 rounded-lg px-3 py-2.5 transition-all duration-300 cursor-pointer ${
              isHovered 
                ? 'bg-white/90 text-black shadow-sm' 
                : 'hover:bg-white/70 text-black'
            }`}
          >
            <Layers className={`h-5 w-5 ${
              isHovered ? 'text-black' : 'text-black'
            }`} />
            <span className={`text-sm font-medium truncate ${
              isHovered ? 'text-black' : 'text-black'
            }`}>
              {projectModule.name}
            </span>
          </div>
          {hasFiles && (
            <button
              onClick={(e) => toggleModuleExpansion(uniqueId, e)}
              className={`p-1.5 rounded-lg ${
                isHovered ? 'hover:bg-white/90 text-black' : 'hover:bg-white/70 text-black'
              }`}
            >
              {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
        
        {isExpanded && hasFiles && (
          <div className="ml-7 mt-1.5 space-y-1">
            {projectModule.submodules.map(fileModule => renderFileModule(fileModule, context))}
          </div>
        )}
      </div>
    );
  };

  const renderFileModule = (fileModule, context) => {
    const isSelected = (context === 'upload-trackers' || context === 'project-dashboard') && 
                       selectedFileId === fileModule.trackerId;
    const fileId = `${context}-${fileModule.id}`;
    const isHovered = hoveredModule === fileId;
    
    return (
      <button
        key={fileId}
        onMouseEnter={() => setHoveredModule(fileId)}
        onMouseLeave={() => setHoveredModule(null)}
        onClick={() => {
          if (context === 'upload-trackers') {
            handleFileModuleClick(fileModule);
          } else if (context === 'project-dashboard') {
            handleProjectFileClick(fileModule);
          }
        }}
        className={`w-full flex items-center space-x-2.5 rounded-lg px-3 py-2 transition-all duration-300 ${
          isSelected 
            ? 'bg-white shadow-sm text-black'
            : isHovered 
              ? 'bg-white/90 text-black shadow-sm' 
              : 'hover:bg-white/70 text-black'
        }`}
      >
        <span className={`text-sm truncate ${
          isSelected 
            ? 'font-medium text-black'
            : isHovered 
              ? 'text-black' 
              : 'text-black'
        }`}>
          {fileModule.displayName || (fileModule.name || '').replace(/\.(xlsx|xls|csv|json|txt)$/i, '')}
        </span>
      </button>
    );
  };

  const renderOtherModules = () => {
    return otherModules.filter(module => module.id !== 'upload-trackers').map((module, index) => {
      const isActive = activeModule === module.id;
      const isHovered = hoveredModule === module.id;
      
      return (
        <button
          key={module.id}
          onMouseEnter={() => setHoveredModule(module.id)}
          onMouseLeave={() => setHoveredModule(null)}
          onClick={() => handleModuleClick(module.id)}
          className={`w-full flex items-center transition-all duration-300 ${
            sidebarCollapsed ? 'justify-center px-2 py-3.5' : 'px-4 py-3.5 space-x-3.5'
          } rounded-xl ${
            isActive 
              ? 'bg-white shadow-md text-black' 
              : isHovered 
                ? 'bg-white/90 shadow-sm text-black' 
                : 'hover:bg-white/70 text-black'
          }`}
        >
          <div className={`transition-colors ${
            isActive ? 'text-black' : 
            isHovered ? 'text-black' : 
            'text-black'
          }`}>
            {module.icon}
          </div>
          {!sidebarCollapsed && (
            <span className={`font-semibold text-base ${
              isActive ? 'text-black' : 
              isHovered ? 'text-black' : 
              'text-black'
            }`}>
              {module.name}
            </span>
          )}
        </button>
      );
    });
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      {/* Global styles */}
      <style>{`
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: #F3F4F6;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #D1D5DB;
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #9CA3AF;
        }
      `}</style>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Original gradient background preserved */}
        <div 
          ref={sidebarRef}
          className={`
            fixed lg:relative inset-y-0 left-0 z-30
            ${sidebarCollapsed ? 'w-16' : 'w-60'}
            bg-gradient-to-b from-rose-100/70 via-pink-50/60 via-blue-50/60 to-sky-100/70
            transform transition-all duration-200 ease-in-out lg:transform-none
            flex flex-col
            shadow-sm
            backdrop-blur-[1px]
            relative overflow-hidden
          `}
          onMouseEnter={() => setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
        >
          {/* Pink overlay at top - GRADUAL fade, not a hard patch */}
          <div className="absolute top-0 right-0 w-64 h-48 pointer-events-none bg-gradient-to-bl from-rose-100/50 via-pink-50/30 to-transparent"></div>
          
          {/* Sparkle effect - very subtle */}
          <div className="absolute inset-0 pointer-events-none opacity-5" 
               style={{
                 backgroundImage: `radial-gradient(circle at 90% 10%, rgba(255, 182, 193, 0.2) 0%, transparent 60%),
                                   radial-gradient(circle at 30% 40%, rgba(135, 206, 235, 0.1) 0%, transparent 50%)`
               }}>
          </div>

          {/* Logo Section */}
          <div className="relative px-4 py-6 z-10">
            {!sidebarCollapsed ? (
              <div className="flex justify-center items-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-200/30 to-sky-200/30 blur-xl rounded-full"></div>
                  <img 
                    src="/caldimlogo.png" 
                    className="h-26 w-auto object-contain relative"  
                    alt="Company Logo"
                  />
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-400 to-sky-400 flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">CD</span>
                </div>
              </div>
            )}
          </div>

          {/* Collapse Button - Moved outside logo section but still in sidebar */}
          {sidebarHovered && (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="absolute top-6 bg-white hover:bg-gradient-to-r hover:from-rose-50 hover:to-sky-50 rounded-full p-1.5 shadow-md border border-indigo-200 z-50"
              style={{
                left: sidebarCollapsed ? '52px' : '220px',
                transform: 'translateX(-50%)',
                zIndex: 9999
              }}
            >
              {sidebarCollapsed ? (
                <ChevronRightIcon className="h-4 w-4 text-indigo-400" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-indigo-400" />
              )}
            </button>
          )}

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 relative z-10">
            {renderProjectDashboardModule()}
            {renderMOMModule()}
            {renderMastersModule()}
            
            <div className="space-y-1.5">
              {renderUploadTrackersModule()}
              {renderOtherModules()}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white">
          {/* Header - Original gradient restored */}
          <header className="bg-gradient-to-br from-rose-100/70 via-pink-50/60 via-blue-50/60 to-sky-100/70 backdrop-blur-[1px] flex-shrink-0 sticky top-0 z-20 relative overflow-hidden">
            {/* Dual-tone overlay */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-rose-100/20 via-transparent to-sky-100/20"></div>
            
            {/* Balanced sparkle effect */}
            <div className="absolute inset-0 pointer-events-none opacity-10" 
                 style={{
                   backgroundImage: `radial-gradient(circle at 30% 40%, rgba(255, 182, 193, 0.3) 0%, transparent 30%),
                                     radial-gradient(circle at 70% 60%, rgba(135, 206, 235, 0.3) 0%, transparent 30%),
                                     radial-gradient(circle at 40% 80%, rgba(255, 192, 203, 0.3) 0%, transparent 30%),
                                     radial-gradient(circle at 60% 20%, rgba(176, 224, 230, 0.3) 0%, transparent 30%)`
                 }}>
            </div>
            
            <div className="px-6 py-4 flex items-center justify-between relative z-10">
              {/* Left side - Empty for centering */}
              <div className="w-48"></div>

              {/* Center - Title */}
              <div className="flex-1 flex justify-center items-center">
                <h1 className="text-2xl font-bold text-black tracking-tight">
                  {getHeaderTitle()}
                </h1>
                
                {(activeModule === 'upload-trackers' || activeModule === 'project-dashboard') && selectedFileId && (
                  <button
                    onClick={() => setSelectedFileId(null)}
                    className="ml-4 flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-gradient-to-r hover:from-rose-50 hover:to-sky-50 rounded-lg text-sm font-medium text-black transition-colors border border-indigo-200"
                  >
                    <span>Clear Selection</span>
                    <ChevronRight className="h-4 w-4 text-indigo-400" />
                  </button>
                )}
              </div>

              {/* Right side - Date/Time and Profile */}
              <div className="flex items-center space-x-6 min-w-[300px] justify-end">
                {/* Date and Time - No icons, black text */}
                <div className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm border border-indigo-100">
                  <span className="text-sm font-medium text-black tabular-nums">{currentTime}</span>
                  <span className="text-indigo-200">|</span>
                  <span className="text-sm font-medium text-black">{currentDate}</span>
                </div>

                {/* Profile Menu with black background */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="bg-black w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base shadow-md hover:shadow-lg transition-all"
                  >
                    {getUserInitial()}
                  </button>

                  {profileMenuOpen && (
                    <div 
                      className="fixed z-[9999] w-72 bg-white rounded-xl shadow-lg border border-gray-200 py-2"
                      style={{
                        position: 'fixed',
                        top: `${profileMenuPosition.top}px`,
                        right: `${profileMenuPosition.right}px`
                      }}
                    >
                      <div className="px-5 py-4">
                        <div className="flex items-center space-x-4">
                          <div className="bg-black w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0">
                            {getUserInitial()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-black text-lg truncate">{user?.full_name || 'User'}</p>
                            <p className="text-sm text-gray-500 mt-1 truncate">{user?.email || 'user@example.com'}</p>
                            <span className="inline-block mt-2 px-2.5 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700 capitalize">
                              {user?.role || 'User'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Menu Items */}
                      <div className="py-2 border-t border-gray-100">
                        <button className="w-full px-5 py-3 text-left text-sm text-black hover:bg-gray-50 flex items-center space-x-3">
                          <User className="h-5 w-5 text-gray-500" />
                          <span className="font-medium">Profile Settings</span>
                        </button>
                        <button className="w-full px-5 py-3 text-left text-sm text-black hover:bg-gray-50 flex items-center space-x-3">
                          <Settings className="h-5 w-5 text-gray-500" />
                          <span className="font-medium">Account Settings</span>
                        </button>
                      </div>
                      
                      <div className="border-t border-gray-100 py-2">
                        <button
                          onClick={() => { 
                            logout(); 
                            setProfileMenuOpen(false); 
                          }}
                          className="w-full px-5 py-3 text-left text-sm text-black hover:bg-gray-50 flex items-center space-x-3"
                        >
                          <LogOut className="h-5 w-5 text-gray-500" />
                          <span className="font-semibold">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 min-h-0 overflow-hidden bg-white">
            <div className={activeModule === 'project-dashboard' ? 'pl-6 pr-0.5 py-6 h-full' : 'p-6 h-full'}>
              <div className="bg-white rounded-lg h-full overflow-auto">
                {getActiveComponent()}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;