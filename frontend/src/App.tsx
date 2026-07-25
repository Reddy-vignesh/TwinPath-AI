import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

import AppShell from './components/layout/AppShell';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import CareerExplorer from './pages/CareerExplorer';
import Recommendations from './pages/Recommendations';
import TwinVisualizer from './pages/TwinVisualizer';
import Simulator from './pages/Simulator';
import SalaryPredictions from './pages/SalaryPredictions';

// Protected route — redirects to /login if not authenticated
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppShell>{children}</AppShell>;
};

export default function App() {
  const { fetchUser, isAuthenticated } = useAuthStore();

  // Reload user info on mount (e.g. after page refresh)
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
        />

        {/* Protected — real pages */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/careers"   element={<ProtectedRoute><CareerExplorer /></ProtectedRoute>} />
        <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
        <Route path="/twin"      element={<ProtectedRoute><TwinVisualizer /></ProtectedRoute>} />
        <Route path="/simulation" element={<ProtectedRoute><Simulator /></ProtectedRoute>} />
        <Route path="/salary"    element={<ProtectedRoute><SalaryPredictions /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
