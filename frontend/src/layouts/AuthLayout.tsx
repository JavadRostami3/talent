import { ReactNode } from "react";
import { ShieldCheck, Clock3, ClipboardCheck } from "lucide-react";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  helper?: string;
  children: ReactNode;
  footer?: ReactNode;
}

const AuthLayout = ({ title, subtitle, helper, children, footer }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden rounded-l-[32px]">
        <img
          src="/umz-gate.webp"
          alt="دانشگاه مازندران"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/60 to-slate-900/10" />
        <div className="relative z-10 p-10 flex flex-col justify-between h-full text-white space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-sm">
              <ShieldCheck className="h-4 w-4" />
              <span>سامانه ثبت‌نام و مصاحبه</span>
            </div>
            <h2 className="text-2xl font-semibold leading-9">
              ورود و ثبت‌نام یکپارچه برای متقاضیان دانشگاه مازندران
            </h2>
            <p className="text-sm text-slate-100/80 leading-7">
              اطلاعات خود را به صورت امن ثبت کنید و با کد پیگیری وضعیت پرونده را دنبال کنید. این سامانه برای
              فرآیندهای استعداد درخشان، آزمون دکتری و المپیاد بهینه شده است.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/15">
              <p className="text-slate-100/80 mb-1">زمان‌بندی شفاف</p>
              <div className="flex items-center gap-2 font-semibold">
                <Clock3 className="h-4 w-4" />
                <span>پیگیری آنلاین</span>
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/15">
              <p className="text-slate-100/80 mb-1">مدارک دیجیتال</p>
              <div className="flex items-center gap-2 font-semibold">
                <ClipboardCheck className="h-4 w-4" />
                <span>آپلود امن</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 p-6 sm:p-10">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <img
                  src="/umz-logo.png"
                  alt="دانشگاه مازندران"
                  className="h-20 w-20 object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
              {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
              {helper && <p className="text-xs text-slate-500">{helper}</p>}
            </div>

            <div className="mt-8">{children}</div>

            {footer && <div className="mt-6">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
