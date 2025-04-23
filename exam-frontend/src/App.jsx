import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import StaffExamManagement from "./components/StaffExamManagement";
import RegisterStudent from "./components/RegisterStudent";
import StaffDashboard from "./components/StaffDashboard";
import StudentManagement from "./components/StudentManagement";
import ProtectedRoute from "./components/ProtectedRoute";
import Exam from "./components/Exam";
import ExamHistory from "./components/ExamHistory";
import ProfileManagement from "./components/ProfileManagement";
import StudentAnalytics from "./components/StudentAnalytics";

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/dashboard/exams" 
          element={
            <ProtectedRoute>
          <Exam />
          </ProtectedRoute>} />
        <Route path="/dashboard/history" 
        element={
          <ProtectedRoute>
            <ExamHistory />
          </ProtectedRoute>} />
        <Route path="/dashboard/profile" 
        element={
          <ProtectedRoute>
            <ProfileManagement />
          </ProtectedRoute>} />
          <Route 
            path="/exam/:examId" 
            element={
              <ProtectedRoute>
                <Exam />
              </ProtectedRoute>
            } 
          />
          
          {/* Staff Routes */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute isStaff={true}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/exams"
            element={
              <ProtectedRoute isStaff={true}>
                <StaffExamManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/students"
            element={
              <ProtectedRoute isStaff={true}>
                <StudentManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/register"
            element={
              <ProtectedRoute isStaff={true}>
                <RegisterStudent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/:studentId/analytics"
            element={
              <ProtectedRoute isStaff={true}>
                <StudentAnalytics />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;