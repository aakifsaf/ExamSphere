import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examService, userService, compileAndRunCode } from '../services/api';
import HamburgerMenu from './HamburgerMenu';
import Editor from '@monaco-editor/react';
import { shuffle } from "../utils/shuffle"; // Import a utility function for shuffling arrays


const Exam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exams, setExams] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false); // Added state to track submission
  const [timerId, setTimerId] = useState(null); // Track the timer ID
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // Track the current question index
  const [selectedLanguage, setSelectedLanguage] = useState('python'); // Default to Python
  const [testInput, setTestInput] = useState(''); // State to manage test input
  const [markedForReview, setMarkedForReview] = useState([]); // Track questions marked for review
  const [isNavOpen, setIsNavOpen] = useState(false); // State to track navigation menu visibility
  const [codePerQuestion, setCodePerQuestion] = useState({}); // Track code for each question
  const [executionResultsPerQuestion, setExecutionResultsPerQuestion] = useState({}); // Track execution results per question
  const [executionError, setExecutionError] = useState(null); // State to store execution error

  const isAutoSubmitTriggered = useRef(false); // Ref to track auto-submit state

  const toggleNav = () => {
    setIsNavOpen((prev) => !prev);
  };

  useEffect(() => {
    const fetchAvailableExams = async () => {
      try {
        const data = await userService.getProfile();
        if (data && data.available_exams) {
          setExams(data.available_exams);
        } else {
          setExams([]);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching available exams:', err);
        setError('Failed to fetch available exams.');
        setLoading(false);
      }
    };

    fetchAvailableExams();
  }, []);

  useEffect(() => {
    if (!examId) return;

    const fetchExam = async () => {
      try {
        const data = await examService.getExam(examId);
        // Shuffle the questions to randomize their order
        data.questions = shuffle(data.questions);
        setExam(data);
        const initialAnswers = {};
        data.questions.forEach((question) => {
          initialAnswers[question.id] = '';
        });
        setAnswers(initialAnswers);
        setTimeLeft(data.duration * 60);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching exam:', err);
        if (err.response?.status === 403) {
          setError('You have already submitted this exam.');
        } else {
          setError('Failed to fetch exam. Please try again later.');
        }
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId]);

  useEffect(() => {
    if (timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimerId(null); // Clear the timer ID
          if (!isAutoSubmitTriggered.current) { // Ensure auto-submit is triggered only once
            handleAutoSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimerId(timer); // Store the timer ID

    return () => {
      clearInterval(timer);
      setTimerId(null); // Cleanup the timer ID
    };
  }, [timeLeft]); // Removed isSubmitted dependency to rely on ref

  useEffect(() => {
    // Function to handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        alert('You are not allowed to switch tabs or minimize the exam screen.');
        // Optionally, log this behavior or end the exam
      }
    };

    // Add event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    // Prevent the user from navigating back
    const handlePopState = () => {
      alert('You cannot go back during the exam.');
      window.history.pushState(null, null, window.location.href);
    };

    // Push initial state to prevent back navigation
    window.history.pushState(null, null, window.location.href);

    // Add event listener
    window.addEventListener('popstate', handlePopState);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const navElement = document.querySelector('.navigation-menu');
      if (navElement && !navElement.contains(event.target)) {
        setIsNavOpen(false);
      }
    };

    if (isNavOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNavOpen]);

  const handleAnswerChange = (questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleMarkForReview = (questionId) => {
    setMarkedForReview((prev) => {
      if (prev.includes(questionId)) {
        return prev.filter((id) => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  const isAttempted = (questionId) => {
    return answers[questionId] !== '' || executionResultsPerQuestion[questionId] !== undefined;
  };

  const renderQuestionNavigation = () => (
    <div
      className={`navigation-menu fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
        isNavOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Question Navigation</h3>
        
        <h4 className="text-gray-800 font-semibold mb-2">All Questions</h4>
        <div className="grid grid-cols-5 gap-2">
          {exam.questions.map((question, index) => (
            <button
              key={question.id}
              onClick={() => {
                setCurrentQuestionIndex(index);
                setIsNavOpen(false);
              }}
              className={`p-2 rounded-lg text-sm font-semibold transition-colors ${
                currentQuestionIndex === index
                  ? 'bg-blue-600 text-white'
                  : isAttempted(question.id)
                  ? 'bg-green-500 text-white'
                  : markedForReview.includes(question.id)
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              Q{index + 1}
            </button>
          ))}
        </div>
        <div className="mb-4">
          <details className="mb-2">
            <summary className="cursor-pointer text-blue-600 font-semibold">Attempted Questions</summary>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {exam.questions.map((question, index) => (
                isAttempted(question.id) && (
                  <button
                    key={question.id}
                    onClick={() => {
                      setCurrentQuestionIndex(index);
                      setIsNavOpen(false);
                    }}
                    className="p-2 rounded-lg text-sm font-semibold bg-green-500 text-white"
                  >
                    Q{index + 1}
                  </button>
                )
              ))}
            </div>
          </details>
          <details className="mb-2">
            <summary className="cursor-pointer text-blue-600 font-semibold">Unattempted Questions</summary>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {exam.questions.map((question, index) => (
                !isAttempted(question.id) && (
                  <button
                    key={question.id}
                    onClick={() => {
                      setCurrentQuestionIndex(index);
                      setIsNavOpen(false);
                    }}
                    className="p-2 rounded-lg text-sm font-semibold bg-gray-200 text-gray-800"
                  >
                    Q{index + 1}
                  </button>
                )
              ))}
            </div>
          </details>
          <details>
            <summary className="cursor-pointer text-blue-600 font-semibold">Marked for Review</summary>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {exam.questions.map((question, index) => (
                markedForReview.includes(question.id) && (
                  <button
                    key={question.id}
                    onClick={() => {
                      setCurrentQuestionIndex(index);
                      setIsNavOpen(false);
                    }}
                    className="p-2 rounded-lg text-sm font-semibold bg-yellow-500 text-white"
                  >
                    Q{index + 1}
                  </button>
                )
              ))}
            </div>
          </details>
        </div>
      </div>
    </div>
  );

  // Ensure duplicate submissions are avoided when the timer ends
  const handleAutoSubmit = async () => {
    if (isAutoSubmitTriggered.current) return; // Prevent duplicate submissions
    isAutoSubmitTriggered.current = true; // Mark as triggered
    setIsSubmitted(true); // Mark as submitted
    try {
      const timeTaken = exam.duration * 60 - timeLeft;
      await examService.submitExam(examId, {
        exam: examId,
        answers: answers,
        time_taken: Math.floor(timeTaken / 60),
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Error auto-submitting exam:', err);
      setError('Failed to auto-submit exam. Please try again.');
    }
  };

  const handleSubmit = async () => {
    try {
      if (isSubmitted) return; // Prevent duplicate submissions
      setIsSubmitted(true); // Mark as submitted
      if (timerId) {
        clearInterval(timerId); // Clear the timer if manually submitting
        setTimerId(null);
      }
      const timeTaken = exam.duration * 60 - timeLeft;
      await examService.submitExam(examId, {
        exam: examId,
        answers: answers,
        time_taken: Math.floor(timeTaken / 60),
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Error submitting exam:', err);
      setError('Failed to submit exam. Please try again.');
    }
  };

  const handleStartExam = (examId) => {
    navigate(`/exam/${examId}`);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleCodeChange = (questionId, newCode) => {
    setCodePerQuestion((prev) => ({
      ...prev,
      [questionId]: newCode,
    }));
  };

  const handleCompileAndRun = async () => {
    try {
      const currentQuestionId = exam.questions[currentQuestionIndex].id;
      const serializedTestCases = exam.questions[currentQuestionIndex].test_cases.map((testCase) => {
        return typeof testCase === 'object' ? JSON.stringify(testCase) : testCase;
      });

      const results = await compileAndRunCode(
        codePerQuestion[currentQuestionId] || '',
        selectedLanguage,
        serializedTestCases
      );

      setExecutionResultsPerQuestion((prev) => ({
        ...prev,
        [currentQuestionId]: results,
      }));
    } catch (error) {
      setExecutionError(error.message);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded shadow-lg">
          {error}
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-blue-800 transition-all shadow-md"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!examId) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-8">
        <HamburgerMenu />
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-2xl p-8">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">Available Exams</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-gradient-to-r from-white to-gray-100 rounded-lg shadow-lg p-6 hover:shadow-2xl transition-shadow cursor-pointer border border-gray-200 hover:border-gray-400"
                  onClick={() => handleStartExam(exam.id)}
                >
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    {exam.title}
                  </h2>
                  <p className="text-gray-600">Duration: {exam.duration} minutes</p>
                </div>
              ))}
              {exams.length === 0 && (
                <div className="col-span-full bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                  No available exams
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-gray-700 text-lg font-semibold">Exam not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-2xl p-8">
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={toggleNav}
              className="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="text-4xl font-extrabold text-gray-900">{exam.title}</h1>
            <div className="text-2xl font-semibold text-blue-600">
              Time Left: {formatTime(timeLeft)}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              {exam.questions.length > 0 && (
                <div key={exam.questions[currentQuestionIndex].id} className="border-b pb-8">
                  <h3 className="text-xl font-medium text-gray-900 mb-6">
                    Question {currentQuestionIndex + 1}: {exam.questions[currentQuestionIndex].text}
                  </h3>
                  {exam.exam_type === 'CODING' ? (
                    <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-800">Coding Challenge</h2>
                      </div>
                
                      <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-2">Select Language</label>
                        <select
                          value={selectedLanguage}
                          onChange={(e) => setSelectedLanguage(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="python">Python</option>
                          <option value="java">Java</option>
                          <option value="c">C</option>
                        </select>
                      </div>
                
                      <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-2">Write Your Code</label>
                        <div className="border rounded-lg overflow-hidden shadow-sm">
                          <Editor
                            height="400px"
                            defaultLanguage={selectedLanguage}
                            value={codePerQuestion[exam.questions[currentQuestionIndex].id] || ''}
                            theme="vs-dark"
                            onChange={(value) => handleCodeChange(exam.questions[currentQuestionIndex].id, value)}
                            className="rounded-lg border border-gray-300"
                            options={{ readOnly: timeLeft === 0 }}
                          />
                        </div>
                      </div>
                
                      <div className="flex justify-end">
                        <button
                          onClick={handleCompileAndRun}
                          disabled={loading || timeLeft === 0}
                          className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          Compile & Run
                        </button>
                      </div>
                
                      
                      {executionError && (
                        <div className="mt-6 bg-red-50 border border-red-200 p-4 rounded-lg text-red-700 text-sm">
                          {executionError}
                        </div>
                      )}

                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Execution Output</h3>
                        <div className="bg-gray-100 p-4 rounded-lg">
                          {executionResultsPerQuestion[exam.questions[currentQuestionIndex].id] ? (
                            <ul className="list-disc list-inside text-sm text-gray-800">
                              {executionResultsPerQuestion[exam.questions[currentQuestionIndex].id].map((result, index) => (
                                <li key={index}>
                                  <p><strong>Test Case {index + 1}:</strong> {result.test_case}</p>
                                  <p><strong>Output:</strong> {result.output}</p>
                                  {result.error && (
                                    <p className="text-red-600"><strong>Error:</strong> {result.error}</p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-600">No output available. Run the code to see results.</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleMarkForReview(exam.questions[currentQuestionIndex].id)}
                        className={`mt-4 px-4 py-2 rounded-lg font-semibold ${
                          markedForReview.includes(exam.questions[currentQuestionIndex].id)
                            ? 'bg-yellow-500 text-white'
                            : 'bg-gray-300 text-gray-800'
                        }`}
                      >
                        {markedForReview.includes(exam.questions[currentQuestionIndex].id)
                          ? 'Unmark for Review'
                          : 'Mark for Review'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {["A", "B", "C", "D"].map((option) => (
                        <label
                          key={option}
                          className="flex items-center space-x-4 p-4 rounded-lg border cursor-pointer hover:bg-gray-50 transition-all"
                        >
                          <input
                            type="radio"
                            name={`question-${exam.questions[currentQuestionIndex].id}`}
                            value={option}
                            checked={answers[exam.questions[currentQuestionIndex].id] === option}
                            onChange={() =>
                              handleAnswerChange(exam.questions[currentQuestionIndex].id, option)
                            }
                            className="h-5 w-5 text-blue-600"
                          />
                          <span className="text-gray-700 text-lg">
                            {exam.questions[currentQuestionIndex][`option_${option.toLowerCase()}`]}
                          </span>
                        </label>
                      ))}
                      <button
                        onClick={() => handleMarkForReview(exam.questions[currentQuestionIndex].id)}
                        className={`mt-4 px-4 py-2 rounded-lg font-semibold ${
                          markedForReview.includes(exam.questions[currentQuestionIndex].id)
                            ? 'bg-yellow-500 text-white'
                            : 'bg-gray-300 text-gray-800'
                        }`}
                      >
                        {markedForReview.includes(exam.questions[currentQuestionIndex].id)
                          ? 'Unmark for Review'
                          : 'Mark for Review'}
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-between mt-6">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="bg-gray-300 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === exam.questions.length - 1}
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              {currentQuestionIndex === exam.questions.length - 1 && (
                <div className="mt-10 flex justify-end">
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 px-8 rounded-lg hover:from-blue-600 hover:to-blue-800 transition-all shadow-lg"
                  >
                    Submit Exam
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {renderQuestionNavigation()}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Are you sure?</h2>
            <p className="text-gray-600 mb-6">Do you really want to submit the exam? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="bg-gray-300 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exam;