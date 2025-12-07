import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import api from '@/services/api';
import { toast } from '@/hooks/use-toast';

const SubmitApplication = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Get application
      const response = await api.get('/api/applications/');
      const applications = Array.isArray(response.data) ? response.data : response.data.results || [];
      const applicationId = applications[0]?.id;
      
      if (!applicationId) {
        throw new Error('Application not found');
      }

      // Submit
      await api.post(`/api/applications/${applicationId}/submit/`);
      
      toast({
        title: 'موفق',
        description: 'درخواست شما با موفقیت برای بررسی ارسال شد',
      });
      
      navigate('..');
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'ارسال با خطا مواجه شد',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Send className="h-8 w-8 text-primary" />
          ارسال برای بررسی
        </h1>
        <p className="text-muted-foreground mt-2">
          آماده ارسال نهایی درخواست خود هستید؟
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>قبل از ارسال نهایی</CardTitle>
          <CardDescription>
            لطفاً موارد زیر را بررسی نمایید
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              اطلاعات شخصی شما کامل و صحیح است
            </AlertDescription>
          </Alert>
          
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              اطلاعات تحصیلی شما کامل و صحیح است
            </AlertDescription>
          </Alert>
          
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              تمامی مدارک شناسایی بارگذاری شده است
            </AlertDescription>
          </Alert>
          
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              تمامی مدارک تحصیلی بارگذاری شده است
            </AlertDescription>
          </Alert>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>توجه:</strong> پس از ارسال نهایی، امکان ویرایش اطلاعات وجود ندارد
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button onClick={handleSubmit} disabled={submitting} size="lg">
          {submitting ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              در حال ارسال...
            </>
          ) : (
            <>
              <Send className="ml-2 h-4 w-4" />
              ارسال نهایی
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SubmitApplication;
