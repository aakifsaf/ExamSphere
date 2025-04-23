import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminMenu from './AdminMenu';
import { authService } from '../services/api';

const StaffDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser || !currentUser.is_staff) {
      navigate('/login');
    }
  }, [navigate]);

  const menuItems = [
    {
      title: 'Manage Exams',
      description: 'Create, edit, and manage exams and their questions',
      path: '/staff/exams',
      icon: '📝',
    },
    {
      title: 'Student Management',
      description: 'Manage student profiles and data',
      path: '/staff/students',
      icon: '👥',
    },
    {
      title: 'Register Students',
      description: 'Register new students',
      path: '/staff/register',
      icon: '📋',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">
      <AdminMenu />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-extrabold text-white mb-12 text-center drop-shadow-lg">
            Staff Dashboard
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {menuItems.map((item) => (
              <div
                key={item.path}
                className="bg-white rounded-lg shadow-xl p-6 hover:shadow-2xl transition-shadow transform hover:scale-105 cursor-pointer"
                onClick={() => navigate(item.path)}
              >
                <div className="text-6xl mb-4 text-center">{item.icon}</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                  {item.title}
                </h2>
                <p className="text-gray-600 text-center">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;