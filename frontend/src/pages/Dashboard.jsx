import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  LogOut, 
  Users,
  Key,
  Briefcase,
  Folder,
  Building,
  Upload,
  Settings,
  Menu,
  X
} from 'lucide-react';

// Import sub-module components
import EmployeeMaster from '../components/modules/EmployeeMaster';
import EmployeeAccess from '../components/modules/EmployeeAccess';
import ProjectMaster from '../components/modules/ProjectMaster';
import PartMaster from '../components/modules/PartMaster';
import DepartmentMaster from '../components/modules/DepartmentMaster';
import UploadTrackers from '../components/modules/UploadTrackers';
import SYSTEMSETTINGS from '../components/modules/SYSTEMSETTINGS';
const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeModule, setActiveModule] = useState('employee-master');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  const modules = [
    {
      id: 'employee-master',
      name: 'Employee Master',
      icon: Users,
      component: <EmployeeMaster />
    },
    {
      id: 'employee-access',
      name: 'Employee Access',
      icon: Key,
      component: <EmployeeAccess />
    },
    {
      id: 'project-master',
      name: 'Project Master',
      icon: Briefcase,
      component: <ProjectMaster />
    },
    {
      id: 'part-master',
      name: 'Part Master',
      icon: Folder,
      component: <PartMaster />
    },
    {
      id: 'department-master',
      name: 'Department Master',
      icon: Building,
      component: <DepartmentMaster />
    },
    {
      id: 'upload-trackers',
      name: 'Build & Upload Trackers',
      icon: Upload,
      component: <UploadTrackers />
    },
    {
      id: 'SYSTEMSETTINGS',
      name: 'System Settings',
      icon: Settings,
      component: <SYSTEMSETTINGS />
    },
  ];

  const activeModuleData = modules.find(m => m.id === activeModule) || modules[0];

  return (
    <div className="min-h-screen bg-cover bg-center" 
         style={{backgroundImage: 'url(https://png.pngtree.com/png-clipart/20221006/original/pngtree-red-gradient-line-combination-geometric-distortion-elements-free-psd-png-image_8658889.png)'}}>
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black/5"></div>
      
      <div className="relative">
        {/* Mobile Header - Always visible on mobile */}
        <header className="lg:hidden bg-white/90 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-white/20"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
                <p className="text-xs text-gray-600">Complete setup for full access</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="font-medium text-sm text-gray-900">{user?.full_name || 'User'}</p>
                <p className="text-xs text-gray-600 capitalize">{user?.role || 'User'}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-white/30 rounded-lg border border-white/30"
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
            fixed lg:relative inset-y-0 left-0 z-30 w-64 lg:w-72 bg-white/95 backdrop-blur-sm border-r border-white/20
            transform transition-transform duration-300 ease-in-out lg:transform-none
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            h-screen lg:h-auto flex flex-col
          `}>
            {/* Sidebar Header - Hidden on mobile, shown on desktop */}
            <div className="hidden lg:block p-6 border-b border-white/20 flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Complete setup for full access</p>
            </div>

            {/* Modules List - Scrollable independently */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {modules.map((module) => (
                <button
                  key={module.id}
                  onClick={() => {
                    setActiveModule(module.id);
                    if (isMobile) setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                    activeModule === module.id 
                      ? 'bg-white/30 text-gray-900 border border-white/30' 
                      : 'hover:bg-white/20 text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg border border-white/30 bg-white/50">
                      <module.icon className="h-5 w-5 text-gray-700" />
                    </div>
                    <span className="font-medium text-sm lg:text-base">{module.name}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Close sidebar on mobile when clicking outside */}
            {sidebarOpen && isMobile && (
              <div 
                className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-h-screen lg:h-screen">
            {/* Desktop Header */}
            <header className="hidden lg:block bg-white/90 backdrop-blur-sm border-b border-white/20 flex-shrink-0">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      {/* Complete the setup to enable full functionality */}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{user?.full_name || 'User'}</p>
                      <p className="text-sm text-gray-600 capitalize">{user?.role || 'User'}</p>
                    </div>
                    {/* Logout button in desktop header */}
                    <button
                      onClick={logout}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-white/30 rounded-lg border border-white/30"
                      title="Logout"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </header>

            {/* Mobile Module Header */}
            <header className="lg:hidden bg-white/90 backdrop-blur-sm border-b border-white/20 flex-shrink-0">
              <div className="px-4 py-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  {activeModuleData.name}
                </h2>
                <p className="text-sm text-gray-600">
                  Complete the setup to enable full functionality
                </p>
              </div>
            </header>

            {/* Main Content Area - Scrollable independently */}
            <main className="flex-1 overflow-y-auto p-3 lg:p-6">
              {/* Content Area with responsive padding */}
              <div className="bg-white/95 backdrop-blur-sm border border-white/30 rounded-xl lg:rounded-2xl p-4 lg:p-6">
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