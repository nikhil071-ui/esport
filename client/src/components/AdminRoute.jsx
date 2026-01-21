import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { currentUser, userRole } = useAuth();

  // 1. Not logged in? -> Login Page
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // 2. Logged in but NOT admin? -> Dashboard
  if (userRole !== 'admin') {
    return <Navigate to="/" />;
  }

  // 3. Is Admin? -> Show the Page
  return children;
}