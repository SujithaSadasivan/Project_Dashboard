import React, { useState } from 'react';
import { Briefcase, Calendar, DollarSign, Users, TrendingUp, MoreVertical } from 'lucide-react';

const ProjectMaster = () => {
  const [projects, setProjects] = useState([
    { id: 1, name: 'Website Redesign', manager: 'John Doe', status: 'In Progress', budget: 50000, timeline: '3 months' },
    { id: 2, name: 'Mobile App Development', manager: 'Jane Smith', status: 'Planning', budget: 75000, timeline: '6 months' },
    { id: 3, name: 'CRM Implementation', manager: 'Bob Johnson', status: 'Completed', budget: 30000, timeline: '2 months' },
  ]);
  
  const [newProject, setNewProject] = useState({ name: '', manager: '', budget: '', timeline: '' });

  const statusColors = {
    'Planning': 'bg-blue-100 text-blue-800',
    'In Progress': 'bg-yellow-100 text-yellow-800',
    'Completed': 'bg-green-100 text-green-800',
    'On Hold': 'bg-gray-100 text-gray-800'
  };

  const handleAddProject = () => {
    if (newProject.name && newProject.manager) {
      setProjects([...projects, { 
        ...newProject, 
        id: projects.length + 1, 
        status: 'Planning',
        budget: parseFloat(newProject.budget) || 0
      }]);
      setNewProject({ name: '', manager: '', budget: '', timeline: '' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Briefcase className="h-6 w-6 mr-2" />
            Project Master
          </h2>
          <p className="text-gray-600 mt-1">Manage all projects, budgets, and timelines</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
          <Briefcase className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-300 rounded-xl p-4">
          <p className="text-sm text-gray-600">Total Projects</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{projects.length}</p>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl p-4">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {projects.filter(p => p.status === 'In Progress').length}
          </p>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl p-4">
          <p className="text-sm text-gray-600">Total Budget</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            ${projects.reduce((sum, p) => sum + (p.budget || 0), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl p-4">
          <p className="text-sm text-gray-600">Completion Rate</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {Math.round((projects.filter(p => p.status === 'Completed').length / projects.length) * 100)}%
          </p>
        </div>
      </div>

      {/* Project Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-300 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Project</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Project Name"
              value={newProject.name}
              onChange={(e) => setNewProject({...newProject, name: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Project Manager"
              value={newProject.manager}
              onChange={(e) => setNewProject({...newProject, manager: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="number"
              placeholder="Budget ($)"
              value={newProject.budget}
              onChange={(e) => setNewProject({...newProject, budget: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Timeline (e.g., 3 months)"
              value={newProject.timeline}
              onChange={(e) => setNewProject({...newProject, timeline: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <button
            onClick={handleAddProject}
            className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Create Project
          </button>
        </div>

        <div className="bg-white border border-gray-300 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span>View Project Calendar</span>
            </button>
            <button className="w-full flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span>Budget Reports</span>
            </button>
            <button className="w-full flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Users className="h-5 w-5 text-purple-600" />
              <span>Assign Team Members</span>
            </button>
            <button className="w-full flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <span>Performance Analytics</span>
            </button>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white border border-gray-300 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">All Projects</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Project Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Manager</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Budget</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Timeline</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{project.name}</td>
                  <td className="py-3 px-4">{project.manager}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${statusColors[project.status]}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-gray-500 mr-1" />
                      <span>${project.budget?.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">{project.timeline}</td>
                  <td className="py-3 px-4">
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProjectMaster;