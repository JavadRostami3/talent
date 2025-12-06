import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Calendar } from 'lucide-react';
import api from '@/services/api';

interface Announcement {
  id: number;
  code: string;
  title: string;
  body: string;
  category: string;
  category_display: string;
  published_at: string | null;
  views_count: number;
  created_at: string;
}

const Announcements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await api.get<{ results?: Announcement[] }>('/api/content/announcements/public/', {
        params: { ordering: '-published_at' }
      });
      const announcementsData = response.data.results || (Array.isArray(response.data) ? response.data : []);
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-center text-3xl font-bold text-foreground mb-2">اطلاعیه‌ها</h1>
        <p className="text-center text-muted-foreground">آخرین اخبار و اطلاعیه‌های ثبت‌نام</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">اطلاعیه‌ای موجود نیست</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2 flex items-center gap-2">
                      <Bell className="h-5 w-5 text-accent" />
                      {announcement.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {announcement.published_at 
                        ? new Date(announcement.published_at).toLocaleDateString('fa-IR')
                        : new Date(announcement.created_at).toLocaleDateString('fa-IR')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed">{announcement.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Announcements;
