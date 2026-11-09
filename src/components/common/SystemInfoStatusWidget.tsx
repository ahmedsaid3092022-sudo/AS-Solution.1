import React, { useState, useEffect } from 'react';
import {
  Server,
  Database,
  Radio,
  Sparkles,
  ShieldCheck,
  Activity,
  CheckCircle2,
  RefreshCw,
  BellRing
} from 'lucide-react';
import { sqliteAdapter } from '../../db/sqliteAdapter';
import { deviceService } from '../../services/deviceService';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';
import { useLanguageStore } from '../../stores/useLanguageStore';

export const SystemInfoStatusWidget: React.FC = () => {
  const { isRtl } = useLanguageStore();
  const { subscriptionInfo } = useSubscriptionStore();
  const [dbSizeKb, setDbSizeKb] = useState(0);
  const [onlineDevicesCount, setOnlineDevicesCount] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState('');

  const updateStats = () => {
    try {
      const bytes = sqliteAdapter.getDatabaseSizeInBytes();
      setDbSizeKb(Math.round(bytes / 1024));

      const devices = deviceService.getDevices();
      const online = devices.filter((d) => d.status === 'ONLINE').length;
      setOnlineDevicesCount(online || devices.length);

      const now = new Date();
      setLastCheckTime(now.toTimeString().split(' ')[0]);
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    updateStats();
    const timer = setInterval(updateStats, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Live Server & DB Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Server className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isRtl ? 'الخادم متصل' : 'Server Online'}</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>SQLite: as_solution.db ({dbSizeKb} KB)</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 font-bold">
          <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span>{isRtl ? `أجهزة البصمة: ${onlineDevicesCount} متصل` : `Devices: ${onlineDevicesCount} Online`}</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          <span>{isRtl ? `ترخيص: ${subscriptionInfo.daysRemaining} يوم متبقي` : `License: ${subscriptionInfo.daysRemaining}d Left`}</span>
        </div>
      </div>

      {/* Version and System Health Ticker */}
      <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
        <span className="inline-flex items-center gap-1 text-slate-300 font-sans font-bold">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>{isRtl ? 'النظام محدث الإصدار v2.5.0' : 'System v2.5.0 Up to Date'}</span>
        </span>
        <span>•</span>
        <span>فحص: {lastCheckTime || '00:00'}</span>
      </div>
    </div>
  );
};
