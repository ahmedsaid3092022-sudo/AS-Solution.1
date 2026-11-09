import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Employee, WorkShift } from '../../types';
import { sqliteAdapter } from '../../db/sqliteAdapter';
import { loggerService } from '../../services/loggerService';
import { useLanguageStore } from '../../stores/useLanguageStore';

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employeeToEdit?: Employee | null;
}

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  employeeToEdit,
}) => {
  const { t, isRtl } = useLanguageStore();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('IT');
  const [position, setPosition] = useState('Software Developer');
  const [nationalId, setNationalId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [biometricId, setBiometricId] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [shiftId, setShiftId] = useState<string>('');
  const [availableShifts, setAvailableShifts] = useState<WorkShift[]>([]);

  useEffect(() => {
    const loadedShifts = sqliteAdapter.getTable('shifts') || [];
    setAvailableShifts(loadedShifts);
    const defaultShift = loadedShifts.find((s) => s.isDefault) || loadedShifts[0];

    if (employeeToEdit) {
      setCode(employeeToEdit.code);
      setName(employeeToEdit.name);
      setDepartment(employeeToEdit.department);
      setPosition(employeeToEdit.position);
      setNationalId(employeeToEdit.nationalId || '');
      setPhone(employeeToEdit.phone || '');
      setEmail(employeeToEdit.email || '');
      setBiometricId(employeeToEdit.biometricId);
      setStatus(employeeToEdit.status);
      setShiftId(employeeToEdit.shiftId || defaultShift?.id || '');
    } else {
      const emps = sqliteAdapter.getTable('employees');
      const nextCode = (1001 + emps.length).toString();
      setCode(nextCode);
      setName('');
      setDepartment(isRtl ? 'تكنولوجيا المعلومات' : 'IT Department');
      setPosition(isRtl ? 'موظف' : 'Employee');
      setNationalId('');
      setPhone('');
      setEmail('');
      setBiometricId(nextCode);
      setStatus('ACTIVE');
      setShiftId(defaultShift?.id || '');
    }
  }, [employeeToEdit, isOpen, isRtl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert(isRtl ? 'يرجى إدخال اسم الموظف كاملاً' : 'Please enter full employee name');

    const employees = sqliteAdapter.getTable('employees');
    const selectedShiftObj = availableShifts.find((s) => s.id === shiftId);

    if (employeeToEdit) {
      const updated = employees.map((emp) => {
        if (emp.id === employeeToEdit.id) {
          return {
            ...emp,
            code,
            name,
            department,
            position,
            nationalId,
            phone,
            email,
            biometricId,
            status,
            shiftId: shiftId || undefined,
            shiftName: selectedShiftObj?.name || undefined,
          };
        }
        return emp;
      });
      sqliteAdapter.updateTable('employees', updated);
      loggerService.logInfo('EMPLOYEES', `Updated employee data for ${name} (${code})`);
    } else {
      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        code,
        name,
        department,
        position,
        nationalId,
        phone,
        email,
        hireDate: new Date().toISOString().split('T')[0],
        biometricId,
        status,
        shiftId: shiftId || undefined,
        shiftName: selectedShiftObj?.name || undefined,
        createdAt: new Date().toISOString(),
      };
      sqliteAdapter.updateTable('employees', [newEmp, ...employees]);
      loggerService.logInfo('EMPLOYEES', `Added new employee ${name} code: ${code}`);
    }

    onSuccess();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employeeToEdit ? t.employeeFormTitleEdit : t.employeeFormTitleAdd}
      subtitle={t.employeeFormSubtitle}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t.employeeId}</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t.fingerprintId}</label>
            <input
              type="text"
              value={biometricId}
              onChange={(e) => setBiometricId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
              required
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t.fullName}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.fullNamePlaceholder}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t.department}</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value={isRtl ? 'تكنولوجيا المعلومات' : 'IT Department'}>
                {isRtl ? 'تكنولوجيا المعلومات' : 'IT Department'}
              </option>
              <option value={isRtl ? 'الموارد البشرية' : 'Human Resources (HR)'}>
                {isRtl ? 'الموارد البشرية' : 'Human Resources (HR)'}
              </option>
              <option value={isRtl ? 'الحسابات والمالية' : 'Finance & Accounting'}>
                {isRtl ? 'الحسابات والمالية' : 'Finance & Accounting'}
              </option>
              <option value={isRtl ? 'المبيعات والتسويق' : 'Sales & Marketing'}>
                {isRtl ? 'المبيعات والتسويق' : 'Sales & Marketing'}
              </option>
              <option value={isRtl ? 'الدعم الفني والعمليات' : 'Technical Support & Operations'}>
                {isRtl ? 'الدعم الفني والعمليات' : 'Technical Support & Operations'}
              </option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t.jobTitle}</label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder={t.positionPlaceholder}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t.assignedShift}</label>
            <select
              value={shiftId}
              onChange={(e) => setShiftId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              {availableShifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.startTime} - {s.endTime})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t.nationalId}</label>
            <input
              type="text"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t.phone}</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t.serviceStatus}</label>
          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="ACTIVE"
                checked={status === 'ACTIVE'}
                onChange={() => setStatus('ACTIVE')}
              />
              <span className="text-emerald-600 font-semibold">{t.activeOnDuty}</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="INACTIVE"
                checked={status === 'INACTIVE'}
                onChange={() => setStatus('INACTIVE')}
              />
              <span className="text-red-500 font-semibold">{t.inactiveResigned}</span>
            </label>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-300 cursor-pointer"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl cursor-pointer shadow-md shadow-blue-600/20"
          >
            {t.saveEmployee}
          </button>
        </div>
      </form>
    </Modal>
  );
};
