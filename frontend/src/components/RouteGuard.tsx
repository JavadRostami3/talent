import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoundTypes: string[]; // ['PHD_TALENT', 'PHD_EXAM'] or ['MA_TALENT', 'OLYMPIAD']
  redirectTo?: string;
}

/**
 * محافظ مسیر بر اساس نوع فراخوان
 * جلوگیری از دسترسی متقاضی ارشد به صفحات دکتری و بالعکس
 */
const RouteGuard = ({ children, allowedRoundTypes, redirectTo }: RouteGuardProps) => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const location = useLocation();

  // Loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Not applicant role
  if (user?.role !== 'APPLICANT') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // اگر round_type ندارد، به صفحه اصلی برگردد
  if (!user.round_type) {
    return <Navigate to="/" replace />;
  }

  // Check if user's round type is allowed
  if (!allowedRoundTypes.includes(user.round_type)) {
    // Redirect to correct panel based on round_type
    const correctPath = user.round_type.startsWith('PHD') ? '/phd' : '/masters';
    return <Navigate to={redirectTo || correctPath} replace />;
  }

  return <>{children}</>;
};

export default RouteGuard;
