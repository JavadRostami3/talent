import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import notificationService from '@/services/notificationService';
import type { Notification, NotificationStats } from '@/types/notification';
import { toast } from '@/hooks/use-toast';

interface NotificationContextType {
  notifications: Notification[];
  stats: NotificationStats | null;
  loading: boolean;
  hasMore: boolean;
  page: number;
  
  // Actions
  fetchNotifications: (reset?: boolean) => Promise<void>;
  refreshStats: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveNotification: (notificationId: number) => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
  loadMore: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
  autoRefreshInterval?: number; // milliseconds, default 30000 (30s)
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  autoRefreshInterval = 30000,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Fetch notifications
  const fetchNotifications = useCallback(async (reset = false) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const response = await notificationService.getNotifications({
        page: currentPage,
        page_size: pageSize,
        is_archived: false,
      });

      if (reset) {
        setNotifications(response.results);
        setPage(1);
      } else {
        setNotifications(prev => [...prev, ...response.results]);
      }

      setHasMore(response.next !== null);
      if (!reset) {
        setPage(prev => prev + 1);
      }
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, page]);

  // Refresh stats
  const refreshStats = useCallback(async () => {
    try {
      const data = await notificationService.getNotificationStats();
      setStats(data);
    } catch (error: any) {
      console.error('Failed to fetch notification stats:', error);
    }
  }, []);

  // Mark as read
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );

      // Refresh stats
      await refreshStats();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: 'خطا در علامت‌گذاری نوتیفیکیشن',
        variant: 'destructive',
      });
    }
  }, [refreshStats]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );

      // Refresh stats
      await refreshStats();

      toast({
        title: 'موفق',
        description: 'همه نوتیفیکیشن‌ها خوانده شدند',
      });
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: 'خطا در علامت‌گذاری همه نوتیفیکیشن‌ها',
        variant: 'destructive',
      });
    }
  }, [refreshStats]);

  // Archive notification
  const archiveNotification = useCallback(async (notificationId: number) => {
    try {
      await notificationService.archiveNotification(notificationId);
      
      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      // Refresh stats
      await refreshStats();

      toast({
        title: 'موفق',
        description: 'نوتیفیکیشن بایگانی شد',
      });
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: 'خطا در بایگانی نوتیفیکیشن',
        variant: 'destructive',
      });
    }
  }, [refreshStats]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      // Refresh stats
      await refreshStats();

      toast({
        title: 'موفق',
        description: 'نوتیفیکیشن حذف شد',
      });
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: 'خطا در حذف نوتیفیکیشن',
        variant: 'destructive',
      });
    }
  }, [refreshStats]);

  // Load more
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchNotifications(false);
    }
  }, [loading, hasMore, fetchNotifications]);

  // Initial load
  useEffect(() => {
    fetchNotifications(true);
    refreshStats();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (autoRefreshInterval > 0) {
      const interval = setInterval(() => {
        refreshStats();
        // Optionally refresh first page of notifications
        fetchNotifications(true);
      }, autoRefreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefreshInterval, refreshStats, fetchNotifications]);

  const value: NotificationContextType = {
    notifications,
    stats,
    loading,
    hasMore,
    page,
    fetchNotifications,
    refreshStats,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    loadMore,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
