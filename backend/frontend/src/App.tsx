
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { NotificationManager } from './components/Notifications/NotificationManager';

// Pages
import { HomePage } from './pages/HomePage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ExerciseManagement } from './pages/admin/ExerciseManagement';
import { Statistics } from './pages/admin/Statistics';
import { Rankings } from './pages/admin/Rankings';
import { SqlQuery } from './pages/admin/SqlQuery';
import { StudentLoginPage } from './pages/student/StudentLoginPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { ExerciseListPage } from './pages/student/ExerciseListPage';
import { ExerciseDetailPage } from './pages/student/ExerciseDetailPage';
import { ResultsPage } from './pages/student/ResultsPage';
import { ProfilePage } from './pages/student/ProfilePage';

import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/student/login" element={<StudentLoginPage />} />
              
              {/* Legacy redirects */}
              <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
              <Route path="/student" element={<Navigate to="/student/login" replace />} />
              
              {/* Protected Admin Routes */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/exercises" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <ExerciseManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/statistics" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Statistics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/rankings" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Rankings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/sql-query" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <SqlQuery />
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected Student Routes */}
              <Route 
                path="/student/dashboard" 
                element={
                  <ProtectedRoute requiredRole="student">
                    <StudentDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/exercises" 
                element={
                  <ProtectedRoute requiredRole="student">
                    <ExerciseListPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/exercises/:id" 
                element={
                  <ProtectedRoute requiredRole="student">
                    <ExerciseDetailPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/results" 
                element={
                  <ProtectedRoute requiredRole="student">
                    <ResultsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student/profile" 
                element={
                  <ProtectedRoute requiredRole="student">
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
          <NotificationManager />
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;