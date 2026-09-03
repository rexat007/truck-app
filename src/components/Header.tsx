import React from 'react';
import { Truck, Smartphone, Monitor, ShieldCheck, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentRole: 'driver' | 'admin';
  onRoleChange: (role: 'driver' | 'admin') => void;
  activeTripsCount: number;
  discrepanciesCount: number;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  activeTripsCount,
  discrepanciesCount,
  isOnline,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md shadow-indigo-600/20 flex-shrink-0">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold leading-none tracking-tight text-slate-900">
                ناقل | TRUCK-TRACK AI
              </h1>
              <span className="hidden lg:inline-block px-2.5 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-full">
                نظام إدارة الأسطول
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block mt-0.5">
              نظام إدارة أسطول النقل اللوجستي المتكامل • ميزان البسكول ومطابقة الوقود
            </p>
          </div>
        </div>

        {/* Center: Role Switcher Tabs (Bento Pill Style) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            id="role-driver-btn"
            onClick={() => onRoleChange('driver')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              currentRole === 'driver'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>تطبيق السائق</span>
          </button>

          <button
            id="role-admin-btn"
            onClick={() => onRoleChange('admin')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              currentRole === 'admin'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>لوحة الإدارة</span>
            {discrepanciesCount > 0 && (
              <span className="bg-amber-400 text-slate-900 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                {discrepanciesCount}
              </span>
            )}
          </button>
        </div>

        {/* Right side: Bento Metric Badges & PWA */}
        <div className="flex items-center gap-2">
          {/* Active Trips Badge */}
          <span className="hidden md:flex px-3 py-1.5 bg-green-100 text-green-700 border border-green-200/80 rounded-full text-xs font-semibold items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>نشط الآن: {activeTripsCount} شاحنة</span>
          </span>

          {/* Discrepancies Alerts Badge */}
          {discrepanciesCount > 0 ? (
            <span className="hidden sm:flex px-3 py-1.5 bg-amber-100 text-amber-700 border border-amber-200/80 rounded-full text-xs font-semibold items-center gap-1.5">
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
              <span>تنبيهات: {discrepanciesCount}</span>
            </span>
          ) : (
            <span className="hidden lg:flex px-3 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-medium items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>الأوزان مطابقة</span>
            </span>
          )}

          {/* Network status */}
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
            title={isOnline ? 'متصل بالشبكة' : 'يعمل في وضع غير متصل'}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-rose-600" />}
            <span className="hidden sm:inline">{isOnline ? 'متصل' : 'أوفلاين'}</span>
          </div>

          {/* PWA Install Button */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
