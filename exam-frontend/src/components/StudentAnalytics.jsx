import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService } from '../services/api';
import AdminMenu from './AdminMenu';

const StudentAnalytics = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await userService.getStudentAnalytics(studentId);
        setAnalytics(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch student analytics');
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [studentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded shadow-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-600">
      <AdminMenu />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-extrabold text-white mb-8 text-center drop-shadow-lg">Student Analytics</h1>
        <div className="bg-white rounded-xl shadow-2xl p-8 transition-transform transform hover:scale-105">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">{analytics.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <p className="text-lg text-gray-600">Email: <span className="font-semibold text-gray-900">{analytics.email}</span></p>
            <p className="text-lg text-gray-600">Total Exams Taken: <span className="font-semibold text-gray-900">{analytics.totalExams}</span></p>
            <p className="text-lg text-gray-600">Average Score: <span className="font-semibold text-gray-900">{analytics.averageScore}%</span></p>
            <p className="text-lg text-gray-600">Highest Score: <span className="font-semibold text-gray-900">{analytics.highestScore}%</span></p>
            <p className="text-lg text-gray-600">Lowest Score: <span className="font-semibold text-gray-900">{analytics.lowestScore}%</span></p>
          </div>
        </div>
        <div className="flex justify-center mt-8">
          <button
            onClick={() => navigate(-1)}
            className="bg-gradient-to-r from-purple-500 to-blue-600 text-white py-3 px-6 rounded-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all"
          >
            Back to Student Management
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentAnalytics;