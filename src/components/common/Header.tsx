import React from 'react';
import { User as UserIcon, LogOut, Scan, Globe, Sparkles, Clock, LogOut as DoorExit, Building2 } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useLanguageStore } from '../../stores/useLanguageStore';
import { useBranchStore } from '../../stores/useBranchStore';

interface HeaderProps {
  currentViewTitle: string;
  onOpenQuickLogModal: () => void;
  onOpenExitReasonModal: () => void;
  onOpenScannerModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentViewTitle,
  onOpenQuickLogModal,
  onOpenExitReasonModal,
  onOpenScannerModal,
}) => {
  const { currentUser, logout } = useAuthStore();
  const { language, toggleLanguage, t, isRtl } = useLanguageStore();
  const { branches, activeBranchId, setActiveBranchId } = useBranchStore();

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return t.roleAdmin;
      case 'HR':
        return t.roleHR;
      case 'SECURITY':
        return t.roleSecurity;
      case 'MANAGER':
        return t.roleManager;
      default:
        return t.roleUser;
    }
  };

  return (
    <header className="bg-slate-900/60 backdrop-blur-2xl border-b border-white/10 px-6 py-3.5 flex flex-wrap items-center justify-between sticky top-0 z-20 shadow-2xl">
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              {currentViewTitle}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>{isRtl ? 'ذكاء اصطناعي مدمج' : 'Smart Core'}</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            {t.appSubtitle}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Multi-Branch Selector (Super Admin & Managers) */}
        <div className="flex items-center gap-1.5 bg-slate-800/90 border border-cyan-500/30 px-2.5 py-1 rounded-xl shadow-inner">
          <Building2 className="w-3.5 h-3.5 text-cyan-400" />
          <select
            value={activeBranchId}
            onChange={(e) => setActiveBranchId(e.target.value)}
            className="bg-transparent text-xs font-bold text-cyan-200 outline-none cursor-pointer py-0.5"
          >
            <option value="ALL" className="bg-slate-900 text-white">
              🏢 {isRtl ? 'كافة الفروع المجمعة (الفرع الرئيسي)' : 'All Consolidated Branches'}
            </option>
            {branches.map((b) => (
              <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                {b.isMain ? '📍 ' : '🏢 '} {isRtl ? b.nameAr : b.nameEn} ({b.code})
              </option>
            ))}
          </select>
        </div>

        {/* Language Switcher Button */}
        <button
          onClick={toggleLanguage}
          className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 border border-cyan-500/30 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          title={isRtl ? 'Switch to English' : 'التحويل إلى اللغة العربية'}
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>{language === 'ar' ? 'English' : 'العربية'}</span>
        </button>

        <button
          onClick={onOpenScannerModal}
          className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-500/25 ring-1 ring-cyan-400/30"
        >
          <Scan className="w-3.5 h-3.5" />
          <span>{t.scannerButton}</span>
        </button>

        <button
          onClick={onOpenExitReasonModal}
          className="px-3.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
        >
          <DoorExit className="w-3.5 h-3.5 text-amber-400" />
          <span>{t.exitReasonButton}</span>
        </button>

        <button
          onClick={onOpenQuickLogModal}
          className="px-3.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-white/10 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t.manualLogButton}</span>
        </button>

        <div className="h-6 w-px bg-white/10 mx-0.5"></div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2.5 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-white/10">
            <div className="p-1.5 bg-gradient-to-tr from-cyan-500 to-blue-600 text-white rounded-lg shadow-md shadow-cyan-500/20">
              <UserIcon className="w-3.5 h-3.5" />
            </div>
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <div className="text-xs font-bold text-white leading-tight">
                {currentUser?.name || (isRtl ? 'مستخدم النظام' : 'System User')}
              </div>
              <div className="text-[10px] text-cyan-400 font-semibold leading-tight">
                {isRtl ? 'الدور: ' : 'Role: '}{getRoleLabel(currentUser?.role)}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            title={t.logoutTooltip}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};


