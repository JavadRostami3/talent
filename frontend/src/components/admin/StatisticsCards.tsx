import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, FileText, CheckCircle, XCircle, Clock, 
  AlertTriangle, TrendingUp, TrendingDown, Activity 
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import applicationService from '@/services/applicationService';

interface StatisticsData {
  total_applications: number;
  pending_review: number;
  approved: number;
  rejected: number;
  approved_with_defect: number;
  by_round_type: {
    [key: string]: number;
  };
  by_status: {
    [key: string]: number;
  };
  recent_trend: {
    today: number;
    yesterday: number;
    this_week: number;
    last_week: number;
  };
}

interface StatCardProps {
  title: string;
  value: number;
  icon: any;
  trend?: number;
  trendLabel?: string;
  className?: string;
}

const StatCard = ({ title, value, icon: Icon, trend, trendLabel, className }: StatCardProps) => {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString('fa-IR')}</div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {trend > 0 ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : trend < 0 ? (
              <TrendingDown className="h-3 w-3 text-red-600" />
            ) : (
              <Activity className="h-3 w-3 text-gray-600" />
            )}
            <span className={`text-xs ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {Math.abs(trend)} {trendLabel}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const StatisticsCards = () => {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
    // تازه‌سازی هر 30 ثانیه
    const interval = setInterval(fetchStatistics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatistics = async () => {
    try {
      const data = await applicationService.getStatistics();
      setStats(data);
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری آمار',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const weekTrend = stats.recent_trend.this_week - stats.recent_trend.last_week;
  const dayTrend = stats.recent_trend.today - stats.recent_trend.yesterday;

  return (
    <div className="space-y-4">
      {/* آمار اصلی */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="کل درخواست‌ها"
          value={stats.total_applications}
          icon={FileText}
          trend={weekTrend}
          trendLabel="نسبت به هفته قبل"
          className="border-r-4 border-r-blue-500"
        />
        <StatCard
          title="در انتظار بررسی"
          value={stats.pending_review}
          icon={Clock}
          trend={dayTrend}
          trendLabel="نسبت به دیروز"
          className="border-r-4 border-r-yellow-500"
        />
        <StatCard
          title="تایید شده"
          value={stats.approved}
          icon={CheckCircle}
          className="border-r-4 border-r-green-500"
        />
        <StatCard
          title="رد شده"
          value={stats.rejected}
          icon={XCircle}
          className="border-r-4 border-r-red-500"
        />
      </div>

      {/* آمار تفصیلی */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* بر اساس نوع فراخوان */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">بر اساس نوع فراخوان</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.by_round_type).map(([type, count]) => {
                const labels: { [key: string]: string } = {
                  MA_TALENT: 'استعداد ارشد',
                  PHD_TALENT: 'استعداد دکتری',
                  PHD_EXAM: 'آزمون دکتری',
                  OLYMPIAD: 'المپیاد',
                };
                const percentage = (count / stats.total_applications) * 100;

                return (
                  <div key={type}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{labels[type] || type}</span>
                      <span className="text-muted-foreground">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* بر اساس وضعیت */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">بر اساس وضعیت</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.by_status).slice(0, 6).map(([status, count]) => {
                const labels: { [key: string]: string } = {
                  SUBMITTED: 'ثبت شده',
                  UNDER_UNIVERSITY_REVIEW: 'بررسی دانشگاه',
                  APPROVED_BY_UNIVERSITY: 'تایید دانشگاه',
                  REJECTED_BY_UNIVERSITY: 'رد دانشگاه',
                  UNDER_FACULTY_REVIEW: 'بررسی دانشکده',
                  RETURNED_FOR_CORRECTION: 'برگشت برای اصلاح',
                };
                const percentage = (count / stats.total_applications) * 100;

                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{labels[status] || status}</span>
                      <span className="text-muted-foreground">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* روند زمانی */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">روند ثبت درخواست</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">امروز</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.recent_trend.today}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">دیروز</p>
              <p className="text-2xl font-bold">
                {stats.recent_trend.yesterday}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">این هفته</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.recent_trend.this_week}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">هفته قبل</p>
              <p className="text-2xl font-bold">
                {stats.recent_trend.last_week}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* هشدارها */}
      {stats.approved_with_defect > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              هشدار
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700">
              {stats.approved_with_defect} درخواست با نقص تایید شده است که نیاز به پیگیری دارند.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StatisticsCards;
