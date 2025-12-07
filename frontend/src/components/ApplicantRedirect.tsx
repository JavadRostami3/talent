import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * کامپوننت ریدایرکت بعد از لاگین
 * تشخیص نوع متقاضی و هدایت به پنل مربوطه
 */
const ApplicantRedirect = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">در حال انتقال به پنل کاربری...</p>
        </div>
      </div>
    );
  }

  // Check if user has round_type
  if (!user?.round_type) {
    // اگر round_type ندارد، به masters هدایت شود (default)
    return <Navigate to="/masters" replace />;
  }

  // تشخیص مسیر بر اساس نوع فراخوان
  const redirectPath = (user.round_type === 'PHD_TALENT' || user.round_type === 'PHD_EXAM') 
    ? '/phd' 
    : '/masters';

  return <Navigate to={redirectPath} replace />;
};

export default ApplicantRedirect;
