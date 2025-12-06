import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import MastersGuide from './MastersGuide';

const GuideRouter = () => {
  const { type } = useParams();
  const navigate = useNavigate();

  const guides: Record<string, { title: string; component: JSX.Element }> = {
    masters: {
      title: 'راهنمای بررسی پرونده‌های ارشد',
      component: <MastersGuide />,
    },
    phd: {
      title: 'راهنمای بررسی پرونده‌های دکتری',
      component: <MastersGuide />, // می‌توانید یک component جداگانه بسازید
    },
    interview: {
      title: 'راهنمای مصاحبه دکتری',
      component: <MastersGuide />,
    },
    'faculty-recruitment': {
      title: 'راهنمای جذب هیئت علمی',
      component: <MastersGuide />,
    },
    reports: {
      title: 'راهنمای گزارش‌گیری',
      component: <MastersGuide />,
    },
  };

  const currentGuide = type && guides[type] ? guides[type] : null;

  if (!currentGuide) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">راهنما یافت نشد</h2>
        <Button onClick={() => navigate('/admin/dashboard')}>
          <ArrowRight className="ml-2 h-4 w-4" />
          بازگشت به داشبورد
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button 
        variant="ghost" 
        onClick={() => navigate('/admin/dashboard')}
        className="mb-4"
      >
        <ArrowRight className="ml-2 h-4 w-4" />
        بازگشت به داشبورد
      </Button>
      {currentGuide.component}
    </div>
  );
};

export default GuideRouter;
