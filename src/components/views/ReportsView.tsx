import React, { useState, useMemo } from 'react';
import {
  Building2,
  Users,
  UserCheck,
  Download,
  Printer,
  Calendar,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  TrendingUp,
  Fingerprint,
  Phone,
  FileText,
  UserX,
  ShieldCheck,
  Paperclip,
  Award
} from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import { sqliteAdapter } from '../../db/sqliteAdapter';
import { Employee, AttendanceRecord, ExitReasonRecord, ScannedDocumentRecord } from '../../types';
import { Badge } from '../common/Badge';
import { useLanguageStore } from '../../stores/useLanguageStore';

type ReportTab = 'COMPANY' | 'ALL_EMPLOYEES' | 'INDIVIDUAL';

export const ReportsView: React.FC = () => {
  const { t, isRtl } = useLanguageStore();

  // Tab State
  const [activeTab, setActiveTab] = useState<ReportTab>('COMPANY');

  // Filter States
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // First day of current month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Employee for Individual Tab
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  // Data Loading from SQLite Adapter
  const employees: Employee[] = useMemo(() => sqliteAdapter.getTable('employees') || [], []);
  const allExitReasons: ExitReasonRecord[] = useMemo(() => sqliteAdapter.getTable('exitReasons') || [], []);
  const allScannedDocs: ScannedDocumentRecord[] = useMemo(() => sqliteAdapter.getTable('scannedDocuments') || [], []);

  // Filtered Attendance Records
  const attendanceRecords: AttendanceRecord[] = useMemo(() => {
    return attendanceService.getAttendanceRecords({
      startDate,
      endDate,
      department: department === 'ALL' ? undefined : department,
      search: searchQuery || undefined,
    });
  }, [startDate, endDate, department, searchQuery]);

  // Unique Departments List
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set);
  }, [employees]);

  // Set default selected employee if not set
  React.useEffect(() => {
    if (!selectedEmployeeId && employees.length > 0) {
      setSelectedEmployeeId(employees[0].id);
    }
  }, [employees, selectedEmployeeId]);

  // -------------------------------------------------------------
  // COMPUTED STATS: COMPANY LEVEL
  // -------------------------------------------------------------
  const companyStats = useMemo(() => {
    const totalStaff = employees.length;
    const activeStaff = employees.filter((e) => e.status === 'ACTIVE').length;
    
    const totalRecords = attendanceRecords.length;
    const presentRecords = attendanceRecords.filter((r) => r.status === 'PRESENT' || r.status === 'LATE');
    const totalPresentCount = presentRecords.length;
    const totalAbsentCount = attendanceRecords.filter((r) => r.status === 'ABSENT').length;
    const totalLateCount = attendanceRecords.filter((r) => r.lateMinutes > 0).length;
    const totalLateMinutes = attendanceRecords.reduce((acc, r) => acc + (r.lateMinutes || 0), 0);
    const totalOvertimeMinutes = attendanceRecords.reduce((acc, r) => acc + (r.overtimeMinutes || 0), 0);

    const periodExitPermits = allExitReasons.filter(
      (ex) => (!startDate || ex.date >= startDate) && (!endDate || ex.date <= endDate)
    );

    const commitmentRate = totalRecords > 0 ? Math.round((totalPresentCount / totalRecords) * 100) : 100;
    const onTimeRate = totalPresentCount > 0 ? Math.round(((totalPresentCount - totalLateCount) / totalPresentCount) * 100) : 100;

    return {
      totalStaff,
      activeStaff,
      totalRecords,
      totalPresentCount,
      totalAbsentCount,
      totalLateCount,
      totalLateMinutes,
      totalOvertimeMinutes,
      totalExitPermits: periodExitPermits.length,
      commitmentRate,
      onTimeRate,
    };
  }, [employees, attendanceRecords, allExitReasons, startDate, endDate]);

  // -------------------------------------------------------------
  // COMPUTED STATS: DEPARTMENT BREAKDOWN
  // -------------------------------------------------------------
  const departmentBreakdown = useMemo(() => {
    const depts = departmentsList.length > 0 ? departmentsList : ['تكنولوجيا المعلومات', 'الموارد البشرية', 'الحسابات والمالية'];
    
    return depts.map((deptName) => {
      const deptEmployees = employees.filter((e) => e.department === deptName);
      const deptRecords = attendanceRecords.filter((r) => r.department === deptName);
      const presentCount = deptRecords.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
      const absentCount = deptRecords.filter((r) => r.status === 'ABSENT').length;
      const lateMins = deptRecords.reduce((acc, r) => acc + (r.lateMinutes || 0), 0);
      const overtimeMins = deptRecords.reduce((acc, r) => acc + (r.overtimeMinutes || 0), 0);
      const rate = deptRecords.length > 0 ? Math.round((presentCount / deptRecords.length) * 100) : 100;

      return {
        departmentName: deptName,
        staffCount: deptEmployees.length,
        totalRecords: deptRecords.length,
        presentCount,
        absentCount,
        lateMins,
        overtimeMins,
        rate,
      };
    });
  }, [departmentsList, employees, attendanceRecords]);

  // -------------------------------------------------------------
  // COMPUTED STATS: ALL EMPLOYEES AGGREGATED LIST
  // -------------------------------------------------------------
  const allEmployeesReportData = useMemo(() => {
    return employees
      .filter((e) => {
        if (department !== 'ALL' && e.department !== department) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase().trim();
          return (
            e.name.toLowerCase().includes(q) ||
            e.code.toLowerCase().includes(q) ||
            e.biometricId.toLowerCase().includes(q) ||
            e.department.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .map((emp) => {
        const empRecords = attendanceRecords.filter(
          (r) => r.employeeCode === emp.code || r.employeeName === emp.name
        );
        const presentDays = empRecords.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
        const absentDays = empRecords.filter((r) => r.status === 'ABSENT').length;
        const lateCount = empRecords.filter((r) => r.lateMinutes > 0).length;
        const totalLateMins = empRecords.reduce((acc, r) => acc + (r.lateMinutes || 0), 0);
        const totalOvertimeMins = empRecords.reduce((acc, r) => acc + (r.overtimeMinutes || 0), 0);

        const empExits = allExitReasons.filter(
          (ex) =>
            ex.employeeId === emp.id &&
            (!startDate || ex.date >= startDate) &&
            (!endDate || ex.date <= endDate)
        );

        const attendanceRate = empRecords.length > 0 ? Math.round((presentDays / empRecords.length) * 100) : 100;

        return {
          employee: emp,
          totalLoggedDays: empRecords.length,
          presentDays,
          absentDays,
          lateCount,
          totalLateMins,
          totalOvertimeMins,
          exitPermitsCount: empExits.length,
          attendanceRate,
        };
      });
  }, [employees, attendanceRecords, allExitReasons, department, searchQuery, startDate, endDate]);

  // -------------------------------------------------------------
  // COMPUTED STATS: INDIVIDUAL SELECTED EMPLOYEE
  // -------------------------------------------------------------
  const selectedEmployeeObj = useMemo(() => {
    return employees.find((e) => e.id === selectedEmployeeId) || employees[0] || null;
  }, [employees, selectedEmployeeId]);

  const individualReportData = useMemo(() => {
    if (!selectedEmployeeObj) return null;

    const empRecords = attendanceRecords.filter(
      (r) => r.employeeCode === selectedEmployeeObj.code || r.employeeName === selectedEmployeeObj.name
    );
    empRecords.sort((a, b) => b.date.localeCompare(a.date));

    const presentDays = empRecords.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
    const absentDays = empRecords.filter((r) => r.status === 'ABSENT').length;
    const lateCount = empRecords.filter((r) => r.lateMinutes > 0).length;
    const totalLateMins = empRecords.reduce((acc, r) => acc + (r.lateMinutes || 0), 0);
    const totalOvertimeMins = empRecords.reduce((acc, r) => acc + (r.overtimeMinutes || 0), 0);

    const empExits = allExitReasons.filter(
      (ex) =>
        ex.employeeId === selectedEmployeeObj.id &&
        (!startDate || ex.date >= startDate) &&
        (!endDate || ex.date <= endDate)
    );

    const empDocs = allScannedDocs.filter((doc) => doc.employeeId === selectedEmployeeObj.id);

    const commitmentRate = empRecords.length > 0 ? Math.round((presentDays / empRecords.length) * 100) : 100;

    return {
      records: empRecords,
      presentDays,
      absentDays,
      lateCount,
      totalLateMins,
      totalOvertimeMins,
      exitPermits: empExits,
      scannedDocs: empDocs,
      commitmentRate,
    };
  }, [selectedEmployeeObj, attendanceRecords, allExitReasons, allScannedDocs, startDate, endDate]);

  // -------------------------------------------------------------
  // EXPORT HANDLERS
  // -------------------------------------------------------------
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (activeTab === 'COMPANY') {
      headers = [isRtl ? 'القسم' : 'Department', isRtl ? 'عدد الموظفين' : 'Staff Count', isRtl ? 'الحضور' : 'Present Days', isRtl ? 'الغياب' : 'Absent Days', isRtl ? 'التأخير (دقيقة)' : 'Late (Mins)', isRtl ? 'الإضافي (ساعة)' : 'Overtime (Hrs)', isRtl ? 'نسبة الالتزام' : 'Rate %'];
      rows = departmentBreakdown.map((d) => [
        d.departmentName,
        d.staffCount.toString(),
        d.presentCount.toString(),
        d.absentCount.toString(),
        d.lateMins.toString(),
        (d.overtimeMins / 60).toFixed(1),
        `${d.rate}%`,
      ]);
    } else if (activeTab === 'ALL_EMPLOYEES') {
      headers = [isRtl ? 'الكود' : 'Code', isRtl ? 'اسم الموظف' : 'Name', isRtl ? 'القسم' : 'Department', isRtl ? 'أيام الحضور' : 'Present Days', isRtl ? 'الغياب' : 'Absent Days', isRtl ? 'مرات التأخير' : 'Late Times', isRtl ? 'دقائق التأخير' : 'Late (Mins)', isRtl ? 'الإضافي (ساعات)' : 'Overtime (Hrs)', isRtl ? 'أذونات الخروج' : 'Exit Permits', isRtl ? 'نسبة الالتزام' : 'Rate %'];
      rows = allEmployeesReportData.map((item) => [
        item.employee.code,
        item.employee.name,
        item.employee.department,
        item.presentDays.toString(),
        item.absentDays.toString(),
        item.lateCount.toString(),
        item.totalLateMins.toString(),
        (item.totalOvertimeMins / 60).toFixed(1),
        item.exitPermitsCount.toString(),
        `${item.attendanceRate}%`,
      ]);
    } else if (activeTab === 'INDIVIDUAL' && selectedEmployeeObj && individualReportData) {
      headers = [isRtl ? 'التاريخ' : 'Date', isRtl ? 'الحضور' : 'Check-In', isRtl ? 'الانصراف' : 'Check-Out', isRtl ? 'التأخير (د)' : 'Late (Mins)', isRtl ? 'الإضافي (د)' : 'Overtime (Mins)', isRtl ? 'الحالة' : 'Status', isRtl ? 'الملاحظات' : 'Notes'];
      rows = individualReportData.records.map((r) => [
        r.date,
        r.checkIn || '-',
        r.checkOut || '-',
        r.lateMinutes.toString(),
        r.overtimeMinutes.toString(),
        r.status,
        r.notes || r.exitReason || '-',
      ]);
    }

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.map((val) => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `as_solution_report_${activeTab.toLowerCase()}_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    let exportPayload: any = {};
    if (activeTab === 'COMPANY') {
      exportPayload = { type: 'COMPANY_SUMMARY', companyStats, departmentBreakdown, startDate, endDate };
    } else if (activeTab === 'ALL_EMPLOYEES') {
      exportPayload = { type: 'ALL_EMPLOYEES_REPORT', allEmployeesReportData, startDate, endDate };
    } else {
      exportPayload = { type: 'INDIVIDUAL_REPORT', employee: selectedEmployeeObj, individualReportData, startDate, endDate };
    }

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `as_solution_report_${activeTab.toLowerCase()}_${startDate}_to_${endDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Printable Style Sheet Injection */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .printable-area { background: white !important; color: black !important; border: none !important; box-shadow: none !important; }
          .printable-area table { width: 100% !important; border-collapse: collapse !important; }
          .printable-area th, .printable-area td { border: 1px solid #cbd5e1 !important; color: black !important; padding: 6px !important; }
          .printable-header { display: block !important; margin-bottom: 20px; text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 10px; }
        }
      `}</style>

      {/* Top Main Mode Navigation Tabs */}
      <div className="no-print bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-2 shadow-xl flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/60 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('COMPANY')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'COMPANY'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{t.reportTabCompany}</span>
          </button>

          <button
            onClick={() => setActiveTab('ALL_EMPLOYEES')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'ALL_EMPLOYEES'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t.reportTabAllEmployees}</span>
          </button>

          <button
            onClick={() => setActiveTab('INDIVIDUAL')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'INDIVIDUAL'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>{t.reportTabIndividual}</span>
          </button>
        </div>

        {/* Global Export & Print Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{t.exportCSV}</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>{t.exportJSON}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>{t.printOfficialReport}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="no-print bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs w-full lg:w-auto">
          {/* Start Date */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-300">{t.dateFrom}:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-900/80 border border-white/10 rounded-xl font-mono text-white text-xs"
            />
          </div>

          {/* End Date */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-300">{t.dateTo}:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-900/80 border border-white/10 rounded-xl font-mono text-white text-xs"
            />
          </div>

          {/* Department Selector */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-300">{t.department}:</span>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="px-3 py-1.5 bg-slate-900/80 border border-white/10 rounded-xl font-medium text-white text-xs"
            >
              <option value="ALL" className="bg-slate-900 text-white">{t.allDepartments}</option>
              {departmentsList.map((d) => (
                <option key={d} value={d} className="bg-slate-900 text-white">
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Individual Employee Pick List if on INDIVIDUAL tab */}
          {activeTab === 'INDIVIDUAL' && (
            <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/30 p-1.5 rounded-xl">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-cyan-300 text-xs">{t.selectEmployeeReport}:</span>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="px-3 py-1 bg-slate-900 border border-white/10 rounded-lg font-bold text-white text-xs min-w-[180px]"
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id} className="bg-slate-900 text-white">
                    {e.name} ({e.code}) - {e.department}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Search Field */}
        <div className="relative w-full lg:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:right-3 rtl:left-auto top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchEmployeePlaceholder}
            className={`w-full py-1.5 ${isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'} bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500`}
          />
        </div>
      </div>

      {/* PRINTABLE HEADER BLOCK (Visible during print) */}
      <div className="hidden print:block printable-header text-center space-y-1 mb-6">
        <h1 className="text-xl font-bold text-black">{t.companyName}</h1>
        <h2 className="text-base font-bold text-slate-700">
          {activeTab === 'COMPANY' && t.reportTabCompany}
          {activeTab === 'ALL_EMPLOYEES' && t.reportTabAllEmployees}
          {activeTab === 'INDIVIDUAL' && `${t.reportTabIndividual}: ${selectedEmployeeObj?.name || ''}`}
        </h2>
        <p className="text-xs text-slate-500">
          الفترة من: {startDate} إلى: {endDate} | تم استخراج التقرير بتاريخ: {new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
        </p>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: COMPANY EXECUTIVE OVERVIEW (تقرير الشركة الشامل) */}
      {/* ========================================================================= */}
      {activeTab === 'COMPANY' && (
        <div className="space-y-6 printable-area">
          {/* Key Metric KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 text-center shadow-xl">
              <Users className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
              <span className="text-slate-400 text-[11px] block font-semibold">{t.totalEmployees}</span>
              <span className="text-lg font-bold font-mono text-white mt-0.5 block">
                {companyStats.totalStaff} ({companyStats.activeStaff} {t.active})
              </span>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 text-center shadow-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <span className="text-slate-400 text-[11px] block font-semibold">{t.totalPresentDays}</span>
              <span className="text-lg font-bold font-mono text-emerald-400 mt-0.5 block">
                {companyStats.totalPresentCount} {isRtl ? 'حركة' : 'logs'}
              </span>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 text-center shadow-xl">
              <UserX className="w-5 h-5 text-red-400 mx-auto mb-1" />
              <span className="text-slate-400 text-[11px] block font-semibold">{t.absentDays}</span>
              <span className="text-lg font-bold font-mono text-red-400 mt-0.5 block">
                {companyStats.totalAbsentCount} {isRtl ? 'يوم' : 'days'}
              </span>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 text-center shadow-xl">
              <Clock className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <span className="text-slate-400 text-[11px] block font-semibold">{t.totalLateHours}</span>
              <span className="text-lg font-bold font-mono text-amber-400 mt-0.5 block">
                {(companyStats.totalLateMinutes / 60).toFixed(1)} {isRtl ? 'ساعة' : 'hrs'}
              </span>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 text-center shadow-xl">
              <TrendingUp className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
              <span className="text-slate-400 text-[11px] block font-semibold">{t.totalOvertimeHours}</span>
              <span className="text-lg font-bold font-mono text-cyan-400 mt-0.5 block">
                {(companyStats.totalOvertimeMinutes / 60).toFixed(1)} {isRtl ? 'ساعة' : 'hrs'}
              </span>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 text-center shadow-xl">
              <Award className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <span className="text-slate-400 text-[11px] block font-semibold">{t.attendanceRate}</span>
              <span className="text-lg font-bold font-mono text-purple-300 mt-0.5 block">
                {companyStats.commitmentRate}%
              </span>
            </div>
          </div>

          {/* Department Breakdown Table */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span>{t.departmentSummary} ({departmentBreakdown.length})</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className={`w-full text-xs ${isRtl ? 'text-right' : 'text-left'}`}>
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 font-semibold bg-white/5">
                    <th className="p-3">{t.department}</th>
                    <th className="p-3">{t.totalEmployees}</th>
                    <th className="p-3">{t.totalPresentDays}</th>
                    <th className="p-3">{t.absentDays}</th>
                    <th className="p-3">{t.totalLateMinutes}</th>
                    <th className="p-3">{t.totalOvertimeHours}</th>
                    <th className="p-3">{t.attendanceRate}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {departmentBreakdown.map((dept) => (
                    <tr key={dept.departmentName} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-bold text-white font-sans">{dept.departmentName}</td>
                      <td className="p-3 text-cyan-300 font-bold">{dept.staffCount}</td>
                      <td className="p-3 text-emerald-400 font-bold">{dept.presentCount}</td>
                      <td className="p-3 text-red-400 font-bold">{dept.absentCount}</td>
                      <td className="p-3 text-amber-400 font-bold">{dept.lateMins} دقيقة</td>
                      <td className="p-3 text-cyan-400 font-bold">{(dept.overtimeMins / 60).toFixed(1)} ساعة</td>
                      <td className="p-3">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                          dept.rate >= 90
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : dept.rate >= 75
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          {dept.rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Company Attendance Log Stream */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>سجل البصمات والحركات المجمعة بالفترة ({attendanceRecords.length} سجل)</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className={`w-full text-xs ${isRtl ? 'text-right' : 'text-left'}`}>
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 font-semibold bg-white/5">
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">الكود</th>
                    <th className="p-3">اسم الموظف</th>
                    <th className="p-3">القسم</th>
                    <th className="p-3">الحضور</th>
                    <th className="p-3">الانصراف</th>
                    <th className="p-3">التأخير</th>
                    <th className="p-3">الإضافي</th>
                    <th className="p-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {attendanceRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-slate-400 font-sans">
                        {t.noData}
                      </td>
                    </tr>
                  ) : (
                    attendanceRecords.slice(0, 50).map((r) => (
                      <tr key={r.id} className="hover:bg-white/5 transition-colors font-mono">
                        <td className="p-3 text-slate-300">{r.date}</td>
                        <td className="p-3 text-cyan-400 font-bold">{r.employeeCode}</td>
                        <td className="p-3 text-white font-sans font-semibold">{r.employeeName}</td>
                        <td className="p-3 text-slate-400 font-sans">{r.department}</td>
                        <td className="p-3 text-emerald-400 font-bold">{r.checkIn || '-'}</td>
                        <td className="p-3 text-slate-300">{r.checkOut || '-'}</td>
                        <td className="p-3 text-amber-400">{r.lateMinutes > 0 ? `+${r.lateMinutes}د` : '0'}</td>
                        <td className="p-3 text-cyan-400">{r.overtimeMinutes > 0 ? `+${r.overtimeMinutes}د` : '0'}</td>
                        <td className="p-3 font-sans">
                          {r.status === 'PRESENT' && <Badge variant="emerald">{t.present}</Badge>}
                          {r.status === 'LATE' && <Badge variant="amber">{t.late}</Badge>}
                          {r.status === 'EARLY_EXIT' && <Badge variant="purple">{t.earlyExit}</Badge>}
                          {r.status === 'ABSENT' && <Badge variant="red">{t.absent}</Badge>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ALL EMPLOYEES TOGETHER REPORT (تقرير جميع العاملين) */}
      {/* ========================================================================= */}
      {activeTab === 'ALL_EMPLOYEES' && (
        <div className="space-y-6 printable-area">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 bg-white/5">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>تقرير ملخص أداء ومتابعة جميع العاملين ({allEmployeesReportData.length} موظف)</span>
              </h3>
              <span className="text-slate-400 text-xs font-medium">
                الفترة: من {startDate} إلى {endDate}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className={`w-full text-xs ${isRtl ? 'text-right' : 'text-left'}`}>
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 font-semibold bg-white/5">
                    <th className="p-3">كود الموظف</th>
                    <th className="p-3">اسم الموظف</th>
                    <th className="p-3">القسم</th>
                    <th className="p-3">أيام الحضور</th>
                    <th className="p-3">أيام الغياب</th>
                    <th className="p-3">مرات التأخير</th>
                    <th className="p-3">إجمالي التأخير</th>
                    <th className="p-3">ساعات الإضافي</th>
                    <th className="p-3">أذونات الخروج</th>
                    <th className="p-3">نسبة الالتزام</th>
                    <th className="p-3 no-print">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {allEmployeesReportData.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center py-8 text-slate-400 font-sans">
                        {t.noData}
                      </td>
                    </tr>
                  ) : (
                    allEmployeesReportData.map((item) => (
                      <tr key={item.employee.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3 font-mono font-bold text-cyan-400">{item.employee.code}</td>
                        <td className="p-3 font-bold text-white font-sans">{item.employee.name}</td>
                        <td className="p-3 text-slate-300 font-sans">{item.employee.department}</td>
                        <td className="p-3 font-mono text-emerald-400 font-bold">{item.presentDays} يوم</td>
                        <td className="p-3 font-mono text-red-400 font-bold">{item.absentDays} يوم</td>
                        <td className="p-3 font-mono text-amber-400">{item.lateCount} مرة</td>
                        <td className="p-3 font-mono text-amber-300 font-bold">{item.totalLateMins} دقيقة</td>
                        <td className="p-3 font-mono text-cyan-300 font-bold">{(item.totalOvertimeMins / 60).toFixed(1)} ساعة</td>
                        <td className="p-3 font-mono text-purple-300 font-bold">{item.exitPermitsCount} أذونات</td>
                        <td className="p-3 font-mono">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                            item.attendanceRate >= 90
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : item.attendanceRate >= 75
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}>
                            {item.attendanceRate}%
                          </span>
                        </td>
                        <td className="p-3 no-print">
                          <button
                            onClick={() => {
                              setSelectedEmployeeId(item.employee.id);
                              setActiveTab('INDIVIDUAL');
                            }}
                            className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 font-bold rounded-lg cursor-pointer text-[11px] transition-colors"
                          >
                            عرض تقريره
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INDIVIDUAL EMPLOYEE STATEMENT (تقرير كل موظف على حدة) */}
      {/* ========================================================================= */}
      {activeTab === 'INDIVIDUAL' && (
        <div className="space-y-6 printable-area">
          {selectedEmployeeObj && individualReportData ? (
            <>
              {/* Employee ID Profile Card */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-xl shadow-cyan-500/20 border border-white/20">
                      {selectedEmployeeObj.name.charAt(0)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-white">{selectedEmployeeObj.name}</h2>
                        {selectedEmployeeObj.status === 'ACTIVE' ? (
                          <Badge variant="emerald">{t.activeOnDuty}</Badge>
                        ) : (
                          <Badge variant="red">{t.inactiveResigned}</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-slate-300 text-xs font-medium">
                        <span>{t.employeeId}: <strong className="text-cyan-300 font-mono">{selectedEmployeeObj.code}</strong></span>
                        <span className="text-slate-600">•</span>
                        <span>{t.department}: <strong className="text-white">{selectedEmployeeObj.department}</strong></span>
                        <span className="text-slate-600">•</span>
                        <span>{t.jobTitle}: <strong className="text-white">{selectedEmployeeObj.position}</strong></span>
                        <span className="text-slate-600">•</span>
                        <span className="flex items-center gap-1 font-mono text-cyan-300">
                          <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                          {t.fingerprintId}: {selectedEmployeeObj.biometricId}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Commitment Rate Gauge */}
                  <div className="bg-white/5 border border-white/10 p-3 rounded-2xl text-center min-w-[130px]">
                    <span className="text-slate-400 text-[11px] block font-semibold">{t.attendanceRate}</span>
                    <span className="text-2xl font-bold font-mono text-cyan-300 mt-0.5 block">
                      {individualReportData.commitmentRate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Individual KPIs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 text-center shadow-xl">
                  <span className="text-slate-400 text-xs block font-semibold">{t.totalPresentDays}</span>
                  <span className="text-lg font-bold font-mono text-emerald-400 mt-1 block">
                    {individualReportData.presentDays} {isRtl ? 'يوم' : 'Days'}
                  </span>
                </div>

                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 text-center shadow-xl">
                  <span className="text-slate-400 text-xs block font-semibold">{t.absentDays}</span>
                  <span className="text-lg font-bold font-mono text-red-400 mt-1 block">
                    {individualReportData.absentDays} {isRtl ? 'يوم' : 'Days'}
                  </span>
                </div>

                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 text-center shadow-xl">
                  <span className="text-slate-400 text-xs block font-semibold">{t.totalLateMinutes}</span>
                  <span className="text-lg font-bold font-mono text-amber-400 mt-1 block">
                    {individualReportData.totalLateMins} {isRtl ? 'دقيقة' : 'min'}
                  </span>
                </div>

                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 text-center shadow-xl">
                  <span className="text-slate-400 text-xs block font-semibold">{t.totalOvertimeHours}</span>
                  <span className="text-lg font-bold font-mono text-cyan-400 mt-1 block">
                    {(individualReportData.totalOvertimeMins / 60).toFixed(1)} {isRtl ? 'ساعة' : 'hrs'}
                  </span>
                </div>

                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 text-center shadow-xl">
                  <span className="text-slate-400 text-xs block font-semibold">{t.exitPermitsCount}</span>
                  <span className="text-lg font-bold font-mono text-purple-300 mt-1 block">
                    {individualReportData.exitPermits.length} {isRtl ? 'أذونات' : 'permits'}
                  </span>
                </div>
              </div>

              {/* Attendance Log Table for Selected Employee */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>سجل الحضور والانصراف المباشر بالفترة ({individualReportData.records.length} حركة)</span>
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className={`w-full text-xs ${isRtl ? 'text-right' : 'text-left'}`}>
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 font-semibold bg-white/5">
                        <th className="p-3">التاريخ</th>
                        <th className="p-3">{t.checkIn}</th>
                        <th className="p-3">{t.checkOut}</th>
                        <th className="p-3">{t.lateMinutes}</th>
                        <th className="p-3">{t.overtimeMinutes}</th>
                        <th className="p-3">{t.status}</th>
                        <th className="p-3">{t.notesAndExcuses}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {individualReportData.records.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-slate-400 font-sans">
                            لا توجد سجلات حضور مسجلة لهذا الموظف في الفترة المحددة
                          </td>
                        </tr>
                      ) : (
                        individualReportData.records.map((r) => (
                          <tr key={r.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-3 text-slate-300">{r.date}</td>
                            <td className="p-3 text-emerald-400 font-bold">{r.checkIn || '-'}</td>
                            <td className="p-3 text-slate-300">{r.checkOut || '-'}</td>
                            <td className="p-3 text-amber-400 font-bold">
                              {r.lateMinutes > 0 ? `+${r.lateMinutes} د` : '0'}
                            </td>
                            <td className="p-3 text-cyan-400 font-bold">
                              {r.overtimeMinutes > 0 ? `+${r.overtimeMinutes} د` : '0'}
                            </td>
                            <td className="p-3 font-sans">
                              {r.status === 'PRESENT' && <Badge variant="emerald">{t.present}</Badge>}
                              {r.status === 'LATE' && <Badge variant="amber">{t.late}</Badge>}
                              {r.status === 'EARLY_EXIT' && <Badge variant="purple">{t.earlyExit}</Badge>}
                              {r.status === 'ABSENT' && <Badge variant="red">{t.absent}</Badge>}
                            </td>
                            <td className="p-3 font-sans text-slate-300 max-w-xs truncate">
                              {r.exitReason || r.notes || '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Scanned Docs & Medical Notes for Employee */}
              {individualReportData.scannedDocs.length > 0 && (
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 space-y-3 shadow-xl">
                  <h4 className="font-bold text-cyan-400 text-xs flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-cyan-400" />
                    <span>المستندات والأعذار الطبية الممسوحة المرفقة ({individualReportData.scannedDocs.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {individualReportData.scannedDocs.map((doc) => (
                      <div key={doc.id} className="p-3 bg-slate-900/80 border border-white/10 rounded-xl space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{doc.documentType}</span>
                          <Badge variant="cyan">{doc.category}</Badge>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-2">
                          {doc.summary || doc.reasonOrDiagnosis || 'لا يوجد ملخص'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center bg-white/5 border border-white/10 rounded-2xl">
              <UserCheck className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-300 text-sm font-bold">{t.selectEmployeeReport}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
