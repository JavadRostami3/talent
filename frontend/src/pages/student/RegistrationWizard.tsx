import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import WizardLayout from '@/components/wizard/WizardLayout';
import api from '@/services/api';
import type { Application } from '@/types/models';

const RegistrationWizard = () => {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplication();
  }, []);

  const fetchApplication = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      // Get user's application for current round
      const response = await api.get<Application[]>('/api/applications/');
      const applications = Array.isArray(response.data) ? response.data : response.data.results || [];
      
      if (applications.length > 0) {
        const app = applications[0];
        setApplication(app);
      } else {
        // No application exists
        toast({
          title: 'خطا',
          description: 'درخواست شما یافت نشد. لطفاً با پشتیبانی تماس بگیرید.',
          variant: 'destructive',
        });
        navigate('..');
      }
    } catch (error: any) {
      toast({
        title: 'خطا در بارگذاری',
        description: error.response?.data?.error || 'خطایی رخ داده است',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWizardComplete = () => {
    toast({
      title: 'تبریک!',
      description: 'ثبت‌نام شما با موفقیت تکمیل شد',
    });
    navigate('..');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card className="shadow-xl">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">در حال بارگذاری...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card className="shadow-xl">
          <CardContent className="p-12 text-center">
            <p className="text-destructive">درخواستی یافت نشد</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <WizardLayout
        roundType={application.round_type}
        applicationId={application.id}
        onComplete={handleWizardComplete}
      />
    </div>
  );
};

export default RegistrationWizard;
