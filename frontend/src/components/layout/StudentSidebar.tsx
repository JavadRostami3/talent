import { LayoutDashboard, FileText, Bell } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';

export const StudentSidebar = () => {
  const links = [
    { to: '/student', icon: LayoutDashboard, label: 'داشبورد', end: true },
    { to: '/student/announcements', icon: Bell, label: 'اطلاعیه‌ها' },
  ];

  return (
    <aside className="bg-card border-l border-border w-64 min-h-[calc(100vh-73px)]">
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
