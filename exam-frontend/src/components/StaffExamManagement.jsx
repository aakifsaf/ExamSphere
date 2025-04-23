import React, { useState, useEffect } from 'react';
import { examService } from '../services/api';
import AdminMenu from './AdminMenu';

const StaffExamManagement = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showExamForm, setShowExamForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [examFormData, setExamFormData] = useState({
    title: '',
    duration: '',
    exam_type: 'APTITUDE',
  });
  const [questionFormData, setQuestionFormData] = useState({
    text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    correct_output: [], // For coding exams
    test_cases: [], // Array to hold random inputs for coding exams
  });
  const [csvFile, setCsvFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

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

  const handleExamSubmit = async (e) => {
    e.preventDefault();
    try {
      await examService.createExam(examFormData);
      setShowExamForm(false);
      setExamFormData({ title: '', duration: '', exam_type: 'APTITUDE' });
      fetchExams();
    } catch (err) {
      setError('Failed to create exam');
    }
  };

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    try {
      await examService.createQuestion({
        ...questionFormData,
        exam: selectedExam.id
      });
      setShowQuestionForm(false);
      setQuestionFormData({
        text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 'A',
        correct_output: '',
        test_cases: [],
      });
      fetchQuestions();
    } catch (err) {
      setError('Failed to create question');
    }
  };

  const handleDeleteExam = async (id) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      try {
        await examService.deleteExam(id);
        fetchExams();
      } catch (err) {
        setError('Failed to delete exam');
      }
    }
  };

  const handleDeleteQuestion = async (id) => {
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
    setShowQuestionForm(false);
  };

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!csvFile) {
      setUploadError('Please select a CSV file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      await examService.uploadExamsCsv(formData);
      setUploadSuccess(true);
      setUploadError(null);
    } catch (err) {
      setUploadError('Failed to upload CSV file. Please try again.');
      setUploadSuccess(false);
    }
  };

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
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              {selectedExam ? `Questions for ${selectedExam.title}` : 'Manage Exams'}
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
                  onClick={() => setShowQuestionForm(!showQuestionForm)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  {showQuestionForm ? 'Cancel' : 'Add New Question'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowExamForm(!showExamForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                {showExamForm ? 'Cancel' : 'Create New Exam'}
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {!selectedExam ? (
            <>
              <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Bulk Upload Exams</h2>
                {uploadError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {uploadError}
                  </div>
                )}
                {uploadSuccess && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    Exams uploaded successfully!
                  </div>
                )}
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="mb-4"
                />
                <button
                  onClick={handleUpload}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Upload CSV
                </button>
              </div>

              {showExamForm && (
                <form onSubmit={handleExamSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Exam Title
                    </label>
                    <input
                      type="text"
                      value={examFormData.title}
                      onChange={(e) => setExamFormData({ ...examFormData, title: e.target.value })}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={examFormData.duration}
                      onChange={(e) => setExamFormData({ ...examFormData, duration: parseInt(e.target.value) })}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      min="1"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Exam Type
                    </label>
                    <select
                      value={examFormData.exam_type}
                      onChange={(e) => setExamFormData({ ...examFormData, exam_type: e.target.value })}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    >
                      <option value="APTITUDE">Aptitude Exam</option>
                      <option value="CODING">Coding Exam</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Create Exam
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exams.map((exam) => (
                  <div
                    key={exam.id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">{exam.title}</h2>
                        <p className="text-gray-600">Duration: {exam.duration} minutes</p>
                      </div>
                      <button
                        onClick={() => handleDeleteExam(exam.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                    <button
                      onClick={() => setSelectedExam(exam)}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      View Questions
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {showQuestionForm && (
                <form onSubmit={handleQuestionSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Question Text
                    </label>
                    <textarea
                      value={questionFormData.text}
                      onChange={(e) => setQuestionFormData({ ...questionFormData, text: e.target.value })}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      rows="3"
                      required
                    />
                  </div>
                  {selectedExam ? (
                    <>
                      {selectedExam.exam_type === 'CODING' ? (
                        <>
                          <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                              Correct Final Output
                            </label>
                            <textarea
                              value={questionFormData.correct_output.join('\n')}
                              onChange={(e) => setQuestionFormData({ ...questionFormData, correct_output: e.target.value.split('\n') })}
                              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              rows="4"
                              placeholder="Enter correct output for each test case on a new line"
                              required
                            />
                          </div>
                          <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                              Test Cases (Random Inputs)
                            </label>
                            <textarea
                              value={questionFormData.test_cases.join('\n')}
                              onChange={(e) => setQuestionFormData({ ...questionFormData, test_cases: e.target.value.split('\n') })}
                              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              rows="4"
                              placeholder="Enter each test case on a new line"
                              required
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-gray-700 text-sm font-bold mb-2">
                                Option A
                              </label>
                              <input
                                type="text"
                                value={questionFormData.option_a}
                                onChange={(e) => setQuestionFormData({ ...questionFormData, option_a: e.target.value })}
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
                                value={questionFormData.option_b}
                                onChange={(e) => setQuestionFormData({ ...questionFormData, option_b: e.target.value })}
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
                                value={questionFormData.option_c}
                                onChange={(e) => setQuestionFormData({ ...questionFormData, option_c: e.target.value })}
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
                                value={questionFormData.option_d}
                                onChange={(e) => setQuestionFormData({ ...questionFormData, option_d: e.target.value })}
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
                              value={questionFormData.correct_answer}
                              onChange={(e) => setQuestionFormData({ ...questionFormData, correct_answer: e.target.value })}
                              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            >
                              <option value="A">Option A</option>
                              <option value="B">Option B</option>
                              <option value="C">Option C</option>
                              <option value="D">Option D</option>
                            </select>
                          </div>
                        </>
                      )}
                    </>
                  ) : null}
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Add Question
                  </button>
                </form>
              )}

              <div className="space-y-4">
                {questions.map((question) => (
                  <div key={question.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          {question.text}
                        </h3>
                        {selectedExam.exam_type === 'CODING' ? (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">
                              <strong>Correct Output:</strong>
                            </p>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                              {question.correct_output.map((correctOutput, index) => (
                                <li key={index}>{correctOutput}</li>
                              ))}
                            </ul>
                            <p className="text-sm text-gray-600">
                              <strong>Test Cases:</strong>
                            </p>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                              {question.test_cases.map((testCase, index) => (
                                <li key={index}>{testCase}</li>
                              ))}
                            </ul>
                            
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">
                                A: {question.option_a}
                                {question.correct_answer === 'A' && (
                                  <span className="text-green-600 ml-2">(Correct)</span>
                                )}
                              </p>
                              <p className="text-sm text-gray-600">
                                B: {question.option_b}
                                {question.correct_answer === 'B' && (
                                  <span className="text-green-600 ml-2">(Correct)</span>
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">
                                C: {question.option_c}
                                {question.correct_answer === 'C' && (
                                  <span className="text-green-600 ml-2">(Correct)</span>
                                )}
                              </p>
                              <p className="text-sm text-gray-600">
                                D: {question.option_d}
                                {question.correct_answer === 'D' && (
                                  <span className="text-green-600 ml-2">(Correct)</span>
                                )}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="text-red-600 hover:text-red-900 ml-4"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {questions.length === 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                    No questions available for this exam
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

export default StaffExamManagement;