import React, { useState } from 'react';
import { X, FileText, Plus, CheckCircle2, XCircle, Clock, Calendar, DollarSign, Send, UserCheck } from 'lucide-react';
import { essService } from '../../services/essService';
import { ESSRequest, ESSRequestType, ESSRequestStatus } from '../../types';
import { sqliteAdapter } from '../../db/sqliteAdapter';
import { useAuthStore } from '../../stores/useAuthStore';
import { useBranchStore } from '../../stores/useBranchStore';

interface ESSManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ESSManagementModal: React.FC<ESSManagementModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuthStore();
  const { activeBranchId } = useBranchStore();
  const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE'>('LIST');
  const [statusFilter, setStatusFilter] = useState<ESSRequestStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<ESSRequestType | 'ALL'>('ALL');

  // New Request Form state
  const [employeeId, setEmployeeId] = useState('');
  const [reqType, setReqType] = useState<ESSRequestType>('VACATION');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState(2000);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const employees = sqliteAdapter.getTable('employees').filter((e) => e.status === 'ACTIVE');
  const requests = essService.getRequests({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    type: typeFilter === 'ALL' ? undefined : typeFilter,
    branchId: activeBranchId,
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      setMessage({ text: 'يرجى اختيار الموظف أولاً', type: 'error' });
      return;
    }
    if (!reason.trim()) {
      setMessage({ text: 'يرجى توضيح سبب الطلب', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const emp = employees.find((e) => e.id === employeeId);
      essService.submitRequest({
        employeeId,
        employeeName: emp?.name || 'موظف',
        employeeCode: emp?.code,
        type: reqType,
        startDate,
        endDate: reqType === 'VACATION' ? endDate : undefined,
        amount: reqType === 'ADVANCE' ? amount : undefined,
        reason,
        branchId: emp?.branchId,
      });

      setMessage({ text: 'تم تقديم الطلب بنجاح وهو الآن في انتظار الاعتماد', type: 'success' });
      setReason('');
      setTimeout(() => {
        setActiveTab('LIST');
        setMessage(null);
      }, 1500);
    } catch (err: any) {
      setMessage({ text: err?.message || 'فشل تقديم الطلب', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = (id: string, status: ESSRequestStatus) => {
    try {
      essService.updateRequestStatus(id, status, currentUser?.name || 'مدير HR');
      setMessage({ text: `تم ${status === 'APPROVED' ? 'اعتماد' : 'رفض'} الطلب بنجاح`, type: 'success' });
      setTimeout(() => setMessage(null), 2000);
    } catch (err: any) {
      setMessage({ text: err?.message || 'فشل تحديث حالة الطلب', type: 'error' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-cyan-900/40 via-blue-900/30 to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">نظام الخدمة الذاتية للموظف (ESS Portal)</h3>
              <p className="text-xs text-cyan-300/80">طلبات الإجازات والأذونات والسلف المالية ودورة الموافقات</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher Bar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('LIST')}
              className={`px-4 py-2 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-2 transition-all ${
                activeTab === 'LIST'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>قائمة الطلبات الجارية ({requests.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('CREATE')}
              className={`px-4 py-2 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-2 transition-all ${
                activeTab === 'CREATE'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>تقديم طلب جديد</span>
            </button>
          </div>

          {activeTab === 'LIST' && (
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none"
              >
                <option value="ALL">جميع الحالات</option>
                <option value="PENDING">معلق ⏳</option>
                <option value="APPROVED">معتمد ✅</option>
                <option value="REJECTED">مرفوض ❌</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none"
              >
                <option value="ALL">جميع الأنواع</option>
                <option value="VACATION">إجازات 🏖️</option>
                <option value="PERMISSION">أذونات خروج ⏱️</option>
                <option value="ADVANCE">سلف مالية 💰</option>
              </select>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {message && (
            <div
              className={`mb-4 p-3 rounded-xl border text-xs font-bold ${
                message.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-red-500/15 border-red-500/30 text-red-300'
              }`}
            >
              {message.text}
            </div>
          )}

          {activeTab === 'CREATE' ? (
            <form onSubmit={handleCreateSubmit} className="max-w-xl mx-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">اختر الموظف مقدم الطلب:</label>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- اضغط للاختيار --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.code}) - {emp.department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">نوع الطلب (Type):</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReqType('VACATION')}
                    className={`p-3 rounded-xl font-bold text-xs border text-center cursor-pointer transition-all ${
                      reqType === 'VACATION' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500' : 'bg-slate-800 text-slate-400 border-white/10'
                    }`}
                  >
                    🏖️ طلب إجازة
                  </button>
                  <button
                    type="button"
                    onClick={() => setReqType('PERMISSION')}
                    className={`p-3 rounded-xl font-bold text-xs border text-center cursor-pointer transition-all ${
                      reqType === 'PERMISSION' ? 'bg-amber-500/20 text-amber-300 border-amber-500' : 'bg-slate-800 text-slate-400 border-white/10'
                    }`}
                  >
                    ⏱️ إذن خروج
                  </button>
                  <button
                    type="button"
                    onClick={() => setReqType('ADVANCE')}
                    className={`p-3 rounded-xl font-bold text-xs border text-center cursor-pointer transition-all ${
                      reqType === 'ADVANCE' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500' : 'bg-slate-800 text-slate-400 border-white/10'
                    }`}
                  >
                    💰 سلفة مالية
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">تاريخ البدء:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>
                {reqType === 'VACATION' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">تاريخ الانتهاء:</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>
                )}
                {reqType === 'ADVANCE' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">مبلغ السلفة (ج.م):</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">تفاصيل وسبب الطلب:</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="اكتب أسباب الطلب هنا..."
                  className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>إرسال الطلب للاعتماد</span>
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              {requests.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">لا توجد طلبات مسجلة مطابقة للفلاتر حالياً</div>
              ) : (
                requests.map((r) => (
                  <div key={r.id} className="p-4 bg-slate-950/80 border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{r.employeeName}</span>
                        <span className="text-xs text-slate-400">({r.employeeCode})</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-cyan-300 border border-white/10">
                          {r.type === 'VACATION' ? '🏖️ إجازة' : r.type === 'PERMISSION' ? '⏱️ إذن خروج' : '💰 سلفة'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium">{r.reason}</p>
                      <div className="text-[11px] text-slate-400 flex items-center gap-3">
                        <span>التاريخ: {r.startDate} {r.endDate ? `إلى ${r.endDate}` : ''}</span>
                        {r.amount && <span className="text-emerald-400 font-bold">المبلغ: {r.amount.toLocaleString()} ج.م</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Status Badge */}
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                          r.status === 'APPROVED'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : r.status === 'REJECTED'
                            ? 'bg-red-500/15 text-red-300 border-red-500/30'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {r.status === 'APPROVED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : r.status === 'REJECTED' ? <XCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        <span>{r.status === 'APPROVED' ? 'معتمد' : r.status === 'REJECTED' ? 'مرفوض' : 'قيد النظر'}</span>
                      </span>

                      {/* Approval Actions for Managers */}
                      {r.status === 'PENDING' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'APPROVED')}
                            className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold cursor-pointer"
                            title="اعتماد الطلب"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'REJECTED')}
                            className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-bold cursor-pointer"
                            title="رفض الطلب"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
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
