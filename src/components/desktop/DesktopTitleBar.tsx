import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  HardDrive,
  Clock,
  Key,
  Minus,
  Square,
  X,
  Laptop,
  Smartphone,
  Globe
} from 'lucide-react';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';
import { platformService } from '../../services/platformService';

interface DesktopTitleBarProps {
  onOpenLicenseModal?: () => void;
}

export const DesktopTitleBar: React.FC<DesktopTitleBarProps> = ({ onOpenLicenseModal }) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const { subscriptionInfo } = useSubscriptionStore();
  const platformName = platformService.getPlatformNameAr();
  const isElectron = platformService.isElectron;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isElectron) {
      platformService.isMaximized().then(setIsMaximized);
    }
  }, [isElectron]);

  const handleMinimize = async () => {
    await platformService.minimizeWindow();
  };

  const handleMaximize = async () => {
    await platformService.maximizeWindow();
    const maxState = await platformService.isMaximized();
    setIsMaximized(maxState);
  };

  const handleClose = async () => {
    await platformService.closeWindow();
  };

  const getPlatformIcon = () => {
    if (platformService.isElectron) return <Laptop className="w-3.5 h-3.5 text-cyan-400" />;
    if (platformService.isNativeMobile) return <Smartphone className="w-3.5 h-3.5 text-emerald-400" />;
    return <Globe className="w-3.5 h-3.5 text-blue-400" />;
  };

  return (
    <div
      className="bg-slate-950/90 backdrop-blur-2xl border-b border-white/10 text-slate-200 px-3 py-1.5 flex items-center justify-between text-xs select-none z-50 sticky top-0"
      style={{
        WebkitAppRegion: isElectron ? 'drag' : 'no-drag',
        appRegion: isElectron ? 'drag' : 'no-drag',
      } as any}
    >
      {/* Left / Start Section: Brand & Database & Platform Badge */}
      <div className="flex items-center space-x-2 space-x-reverse" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div className="flex items-center gap-1.5 font-bold text-white bg-gradient-to-r from-cyan-600/30 to-blue-600/30 text-cyan-200 px-2.5 py-1 rounded-md border border-cyan-500/30 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span className="tracking-tight">أيه إس سوليوشن | AS Solution</span>
        </div>

        {/* Platform Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 border border-white/10 rounded text-slate-300 text-[11px]">
          {getPlatformIcon()}
          <span>{platformName}</span>
        </div>

        {/* Database Connection */}
        <div className="hidden lg:flex items-center gap-1.5 text-slate-400 border-r border-white/10 pr-2">
          <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-mono text-[11px]">as_solution.db</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
      </div>

      {/* Middle/Right Section: License Badge, Clock, Window Controls */}
      <div className="flex items-center space-x-2 space-x-reverse" style={{ WebkitAppRegion: 'no-drag' } as any}>
        {/* License Pill */}
        <button
          onClick={onOpenLicenseModal}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium cursor-pointer transition-all ${
            subscriptionInfo.status === 'ACTIVE'
              ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
              : subscriptionInfo.status === 'WARNING'
              ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 animate-pulse'
              : 'bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30'
          }`}
          title="عرض وتحديث تفاصيل الترخيص"
        >
          <Key className="w-3.5 h-3.5" />
          <span className="truncate max-w-[200px] sm:max-w-xs">
            {subscriptionInfo.companyName} - متبقي {subscriptionInfo.daysRemaining} يوم
          </span>
        </button>

        {/* System Clock */}
        <div className="hidden md:flex items-center gap-1 text-slate-300 font-mono bg-slate-900/80 px-2 py-1 rounded border border-white/10 text-[11px]">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>{timeStr}</span>
        </div>

        {/* Native Electron Window Controls (Minimize, Maximize, Close) */}
        {isElectron && (
          <div className="flex items-center border-r border-white/10 pr-2 space-x-1 space-x-reverse">
            <button
              onClick={handleMinimize}
              className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white cursor-pointer transition-colors"
              title="تصغير النافذة"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleMaximize}
              className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white cursor-pointer transition-colors"
              title={isMaximized ? 'استعادة النافذة' : 'تكبير النافذة'}
            >
              <Square className="w-3 h-3" />
            </button>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-red-500/80 rounded text-slate-400 hover:text-white cursor-pointer transition-colors"
              title="إغلاق النظام"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
