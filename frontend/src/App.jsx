import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';
import UploadTrackers from './pages/Trackers/UploadTrackers';
import ProjectDashboard from './pages/ProjectDashboard';
import FileViewerPage from './pages/FileViewerPage';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Dashboard route - this contains the sidebar and header */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />

            {/* Nested routes under Dashboard */}
            <Route
              path="/upload-trackers"
              element={
                <PrivateRoute>
                  <Dashboard>
                    <UploadTrackers />
                  </Dashboard>
                </PrivateRoute>
              }
            />

            <Route
              path="/project-dashboard"
              element={
                <PrivateRoute>
                  <Dashboard>
                    <ProjectDashboard />
                  </Dashboard>
                </PrivateRoute>
              }
            />

            <Route
              path="/file-viewer/:trackerId"
              element={
                <PrivateRoute>
                  <Dashboard>
                    <FileViewerPage />
                  </Dashboard>
                </PrivateRoute>
              }
            />

            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;