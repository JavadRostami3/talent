import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import api from '@/services/api';
import { toast } from '@/hooks/use-toast';

interface Deficiency {
  id: number;
  deficiency_type: string;
  description: string;
  created_at: string;
  resolved: boolean;
}

const Deficiencies = () => {
  const [loading, setLoading] = useState(true);
  const [deficiencies, setDeficiencies] = useState<Deficiency[]>([]);

  useEffect(() => {
    fetchDeficiencies();
  }, []);

  const fetchDeficiencies = async () => {
    try {
      const response = await api.get('/api/applicant/applications/');
      const application = response.data.results[0];
      
      if (application?.deficiencies) {
        setDeficiencies(application.deficiencies);
      }
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'دریافت نقص‌ها با خطا مواجه شد',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <AlertCircle className="h-8 w-8 text-amber-500" />
          نقص‌های پرونده
        </h1>
        <p className="text-muted-foreground mt-2">
          لیست نقص‌های اعلام شده توسط کارشناسان
        </p>
      </div>

      {deficiencies.length === 0 ? (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            پرونده شما در حال حاضر فاقد نقص است
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {deficiencies.map((deficiency) => (
            <Card key={deficiency.id}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>نقص: {deficiency.deficiency_type}</span>
                  {deficiency.resolved ? (
                    <span className="text-sm text-green-600">رفع شده</span>
                  ) : (
                    <span className="text-sm text-amber-600">در انتظار رفع</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{deficiency.description}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  تاریخ: {new Date(deficiency.created_at).toLocaleDateString('fa-IR')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Deficiencies;
