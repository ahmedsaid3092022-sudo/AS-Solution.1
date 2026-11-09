import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Employee, AttendanceRecord, ExitReasonRecord, ScannedDocumentRecord } from '../../types';
import { sqliteAdapter } from '../../db/sqliteAdapter';
import { loggerService } from '../../services/loggerService';
import { useLanguageStore } from '../../stores/useLanguageStore';
import {
  User,
  Fingerprint,
  Building,
  Briefcase,
  Clock,
  Edit2,
  FileSpreadsheet,
  Printer,
  Plus,
  FileCheck2,
  UserX,
  History,
  Scan,
  Eye,
  FileText,
  Paperclip,
} from 'lucide-react';

interface EmployeeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onEditEmployee: (emp: Employee) => void;
  onOpenQuickLogModal: (empId: string) => void;
  onOpenExitReasonModal: (empId: string) => void;
  onOpenScannerModal?: (empId: string) => void;
  onRefreshData?: () => void;
}

export const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({
  isOpen,
  onClose,
  employee,
  onEditEmployee,
  onOpenQuickLogModal,
  onOpenExitReasonModal,
  onOpenScannerModal,
  onRefreshData,
}) => {
  if (!employee) return null;

  const { t, isRtl } = useLanguageStore();

  const [activeTab, setActiveTab] = useState<'attendance' | 'documents' | 'info'>('attendance');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [exitReasons, setExitReasons] = useState<ExitReasonRecord[]>([]);
  const [scannedDocs, setScannedDocs] = useState<ScannedDocumentRecord[]>([]);
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<ScannedDocumentRecord | null>(null);
  const [currentEmpStatus, setCurrentEmpStatus] = useState<string>(employee.status);

  useEffect(() => {
    if (employee && isOpen) {
      setCurrentEmpStatus(employee.status);
      loadEmployeeAttendanceData();
    }
  }, [employee, isOpen, startDate, endDate]);

  const loadEmployeeAttendanceData = () => {
    if (!employee) return;
    const allRecords = sqliteAdapter.getTable('attendance') || [];
    const empRecords = allRecords.filter(
      (r) =>
        r.employeeId === employee.id &&
        (!startDate || r.date >= startDate) &&
        (!endDate || r.date <= endDate)
    );
    empRecords.sort((a, b) => b.date.localeCompare(a.date));
    setAttendanceRecords(empRecords);

    const allExit = sqliteAdapter.getTable('exitReasons') || [];
    const empExit = allExit.filter(
      (ex) =>
        ex.employeeId === employee.id &&
        (!startDate || ex.date >= startDate) &&
        (!endDate || ex.date <= endDate)
    );
    setExitReasons(empExit);

    const allDocs = (sqliteAdapter.getTable('scannedDocuments') as unknown as ScannedDocumentRecord[]) || [];
    const empDocs = allDocs.filter((d) => d.employeeId === employee.id);
    empDocs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    setScannedDocs(empDocs);
  };

  const handleToggleStatus = () => {
    if (!employee) return;
    const newStatus = currentEmpStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const statusText = newStatus === 'ACTIVE' ? t.activeOnDuty : t.inactiveResigned;

    if (confirm(isRtl ? `هل أنت متأكد من تغيير حالة الموظف (${employee.name}) إلى ${statusText}؟` : `Are you sure you want to change status of (${employee.name}) to ${statusText}?`)) {
      const emps = sqliteAdapter.getTable('employees');
      const updated = emps.map((e) => (e.id === employee.id ? { ...e, status: newStatus as any } : e));
      sqliteAdapter.updateTable('employees', updated);
      setCurrentEmpStatus(newStatus);
      loggerService.logWarn('EMPLOYEES', `Changed employee status for ${employee.name} to ${newStatus}`);
      if (onRefreshData) onRefreshData();
    }
  };

  const handleExportCSV = () => {
    if (attendanceRecords.length === 0) {
      alert(isRtl ? 'لا توجد سجلات حضور للتصدير لهذا الموظف' : 'No attendance records available for export');
      return;
    }

    const headers = isRtl
      ? ['التاريخ', 'وقت الحضور', 'وقت الانصراف', 'دقائق التأخير', 'دقائق الإضافي', 'الحالة', 'جهاز البصمة', 'الملاحظات']
      : ['Date', 'Check-In', 'Check-Out', 'Late (Min)', 'Overtime (Min)', 'Status', 'Device ID', 'Notes'];

    const rows = attendanceRecords.map((r) => [
      r.date,
      r.checkIn || '-',
      r.checkOut || '-',
      r.lateMinutes || 0,
      r.overtimeMinutes || 0,
      r.status,
      r.deviceId || '-',
      `"${r.exitReason || r.notes || '-'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${employee.code}_${employee.name}_${startDate}_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  // KPI Calculations
  const presentCount = attendanceRecords.filter((r) => r.status === 'PRESENT').length;
  const lateCount = attendanceRecords.filter((r) => r.status === 'LATE').length;
  const earlyExitCount = attendanceRecords.filter((r) => r.status === 'EARLY_EXIT').length;
  const absentCount = attendanceRecords.filter((r) => r.status === 'ABSENT').length;
  const totalLateMinutes = attendanceRecords.reduce((sum, r) => sum + (r.lateMinutes || 0), 0);
  const totalOvertimeMinutes = attendanceRecords.reduce((sum, r) => sum + (r.overtimeMinutes || 0), 0);

  const settings = sqliteAdapter.getTable('settings');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isRtl ? `الملف الشامل للموظف: ${employee.name}` : `Full Employee Profile: ${employee.name}`}
      subtitle={`${t.employeeId}: ${employee.code} | ${t.fingerprintId}: ${employee.biometricId}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-5 text-xs">
        {/* Profile Header Banner */}
        <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-900 border border-white/10 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-cyan-500/20">
              {employee.name.charAt(0)}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{employee.name}</h2>
                {currentEmpStatus === 'ACTIVE' ? (
                  <Badge variant="emerald">{t.activeOnDuty}</Badge>
                ) : (
                  <Badge variant="red">{t.inactiveResigned}</Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-slate-300 font-medium">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                  {employee.position}
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-cyan-400" />
                  {employee.department}
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 font-mono text-cyan-300">
                  <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                  {t.fingerprintId}: {employee.biometricId}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEditEmployee(employee);
              }}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.edit}</span>
            </button>

            {onOpenScannerModal && (
              <button
                onClick={() => onOpenScannerModal(employee.id)}
                className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/20 transition-all"
              >
                <Scan className="w-3.5 h-3.5" />
                <span>{t.scannerButton}</span>
              </button>
            )}

            <button
              onClick={() => onOpenQuickLogModal(employee.id)}
              className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.manualLogButton}</span>
            </button>

            <button
              onClick={() => onOpenExitReasonModal(employee.id)}
              className="px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>{t.exitReasonButton}</span>
            </button>

            <button
              onClick={handleToggleStatus}
              className={`px-3 py-1.5 font-semibold rounded-xl border flex items-center gap-1.5 cursor-pointer transition-all ${
                currentEmpStatus === 'ACTIVE'
                  ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}
            >
              <UserX className="w-3.5 h-3.5" />
              <span>{currentEmpStatus === 'ACTIVE' ? (isRtl ? 'تعطيل' : 'Deactivate') : (isRtl ? 'تنشيط' : 'Activate')}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'attendance'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{t.tabAttendanceHistory}</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'documents'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Paperclip className="w-4 h-4" />
            <span>{t.tabScannedDocs} ({scannedDocs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'info'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{t.tabPersonalInfo}</span>
          </button>
        </div>

        {/* TAB 1: ATTENDANCE & DEPARTURE LOGS */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-slate-300 font-semibold">{t.dateFrom}:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900/80 border border-white/10 rounded-xl font-mono text-white"
                />
                <span className="text-slate-300 font-semibold">{t.dateTo}:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900/80 border border-white/10 rounded-xl font-mono text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>{t.export} Excel</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/10 font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isRtl ? 'طباعة' : 'Print'}</span>
                </button>
              </div>
            </div>

            {/* KPI Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-center">
                <span className="text-slate-400 text-[11px] font-medium block">{t.totalPresentDays}</span>
                <span className="text-lg font-bold font-mono text-emerald-400 mt-0.5 block">
                  {presentCount} {isRtl ? 'يوم' : 'Days'}
                </span>
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-center">
                <span className="text-slate-400 text-[11px] font-medium block">{t.totalLateMinutes}</span>
                <span className="text-lg font-bold font-mono text-amber-400 mt-0.5 block">
                  {lateCount} ({totalLateMinutes} {isRtl ? 'دقيقة' : 'min'})
                </span>
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-center">
                <span className="text-slate-400 text-[11px] font-medium block">{t.earlyExit}</span>
                <span className="text-lg font-bold font-mono text-purple-400 mt-0.5 block">
                  {earlyExitCount}
                </span>
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-center">
                <span className="text-slate-400 text-[11px] font-medium block">{t.totalAbsentDays}</span>
                <span className="text-lg font-bold font-mono text-red-400 mt-0.5 block">
                  {absentCount} {isRtl ? 'يوم' : 'Days'}
                </span>
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-center">
                <span className="text-slate-400 text-[11px] font-medium block">{t.overtimeMinutes}</span>
                <span className="text-lg font-bold font-mono text-cyan-400 mt-0.5 block">
                  {(totalOvertimeMinutes / 60).toFixed(1)} {isRtl ? 'ساعة' : 'hrs'}
                </span>
              </div>
            </div>

            {/* Detailed Attendance Log Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <h4 className="font-bold text-white text-xs flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-400" />
                  {t.attendanceRecords} ({attendanceRecords.length})
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className={`w-full text-xs ${isRtl ? 'text-right' : 'text-left'}`}>
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 font-semibold bg-white/5">
                      <th className="p-2.5">{isRtl ? 'التاريخ' : 'Date'}</th>
                      <th className="p-2.5">{t.checkIn}</th>
                      <th className="p-2.5">{t.checkOut}</th>
                      <th className="p-2.5">{t.lateMinutes}</th>
                      <th className="p-2.5">{t.overtimeMinutes}</th>
                      <th className="p-2.5">{t.status}</th>
                      <th className="p-2.5">{isRtl ? 'جهاز البصمة' : 'Device ID'}</th>
                      <th className="p-2.5">{t.notesAndExcuses}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {attendanceRecords.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-6 text-slate-400 font-sans">
                          {t.noData}
                        </td>
                      </tr>
                    ) : (
                      attendanceRecords.map((r) => (
                        <tr key={r.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-2.5 text-slate-300 font-bold">{r.date}</td>
                          <td className="p-2.5 text-emerald-400 font-bold">{r.checkIn || '-'}</td>
                          <td className="p-2.5 text-slate-300">{r.checkOut || '-'}</td>
                          <td className="p-2.5">
                            {r.lateMinutes > 0 ? (
                              <span className="text-amber-400 font-bold">+{r.lateMinutes}</span>
                            ) : (
                              '0'
                            )}
                          </td>
                          <td className="p-2.5">
                            {r.overtimeMinutes > 0 ? (
                              <span className="text-cyan-400 font-bold">+{r.overtimeMinutes}</span>
                            ) : (
                              '0'
                            )}
                          </td>
                          <td className="p-2.5 font-sans">
                            {r.status === 'PRESENT' && <Badge variant="emerald">{t.present}</Badge>}
                            {r.status === 'LATE' && <Badge variant="amber">{t.late}</Badge>}
                            {r.status === 'EARLY_EXIT' && <Badge variant="purple">{t.earlyExit}</Badge>}
                            {r.status === 'ABSENT' && <Badge variant="red">{t.absent}</Badge>}
                          </td>
                          <td className="p-2.5 text-slate-400 text-[11px]">{r.deviceId || 'DEV-01'}</td>
                          <td className="p-2.5 font-sans text-slate-300 max-w-xs truncate">
                            {r.exitReason || r.notes || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Exit Permissions History List */}
            {exitReasons.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-amber-300 text-xs flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-amber-400" />
                  {t.exitReasonTitle} ({exitReasons.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {exitReasons.map((ex) => (
                    <div
                      key={ex.id}
                      className="p-3 bg-slate-900/80 border border-white/10 rounded-xl space-y-1"
                    >
                      <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
                        <span>{isRtl ? 'التاريخ' : 'Date'}: {ex.date}</span>
                        <span className="text-amber-400 font-bold">{t.departureTime}: {ex.departureTime}</span>
                      </div>
                      <p className="font-bold text-white text-xs">{ex.reason}</p>
                      {ex.approvedBy && (
                        <p className="text-[10px] text-slate-400">{isRtl ? 'اعتماد' : 'Approved'}: {ex.approvedBy}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SCANNED DOCUMENTS & ATTACHMENTS (OCR) */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-white text-xs flex items-center gap-2">
                  <Scan className="w-4 h-4 text-cyan-400" />
                  {t.scannedDocsArchive} ({scannedDocs.length})
                </h4>
              </div>

              {onOpenScannerModal && (
                <button
                  onClick={() => onOpenScannerModal(employee.id)}
                  className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all"
                >
                  <Scan className="w-4 h-4" />
                  <span>+ {t.scanDoc}</span>
                </button>
              )}
            </div>

            {scannedDocs.length === 0 ? (
              <div className="p-8 text-center bg-white/5 border border-white/10 rounded-2xl space-y-3">
                <Scan className="w-10 h-10 text-slate-500 mx-auto" />
                <p className="text-slate-400 text-xs font-semibold">
                  {t.noDocsFound}
                </p>
                {onOpenScannerModal && (
                  <button
                    onClick={() => onOpenScannerModal(employee.id)}
                    className="px-4 py-2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 font-bold rounded-xl text-xs cursor-pointer inline-flex items-center gap-1.5 transition-all"
                  >
                    <Scan className="w-4 h-4" />
                    <span>{t.scanDoc}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {scannedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 space-y-3 hover:border-cyan-500/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="font-mono text-[10px] text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                          {doc.referenceNumber || doc.id}
                        </span>
                        <h5 className="font-bold text-white text-xs">{doc.documentType}</h5>
                      </div>
                      <Badge
                        variant={
                          doc.category === 'SICK_LEAVE'
                            ? 'amber'
                            : doc.category === 'VACATION'
                            ? 'purple'
                            : doc.category === 'MISSION'
                            ? 'emerald'
                            : 'blue'
                        }
                      >
                        {doc.category === 'SICK_LEAVE'
                          ? t.sickLeave
                          : doc.category === 'VACATION'
                          ? t.vacation
                          : doc.category === 'MISSION'
                          ? t.mission
                          : t.general}
                      </Badge>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5 space-y-1 text-[11px]">
                      <div className="flex justify-between text-slate-400 font-mono">
                        <span>{t.documentDate}: {doc.startDate || doc.documentDate || (doc.createdAt ? doc.createdAt.split('T')[0] : '')}</span>
                      </div>
                      {(doc.summary || doc.reasonOrDiagnosis) && (
                        <p className="text-slate-300 line-clamp-2 leading-relaxed">
                          {doc.summary || doc.reasonOrDiagnosis}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-slate-400 font-mono text-[10px]">
                        {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US') : '-'}
                      </span>
                      {doc.fileData && (
                        <button
                          onClick={() => setSelectedPreviewDoc(doc)}
                          className="px-2.5 py-1 text-cyan-300 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 rounded-lg cursor-pointer transition-colors flex items-center gap-1 font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{t.preview}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PERSONAL & EMPLOYMENT DETAILS */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Employment Data Box */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
              <h4 className="font-bold text-cyan-400 text-xs flex items-center gap-2 border-b border-white/10 pb-2">
                <Briefcase className="w-4 h-4" />
                {t.tabPersonalInfo}
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">{t.employeeId}:</span>
                  <span className="font-mono font-bold text-cyan-300">{employee.code}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">{t.fingerprintId}:</span>
                  <span className="font-mono font-bold text-white">{employee.biometricId}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">{t.department}:</span>
                  <span className="font-bold text-white">{employee.department}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">{t.jobTitle}:</span>
                  <span className="font-bold text-white">{employee.position}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">{isRtl ? 'مواعيد الدوام الرسمي:' : 'Official Work Hours:'}</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {settings.workStartTime} - {settings.workEndTime}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">{t.serviceStatus}:</span>
                  <span>
                    {currentEmpStatus === 'ACTIVE' ? (
                      <Badge variant="emerald">{t.activeOnDuty}</Badge>
                    ) : (
                      <Badge variant="red">{t.inactiveResigned}</Badge>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Personal Data Box */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
              <h4 className="font-bold text-cyan-400 text-xs flex items-center gap-2 border-b border-white/10 pb-2">
                <User className="w-4 h-4" />
                {t.fullName}
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">{t.fullName}:</span>
                  <span className="font-bold text-white">{employee.name}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">{t.nationalId}:</span>
                  <span className="font-mono font-bold text-white">{employee.nationalId || '-'}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">{t.phone}:</span>
                  <span className="font-mono text-cyan-300">{employee.phone || '-'}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">{t.email}:</span>
                  <span className="font-mono text-slate-300">{employee.email || '-'}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">{t.hireDate}:</span>
                  <span className="font-mono text-slate-300">{employee.hireDate || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl cursor-pointer"
          >
            {t.close}
          </button>
        </div>

        {/* Selected Document Image Preview Modal */}
        {selectedPreviewDoc && (
          <Modal
            isOpen={!!selectedPreviewDoc}
            onClose={() => setSelectedPreviewDoc(null)}
            title={`${t.preview}: ${selectedPreviewDoc.documentType}`}
            subtitle={`${t.documentNumber}: ${selectedPreviewDoc.referenceNumber || selectedPreviewDoc.id}`}
            maxWidth="max-w-3xl"
          >
            <div className="space-y-4">
              <div className="bg-slate-950 border border-white/10 rounded-2xl p-2 flex justify-center items-center overflow-hidden max-h-[60vh]">
                <img
                  src={selectedPreviewDoc.fileData}
                  alt={selectedPreviewDoc.documentType}
                  className="max-h-[58vh] w-auto object-contain rounded-xl"
                />
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 text-xs">
                <h5 className="font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  {t.extractedSummary}
                </h5>
                <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl font-mono text-[11px] border border-white/5">
                  {selectedPreviewDoc.summary || selectedPreviewDoc.reasonOrDiagnosis || '-'}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedPreviewDoc(null)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl cursor-pointer"
                >
                  {t.close}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Modal>
  );
};
