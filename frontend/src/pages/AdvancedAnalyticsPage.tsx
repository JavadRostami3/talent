import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Users, FileText, CheckCircle, Calendar } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  applications_trend: {
    date: string;
    count: number;
    accepted: number;
    rejected: number;
    pending: number;
  }[];
  status_distribution: {
    name: string;
    value: number;
  }[];
  university_stats: {
    name: string;
    applications: number;
    acceptance_rate: number;
  }[];
  program_stats: {
    name: string;
    applications: number;
  }[];
  monthly_comparison: {
    month: string;
    current_year: number;
    previous_year: number;
  }[];
  kpi_metrics: {
    total_applications: number;
    acceptance_rate: number;
    average_processing_time: number;
    active_users: number;
    growth_rate: number;
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdvancedAnalyticsPage() {
  const { toast } = useToast();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [comparisonYear, setComparisonYear] = useState('2024');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/analytics/advanced/', {
        params: { time_range: timeRange },
      });
      setData(response.data);
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'بارگذاری داده‌های تحلیلی با خطا مواجه شد',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">در حال بارگذاری تحلیل‌ها...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">تحلیل‌های پیشرفته</h1>
          <p className="text-muted-foreground mt-1">
            نمودارها و آمار جامع سیستم
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 ml-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 روز اخیر</SelectItem>
              <SelectItem value="30d">30 روز اخیر</SelectItem>
              <SelectItem value="90d">3 ماه اخیر</SelectItem>
              <SelectItem value="365d">سال جاری</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadAnalytics}>بروزرسانی</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              کل درخواست‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data.kpi_metrics.total_applications.toLocaleString('fa-IR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              نرخ پذیرش
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {data.kpi_metrics.acceptance_rate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              کاربران فعال
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {data.kpi_metrics.active_users.toLocaleString('fa-IR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              نرخ رشد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              +{data.kpi_metrics.growth_rate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              زمان پردازش
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {data.kpi_metrics.average_processing_time} روز
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>روند درخواست‌ها در طول زمان</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data.applications_trend}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAccepted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorTotal)"
                name="کل"
              />
              <Area
                type="monotone"
                dataKey="accepted"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorAccepted)"
                name="پذیرفته شده"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>توزیع وضعیت درخواست‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.status_distribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.status_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Program Stats Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>درخواست‌ها بر اساس رشته</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.program_stats.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="applications" fill="#3b82f6" name="تعداد درخواست" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* University Stats */}
      <Card>
        <CardHeader>
          <CardTitle>آمار دانشگاه‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data.university_stats} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="applications" fill="#3b82f6" name="تعداد درخواست" />
              <Bar
                dataKey="acceptance_rate"
                fill="#10b981"
                name="نرخ پذیرش (%)"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>مقایسه ماهانه سال جاری با سال قبل</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data.monthly_comparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="current_year"
                stroke="#3b82f6"
                strokeWidth={2}
                name="سال جاری"
              />
              <Line
                type="monotone"
                dataKey="previous_year"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="سال قبل"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Insights Section */}
      <Card>
        <CardHeader>
          <CardTitle>تحلیل‌ها و پیشنهادات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.kpi_metrics.growth_rate > 10 && (
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">رشد مثبت</h4>
                  <p className="text-sm text-green-700 mt-1">
                    تعداد درخواست‌ها نسبت به دوره قبل {data.kpi_metrics.growth_rate.toFixed(1)}% رشد داشته است.
                  </p>
                </div>
              </div>
            )}

            {data.kpi_metrics.acceptance_rate < 30 && (
              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">نرخ پذیرش پایین</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    نرخ پذیرش فعلی {data.kpi_metrics.acceptance_rate.toFixed(1)}% است. بررسی معیارهای پذیرش توصیه می‌شود.
                  </p>
                </div>
              </div>
            )}

            {data.kpi_metrics.average_processing_time > 15 && (
              <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-900">زمان پردازش بالا</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    میانگین زمان پردازش {data.kpi_metrics.average_processing_time} روز است. بهینه‌سازی فرآیند پیشنهاد می‌شود.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">کاربران فعال</h4>
                <p className="text-sm text-blue-700 mt-1">
                  در حال حاضر {data.kpi_metrics.active_users.toLocaleString('fa-IR')} کاربر فعال در سیستم وجود دارد.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
