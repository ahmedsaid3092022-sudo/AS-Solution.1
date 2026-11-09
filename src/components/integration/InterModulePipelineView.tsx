import React, { useState, useEffect } from 'react';
import { Truck, Calculator, Activity, ArrowRightLeft, DollarSign, Calendar, CheckCircle, RefreshCw } from 'lucide-react';
import { moduleBridgeService } from '../../services/moduleBridgeService';
import { DriverTripLog, PayrollJournalEntry } from '../../types';
import { sqliteAdapter } from '../../db/sqliteAdapter';

export const InterModulePipelineView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'FLEET' | 'PAYROLL' | 'EVENTS'>('FLEET');
  const [tripLogs, setTripLogs] = useState<DriverTripLog[]>([]);
  const [payrollDrafts, setPayrollDrafts] = useState<PayrollJournalEntry[]>([]);
  const [eventHistory, setEventHistory] = useState<any[]>([]);

  useEffect(() => {
    loadPipelineData();

    // Subscribe to Event Bus live updates
    const unsub1 = moduleBridgeService.subscribe('DRIVER_FLEET_SYNC', () => loadPipelineData());
    const unsub2 = moduleBridgeService.subscribe('PAYROLL_DRAFT_GENERATED', () => loadPipelineData());

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const loadPipelineData = () => {
    const trips = sqliteAdapter.getTable('driverTripLogs') || [];
    const payroll = sqliteAdapter.getTable('payrollEntries') || [];
    const events = moduleBridgeService.getHistory();

    setTripLogs(trips);
    setPayrollDrafts(payroll);
    setEventHistory(events);
  };

  const handleGeneratePayrollDraft = () => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    moduleBridgeService.generateMonthlyPayrollDraft(currentMonth);
    loadPipelineData();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 bg-gradient-to-r from-cyan-900/40 via-blue-900/30 to-slate-900 border border-white/10 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-2xl border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">جسر الربط والمسارات المجمعة (Module Integration Bridge)</h2>
            <p className="text-xs text-cyan-300/80">
              ربط بصمات السائقين بالأسطول + إعداد القيد المحاسبي المزدوج التلقائي للرواتب واستقطاعات السلف
            </p>
          </div>
        </div>

        <button
          onClick={handleGeneratePayrollDraft}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-2"
        >
          <Calculator className="w-4 h-4" />
          <span>توليد مسودة الرواتب للشهر الحالي</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('FLEET')}
          className={`px-4 py-2 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-2 transition-all ${
            activeTab === 'FLEET'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>سجلات أسطول السائقين ({tripLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PAYROLL')}
          className={`px-4 py-2 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-2 transition-all ${
            activeTab === 'PAYROLL'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>قيود مسودة الرواتب للـ ERP ({payrollDrafts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('EVENTS')}
          className={`px-4 py-2 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-2 transition-all ${
            activeTab === 'EVENTS'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>مراقبة الأحداث الحية (Event Bus)</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'FLEET' && (
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-cyan-400" />
              <span>توليد رحلات الأسطول تلقائياً من بصمة الانصراف</span>
            </h3>
            <span className="text-xs text-slate-400">بدل السائق المستحق: 150 ج.م/ساعة transit</span>
          </div>

          <div className="space-y-3">
            {tripLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">لا توجد سجلات رحلات سائقين مسجلة حتى الآن</div>
            ) : (
              tripLogs.map((trip) => (
                <div key={trip.id} className="p-4 bg-slate-950/80 border border-white/10 rounded-xl flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{trip.driverName}</span>
                      <span className="text-xs text-cyan-400 font-mono">({trip.driverEmployeeId})</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      التاريخ: {trip.date} | ساعات العبور: {trip.transitHours} ساعة | مسافة التوجيه: {trip.estimatedDistanceKm} كم
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-400 block">+{trip.transitAllowance} ج.م</span>
                    <span className="text-[10px] text-slate-400">بدل رحلة ميدانية مضاف للحساب</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'PAYROLL' && (
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>مسودة القيد المحاسبي المزدوج المستخرج للرواتب (Payroll Double Entry Journal)</span>
            </h3>
            <span className="text-xs text-emerald-400 font-bold">جاهز للتصدير لنظام الـ ERP المالية</span>
          </div>

          <div className="space-y-3">
            {payrollDrafts.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                لم يتم توليد قيد رواتب بعد. اضغط على زر "توليد مسودة الرواتب للشهر الحالي" بالأعلى.
              </div>
            ) : (
              payrollDrafts.map((p) => (
                <div key={p.id} className="p-4 bg-slate-950/80 border border-white/10 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div>
                      <span className="font-bold text-white text-sm">{p.branchName || 'مسودة مرتبات الفرع'}</span>
                      <span className="text-xs text-slate-400 mr-2">الشهر: {p.periodMonth}</span>
                    </div>
                    <span className="text-base font-black text-emerald-400">صافي المستحق: {p.netPayrollPayable.toLocaleString()} ج.م</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-white/5">
                      <span className="text-slate-400 block text-[10px]">إجمالي الأساسيات</span>
                      <span className="font-bold text-white">{p.totalBasicSalaries.toLocaleString()} ج.م</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-white/5">
                      <span className="text-slate-400 block text-[10px]">الإضافي والبدلات</span>
                      <span className="font-bold text-emerald-400">+{(p.totalOvertimePay + p.totalNightBonus).toLocaleString()} ج.م</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-white/5">
                      <span className="text-slate-400 block text-[10px]">استقطاعات التأخير والسلف</span>
                      <span className="font-bold text-red-400">-{(p.totalAbsenceDeductions + p.totalLateDeductions + p.totalAdvanceRepayments).toLocaleString()} ج.م</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-white/5">
                      <span className="text-slate-400 block text-[10px]">حالة القيد المالي</span>
                      <span className="font-bold text-cyan-400">مسودة ممتثلة (Draft)</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'EVENTS' && (
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>سجل بث الأحداث اللحظي بين الموديولات (System Event Bus)</span>
            </h3>
            <span className="text-xs text-cyan-400 font-mono">Status: Connected</span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {eventHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">لا توجد أحداث مبثوثة مؤخراً</div>
            ) : (
              eventHistory.map((ev, i) => (
                <div key={i} className="p-3 bg-slate-950/80 border border-white/10 rounded-xl flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">{ev.type}</span>
                    <span className="text-slate-300">{new Date(ev.timestamp).toLocaleTimeString('ar-EG')}</span>
                  </div>
                  <span className="text-slate-400 text-[11px] truncate max-w-md">{JSON.stringify(ev.payload)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
