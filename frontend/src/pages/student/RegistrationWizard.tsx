import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stepper } from '@/components/ui/Stepper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import ProgramSelector from '@/components/features/ProgramSelector';
import PersonalInfoForm from '@/components/forms/PersonalInfoForm';
import EducationRecordsForm from '@/components/forms/EducationRecordsForm';
import ResearchRecordsForm from '@/components/forms/ResearchRecordsForm';
import DocumentUploadForm from '@/components/forms/DocumentUploadForm';
import api from '@/services/api';
import type { Application, RoundType } from '@/types/models';

const RegistrationWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const steps = [
    { label: 'انتخاب رشته' },
    { label: 'اطلاعات شخصی' },
    { label: 'سوابق تحصیلی' },
    { label: 'سوابق پژوهشی' },
    { label: 'بارگذاری مدارک' },
  ];

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
      
      if (response.data.length > 0) {
        const app = response.data[0];
        setApplication(app);
        
        // Determine current step based on application state
        if (app.program_choices && app.program_choices.length > 0) {
          setCurrentStep(2); // Move to personal info if programs selected
        }
      } else {
        // No application exists, create one
        toast({
          title: 'خطا',
          description: 'درخواست شما یافت نشد. لطفاً با پشتیبانی تماس بگیرید.',
          variant: 'destructive',
        });
        navigate('/student');
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

  const handleProgramSelectionComplete = () => {
    setCurrentStep(2);
    fetchApplication(); // Refresh to get updated choices
  };

  const handlePersonalInfoComplete = () => {
    setCurrentStep(3);
  };

  const handleEducationRecordsComplete = () => {
    setCurrentStep(4);
  };

  const handleResearchRecordsComplete = () => {
    setCurrentStep(5);
  };

  const handleDocumentUploadComplete = async () => {
    try {
      // Submit the application
      await api.patch(`/api/applications/${application?.id}/`, {
        status: 'SUBMITTED',
      });

      toast({
        title: 'ثبت نهایی موفق',
        description: 'درخواست شما با موفقیت ثبت شد و در دست بررسی است',
      });

      // Navigate to dashboard
      navigate('/student');
    } catch (error: any) {
      toast({
        title: 'خطا در ثبت نهایی',
        description: error.response?.data?.error || 'خطایی رخ داده است',
        variant: 'destructive',
      });
    }
  };

  const handleBack = (step: number) => {
    setCurrentStep(step);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="shadow-xl">
          <CardContent className="p-12 text-center">
            <p className="text-destructive">درخواستی یافت نشد</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">تکمیل درخواست ثبت‌نام</CardTitle>
        </CardHeader>
        <CardContent>
          <Stepper steps={steps} currentStep={currentStep} />

          <div className="mt-8">
            {currentStep === 1 && (
              <ProgramSelector
                applicationId={application.id}
                roundType={application.round_type}
                onComplete={handleProgramSelectionComplete}
                initialChoices={application.program_choices || []}
              />
            )}

            {currentStep === 2 && user && (
              <PersonalInfoForm
                userId={user.id}
                initialData={{
                  father_name: user.father_name,
                  birth_certificate_number: user.birth_certificate_number,
                  birth_certificate_serial: user.birth_certificate_serial,
                  birth_certificate_location: user.birth_certificate_location,
                  birth_date: user.birth_date,
                  gender: user.gender,
                  military_status: user.military_status,
                }}
                onComplete={handlePersonalInfoComplete}
                onBack={() => handleBack(1)}
              />
            )}

            {currentStep === 3 && (
              <EducationRecordsForm
                applicationId={application.id}
                roundType={application.round_type}
                onComplete={handleEducationRecordsComplete}
                onBack={() => handleBack(2)}
              />
            )}

            {currentStep === 4 && (
              <ResearchRecordsForm
                applicationId={application.id}
                roundType={application.round_type}
                onComplete={handleResearchRecordsComplete}
                onBack={() => handleBack(3)}
              />
            )}

            {currentStep === 5 && (
              <DocumentUploadForm
                applicationId={application.id}
                onComplete={handleDocumentUploadComplete}
                onBack={() => handleBack(4)}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegistrationWizard;
