import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Edit2, Trash2, Fingerprint, Eye, FileText, Scan, Clock } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Employee, WorkShift } from '../../types';
import { sqliteAdapter } from '../../db/sqliteAdapter';
import { loggerService } from '../../services/loggerService';
import { EmployeeDetailsModal } from '../forms/EmployeeDetailsModal';
import { ShiftManagementModal } from '../forms/ShiftManagementModal';
import { useLanguageStore } from '../../stores/useLanguageStore';

interface EmployeesViewProps {
  onOpenEmployeeModal: (empToEdit?: Employee) => void;
  onOpenQuickLogModal?: (empId?: string) => void;
  onOpenExitReasonModal?: (empId?: string) => void;
  onOpenScannerModal?: (empId?: string) => void;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  onOpenEmployeeModal,
  onOpenQuickLogModal,
  onOpenExitReasonModal,
  onOpenScannerModal,
}) => {
  const { t, isRtl } = useLanguageStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState('ALL');

  // Modals state
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

  const loadData = () => {
    const list = sqliteAdapter.getTable('employees');
    const shiftList = sqliteAdapter.getTable('shifts') || [];
    setEmployees(list);
    setShifts(shiftList);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = isRtl
      ? `هل أنت تأكد من نقل الموظف (${name}) إلى قائمة غير النشطين؟`
      : `Are you sure you want to deactivate employee (${name})?`;
    if (confirm(msg)) {
      const list = sqliteAdapter.getTable('employees');
      const updated = list.map((emp) => (emp.id === id ? { ...emp, status: 'INACTIVE' as const } : emp));
      sqliteAdapter.updateTable('employees', updated);
      loggerService.logWarn('EMPLOYEES', `Deactivated employee ${name}`);
      loadData();
      if (selectedEmployee?.id === id) {
        setSelectedEmployee((prev) => (prev ? { ...prev, status: 'INACTIVE' } : null));
      }
    }
  };

  const handleOpenDetails = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsDetailsModalOpen(true);
  };

  const filteredEmployees = employees.filter((emp) => {
    if (department !== 'ALL' && emp.department !== department) return false;
    if (selectedShiftFilter !== 'ALL' && emp.shiftId !== selectedShiftFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchName = emp.name.toLowerCase().includes(q);
      const matchCode = emp.code.toLowerCase().includes(q);
      const matchBio = emp.biometricId.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchBio) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Search & Actions Bar */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className={`w-4 h-4 text-slate-400 absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-3`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchEmployeePlaceholder}
              className={`w-full ${isRtl ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2 bg-slate-900/60 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
            />
          </div>

          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-3 py-2 bg-slate-900/60 border border-white/10 rounded-xl text-xs font-medium text-white"
          >
            <option value="ALL" className="bg-slate-900 text-white">{t.allDepartments}</option>
            <option value="تكنولوجيا المعلومات" className="bg-slate-900 text-white">{isRtl ? 'تكنولوجيا المعلومات' : 'IT Department'}</option>
            <option value="الموارد البشرية" className="bg-slate-900 text-white">{isRtl ? 'الموارد البشرية' : 'HR Department'}</option>
            <option value="الحسابات والمالية" className="bg-slate-900 text-white">{isRtl ? 'الحسابات والمالية' : 'Finance & Payroll'}</option>
            <option value="المبيعات والتسويق" className="bg-slate-900 text-white">{isRtl ? 'المبيعات والتسويق' : 'Sales & Marketing'}</option>
            <option value="الدعم الفني والعمليات" className="bg-slate-900 text-white">{isRtl ? 'الدعم الفني والعمليات' : 'Tech Support & Ops'}</option>
          </select>

          <select
            value={selectedShiftFilter}
            onChange={(e) => setSelectedShiftFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900/60 border border-white/10 rounded-xl text-xs font-medium text-cyan-300 border-cyan-500/30"
          >
            <option value="ALL" className="bg-slate-900 text-white">{t.allShifts}</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                {s.name} ({s.startTime} - {s.endTime})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsShiftModalOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-cyan-500/30 text-cyan-300 font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 transition-all shadow-md"
          >
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>{t.shiftsManagement}</span>
          </button>

          {onOpenScannerModal && (
            <button
              onClick={() => onOpenScannerModal()}
              className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Scan className="w-4 h-4" />
              <span>{t.scanDoc}</span>
            </button>
          )}

          <button
            onClick={() => onOpenEmployeeModal()}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>{t.addNewEmployee}</span>
          </button>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-white text-sm">
              {isRtl ? 'قائمة الموظفين والأجهزة المرتبطة' : 'Employees & Biometric Roster'} ({filteredEmployees.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            {isRtl ? 'اضغط على اسم الموظف لعرض سجل الحضور والملف الشامل' : 'Click any employee row to open detailed profile'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className={`w-full text-xs ${isRtl ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-semibold bg-white/5">
                <th className="p-3">{t.employeeId}</th>
                <th className="p-3">{t.fingerprintId}</th>
                <th className="p-3">{t.employeeName}</th>
                <th className="p-3">{t.department}</th>
                <th className="p-3">{t.assignedShift}</th>
                <th className="p-3">{t.jobTitle}</th>
                <th className="p-3">{t.phone}</th>
                <th className="p-3">{t.status}</th>
                <th className="p-3 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">
                    {t.noData}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const empShift = shifts.find((s) => s.id === emp.shiftId) || shifts.find((s) => s.isDefault) || shifts[0];
                  return (
                    <tr
                      key={emp.id}
                      onClick={() => handleOpenDetails(emp)}
                      className="hover:bg-cyan-500/10 cursor-pointer transition-colors group"
                    >
                      <td className="p-3 font-mono font-bold text-cyan-400">{emp.code}</td>
                      <td className="p-3 font-mono">
                        <span className="inline-flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-300">
                          <Fingerprint className="w-3 h-3 text-cyan-400" />
                          {emp.biometricId}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetails(emp);
                          }}
                          className={`font-bold text-white group-hover:text-cyan-300 group-hover:underline flex items-center gap-1.5 ${isRtl ? 'text-right' : 'text-left'} cursor-pointer`}
                        >
                          <span>{emp.name}</span>
                          <Eye className="w-3.5 h-3.5 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </button>
                      </td>
                      <td className="p-3 text-slate-400">{emp.department}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-medium text-[11px]">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          {empShift ? empShift.name : t.noShiftAssigned}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">{emp.position}</td>
                      <td className="p-3 text-slate-400 font-mono text-[11px]">{emp.phone || '-'}</td>
                      <td className="p-3">
                        {emp.status === 'ACTIVE' ? (
                          <Badge variant="emerald">{t.active}</Badge>
                        ) : (
                          <Badge variant="red">{t.inactive}</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetails(emp);
                            }}
                            className="px-2 py-1 text-xs text-cyan-300 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 rounded-lg cursor-pointer transition-colors flex items-center gap-1 font-semibold"
                            title={isRtl ? 'عرض ملف الموظف والحضور' : 'View History & Profile'}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{t.history}</span>
                          </button>
                          {onOpenScannerModal && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenScannerModal(emp.id);
                              }}
                              className="px-2 py-1 text-xs text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-lg cursor-pointer transition-colors flex items-center gap-1 font-semibold"
                              title={isRtl ? 'إضافة/مسح مستند ضوئي لهذا الموظف' : 'Scan Document for Employee'}
                            >
                              <Scan className="w-3.5 h-3.5" />
                              <span>{t.scanDoc}</span>
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenEmployeeModal(emp);
                            }}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                            title={t.edit}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(emp.id, emp.name, e)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer transition-colors"
                            title={t.delete}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Details Modal */}
      <EmployeeDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        employee={selectedEmployee}
        onEditEmployee={(emp) => onOpenEmployeeModal(emp)}
        onOpenQuickLogModal={(empId) => onOpenQuickLogModal && onOpenQuickLogModal(empId)}
        onOpenExitReasonModal={(empId) => onOpenExitReasonModal && onOpenExitReasonModal(empId)}
        onOpenScannerModal={(empId) => onOpenScannerModal && onOpenScannerModal(empId)}
        onRefreshData={loadData}
      />

      {/* Shift Management Modal */}
      <ShiftManagementModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};


