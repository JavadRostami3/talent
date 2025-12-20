import { LayoutDashboard, Users, Settings, Bell, BookOpen } from 'lucide-react';
import { NavLink } from '@/components/NavLink';

export const AdminSidebar = () => {
  const links = [
    { to: '/admin', icon: LayoutDashboard, label: 'داشبورد', end: true },
    { to: '/admin/applications', icon: Users, label: 'لیست متقاضیان' },
    { to: '/admin/talent/admissions/programs', icon: BookOpen, label: 'پذیرش ارشد' },
    { to: '/admin/announcements', icon: Bell, label: 'اطلاعیه‌ها' },
    { to: '/admin/process-guide', icon: BookOpen, label: 'راهنمای فرآیندها' },
    { to: '/admin/settings', icon: Settings, label: 'تنظیمات' },
  ];

  return (
    <aside className="bg-card border-l border-border w-[15.4rem] min-h-[calc(100vh-73px)]">
      <nav className="p-4 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
          >
            <link.icon className="h-5 w-5" />
            <span className="font-medium">{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
