import React, { lazy } from 'react';
import { useAuth } from '../context/AuthContext';

// Lazy load the dashboards so users don't download admin code
const Dashboard = lazy(() => import('../pages/Dashboard'));
const AdminPanel = lazy(() => import('../pages/AdminPanel'));

const RoleBasedDashboard = () => {
  const { userRole } = useAuth();

  // If the role from Firebase is 'admin', show the Admin Panel
  if (userRole === 'admin') {
    return <AdminPanel />;
  }

  // Otherwise, show the normal User Dashboard
  return <Dashboard />;
};

export default RoleBasedDashboard;