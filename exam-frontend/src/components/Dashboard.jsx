import React from 'react';
import { useNavigate } from 'react-router-dom';
import HamburgerMenu from './HamburgerMenu';

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
      <HamburgerMenu />
      <div className="container mx-auto px-4 py-8 md:px-8 lg:px-16">
        <h1 className="text-5xl font-extrabold text-white mb-12 text-center drop-shadow-lg">
          Dashboard
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div
            className="bg-white rounded-lg shadow-xl p-6 hover:shadow-2xl transition-shadow transform hover:scale-105 cursor-pointer"
            onClick={() => navigate('/dashboard/exams')}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
              Exams
            </h2>
            <p className="text-gray-600 text-center">Manage and take exams</p>
          </div>
          <div
            className="bg-white rounded-lg shadow-xl p-6 hover:shadow-2xl transition-shadow transform hover:scale-105 cursor-pointer"
            onClick={() => navigate('/dashboard/history')}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
              History
            </h2>
            <p className="text-gray-600 text-center">View your exam history</p>
          </div>
          <div
            className="bg-white rounded-lg shadow-xl p-6 hover:shadow-2xl transition-shadow transform hover:scale-105 cursor-pointer"
            onClick={() => navigate('/dashboard/profile')}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
              Profile
            </h2>
            <p className="text-gray-600 text-center">Manage your profile</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
