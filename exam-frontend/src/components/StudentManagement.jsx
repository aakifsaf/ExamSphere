import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import AdminMenu from './AdminMenu';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
  const [analytics, setAnalytics] = useState({
    totalStudents: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    averageScore: 0,
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
    fetchAnalytics();
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await userService.getAllStudents();
      setStudents(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch students');
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await userService.getStudentAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  const handleStatusChange = async (studentId, newStatus) => {
    try {
      await userService.updateStudentStatus(studentId, newStatus);
      fetchStudents();
    } catch (err) {
      setError('Failed to update student status');
    }
  };

  const handleSendNotification = async (studentId, message) => {
    try {
      await userService.sendNotification(studentId, message);
      alert('Notification sent successfully');
    } catch (err) {
      setError('Failed to send notification');
    }
  };

  const handleViewStudentAnalytics = (studentId) => {
    navigate(`/student/${studentId}/analytics`);
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && student.is_active) ||
                         (filterStatus === 'inactive' && !student.is_active);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
      <AdminMenu />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800">Total Students</h3>
              <p className="text-2xl font-bold text-blue-600">{analytics.totalStudents}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800">Active Students</h3>
              <p className="text-2xl font-bold text-green-600">{analytics.activeStudents}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800">Inactive Students</h3>
              <p className="text-2xl font-bold text-red-600">{analytics.inactiveStudents}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800">Average Exam Score</h3>
              <p className="text-2xl font-bold text-purple-600">{analytics.averageScore}%</p>
            </div>
          </div>

          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Student Management</h1>
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Students</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exams Taken
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Analytics
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {student.username}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.first_name} {student.last_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          student.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {student.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.exam_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.id, !student.is_active)}
                          className={`${
                            student.is_active
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {student.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => {
                            const message = prompt('Enter notification message:');
                            if (message) {
                              handleSendNotification(student.id, message);
                            }
                          }}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          Notify
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewStudentAnalytics(student.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Analytics
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Student Details Modal */}
          {selectedStudent && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Student Details
                  </h2>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Username</p>
                        <p className="text-gray-900">{selectedStudent.username}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="text-gray-900">{selectedStudent.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="text-gray-900">
                          {selectedStudent.first_name} {selectedStudent.last_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <p className="text-gray-900">
                          {selectedStudent.is_active ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Exam History
                    </h3>
                    {selectedStudent.exam_history && selectedStudent.exam_history.length > 0 ? (
                      <div className="space-y-2">
                        {selectedStudent.exam_history.map((exam) => (
                          <div
                            key={exam.id}
                            className="bg-gray-50 p-4 rounded-lg"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {exam.exam_title}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Score: {exam.score}%
                                </p>
                                <p className="text-sm text-gray-600">
                                  Date: {exam.submitted_date}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-600">
                                  Time Taken: {exam.time_taken} minutes
                                </p>
                                <p className="text-sm text-gray-600">
                                  Questions: {exam.total_questions}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No exam history available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentManagement;