import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  LogOut, 
  Menu,
  X,
  Users,
  Shield,
  FolderKanban,
  Package,
  Building,
  Upload,
  Settings,
  ClipboardList,
  MessageSquare,
  Calendar,
  FileText,
  ClipboardCheck
} from 'lucide-react';

import EmployeeMaster from "../pages/EmployeeMaster";
import EmployeeAccess from "../pages/EmployeeAccess";
import ProjectMaster from "../pages/ProjectMaster";
import PartMaster from "../pages/PartMaster";
import DepartmentMaster from "../pages/DepartmentMaster";
import UploadTrackers from "../pages/UploadTrackers";
import SystemSettings from "../pages/SystemSettings";
import MOMModule from "../pages/MOMModule";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeModule, setActiveModule] = useState('MOMModule'); // Default to MOM
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const profileMenuRef = useRef(null);

  // Update time and date every second
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      
      // Format time (HH:MM:SS AM/PM)
      const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      
      // Format date (Day, Date Month Year)
      const dateString = now.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      setCurrentTime(timeString);
      setCurrentDate(dateString);
    };

    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      // On mobile, keep sidebar closed initially
      // On desktop, keep sidebar open
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const modules = [
    {
      id: 'employee-master',
      name: 'Employee Master',
      component: <EmployeeMaster />,
      icon: <Users className="h-5 w-5" />
    },
    {
      id: 'employee-access',
      name: 'Employee Access',
      component: <EmployeeAccess />,
      icon: <Shield className="h-5 w-5" />
    },
    {
      id: 'project-master',
      name: 'Project Master',
      component: <ProjectMaster />,
      icon: <FolderKanban className="h-5 w-5" />
    },
    {
      id: 'part-master',
      name: 'Part Master',
      component: <PartMaster />,
      icon: <Package className="h-5 w-5" />
    },
    {
      id: 'department-master',
      name: 'Department Master',
      component: <DepartmentMaster />,
      icon: <Building className="h-5 w-5" />
    },
    {
      id: 'upload-trackers',
      name: 'Upload Trackers',
      component: <UploadTrackers />,
      icon: <Upload className="h-5 w-5" />
    },
    {
      id: 'SystemSettings',
      name: 'Settings',
      component: <SystemSettings />,
      icon: <Settings className="h-5 w-5" />
    },
    {
      id: 'MOMModule',
      name: 'Minutes Of Meeting',
      component: <MOMModule />,
      icon: <Users className="h-5 w-5" />
      
    },
  ];

  const activeModuleData = modules.find(m => m.id === activeModule) || modules[0];

  // Get first letter of user's name for profile icon
  const getUserInitial = () => {
    if (user?.full_name) {
      return user.full_name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Handle module click
  const handleModuleClick = (moduleId) => {
    setActiveModule(moduleId);
    if (isMobile) {
      setSidebarOpen(false); // Close sidebar on mobile after selection
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden bg-gray-100 sticky top-0 z-40 border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-200 text-gray-700"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 truncate max-w-[150px]">
                {activeModuleData.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="font-medium text-sm text-gray-900 truncate max-w-[120px]">
                {user?.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-600 capitalize">
                {user?.role || 'User'}
              </p>
            </div>
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-[#E30613] text-white font-semibold hover:opacity-90 transition-opacity"
              >
                {getUserInitial()}
              </button>
              
              {/* Mobile Profile Dropdown */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-100">
                    <p className="font-medium text-gray-900 truncate">
                      {user?.full_name || 'User'}
                    </p>
                    <p className="text-sm text-gray-600 capitalize">
                      {user?.role || 'User'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setProfileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-[#E30613] flex items-center space-x-2 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile Time and Date */}
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">{currentTime}</p>
            <p className="text-xs text-gray-600 truncate max-w-[200px]">{currentDate}</p>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className={`
          fixed lg:relative inset-y-0 left-0 z-30 w-64 lg:w-64 bg-gray-100
          transform transition-transform duration-300 ease-in-out lg:transform-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          h-screen lg:h-screen flex flex-col border-r border-gray-200
        `}>
          {/* Logo */}
          <div className="flex-shrink-0 pt-4 pb-3 px-4">
            <div className="flex items-center justify-center">
              <img 
                // src="/caldimlogo.png" 
                // alt="Company Logo" 
                className="h-20 w-auto object-contain max-h-32"
              />
            </div>
          </div>

          {/* Modules List */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
              Navigation
            </p>
            {modules.map((module) => (
              <button
                key={module.id}
                onClick={() => handleModuleClick(module.id)}
                className={`w-full flex items-center space-x-3 rounded-lg transition-all duration-200 ${
                  activeModule === module.id
                    ? 'bg-white text-black shadow-lg px-3 py-3 border-l-4 border-[#E30613]'
                    : 'hover:bg-gray-200 text-gray-900 p-3 hover:pl-4'
                }`}
              >
                <div className={`${activeModule === module.id ? 'text-[#E30613]' : 'text-gray-500'}`}>
                  {module.icon}
                </div>
                <span className="font-semibold text-sm truncate">{module.name}</span>
              </button>
            ))}
          </div>

          {/* Desktop Logout Button */}
          <div className="hidden lg:block p-4 border-t border-gray-200">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && isMobile && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen lg:h-screen">
          {/* Desktop Header */}
          <header className="hidden lg:block bg-gray-100 flex-shrink-0 border-b border-gray-200">
            <div className="px-8 py-4">
              <div className="flex items-center justify-between">
                {/* Module Title */}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {activeModuleData.name}
                  </h1>
                </div>

                {/* Right side */}
                <div className="flex items-center space-x-6">
                  {/* Date and Time */}
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <p className="text-lg font-semibold text-gray-900">{currentTime}</p>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-sm text-gray-600">{currentDate}</p>
                    </div>
                  </div>

                  {/* User Profile */}
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{user?.full_name || 'User'}</p>
                      <p className="text-sm text-gray-600 capitalize">{user?.role || 'User'}</p>
                    </div>
                    <div className="relative" ref={profileMenuRef}>
                      <button
                        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                        className="flex items-center justify-center w-12 h-12 rounded-full bg-[#E30613] text-white font-semibold text-lg hover:opacity-90 transition-opacity"
                      >
                        {getUserInitial()}
                      </button>
                      
                      {/* Profile Dropdown */}
                      {profileMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                          <div className="p-4 border-b border-gray-100">
                            <p className="font-medium text-gray-900">{user?.full_name || 'User'}</p>
                            <p className="text-sm text-gray-600 capitalize">{user?.role || 'User'}</p>
                          </div>
                          <button
                            onClick={() => {
                              logout();
                              setProfileMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-[#E30613] flex items-center space-x-2 transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Logout</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-3 lg:p-6">
            <div className="bg-white rounded-lg lg:rounded-lg p-4 lg:p-6 h-full">
              {activeModuleData.component}
            </div>
          </main>

          {/* Mobile Footer with Logout */}
          <footer className="lg:hidden bg-gray-100 border-t border-gray-200 p-4">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="font-medium">Logout</span>
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
