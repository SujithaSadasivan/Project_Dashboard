import React, { useState, useEffect, useRef } from 'react';
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
  Folder,
  FileText,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  Database,
  Briefcase,
  MessageSquare,
  ChevronLeft,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';

import EmployeeMaster from "../pages/Masters/EmployeeMaster";
import EmployeeAccess from "../pages/Masters/EmployeeAccess";
import ProjectMaster from "../pages/Masters/ProjectMaster";
import PartMaster from "../pages/Masters/PartMaster";
import DepartmentMaster from "../pages/Masters/DepartmentMaster";
import ProjectDashboard from "../pages/Masters/ProjectDashboard";

import UploadTrackers from "../pages/Trackers/UploadTrackers";
import SystemSettings from "../pages/Settings/SystemSettings";

import MOMModule from "../pages/mom/MOMModule";


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
  }
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeModule, setActiveModule] = useState(() => {
    return localStorage.getItem('active_module') || 'project-dashboard';
  });
  const [isMobile, setIsMobile] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [dynamicModules, setDynamicModules] = useState([]);
  const [expandedModules, setExpandedModules] = useState({
    'project-dashboard': true,
    'masters': true
  });
  const [selectedFileId, setSelectedFileId] = useState(() => {
    const saved = localStorage.getItem('selected_file_id');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return saved;
    }
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const profileMenuRef = useRef(null);
  const sidebarRef = useRef(null);

  // Load dynamic modules on component mount
  useEffect(() => {
    loadDynamicModules();
    
    // Load expanded states from localStorage
    const savedExpandedModules = localStorage.getItem('expanded_modules');
    if (savedExpandedModules) {
      setExpandedModules(JSON.parse(savedExpandedModules));
    }
  }, []);

  // Save expanded states when they change
  useEffect(() => {
    localStorage.setItem('expanded_modules', JSON.stringify(expandedModules));
  }, [expandedModules]);

  // Save activeModule to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('active_module', activeModule);
  }, [activeModule]);

  // Save selectedFileId to localStorage whenever it changes
  useEffect(() => {
    if (selectedFileId !== null) {
      localStorage.setItem('selected_file_id', JSON.stringify(selectedFileId));
    } else {
      localStorage.removeItem('selected_file_id');
    }
  }, [selectedFileId]);

  const loadDynamicModules = () => {
    const modules = sidebarManager.loadDynamicModules();
    setDynamicModules(modules);
  };

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
      setCurrentDate(now.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }));
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for sidebar update events
  useEffect(() => {
    const handleSidebarUpdate = () => {
      loadDynamicModules();
    };

    window.addEventListener('sidebarUpdate', handleSidebarUpdate);
    
    const handleStorageChange = (e) => {
      if (e.key === 'dynamic_modules') {
        loadDynamicModules();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('sidebarUpdate', handleSidebarUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Define Masters submodules (icons removed from component objects)
  const mastersSubmodules = [
    { id: 'employee-master', name: 'Employee Master', component: <EmployeeMaster /> },
    { id: 'employee-access', name: 'Employee Access', component: <EmployeeAccess /> },
    { id: 'project-master', name: 'Project Master', component: <ProjectMaster /> },
    { id: 'part-master', name: 'Part Master', component: <PartMaster /> },
    { id: 'department-master', name: 'Department Master', component: <DepartmentMaster /> },
  ];

  const otherModules = [
    { id: 'upload-trackers', name: 'Upload Trackers', component: <UploadTrackers selectedFileId={selectedFileId} onClearSelection={() => setSelectedFileId(null)} />, icon: <Upload className="h-5 w-5" /> },
    { id: 'SystemSettings', name: 'Settings', component: <SystemSettings />, icon: <Settings className="h-5 w-5" /> },
  ];

  // Get active component with smooth transition
  const getActiveComponent = () => {
    const mastersModule = mastersSubmodules.find(m => m.id === activeModule);
    if (mastersModule) return mastersModule.component;
    
    const otherModule = otherModules.find(m => m.id === activeModule);
    if (otherModule) return otherModule.component;
    
    if (activeModule === 'MOMModule') return <MOMModule />;
    
    return <ProjectDashboard />;
  };

  // Get active module name for header
  const getActiveModuleName = () => {
    if (activeModule === 'project-dashboard') return 'Project Dashboard';
    if (activeModule === 'masters') return 'Masters';
    if (activeModule === 'MOMModule') return 'Minutes Of Meeting';
    
    const allModules = [...mastersSubmodules, ...otherModules];
    const module = allModules.find(m => m.id === activeModule);
    return module ? module.name : 'Project Dashboard';
  };

  const getHeaderTitle = () => {
    if (activeModule === 'upload-trackers' && selectedFileId) {
      for (const proj of dynamicModules) {
        const file = proj.submodules?.find(s => s.trackerId === selectedFileId);
        if (file) {
          return (file.name || '').replace(/\.(xlsx|xls|csv|json|txt)$/i, '');
        }
      }
      return 'File Viewer';
    }
    return getActiveModuleName();
  };

  const getUserInitial = () =>
    user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U';

  // Smooth module transition handler
  const handleModuleClick = (moduleId) => {
    setIsTransitioning(true);
    setActiveModule(moduleId);
    setSelectedFileId(null);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  const toggleModuleExpansion = (moduleId, e) => {
    if (e) e.stopPropagation();
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const handleFileModuleClick = (fileModule) => {
    setIsTransitioning(true);
    setActiveModule('upload-trackers');
    setSelectedFileId(fileModule.trackerId);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  const handleClearFileSelection = () => {
    setSelectedFileId(null);
  };

  const renderProjectDashboardModule = () => {
    const isActive = activeModule === 'project-dashboard';
    const isExpanded = expandedModules['project-dashboard'] || false;
    const hasDynamicModules = dynamicModules.length > 0;
    
    return (
      <div key="project-dashboard">
        <button
          onClick={() => handleModuleClick('project-dashboard')}
          className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'} rounded-lg transition-all duration-200 ${
            isActive
              ? 'bg-white shadow-lg py-3 border-l-4 border-[#E30613]'
              : 'hover:bg-gray-200 py-3'
          }`}
        >
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className={isActive ? 'text-[#E30613]' : 'text-gray-500'}>
              <LayoutDashboard className="h-5 w-5" />
            </div>
            {!sidebarCollapsed && (
              <span className="font-semibold text-base truncate">Project Dashboard</span>
            )}
          </div>
          {!sidebarCollapsed && hasDynamicModules && (
            <button
              onClick={(e) => toggleModuleExpansion('project-dashboard', e)}
              className={`p-1 rounded hover:bg-gray-300 ${isActive ? 'text-[#E30613]' : 'text-gray-500'}`}
            >
              {isExpanded ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </button>
          )}
        </button>
        
        {/* Dynamic Project Modules under Project Dashboard */}
        {!sidebarCollapsed && isExpanded && hasDynamicModules && (
          <div className="ml-6 mt-1 space-y-1">
            {dynamicModules.map(projectModule => renderProjectModule(projectModule))}
          </div>
        )}
      </div>
    );
  };

  const renderMOMModule = () => {
    const isActive = activeModule === 'MOMModule';
    
    return (
      <button
        key="MOMModule"
        onClick={() => handleModuleClick('MOMModule')}
        className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'px-3'} space-x-3 rounded-lg transition-all duration-200 py-3 ${
          isActive
            ? 'bg-white shadow-lg border-l-4 border-[#E30613]'
            : 'hover:bg-gray-200'
        }`}
      >
        <div className={isActive ? 'text-[#E30613]' : 'text-gray-500'}>
          <MessageSquare className="h-5 w-5" />
        </div>
        {!sidebarCollapsed && (
          <span className="font-semibold text-base truncate">Minutes Of Meeting</span>
        )}
      </button>
    );
  };

  const renderMastersModule = () => {
    const isActive = activeModule === 'masters';
    const isExpanded = expandedModules['masters'] || false;
    
    return (
      <div key="masters" className="mt-2">
        <div
          onClick={() => handleModuleClick('masters')}
          className={`w-full flex items-center cursor-pointer ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'} rounded-lg transition-all duration-200 ${
            isActive
              ? 'bg-white shadow-lg py-3 border-l-4 border-[#E30613]'
              : 'hover:bg-gray-200 py-3'
          }`}
        >
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className={isActive ? 'text-[#E30613]' : 'text-gray-500'}>
              <Briefcase className="h-5 w-5" />
            </div>
            {!sidebarCollapsed && (
              <span className="font-semibold text-base truncate">Masters</span>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleModuleExpansion('masters', e);
              }}
              className={`p-1 rounded hover:bg-gray-300 ${isActive ? 'text-[#E30613]' : 'text-gray-500'}`}
            >
              {isExpanded ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </button>
          )}
        </div>
        
        {/* Masters submodules - icons removed */}
        {!sidebarCollapsed && isExpanded && (
          <div className="ml-6 mt-1 space-y-1">
            {mastersSubmodules.map(submodule => (
              <button
                key={submodule.id}
                onClick={() => handleModuleClick(submodule.id)}
                className={`w-full flex items-center space-x-3 rounded-lg transition-all duration-200 p-2 text-left ${
                  activeModule === submodule.id
                    ? 'bg-blue-100 border-l-2 border-blue-500'
                    : 'hover:bg-gray-200'
                }`}
              >
                {/* Icon removed - only text */}
                <span className={`font-medium text-base truncate ml-2 ${activeModule === submodule.id ? 'text-blue-600 font-semibold' : ''}`}>
                  {submodule.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderProjectModule = (projectModule) => {
    const isExpanded = expandedModules[projectModule.id] || false;
    const hasFiles = projectModule.submodules && projectModule.submodules.length > 0;
    
    return (
      <div key={projectModule.id} className="mt-1">
        <div className="flex items-center justify-between">
          <button
            onClick={(e) => toggleModuleExpansion(projectModule.id, e)}
            className="flex-1 flex items-center space-x-2 rounded-lg p-2 hover:bg-gray-200 transition-all duration-200 text-left"
          >
            {/* Folder icon removed from project modules */}
            <span className="font-medium text-base truncate ml-2">{projectModule.name}</span>
          </button>
          {hasFiles && (
            <button
              onClick={(e) => toggleModuleExpansion(projectModule.id, e)}
              className="p-1 rounded hover:bg-gray-300 text-gray-500 ml-1"
            >
              {isExpanded ? 
                <ChevronDown className="h-3 w-3" /> : 
                <ChevronRight className="h-3 w-3" />
              }
            </button>
          )}
        </div>
        
        {/* File submodules - icons removed */}
        {isExpanded && hasFiles && (
          <div className="ml-4 mt-1 space-y-1">
            {projectModule.submodules.map(fileModule => renderFileModule(fileModule))}
          </div>
        )}
      </div>
    );
  };

  const renderFileModule = (fileModule) => {
    const isSelected = selectedFileId === fileModule.trackerId;
    
    return (
      <button
        key={fileModule.id}
        onClick={() => handleFileModuleClick(fileModule)}
        className={`w-full flex items-center space-x-2 rounded-lg p-2 transition-all duration-200 text-left ${
          isSelected 
            ? 'bg-blue-100 border-l-2 border-blue-500' 
            : 'hover:bg-gray-200'
        }`}
      >
        {/* FileText icon removed from file modules */}
        <span className={`font-normal text-base truncate ml-2 ${isSelected ? 'text-blue-600 font-medium' : ''}`}>
          {(fileModule.name || '').replace(/\.(xlsx|xls|csv)$/i, '')}
        </span>
      </button>
    );
  };

  const renderOtherModules = () => {
    return otherModules.map(module => {
      const isActive = activeModule === module.id;
      
      return (
        <button
          key={module.id}
          onClick={() => handleModuleClick(module.id)}
          className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'px-3'} space-x-3 rounded-lg transition-all duration-200 py-3 ${
            isActive
              ? 'bg-white shadow-lg border-l-4 border-[#E30613]'
              : 'hover:bg-gray-200'
          }`}
        >
          <div className={isActive ? 'text-[#E30613]' : 'text-gray-500'}>
            {module.icon}
          </div>
          {!sidebarCollapsed && (
            <span className="font-semibold text-base truncate">{module.name}</span>
          )}
        </button>
      );
    });
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Hover-triggered toggle */}
        <div 
          ref={sidebarRef}
          className={`
            fixed lg:relative inset-y-0 left-0 z-30 
            ${sidebarCollapsed ? 'w-20' : 'w-64'}
            bg-gray-100
            transform transition-all duration-300 ease-in-out lg:transform-none
            flex flex-col
            group
          `}
          onMouseEnter={() => setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
        >
          {/* Sidebar Header */}
          <div className="pt-4 px-3 relative">
            {/* Logo Section - Full logo when expanded, mini when collapsed */}
            {!sidebarCollapsed ? (
              <div className="flex justify-center">
                <img 
                  // src="/TM2.png" 
                  className="h-36 w-auto object-contain"
                  // alt="Company Logo"
                  // onError={(e) => {
                  //   e.target.onerror = null;
                  //   e.target.src =
                  //     'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjYwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlMzA2MTMiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNvbXBhbnkgTG9nbzwvdGV4dD48L3N2Zz4=';
                  // }}
                />
              </div>
            ) : (
              <div className="flex justify-center py-2">
                <div className="h-8 w-8 rounded-full bg-[#E30613] flex items-center justify-center">
                  <span className="text-white font-bold text-xs">TM</span>
                </div>
              </div>
            )}
            
            {/* Hover-triggered Toggle Button */}
            {(sidebarHovered || isMobile) && (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`
                  absolute top-6 -right-3
                  bg-white hover:bg-gray-100 
                  rounded-full p-1.5 
                  shadow-lg border border-gray-300
                  transition-all duration-200
                  z-40
                  flex items-center justify-center
                `}
              >
                {sidebarCollapsed ? (
                  <ChevronRightIcon className="h-4 w-4 text-gray-700" />
                ) : (
                  <ChevronLeft className="h-4 w-4 text-gray-700" />
                )}
              </button>
            )}
          </div>

          {/* Navigation Modules */}
          <div className="flex-1 overflow-y-auto px-2 space-y-1 mt-0">
            {/* 1. Project Dashboard Module */}
            <div className="mt-0">
              {renderProjectDashboardModule()}
            </div>
            
            {/* 2. Minutes Of Meeting Module */}
            {renderMOMModule()}
            
            {/* 3. Masters Module with submodules */}
            {renderMastersModule()}
            
            {/* Other Modules (Upload Trackers, Settings) */}
            <div className="mt-2 space-y-1">
              {renderOtherModules()}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col min-h-0 overflow-hidden transition-all duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
          {/* Header */}
          <header className="hidden lg:block bg-gray-100 flex-shrink-0">
            <div className="px-4 py-4 flex items-center justify-center relative">
              {/* Centered Module Name */}
              <h1 className="text-2xl font-bold text-gray-900 text-center">
                {getHeaderTitle()}
              </h1>
              
              {/* Right-aligned User Profile */}
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center">
                <div className="text-right mr-4">
                  <p className="text-lg font-semibold text-gray-900">{currentTime}</p>
                  <p className="text-sm text-gray-600">{currentDate}</p>
                </div>
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center justify-center w-12 h-12 rounded-full bg-[#E30613] text-white font-semibold text-lg"
                  >
                    {getUserInitial()}
                  </button>
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-900 truncate">{user?.full_name || 'User'}</p>
                        <p className="text-sm text-gray-600 capitalize">{user?.role || 'User'}</p>
                      </div>
                      <button
                        onClick={() => { logout(); setProfileMenuOpen(false); }}
                        className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Content Container */}
          <main className={`flex-1 min-h-0 overflow-auto p-2 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            <div className="bg-white rounded-lg min-h-full w-full p-2">
              {activeModule === 'upload-trackers' ? (
                <UploadTrackers 
                  selectedFileId={selectedFileId}
                  onClearSelection={handleClearFileSelection}
                />
              ) : (
                getActiveComponent()
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
