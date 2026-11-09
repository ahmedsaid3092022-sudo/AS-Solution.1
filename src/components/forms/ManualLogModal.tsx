import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { sqliteAdapter } from '../../db/sqliteAdapter';
import { attendanceService } from '../../services/attendanceService';
import { useLanguageStore } from '../../stores/useLanguageStore';

interface ManualLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialEmployeeId?: string;
}

export const ManualLogModal: React.FC<ManualLogModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialEmployeeId,
}) => {
  const { t, isRtl } = useLanguageStore();
  const [employeeId, setEmployeeId] = useState(initialEmployeeId || '');
  const [type, setType] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');
  const [timeStr, setTimeStr] = useState('08:00');

  useEffect(() => {
    if (initialEmployeeId) {
      setEmployeeId(initialEmployeeId);
    }
  }, [initialEmployeeId, isOpen]);

  const employees = sqliteAdapter.getTable('employees').filter((e) => e.status === 'ACTIVE');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return alert(isRtl ? 'يرجى اختيار الموظف أولاً' : 'Please select an employee first');

    attendanceService.recordCheckInOrOut(employeeId, type, `${timeStr}:00`, 'dev-manual');
    onSuccess();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.manualLogTitle}
      subtitle={t.manualLogSubtitle}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t.selectEmployee}</label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">{t.selectEmployeePrompt}</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({t.employeeId}: {emp.code} - {emp.department})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t.movementType}</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="CHECK_IN">{isRtl ? 'حضور (Check-In)' : 'Check-In'}</option>
              <option value="CHECK_OUT">{isRtl ? 'انصراف (Check-Out)' : 'Check-Out'}</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t.timeHHMM}</label>
            <input
              type="time"
              value={timeStr}
              onChange={(e) => setTimeStr(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
              required
            />
          </div>
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
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl cursor-pointer shadow-md"
          >
            {t.saveManualLog}
          </button>
        </div>
      </form>
    </Modal>
  );
};
