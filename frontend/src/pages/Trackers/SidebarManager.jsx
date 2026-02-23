// ============================================================================
// DUAL SIDEBAR MANAGER - Two Independent Hierarchies - NO CHANGES NEEDED
// ============================================================================

const sidebarManager = {
  // ============== HIERARCHY 1: UPLOAD TRACKERS MODULE ==============
  // Purpose: For file management, tracking, and administrative view
  // Context: "upload-management" - shows all uploaded files regardless of project
  // VIEW ONLY - NO EDITING CAPABILITIES
  
  loadUploadTrackerModules: () => {
    try {
      const saved = localStorage.getItem('upload_tracker_modules');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading upload tracker modules:', error);
      return [];
    }
  },

  saveUploadTrackerModules: (modules) => {
    try {
      localStorage.setItem('upload_tracker_modules', JSON.stringify(modules));
    } catch (error) {
      console.error('Error saving upload tracker modules:', error);
    }
  },

  createUploadTrackerProject: (projectName) => {
    const projectId = projectName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    return {
      id: `upload-project-${projectId}-${Date.now()}`,
      moduleId: `upload-project-${projectId}`,
      name: projectName,
      type: 'project',
      parentId: 'upload-trackers',
      context: 'upload-management',
      viewType: 'management',
      path: `/upload-trackers/${projectId}`,
      isExpanded: false,
      submodules: [],
      stats: {
        fileCount: 0,
        lastUpload: null
      },
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  },

  createUploadTrackerFile: (fileName, trackerId, projectName) => {
    const projectId = projectName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    return {
      id: `upload-file-${trackerId}`,
      moduleId: `upload-file-${trackerId}`,
      name: fileName,
      displayName: fileName.replace(/\.[^/.]+$/, ""),
      type: 'file',
      parentId: `upload-project-${projectId}`,
      trackerId: trackerId,
      context: 'upload-management',
      viewType: 'management',
      path: `/upload-trackers/${projectId}/${trackerId}`,
      createdAt: new Date().toISOString(),
      metadata: {
        source: 'upload',
        department: null,
        employeeName: null,
        fileType: fileName.split('.').pop().toUpperCase(),
        uploadDate: new Date().toISOString()
      }
    };
  },

  addToUploadTrackers: (projectName, fileName, trackerId, metadata = {}) => {
    const modules = sidebarManager.loadUploadTrackerModules();
    const projectId = projectName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    let projectModule = modules.find(m => 
      m.moduleId === `upload-project-${projectId}` && 
      m.context === 'upload-management'
    );
    
    if (!projectModule) {
      projectModule = sidebarManager.createUploadTrackerProject(projectName);
      modules.push(projectModule);
    }
    
    const existingFile = projectModule.submodules.find(file => 
      file.trackerId === trackerId && file.context === 'upload-management'
    );
    
    if (!existingFile) {
      const fileModule = sidebarManager.createUploadTrackerFile(fileName, trackerId, projectName);
      
      fileModule.metadata = {
        ...fileModule.metadata,
        ...metadata,
        department: metadata.department || null,
        employeeName: metadata.employeeName || null
      };
      
      projectModule.submodules.push(fileModule);
      
      projectModule.stats.fileCount = projectModule.submodules.length;
      projectModule.stats.lastUpload = new Date().toISOString();
      projectModule.lastUpdated = new Date().toISOString();
      
      projectModule.submodules.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      sidebarManager.saveUploadTrackerModules(modules);
      
      window.dispatchEvent(new CustomEvent('uploadTrackerUpdate', { 
        detail: { type: 'add', trackerId, projectName, context: 'upload-management' } 
      }));
    }
    
    return modules;
  },

  removeFromUploadTrackers: (trackerId) => {
    const modules = sidebarManager.loadUploadTrackerModules();
    let removed = false;
    
    for (const projectModule of modules) {
      const fileIndex = projectModule.submodules.findIndex(file => 
        file.trackerId === trackerId && file.context === 'upload-management'
      );
      
      if (fileIndex !== -1) {
        projectModule.submodules.splice(fileIndex, 1);
        projectModule.stats.fileCount = projectModule.submodules.length;
        projectModule.lastUpdated = new Date().toISOString();
        removed = true;
        
        if (projectModule.submodules.length === 0) {
          const projectIndex = modules.findIndex(p => p.moduleId === projectModule.moduleId);
          if (projectIndex !== -1) {
            modules.splice(projectIndex, 1);
          }
        }
        
        sidebarManager.saveUploadTrackerModules(modules);
        
        window.dispatchEvent(new CustomEvent('uploadTrackerUpdate', { 
          detail: { type: 'delete', trackerId, context: 'upload-management' } 
        }));
        
        break;
      }
    }
    
    return removed;
  },

  // ============== HIERARCHY 2: PROJECT DASHBOARD MODULE ==============
  // Purpose: For project-based organization and team collaboration
  // Context: "project-dashboard" - EDITABLE, TEMPLATES, DESIGNS
  // COMPLETELY SEPARATE from Upload Trackers
  
  loadProjectDashboardModules: () => {
    try {
      const saved = localStorage.getItem('project_dashboard_modules');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading project dashboard modules:', error);
      return [];
    }
  },

  saveProjectDashboardModules: (modules) => {
    try {
      localStorage.setItem('project_dashboard_modules', JSON.stringify(modules));
    } catch (error) {
      console.error('Error saving project dashboard modules:', error);
    }
  },

  createProjectDashboardProject: (projectName) => {
    const projectId = projectName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    return {
      id: `project-dashboard-${projectId}-${Date.now()}`,
      moduleId: `project-dashboard-${projectId}`,
      name: projectName,
      type: 'project',
      parentId: 'projects-root',
      context: 'project-dashboard',
      viewType: 'collaboration',
      path: `/projects/${projectId}`,
      isExpanded: false,
      submodules: [],
      projectStats: {
        totalFiles: 0,
        contributors: [],
        lastActivity: null
      },
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  },

  createProjectDashboardFile: (fileName, trackerId, projectName, employeeName) => {
    const projectId = projectName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    return {
      id: `project-file-${trackerId}`,
      moduleId: `project-file-${trackerId}`,
      name: fileName,
      displayName: fileName.replace(/\.[^/.]+$/, ""),
      type: 'file',
      parentId: `project-dashboard-${projectId}`,
      trackerId: trackerId,
      context: 'project-dashboard',
      viewType: 'collaboration',
      path: `/projects/${projectId}/${trackerId}`,
      createdAt: new Date().toISOString(),
      owner: employeeName,
      contributors: [employeeName],
      metadata: {
        source: 'project',
        uploadedBy: employeeName,
        fileType: fileName.split('.').pop().toUpperCase(),
        uploadDate: new Date().toISOString(),
        version: 1,
        lastModifiedBy: employeeName
      }
    };
  },

  addToProjectDashboard: (projectName, fileName, trackerId, employeeName, metadata = {}) => {
    const modules = sidebarManager.loadProjectDashboardModules();
    const projectId = projectName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    let projectModule = modules.find(m => 
      m.moduleId === `project-dashboard-${projectId}` && 
      m.context === 'project-dashboard'
    );
    
    if (!projectModule) {
      projectModule = sidebarManager.createProjectDashboardProject(projectName);
      modules.push(projectModule);
    }
    
    const existingFile = projectModule.submodules.find(file => 
      file.trackerId === trackerId && file.context === 'project-dashboard'
    );
    
    if (!existingFile) {
      const fileModule = sidebarManager.createProjectDashboardFile(
        fileName, 
        trackerId, 
        projectName, 
        employeeName
      );
      
      fileModule.metadata = {
        ...fileModule.metadata,
        ...metadata,
        department: metadata.department || null
      };
      
      if (!projectModule.projectStats.contributors.includes(employeeName)) {
        projectModule.projectStats.contributors.push(employeeName);
      }
      
      projectModule.submodules.push(fileModule);
      
      projectModule.projectStats.totalFiles = projectModule.submodules.length;
      projectModule.projectStats.lastActivity = new Date().toISOString();
      projectModule.lastUpdated = new Date().toISOString();
      
      projectModule.submodules.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      sidebarManager.saveProjectDashboardModules(modules);
      
      window.dispatchEvent(new CustomEvent('projectDashboardUpdate', { 
        detail: { type: 'add', trackerId, projectName, context: 'project-dashboard' } 
      }));
    }
    
    return modules;
  },

  removeFromProjectDashboard: (trackerId) => {
    const modules = sidebarManager.loadProjectDashboardModules();
    let removed = false;
    
    for (const projectModule of modules) {
      const fileIndex = projectModule.submodules.findIndex(file => 
        file.trackerId === trackerId && file.context === 'project-dashboard'
      );
      
      if (fileIndex !== -1) {
        projectModule.submodules.splice(fileIndex, 1);
        projectModule.projectStats.totalFiles = projectModule.submodules.length;
        projectModule.projectStats.lastActivity = new Date().toISOString();
        projectModule.lastUpdated = new Date().toISOString();
        removed = true;
        
        if (projectModule.submodules.length === 0) {
          const projectIndex = modules.findIndex(p => p.moduleId === projectModule.moduleId);
          if (projectIndex !== -1) {
            modules.splice(projectIndex, 1);
          }
        }
        
        sidebarManager.saveProjectDashboardModules(modules);
        
        window.dispatchEvent(new CustomEvent('projectDashboardUpdate', { 
          detail: { type: 'delete', trackerId, context: 'project-dashboard' } 
        }));
        
        break;
      }
    }
    
    return removed;
  },

  // ============== DELETE FROM BOTH CONTEXTS ==============
  
  deleteFileFromAllContexts: (trackerId) => {
    const removedFromUpload = sidebarManager.removeFromUploadTrackers(trackerId);
    const removedFromProject = sidebarManager.removeFromProjectDashboard(trackerId);
    
    return { removedFromUpload, removedFromProject };
  },

  // ============== GETTERS FOR DIFFERENT CONTEXTS ==============
  
  getUploadTrackerFiles: () => {
    const modules = sidebarManager.loadUploadTrackerModules();
    const files = [];
    modules.forEach(project => {
      project.submodules.forEach(file => {
        files.push({
          ...file,
          projectName: project.name,
          projectId: project.moduleId
        });
      });
    });
    return files;
  },

  getProjectDashboardFiles: () => {
    const modules = sidebarManager.loadProjectDashboardModules();
    const files = [];
    modules.forEach(project => {
      project.submodules.forEach(file => {
        files.push({
          ...file,
          projectName: project.name,
          projectId: project.moduleId
        });
      });
    });
    return files;
  }
};

export default sidebarManager;