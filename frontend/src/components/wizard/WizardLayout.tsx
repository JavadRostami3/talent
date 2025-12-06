import { useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { RoundType, Application } from '@/types/models';
import applicationService from '@/services/applicationService';

// Import Step Components
import PersonalInfoStep from './steps/PersonalInfoStep';
import EducationRecordsStep from './steps/EducationRecordsStep';
import ResearchRecordsStep from './steps/ResearchRecordsStep';
import DocumentUploadStep from './steps/DocumentUploadStep';
import ProgramSelectionStep from './steps/ProgramSelectionStep';

export interface WizardStep {
  id: number;
  title: string;
  description: string;
  component: ReactNode;
  isOptional?: boolean;
  shouldSkip?: (app: Application) => boolean;
}

interface WizardLayoutProps {
  roundType: RoundType;
  applicationId: number;
  onComplete?: () => void;
}

const WizardLayout = ({ roundType, applicationId, onComplete }: WizardLayoutProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const navigate = useNavigate();

  // Handler برای تکمیل هر مرحله
  const handleStepComplete = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
    
    // انتقال به مرحله بعد
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  // تعریف مراحل بر اساس نوع فراخوان
  const getSteps = (): WizardStep[] => {
    const baseSteps: WizardStep[] = [
      {
        id: 1,
        title: 'مشخصات شخصی',
        description: 'تکمیل اطلاعات فردی و شناسنامه‌ای',
        component: (
          <PersonalInfoStep
            applicationId={applicationId}
            onComplete={() => handleStepComplete(1)}
          />
        ),
        isOptional: false,
      },
      {
        id: 2,
        title: 'سوابق تحصیلی',
        description: 'ثبت مدارک و سوابق تحصیلی',
        component: (
          <EducationRecordsStep
            applicationId={applicationId}
            roundType={roundType}
            onComplete={() => handleStepComplete(2)}
          />
        ),
        isOptional: false,
      },
    ];

    // فاز پژوهش فقط برای دکتری
    if (roundType === 'PHD_TALENT' || roundType === 'PHD_EXAM') {
      baseSteps.push({
        id: 3,
        title: 'سوابق پژوهشی',
        description: 'ثبت مقالات، اختراعات و سایر سوابق',
        component: (
          <ResearchRecordsStep
            applicationId={applicationId}
            onComplete={() => handleStepComplete(3)}
          />
        ),
        isOptional: roundType === 'PHD_EXAM', // برای آزمون دکتری اختیاری است
      });
    }

    baseSteps.push(
      {
        id: 4,
        title: 'بارگذاری مدارک',
        description: 'آپلود مدارک شناسایی و تحصیلی',
        component: (
          <DocumentUploadStep
            applicationId={applicationId}
            roundType={roundType}
            onComplete={() => handleStepComplete(4)}
          />
        ),
        isOptional: false,
      },
      {
        id: 5,
        title: 'انتخاب رشته',
        description: 'انتخاب حداکثر 3 رشته به ترتیب اولویت',
        component: (
          <ProgramSelectionStep
            applicationId={applicationId}
            onComplete={() => handleStepComplete(5)}
          />
        ),
        isOptional: false,
      }
    );

    return baseSteps;
  };

  const steps = getSteps();

  useEffect(() => {
    fetchApplication();
  }, [applicationId]);

  const fetchApplication = async () => {
    setLoading(true);
    try {
      const app = await applicationService.getApplicationById(applicationId);
      setApplication(app);
      
      // تشخیص مراحل تکمیل شده بر اساس وضعیت
      const completed: number[] = [];
      
      // Step 1: Personal Info
      if (app.applicant?.user.father_name && app.applicant?.user.gender) {
        completed.push(1);
      }
      
      // Step 2: Education Records
      if (app.education_records && app.education_records.length > 0) {
        completed.push(2);
      }
      
      // Step 3: Research Records (if applicable)
      if (roundType === 'PHD_TALENT' || roundType === 'PHD_EXAM') {
        if (app.research_records && app.research_records.length > 0) {
          completed.push(3);
        }
      }
      
      // Step 4: Documents
      if (app.documents && app.documents.length >= 3) {
        // حداقل 3 مدرک ضروری
        completed.push(4);
      }
      
      // Step 5: Program Choices
      if (app.choices && app.choices.length > 0) {
        completed.push(5);
      }
      
      setCompletedSteps(completed);
      
      // تنظیم مرحله فعلی به اولین مرحله ناتمام
      const firstIncomplete = steps.findIndex(step => !completed.includes(step.id));
      if (firstIncomplete !== -1) {
        setCurrentStepIndex(firstIncomplete);
      }
      
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در بارگذاری اطلاعات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    const currentStep = steps[currentStepIndex];
    
    // Validate current step
    if (!completedSteps.includes(currentStep.id) && !currentStep.isOptional) {
      toast({
        title: 'تکمیل مرحله الزامی است',
        description: `لطفاً مرحله "${currentStep.title}" را تکمیل کنید`,
        variant: 'destructive',
      });
      return;
    }

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // آخرین مرحله - ارسال نهایی
      await handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!application) return;

    // بررسی اینکه آیا همه مراحل الزامی تکمیل شده‌اند
    const requiredSteps = steps.filter(s => !s.isOptional).map(s => s.id);
    const allCompleted = requiredSteps.every(id => completedSteps.includes(id));

    if (!allCompleted) {
      toast({
        title: 'مراحل ناقص',
        description: 'لطفاً تمام مراحل الزامی را تکمیل کنید',
        variant: 'destructive',
      });
      return;
    }

    // Check readiness with backend validation
    const validation = applicationService.isApplicationReadyForSubmission(application);
    if (!validation.ready) {
      toast({
        title: 'پرونده ناقص است',
        description: validation.missingItems.join('، '),
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await applicationService.submitApplication({
        application_id: applicationId,
        confirm_accuracy: true,
      });

      toast({
        title: 'ثبت نهایی موفق',
        description: 'درخواست شما با موفقیت ثبت شد و در دست بررسی است',
      });

      if (onComplete) {
        onComplete();
      } else {
        navigate('/student/dashboard');
      }
    } catch (error: any) {
      toast({
        title: 'خطا در ارسال',
        description: error.response?.data?.error || 'خطایی رخ داده است',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (): number => {
    return Math.round((completedSteps.length / steps.length) * 100);
  };

  if (loading && !application) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  const currentStep = steps[currentStepIndex];
  const progress = calculateProgress();

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">پیشرفت ثبت‌نام</h2>
          <span className="text-sm text-muted-foreground">
            {completedSteps.length} از {steps.length} مرحله
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground mt-1">{progress}% تکمیل شده</p>
      </div>

      {/* Steps Navigation */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max pb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => setCurrentStepIndex(index)}
                className={`flex flex-col items-center min-w-[120px] p-3 rounded-lg transition-all ${
                  index === currentStepIndex
                    ? 'bg-primary text-primary-foreground'
                    : completedSteps.includes(step.id)
                    ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                disabled={loading}
              >
                <div className="flex items-center gap-2 mb-1">
                  {completedSteps.includes(step.id) ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                  <span className="text-xs font-medium">مرحله {step.id}</span>
                </div>
                <span className="text-xs font-semibold text-center">{step.title}</span>
                {step.isOptional && (
                  <span className="text-[10px] opacity-70 mt-1">(اختیاری)</span>
                )}
              </button>
              
              {index < steps.length - 1 && (
                <ArrowLeft className="h-4 w-4 text-muted-foreground mx-1 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>
              <h3 className="text-xl">{currentStep.title}</h3>
              <p className="text-sm text-muted-foreground font-normal mt-1">
                {currentStep.description}
              </p>
            </div>
            {currentStep.isOptional && (
              <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                اختیاری
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Step Component will be rendered here */}
          {application && (
            <div className="min-h-[400px]">
              {/* این محتوا از props children یا از طریق render prop دریافت می‌شود */}
              {currentStep.component}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0 || loading}
            >
              <ArrowRight className="ml-2 h-4 w-4" />
              مرحله قبل
            </Button>

            <div className="flex items-center gap-3">
              {currentStep.isOptional && (
                <Button
                  variant="ghost"
                  onClick={handleNext}
                  disabled={loading}
                >
                  رد شدن
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </Button>
              )}
              
              <Button
                onClick={handleNext}
                disabled={loading || (!currentStep.isOptional && !completedSteps.includes(currentStep.id))}
              >
                {currentStepIndex === steps.length - 1 ? 'ارسال نهایی' : 'مرحله بعد'}
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Text */}
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          💡 <strong>راهنما:</strong> برای تکمیل هر مرحله، فرم مربوطه را پر کرده و ذخیره کنید. 
          پس از تکمیل تمام مراحل الزامی، می‌توانید پرونده خود را ارسال نمایید.
        </p>
      </div>
    </div>
  );
};

export default WizardLayout;
