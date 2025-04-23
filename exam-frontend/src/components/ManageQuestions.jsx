import React, { useState, useEffect } from 'react';
import { examService } from '../services/api';
import AdminMenu from './AdminMenu';
import { useNavigate } from 'react-router-dom';

const ManageQuestions = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    exam: '',
    text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
  });
  const [testCases, setTestCases] = useState([]);

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      fetchQuestions();
    }
  }, [selectedExam]);

  const fetchExams = async () => {
    try {
      const data = await examService.getExams();
      setExams(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch exams');
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const data = await examService.getQuestions(selectedExam.id);
      setQuestions(data);
    } catch (err) {
      setError('Failed to fetch questions');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await examService.createQuestion({
        ...formData,
        exam: selectedExam.id,
        testCases,
      });
      setShowForm(false);
      setFormData({
        exam: selectedExam.id,
        text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 'A',
      });
      setTestCases([]);
      fetchQuestions();
    } catch (err) {
      setError('Failed to create question');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await examService.deleteQuestion(id);
        fetchQuestions();
      } catch (err) {
        setError('Failed to delete question');
      }
    }
  };

  const handleBack = () => {
    setSelectedExam(null);
    setQuestions([]);
    setShowForm(false);
  };

  const handleAddTestCase = () => {
    setTestCases([...testCases, { input: '', output: '' }]);
  };

  const handleTestCaseChange = (index, field, value) => {
    const updatedTestCases = [...testCases];
    updatedTestCases[index][field] = value;
    setTestCases(updatedTestCases);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <AdminMenu />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminMenu />
      <div className="container mx-auto px-4 py-8 md:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              {selectedExam ? `Questions for ${selectedExam.title}` : 'Manage Questions'}
            </h1>
            {selectedExam ? (
              <div className="flex space-x-4">
                <button
                  onClick={handleBack}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Back to Exams
                </button>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  {showForm ? 'Cancel' : 'Add New Question'}
                </button>
              </div>
            ) : null}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {!selectedExam ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  onClick={() => setSelectedExam(exam)}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">{exam.title}</h2>
                  <p className="text-gray-600">Duration: {exam.duration} minutes</p>
                </div>
              ))}
            </div>
          ) : (
            <>
              {showForm && (
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Question Text
                    </label>
                    <textarea
                      value={formData.text}
                      onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      rows="3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Option A
                      </label>
                      <input
                        type="text"
                        value={formData.option_a}
                        onChange={(e) => setFormData({ ...formData, option_a: e.target.value })}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Option B
                      </label>
                      <input
                        type="text"
                        value={formData.option_b}
                        onChange={(e) => setFormData({ ...formData, option_b: e.target.value })}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Option C
                      </label>
                      <input
                        type="text"
                        value={formData.option_c}
                        onChange={(e) => setFormData({ ...formData, option_c: e.target.value })}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Option D
                      </label>
                      <input
                        type="text"
                        value={formData.option_d}
                        onChange={(e) => setFormData({ ...formData, option_d: e.target.value })}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Correct Answer
                    </label>
                    <select
                      value={formData.correct_answer}
                      onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    >
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Test Cases
                    </label>
                    {testCases.map((testCase, index) => (
                      <div key={index} className="grid grid-cols-2 gap-4 mb-2">
                        <input
                          type="text"
                          placeholder="Input"
                          value={testCase.input}
                          onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Expected Output"
                          value={testCase.output}
                          onChange={(e) => handleTestCaseChange(index, 'output', e.target.value)}
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          required
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddTestCase}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                    >
                      Add Test Case
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Create Question
                  </button>
                </form>
              )}

              <div className="space-y-4">
                {questions.length > 0 ? (
                  questions.map((question) => (
                    <div key={question.id} className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-gray-800 font-medium mb-2">{question.text}</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">A. {question.option_a}</p>
                              <p className="text-sm text-gray-600">B. {question.option_b}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">C. {question.option_c}</p>
                              <p className="text-sm text-gray-600">D. {question.option_d}</p>
                            </div>
                          </div>
                          <p className="mt-2 text-sm text-green-600">
                            Correct Answer: {question.correct_answer}
                          </p>
                          {question.testCases && question.testCases.length > 0 && (
                            <div className="mt-4">
                              <h3 className="text-gray-800 font-medium mb-2">Test Cases:</h3>
                              {question.testCases.map((testCase, index) => (
                                <div key={index} className="text-sm text-gray-600 mb-2">
                                  <p>Input: {testCase.input}</p>
                                  <p>Expected Output: {testCase.output}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(question.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                    No questions added yet
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageQuestions;