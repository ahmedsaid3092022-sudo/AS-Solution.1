import React, { useState, useEffect } from 'react';
import { Search, Clock, FileSpreadsheet, Scan, Layers } from 'lucide-react';
import { Badge } from '../common/Badge';
import { attendanceService } from '../../services/attendanceService';
import { AttendanceRecord, AttendanceStatus, WorkShift, Employee } from '../../types';
import { sqliteAdapter } from '../../db/sqliteAdapter';
import { ShiftManagementModal } from '../forms/ShiftManagementModal';
import { useLanguageStore } from '../../stores/useLanguageStore';

interface AttendanceViewProps {
  onOpenQuickLogModal: () => void;
  onOpenExitReasonModal: () => void;
  onOpenScannerModal?: (empId?: string) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  onOpenQuickLogModal,
  onOpenExitReasonModal,
  onOpenScannerModal,
}) => {
  const { t, isRtl } = useLanguageStore();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState('ALL');
  const [status, setStatus] = useState<AttendanceStatus | 'ALL'>('ALL');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

  const loadData = () => {
    const data = attendanceService.getAttendanceRecords({
      date,
      department: department === 'ALL' ? undefined : department,
      status: status === 'ALL' ? undefined : status,
      search,
    });

    const shiftList = sqliteAdapter.getTable('shifts') || [];
    const empList = sqliteAdapter.getTable('employees') || [];
    setShifts(shiftList);
    setEmployees(empList);

    // Apply shift filter locally if specific shift selected
    if (selectedShiftFilter !== 'ALL') {
      const empIdsInShift = new Set(
        empList.filter((e) => e.shiftId === selectedShiftFilter).map((e) => e.id)
      );
      setRecords(data.filter((r) => r.shiftId === selectedShiftFilter || empIdsInShift.has(r.employeeId)));
    } else {
      setRecords(data);
    }
  };

  useEffect(() => {
    loadData();
  }, [date, department, status, search, selectedShiftFilter]);

  const handleExportCSV = () => {
    if (records.length === 0) return alert(isRtl ? 'لا توجد سجلات للتصدير' : 'No records to export');

    const headers = [
      t.employeeId,
      t.employeeName,
      t.department,
      t.documentDate,
      t.checkIn,
      t.checkOut,
      t.lateMinutes,
      t.overtimeMinutes,
      t.status,
    ];
    const rows = records.map((r) => [
      r.employeeCode,
      `"${r.employeeName}"`,
      `"${r.department}"`,
      r.date,
      r.checkIn || '-',
      r.checkOut || '-',
      r.lateMinutes,
      r.overtimeMinutes,
      r.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Search & Filters Bar */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className={`w-4 h-4 text-slate-400 absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-3`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchEmployeePlaceholder}
              className={`w-full ${isRtl ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2 bg-slate-900/60 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 bg-slate-900/60 border border-white/10 rounded-xl font-mono text-xs text-white"
            />

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

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="px-3 py-2 bg-slate-900/60 border border-white/10 rounded-xl text-xs font-medium text-white"
            >
              <option value="ALL" className="bg-slate-900 text-white">{t.allStatuses}</option>
              <option value="PRESENT" className="bg-slate-900 text-white">{t.present} (PRESENT)</option>
              <option value="LATE" className="bg-slate-900 text-white">{t.late} (LATE)</option>
              <option value="EARLY_EXIT" className="bg-slate-900 text-white">{t.earlyExit} (EARLY_EXIT)</option>
              <option value="ABSENT" className="bg-slate-900 text-white">{t.absent} (ABSENT)</option>
            </select>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{t.export} CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-white text-sm">
              {t.attendanceRecords} ({date}) - {records.length}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsShiftModalOpen(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-cyan-500/30 text-cyan-300 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-md"
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.shiftsManagement}</span>
            </button>
            {onOpenScannerModal && (
              <button
                onClick={() => onOpenScannerModal()}
                className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5"
              >
                <Scan className="w-3.5 h-3.5" />
                <span>+ {t.scanDoc}</span>
              </button>
            )}
            <button
              onClick={onOpenExitReasonModal}
              className="px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 rounded-xl text-xs font-semibold cursor-pointer transition-all"
            >
              + {t.exitReasonButton}
            </button>
            <button
              onClick={onOpenQuickLogModal}
              className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-lg shadow-cyan-500/20 transition-all"
            >
              + {t.manualLogButton}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={`w-full text-xs ${isRtl ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-semibold bg-white/5">
                <th className="p-3">{t.employeeId}</th>
                <th className="p-3">{t.employeeName}</th>
                <th className="p-3">{t.department}</th>
                <th className="p-3">{t.assignedShift}</th>
                <th className="p-3">{t.checkIn}</th>
                <th className="p-3">{t.checkOut}</th>
                <th className="p-3">{t.lateMinutes}</th>
                <th className="p-3">{t.overtimeMinutes}</th>
                <th className="p-3">{t.status}</th>
                <th className="p-3">{t.notesAndExcuses}</th>
                <th className="p-3 text-center">{t.attachDoc}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-slate-400">
                    {t.noData}
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const empObj = employees.find((e) => e.id === r.employeeId);
                  const shiftObj = shifts.find((s) => s.id === (r.shiftId || empObj?.shiftId)) || shifts[0];
                  return (
                    <tr key={r.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-300">{r.employeeCode}</td>
                      <td className="p-3 font-semibold text-white">{r.employeeName}</td>
                      <td className="p-3 text-slate-400">{r.department}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[11px] font-medium">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          {shiftObj ? shiftObj.name : t.noShiftAssigned}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-emerald-400 font-bold">{r.checkIn || '-'}</td>
                      <td className="p-3 font-mono text-slate-300">{r.checkOut || '-'}</td>
                      <td className="p-3 font-mono">
                        {r.lateMinutes > 0 ? (
                          <span className="text-amber-400 font-bold">+{r.lateMinutes}</span>
                        ) : (
                          '0'
                        )}
                      </td>
                      <td className="p-3 font-mono">
                        {r.overtimeMinutes > 0 ? (
                          <span className="text-emerald-400 font-bold">+{r.overtimeMinutes}</span>
                        ) : (
                          '0'
                        )}
                      </td>
                      <td className="p-3">
                        {r.status === 'PRESENT' && <Badge variant="emerald">{t.present}</Badge>}
                        {r.status === 'LATE' && <Badge variant="amber">{t.late}</Badge>}
                        {r.status === 'EARLY_EXIT' && <Badge variant="purple">{t.earlyExit}</Badge>}
                        {r.status === 'ABSENT' && <Badge variant="red">{t.absent}</Badge>}
                      </td>
                      <td className="p-3 text-slate-400 max-w-xs truncate">{r.exitReason || r.notes || '-'}</td>
                      <td className="p-3 text-center">
                        {onOpenScannerModal && (
                          <button
                            onClick={() => onOpenScannerModal(r.employeeId)}
                            className="px-2.5 py-1 text-xs text-cyan-300 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1 font-semibold"
                            title={`${t.scanDoc}: ${r.employeeName}`}
                          >
                            <Scan className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{t.attachDoc}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shift Management Modal */}
      <ShiftManagementModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};

