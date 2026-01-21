import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children }) {
  const { currentUser } = useAuth();

  // If the user is NOT logged in, kick them back to the Login page
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If the user IS logged in, let them see the page (Dashboard)
  return children;
}