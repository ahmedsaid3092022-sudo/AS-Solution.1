export type Role = 'ADMIN' | 'HR' | 'SECURITY' | 'MANAGER';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  email: string;
  avatar?: string;
  lastLogin?: string;
}

export type ShiftType = 'MORNING' | 'EVENING' | 'NIGHT' | 'CUSTOM';

export interface WorkShift {
  id: string;
  name: string; // e.g. "الوردية الصباحية (النهارية)"
  code: string; // e.g. "SHIFT-01"
  type: ShiftType;
  startTime: string; // "08:00"
  endTime: string; // "16:00"
  gracePeriodMinutes: number; // 15
  color?: string; // e.g. "cyan" | "amber" | "purple" | "emerald" | "blue"
  isDefault?: boolean;
  isActive: boolean;
}

export interface Branch {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  isMain?: boolean;
  isActive: boolean;
}

export type ESSRequestType = 'VACATION' | 'PERMISSION' | 'ADVANCE';
export type ESSRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ESSRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode?: string;
  type: ESSRequestType;
  startDate: string;
  endDate?: string;
  amount?: number; // for advance loan
  reason: string;
  status: ESSRequestStatus;
  approvedBy?: string;
  notes?: string;
  createdAt: string;
  branchId?: string;
}

export interface GeoPunchLocation {
  latitude: number;
  longitude: number;
  isWithinGeofence: boolean;
  distanceMeters: number;
  siteName?: string;
  allowedRadiusMeters?: number;
}

export interface DriverTripLog {
  id: string;
  driverEmployeeId: string;
  driverName: string;
  date: string;
  checkInTime: string;
  checkOutTime: string;
  transitHours: number;
  estimatedDistanceKm: number;
  transitAllowance: number;
  estimatedFuelLiters: number;
  branchId?: string;
  createdAt: string;
}

export interface JournalLineItem {
  accountCode: string;
  accountNameAr: string;
  debit: number;
  credit: number;
}

export interface PayrollJournalEntry {
  id: string;
  periodMonth: string; // YYYY-MM
  branchId?: string;
  branchName?: string;
  totalBasicSalaries: number;
  totalOvertimePay: number;
  totalNightBonus: number;
  totalAbsenceDeductions: number;
  totalLateDeductions: number;
  totalAdvanceRepayments: number;
  netPayrollPayable: number;
  entries: JournalLineItem[];
  createdAt: string;
  status: 'DRAFT' | 'POSTED';
}

export interface Employee {
  id: string;
  code: string;
  name: string;
  department: string;
  position: string;
  nationalId?: string;
  phone?: string;
  email?: string;
  hireDate: string;
  biometricId: string;
  status: 'ACTIVE' | 'INACTIVE';
  shiftId?: string;
  shiftName?: string;
  branchId?: string;
  isDriver?: boolean;
  basicSalary?: number;
  createdAt: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' | 'EARLY_EXIT';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  date: string; // YYYY-MM-DD
  checkIn?: string; // HH:mm:ss
  checkOut?: string; // HH:mm:ss
  lateMinutes: number;
  overtimeMinutes: number;
  nightBonusMinutes?: number;
  status: AttendanceStatus;
  exitReason?: string;
  notes?: string;
  deviceId?: string;
  shiftId?: string;
  shiftName?: string;
  branchId?: string;
  geoPunch?: GeoPunchLocation;
  isCrossMidnight?: boolean;
}

export interface ExitReasonRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  departureTime: string;
  returnTime?: string;
  reason: string;
  approvedBy: string;
  notes?: string;
  branchId?: string;
}

export interface BiometricDevice {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  location: string;
  status: 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'ERROR';
  lastSync: string;
  totalLogs: number;
  model: string;
  branchId?: string;
}

export type SeverityLevel = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
  severity: SeverityLevel;
  ipAddress?: string;
  branchId?: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: SeverityLevel;
  module: string;
  message: string;
  errorStack?: string;
  meta?: Record<string, any>;
  branchId?: string;
}

export type SubscriptionPlan = '1_MONTH' | '2_MONTHS' | '3_MONTHS' | '6_MONTHS' | '1_YEAR' | 'CUSTOM';

export type SubscriptionStatus = 'ACTIVE' | 'WARNING' | 'EXPIRED' | 'TAMPERED' | 'UNLICENSED';

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  planNameAr: string;
  companyName: string;
  licenseKey: string;
  activationDate: string;
  expirationDate: string;
  daysRemaining: number;
  maxDevices: number;
  maxEmployees: number;
  currentEmployeesCount?: number;
  currentDevicesCount?: number;
  hardwareId: string;
  tamperedReason?: string;
  lastCheckedTime?: string;
}

export interface BackupMetadata {
  id: string;
  timestamp: string;
  fileName: string;
  fileSize: string;
  tablesCount: {
    employees: number;
    attendance: number;
    exitReasons: number;
    devices: number;
    auditLogs: number;
    settings: number;
    branches?: number;
    essRequests?: number;
  };
  checksum: string;
  encrypted: boolean;
  note?: string;
}

export interface ScannedDocumentRecord {
  id: string;
  employeeId?: string;
  employeeName?: string;
  employeeCode?: string;
  category: 'VACATION' | 'SICK_LEAVE' | 'MISSION' | 'GENERAL';
  documentType: string;
  documentDate: string;
  startDate?: string;
  endDate?: string;
  daysOrHoursCount?: string;
  departureTime?: string;
  returnTime?: string;
  reasonOrDiagnosis: string;
  issuingAuthority?: string;
  referenceNumber?: string;
  approvedBy?: string;
  summary: string;
  fileName: string;
  mimeType: string;
  fileData?: string; // base64
  createdAt: string;
  linkedAttendanceId?: string;
  linkedExitReasonId?: string;
  branchId?: string;
}

export interface DatabaseTables {
  branches: Branch[];
  employees: Employee[];
  attendance: AttendanceRecord[];
  exitReasons: ExitReasonRecord[];
  essRequests: ESSRequest[];
  driverTripLogs: DriverTripLog[];
  payrollEntries: PayrollJournalEntry[];
  scannedDocuments: ScannedDocumentRecord[];
  devices: BiometricDevice[];
  shifts: WorkShift[];
  auditLogs: AuditLog[];
  systemLogs: SystemLog[];
  settings: SystemSettings;
  license: {
    licenseKey: string;
    lastKnownTime: string;
    tampered: boolean;
  };
}

export interface SystemSettings {
  companyName: string;
  workStartTime: string; // e.g. "08:00"
  workEndTime: string; // e.g. "16:00"
  gracePeriodMinutes: number; // e.g. 15
  autoBackupIntervalHours: number; // e.g. 24
  autoBackupEnabled: boolean;
  language: 'ar' | 'en';
  theme: 'light' | 'dark' | 'system';
  mainBranchLat?: number;
  mainBranchLng?: number;
  mainBranchRadiusMeters?: number;
  geofencingEnabled?: boolean;
  strictGeofenceBlock?: boolean;
  payrollIntegrationEnabled?: boolean;
  fleetIntegrationEnabled?: boolean;
  autoApproveGeoPunch?: boolean;
  encryptedEventsPipeline?: boolean;
  overtimeHourRateMultiplier?: number; // e.g. 1.5
  nightBonusRateMultiplier?: number; // e.g. 1.25
}
