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
  Settings
} from 'lucide-react';

import EmployeeMaster from "../pages/EmployeeMaster";
import EmployeeAccess from "../pages/EmployeeAccess";
import ProjectMaster from "../pages/ProjectMaster";
import PartMaster from "../pages/PartMaster";
import DepartmentMaster from "../pages/DepartmentMaster";
import UploadTrackers from "../pages/UploadTrackers";
import SystemSettings from "../pages/SystemSettings";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeModule, setActiveModule] = useState('employee-master');
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
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
  ];

  const activeModuleData = modules.find(m => m.id === activeModule) || modules[0];

  // Get first letter of user's name for profile icon
  const getUserInitial = () => {
    if (user?.full_name) {
      return user.full_name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundImage: 'url("https://png.pngtree.com/png-clipart/20221006/original/pngtree-red-gradient-line-combination-geometric-distortion-elements-free-psd-png-image_8658889.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="relative">
        {/* Mobile Header - Always visible on mobile */}
        <header className="lg:hidden bg-gray-100 sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-200 text-gray-700"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="font-medium text-sm text-gray-900">{user?.full_name || 'User'}</p>
                <p className="text-xs text-gray-600 capitalize">{user?.role || 'User'}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-500 hover:text-white hover:bg-[#E30613] rounded-lg border border-gray-300 hover:border-[#E30613] transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar - Responsive behavior */}
          <div className={`
            fixed lg:relative inset-y-0 left-0 z-30 w-56 lg:w-56 bg-gray-100
            transform transition-transform duration-300 ease-in-out lg:transform-none
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            h-screen lg:h-auto flex flex-col
          `}>
            {/* Fixed Logo at Top - Made bigger with less padding */}
            <div className="flex-shrink-0 pt-2 pb-2 px-2">
              <div className="flex items-center justify-center">
                <img 
                  // src="/caldimlogo.png" 
                  // alt="Company Logo" 
                  className="h-24 w-auto object-contain max-h-32" // Increased from h-16 to h-24
                />
              </div>
            </div>

            {/* Modules List - Scrollable independently with fixed logo at top */}
            <div className="flex-1 overflow-y-auto px-2 space-y-1">
              {modules.map((module) => (
                <button
                  key={module.id}
                  onClick={() => {
                    setActiveModule(module.id);
                    if (isMobile) setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 rounded-lg transition-all ${
                    activeModule === module.id
                      ? 'bg-white text-black shadow-lg px-3 py-2'
                      : 'hover:bg-gray-200 text-gray-900 p-3'
                  }`}
                >
                  {module.icon}
                  <span className="font-semibold text-base">{module.name}</span>
                </button>
              ))}
            </div>

            {/* Close sidebar on mobile when clicking outside */}
            {sidebarOpen && isMobile && (
              <div 
                className="fixed inset-0 bg-black/20 z-20 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-h-screen lg:h-screen">
            {/* Desktop Header - Changed to bg-gray-100 */}
            <header className="hidden lg:block bg-gray-100 flex-shrink-0">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  {/* Centered Module Name */}
                  <div className="flex-1 flex justify-center">
                    <div className="text-center">
                      <h1 className="text-2xl font-bold text-gray-900">{activeModuleData.name}</h1>
                    </div>
                  </div>

                  {/* Right side with DateTime and Profile */}
                  <div className="flex items-center space-x-6">
                    {/* Date and Time */}
                    <div className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <p className="text-lg font-semibold text-gray-900">{currentTime}</p>
                      </div>
                      <div className="flex items-center justify-end space-x-2 mt-1">
                        <p className="text-sm text-gray-600">{currentDate}</p>
                      </div>
                    </div>

                    {/* Profile Menu */}
                    <div className="relative" ref={profileMenuRef}>
                      <button
                        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-[#E30613] text-white font-semibold hover:opacity-90 transition-opacity"
                      >
                        {getUserInitial()}
                      </button>
                      
                      {/* Profile Dropdown Menu */}
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
            </header>

            {/* Mobile Module Header - Changed to bg-gray-100 */}
            <header className="lg:hidden bg-gray-100 flex-shrink-0">
              <div className="px-4 py-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  {activeModuleData.name}
                </h2>
              </div>
            </header>

            {/* Main Content Area - Scrollable independently */}
            <main className="flex-1 overflow-y-auto p-3 lg:p-6">
              {/* Content Area with clean white background */}
              <div className="bg-white rounded-lg lg:rounded-lg p-4 lg:p-6">
                {activeModuleData.component}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;