// src/pages/ProjectDashboard.jsx
import React from 'react';

const ProjectDashboard = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Project Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of projects, tasks, and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welcome Card */}
        <div className="lg:col-span-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome to Project Dashboard</h2>
          <p className="mb-4">Track and manage all your projects from one central location.</p>
          <button className="bg-white text-blue-600 font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition duration-200">
            View All Projects
          </button>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Active Projects</span>
              <span className="font-bold text-gray-900">12</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Completed Tasks</span>
              <span className="font-bold text-gray-900">156</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Team Members</span>
              <span className="font-bold text-gray-900">42</span>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder for future content */}
      <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="font-bold text-gray-900 mb-4">Dashboard Content</h3>
        <p className="text-gray-600">Project metrics, charts, and analytics will be displayed here.</p>
        <div className="mt-4 p-8 bg-gray-50 rounded-lg text-center text-gray-500">
          Dashboard widgets and charts area
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;