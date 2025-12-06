import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import React from "react";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Register from "./pages/Register";
import Announcements from "./pages/Announcements";
import StudentDashboard from "./pages/student/Dashboard";
import RegistrationWizard from "./pages/student/RegistrationWizard";
import PersonalInfo from "./pages/student/PersonalInfo";
import DocumentsUpload from "./pages/student/DocumentsUpload";
import EducationInfo from "./pages/student/EducationInfo";
import SubmitApplication from "./pages/student/SubmitApplication";
import Deficiencies from "./pages/student/Deficiencies";
import ApplicationStatus from "./pages/student/ApplicationStatus";
import ProgramSelection from "./pages/student/ProgramSelection";
import StudentLayout from "./layouts/StudentLayout";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import ApplicationReview from "./pages/admin/ApplicationReview";
import UniversityAdminApplicationsList from "./pages/admin/UniversityAdminApplicationsList";
import UniversityAdminApplicationReview from "./pages/admin/UniversityAdminApplicationReview";
import UniversityApplicationsList from "./pages/admin/university/ApplicationsList";
import FacultyAdminApplicationsList from "./pages/admin/FacultyAdminApplicationsList";
import FacultyAdminApplicationReview from "./pages/admin/FacultyAdminApplicationReview";
import FacultyApplicationsList from "./pages/admin/faculty/ApplicationsList";
import FacultyApplicationReview from "./pages/admin/faculty/ApplicationReview";
import PhdExamApplicants from "./pages/admin/applicants/PhdExamApplicants";
import MastersTalentedApplicants from "./pages/admin/applicants/MastersTalentedApplicants";
import PhdTalentedApplicants from "./pages/admin/applicants/PhdTalentedApplicants";
import OlympiadApplicants from "./pages/admin/applicants/OlympiadApplicants";
import MastersGuide from "./pages/admin/guides/MastersGuide";
import PhdGuide from "./pages/admin/guides/PhdGuide";
import ReportsGuide from "./pages/admin/guides/ReportsGuide";
import ReportsPage from "./pages/admin/ReportsPage";
import BulkEmailPage from "./pages/admin/BulkEmailPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    // Redirect based on user role
    if (user.role === 'APPLICANT') {
      return <Navigate to="/student" replace />;
    }
    if (['ADMIN', 'UNIVERSITY_ADMIN', 'FACULTY_ADMIN', 'SYSTEM_ADMIN'].includes(user.role)) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<Login />} />
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route path="/register" element={<Register />} />
    <Route path="/announcements" element={<Announcements />} />
    
    {/* Student Routes with Layout */}
    <Route
      path="/student"
      element={
        <ProtectedRoute allowedRoles={['APPLICANT']}>
          <StudentLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<StudentDashboard />} />
      <Route path="wizard" element={<RegistrationWizard />} />
      <Route path="program-selection" element={<ProgramSelection />} />
      <Route path="personal-info" element={<PersonalInfo />} />
      <Route path="education" element={<EducationInfo />} />
      <Route path="documents" element={<DocumentsUpload />} />
      <Route path="submit" element={<SubmitApplication />} />
      <Route path="deficiencies" element={<Deficiencies />} />
      <Route path="status" element={<ApplicationStatus />} />
    </Route>

    {/* Admin Routes with new Layout */}
    <Route
      path="/admin"
      element={
        <ProtectedRoute allowedRoles={['ADMIN', 'UNIVERSITY_ADMIN', 'FACULTY_ADMIN', 'SYSTEM_ADMIN']}>
          <AdminLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="dashboard" element={<AdminDashboard />} />
      
      {/* University Admin */}
      <Route path="university/applications" element={<UniversityApplicationsList />} />
      <Route path="university/applications/:id" element={<UniversityAdminApplicationReview />} />
      
      {/* Faculty Admin */}
      <Route path="faculty/applications" element={<FacultyApplicationsList />} />
      <Route path="faculty/applications/:id" element={<FacultyApplicationReview />} />
      
      {/* Round Type specific routes - Applicants Lists */}
      <Route path="applicants/phd-exam" element={<PhdExamApplicants />} />
      <Route path="applicants/masters-talented" element={<MastersTalentedApplicants />} />
      <Route path="applicants/phd-talented" element={<PhdTalentedApplicants />} />
      <Route path="applicants/olympiad" element={<OlympiadApplicants />} />
      
      {/* Application Review */}
      <Route path="applications/:id" element={<ApplicationReview />} />
      
      {/* Guide pages */}
      <Route path="guides/masters" element={<MastersGuide />} />
      <Route path="guides/phd" element={<PhdGuide />} />
      <Route path="guides/interview" element={<PhdGuide />} />
      <Route path="guides/faculty-recruitment" element={<ReportsGuide />} />
      <Route path="guides/reports" element={<ReportsGuide />} />
      
      {/* Reports */}
      <Route path="reports" element={<ReportsPage />} />
      
      {/* Bulk Actions */}
      <Route path="bulk-email" element={<BulkEmailPage />} />
      
      {/* Support */}
      <Route path="support" element={<div className="p-8"><h1 className="text-2xl font-bold">پشتیبانی</h1></div>} />
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => {
  // Simple error boundary
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      setHasError(true);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">خطایی رخ داده است</h1>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-white rounded"
          >
            بارگذاری مجدد
          </button>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
