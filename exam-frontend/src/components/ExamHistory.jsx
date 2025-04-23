import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import HamburgerMenu from './HamburgerMenu';

const ExamHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchExamHistory();
  }, []);

  const fetchExamHistory = async () => {
    try {
      const data = await userService.getProfile();
      if (data && data.exam_history) {
        setHistory(data.exam_history);
      } else {
        setHistory([]);
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch exam history');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded shadow-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-green-400 to-blue-500">
      <HamburgerMenu />
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-4xl font-extrabold text-gray-800 text-center drop-shadow-lg">
            Exam History
          </h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 md:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            {history.length > 0 ? (
              history.map((submission) => (
                <div key={submission.id} className="bg-white rounded-lg shadow-xl p-6 hover:shadow-2xl transition-shadow transform hover:scale-105">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    {submission.exam_title}
                  </h3>
                  <p className="text-gray-600 mb-2">Submitted on: {submission.submitted_date}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <p className="text-gray-600">Time Taken: {submission.time_taken} minutes</p>
                    <p className="text-gray-600">Total Questions: {submission.total_questions}</p>
                    <p className="text-gray-600">Correct Answers: {submission.correct_answers}</p>
                    <p className="text-gray-600">Score: {submission.score}</p>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${submission.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Percentage: {submission.percentage.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-xl p-6 text-center text-gray-500">
                No exam history available
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExamHistory;