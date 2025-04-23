import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, isStaff }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (!user) {
    return <Navigate to="/" />;
  }

  if (isStaff && !user.is_staff) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default ProtectedRoute; 