import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-foreground">سامانه ثبت‌نام دانشجویان مستعد</h1>
              <p className="text-xs text-muted-foreground">دانشگاه علوم پزشکی</p>
            </div>
          </Link>

          {isAuthenticated && user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{user.name}</span>
                <span className="text-muted-foreground">({user.role === 'admin' ? 'مدیر' : 'دانشجو'})</span>
              </div>
              <Button variant="outline" size="sm" onClick={logout} className="gap-2">
                <LogOut className="h-4 w-4" />
                خروج
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
