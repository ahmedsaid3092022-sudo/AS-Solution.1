import React, { useState, useEffect } from 'react';
import { ShieldAlert, Download, Trash2, Search, Filter, Bug } from 'lucide-react';
import { auditService } from '../../services/auditService';
import { loggerService } from '../../services/loggerService';
import { AuditLog, SeverityLevel, SystemLog } from '../../types';
import { Badge } from '../common/Badge';

export const AuditLogView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'audit' | 'system'>('audit');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | 'ALL'>('ALL');

  const loadLogs = () => {
    setAuditLogs(
      auditService.getAuditLogs({
        severity: severityFilter === 'ALL' ? undefined : severityFilter,
        search,
      })
    );
    setSystemLogs(
      loggerService.getLogs(
        severityFilter === 'ALL' ? undefined : severityFilter,
        search
      )
    );
  };

  useEffect(() => {
    loadLogs();
  }, [search, severityFilter, activeTab]);

  const handleClear = () => {
    if (confirm('هل أنت تأكد من مسح جميع السجلات محلياً؟')) {
      if (activeTab === 'audit') {
        auditService.clearAuditLogs();
      } else {
        loggerService.clearLogs();
      }
      loadLogs();
    }
  };

  const handleExport = () => {
    if (activeTab === 'audit') {
      const dataStr = auditService.exportAuditLogsAsJson();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `as_solution_audit_logs_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      loggerService.downloadLogsFile('json');
    }
  };

  return (
    <div className="space-y-5">
      {/* Tab bar & Controls */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-slate-900/60 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                activeTab === 'audit'
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              سجل التدقيق والأمان (Audit Logs)
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                activeTab === 'system'
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              سجل أخطاء النظام (System & Exception Logs)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث في السجلات..."
                className="w-full pr-9 pl-3 py-1.5 bg-slate-900/60 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-900/60 border border-white/10 rounded-xl font-semibold text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="ALL" className="bg-slate-900 text-white">جميع المستويات (ALL)</option>
              <option value="INFO" className="bg-slate-900 text-white">معلومات (INFO)</option>
              <option value="WARN" className="bg-slate-900 text-white">تحذير (WARN)</option>
              <option value="ERROR" className="bg-slate-900 text-white">أخطاء (ERROR)</option>
              <option value="CRITICAL" className="bg-slate-900 text-white">حرجة جداً (CRITICAL)</option>
            </select>

            <button
              onClick={handleExport}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold rounded-xl flex items-center gap-1 cursor-pointer transition-all"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>تصدير JSON</span>
            </button>

            <button
              onClick={handleClear}
              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-semibold rounded-xl flex items-center gap-1 cursor-pointer transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح السجلات</span>
            </button>
          </div>
        </div>
      </div>

      {/* Log Entries View */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-white text-sm">
              {activeTab === 'audit' ? 'سجلات حركات أمان المستخدمين' : 'سجل استثناءات وأخطاء الواجهة ومحرك الأجهزة'}
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'audit' ? (
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-semibold bg-white/5">
                  <th className="p-3">التاريخ والوقت</th>
                  <th className="p-3">المستخدم</th>
                  <th className="p-3">الحركة</th>
                  <th className="p-3">الوحدة</th>
                  <th className="p-3">التفاصيل</th>
                  <th className="p-3">مستوى الخطورة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      لا توجد سجلات تدقيق
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors font-mono">
                      <td className="p-3 text-slate-400 text-[11px]">
                        {new Date(log.timestamp).toLocaleString('ar-EG')}
                      </td>
                      <td className="p-3 font-semibold text-white">{log.userName}</td>
                      <td className="p-3 font-bold text-cyan-400">{log.action}</td>
                      <td className="p-3 text-slate-400">{log.module}</td>
                      <td className="p-3 text-slate-300 font-sans">{log.details}</td>
                      <td className="p-3 font-sans">
                        {log.severity === 'INFO' && <Badge variant="blue">INFO</Badge>}
                        {log.severity === 'WARN' && <Badge variant="amber">WARN</Badge>}
                        {log.severity === 'ERROR' && <Badge variant="red">ERROR</Badge>}
                        {log.severity === 'CRITICAL' && <Badge variant="red">CRITICAL</Badge>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <div className="divide-y divide-white/5 font-mono text-xs">
              {systemLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-400">لا توجد أخطاء نظام مسجلة</div>
              ) : (
                systemLogs.map((log) => (
                  <div key={log.id} className="p-4 space-y-1 hover:bg-white/5 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {log.level === 'INFO' && <Badge variant="blue">INFO</Badge>}
                        {log.level === 'WARN' && <Badge variant="amber">WARN</Badge>}
                        {log.level === 'ERROR' && <Badge variant="red">ERROR</Badge>}
                        {log.level === 'CRITICAL' && <Badge variant="red">CRITICAL</Badge>}
                        <span className="font-bold text-white">[{log.module}]</span>
                        <span className="text-slate-400 text-[11px]">{new Date(log.timestamp).toLocaleString('ar-EG')}</span>
                      </div>
                    </div>
                    <p className="text-slate-300 font-sans mt-1">{log.message}</p>
                    {log.errorStack && (
                      <pre className="p-2 bg-slate-900/90 text-red-300 border border-white/10 rounded-lg text-[10px] overflow-x-auto whitespace-pre-wrap mt-2">
                        {log.errorStack}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
