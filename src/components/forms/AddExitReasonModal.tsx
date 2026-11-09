import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { sqliteAdapter } from '../../db/sqliteAdapter';
import { attendanceService } from '../../services/attendanceService';
import { useAuthStore } from '../../stores/useAuthStore';
import { useLanguageStore } from '../../stores/useLanguageStore';

interface AddExitReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialEmployeeId?: string;
}

export const AddExitReasonModal: React.FC<AddExitReasonModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialEmployeeId,
}) => {
  const { currentUser } = useAuthStore();
  const { t, isRtl } = useLanguageStore();
  const [employeeId, setEmployeeId] = useState(initialEmployeeId || '');
  const [departureTime, setDepartureTime] = useState('14:00');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialEmployeeId) {
      setEmployeeId(initialEmployeeId);
    }
  }, [initialEmployeeId, isOpen]);

  const employees = sqliteAdapter.getTable('employees').filter((e) => e.status === 'ACTIVE');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return alert(isRtl ? 'يرجى اختيار الموظف أولاً' : 'Please select an employee first');
    if (!reason.trim()) return alert(isRtl ? 'يرجى كتابة سبب أو طبيعة إذن الخروج' : 'Please specify reason for exit permit');

    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;

    attendanceService.addExitReason({
      employeeId: emp.id,
      employeeName: emp.name,
      date: new Date().toISOString().split('T')[0],
      departureTime,
      reason,
      approvedBy: currentUser?.name || (isRtl ? 'مدير النظام' : 'System Admin'),
      notes,
    });

    onSuccess();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.exitReasonTitle}
      subtitle={t.exitReasonSubtitle}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t.selectEmployee}</label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500"
            required
          >
            <option value="">{t.selectEmployeePrompt}</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.department})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t.departureTime}</label>
          <input
            type="time"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
            required
          />
        </div>

        <div>
          <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t.exitReasonLabel}</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t.exitReasonPlaceholder}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            required
          />
        </div>

        <div>
          <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t.additionalNotes}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
          ></textarea>
        </div>

        <div className="pt-4 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl cursor-pointer shadow-md"
          >
            {t.approveAndSavePermit}
          </button>
        </div>
      </form>
    </Modal>
  );
};
