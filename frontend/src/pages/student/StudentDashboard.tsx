import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '@/services/api';
import type { Application } from '@/types/models';
import Dashboard from './Dashboard'; // Masters Dashboard
import PhdDashboard from './PhdDashboard';

/**
 * Smart Dashboard Router
 * تشخیص نوع فراخوان و هدایت به داشبورد مناسب
 */
const StudentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [roundType, setRoundType] = useState<string | null>(null);

  useEffect(() => {
    detectRoundType();
  }, []);

  const detectRoundType = async () => {
    setLoading(true);
    try {
      const response = await api.get<{ results: Application[] }>('/api/applicant/applications/');
      
      if (response.data.results && response.data.results.length > 0) {
        const app = response.data.results[0];
        setRoundType(app.round.type);
      } else {
        // اگر application وجود نداشت، NEW user است
        setRoundType(null);
      }
    } catch (error) {
      console.error('Error detecting round type:', error);
      setRoundType(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // اگر application وجود نداشت
  if (!roundType) {
    return <Dashboard />; // Default to Masters dashboard
  }

  // بر اساس نوع فراخوان، داشبورد مناسب را نمایش بده
  switch (roundType) {
    case 'PHD_TALENT':
    case 'PHD_EXAM':
      return <PhdDashboard />;
    
    case 'MA_TALENT':
    case 'OLYMPIAD':
    default:
      return <Dashboard />;
  }
};

export default StudentDashboard;
