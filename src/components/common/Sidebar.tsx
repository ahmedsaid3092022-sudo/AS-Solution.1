import React from 'react';
import {
  LayoutDashboard,
  Clock,
  Users,
  Cpu,
  FileBarChart2,
  ShieldAlert,
  Settings,
  Key,
  Database,
  Building2,
  Scan,
  UserCheck,
  ArrowRightLeft,
} from 'lucide-react';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';
import { useLanguageStore } from '../../stores/useLanguageStore';

export type ViewType = 'dashboard' | 'attendance' | 'scannedDocs' | 'employees' | 'devices' | 'reports' | 'audit' | 'settings' | 'ess' | 'pipeline';

interface SidebarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  onOpenLicenseModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  onOpenLicenseModal,
}) => {
  const { subscriptionInfo } = useSubscriptionStore();
  const { t, isRtl } = useLanguageStore();

  const navItems = [
    { id: 'dashboard' as ViewType, label: t.navDashboard, icon: LayoutDashboard },
    { id: 'attendance' as ViewType, label: t.navAttendance, icon: Clock },
    { id: 'ess' as ViewType, label: isRtl ? 'الخدمة الذاتية (ESS)' : 'ESS Portal', icon: UserCheck },
    { id: 'pipeline' as ViewType, label: isRtl ? 'الربط والـ ERP' : 'ERP Bridge', icon: ArrowRightLeft },
    { id: 'scannedDocs' as ViewType, label: t.navScannedDocs, icon: Scan },
    { id: 'employees' as ViewType, label: t.navEmployees, icon: Users },
    { id: 'devices' as ViewType, label: t.navDevices, icon: Cpu },
    { id: 'reports' as ViewType, label: t.navReports, icon: FileBarChart2 },
    { id: 'audit' as ViewType, label: t.navAudit, icon: ShieldAlert },
    { id: 'settings' as ViewType, label: t.navSettings, icon: Settings },
  ];

  return (
    <aside className={`w-64 bg-slate-900/70 backdrop-blur-2xl ${isRtl ? 'border-l' : 'border-r'} border-white/10 text-slate-300 flex flex-col justify-between select-none z-10 shadow-2xl`}>
      <div>
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-cyan-600 to-blue-500 text-white rounded-xl shadow-lg shadow-cyan-500/25 ring-1 ring-cyan-400/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-extrabold text-white text-base tracking-tight leading-snug">{t.appName}</h2>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <p className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase">Smart Biometric Hub</p>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-transparent border border-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-500/10 font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-1.5 rounded-lg transition-colors ${
                      isActive ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{item.label}</span>
                </div>

                {isActive && (
                  <span className={`w-1.5 h-5 rounded-full bg-cyan-400 glow-cyan absolute ${isRtl ? 'left-2' : 'right-2'}`} />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-white/10 space-y-3">
        <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl p-3.5 border border-cyan-500/20 shadow-inner space-y-2.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              {t.subscriptionStatus}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                subscriptionInfo.status === 'ACTIVE'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {isRtl ? subscriptionInfo.planNameAr : 'Pro Enterprise'}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>{t.expiresIn}:</span>
              <span className="font-mono text-slate-200">{subscriptionInfo.expirationDate}</span>
            </div>
            <div className="flex justify-between">
              <span>{t.daysRemaining}:</span>
              <span className="font-mono text-cyan-400 font-bold">{subscriptionInfo.daysRemaining} {isRtl ? 'يوم' : 'Days'}</span>
            </div>
          </div>

          <button
            onClick={onOpenLicenseModal}
            className="w-full mt-1 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30 text-cyan-200 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Key className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.manageLicense}</span>
          </button>
        </div>

        <div className="text-center text-[10px] text-slate-500 font-mono flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50" />
          <span>{t.systemVersion}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50" />
        </div>
      </div>
    </aside>
  );
};

