import {
  Employee,
  AttendanceRecord,
  ExitReasonRecord,
  BiometricDevice,
  AuditLog,
  SystemLog,
  SystemSettings,
  ScannedDocumentRecord,
  WorkShift,
  Branch,
  ESSRequest,
  DriverTripLog,
  PayrollJournalEntry,
  DatabaseTables,
} from '../types';

const DB_STORAGE_KEY = 'as_solution_db_v1';
const DB_NAME = 'as_solution.db';

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'branch-main',
    code: 'BR-CAIRO-01',
    nameAr: 'المبنى الرئيسي - القاهرة',
    nameEn: 'Main HQ - Cairo',
    address: 'شارع التحرير، الدقي، القاهرة',
    latitude: 30.0444,
    longitude: 31.2357,
    radiusMeters: 200,
    isMain: true,
    isActive: true,
  },
  {
    id: 'branch-alex',
    code: 'BR-ALEX-02',
    nameAr: 'فرع الإسكندرية - سموحة',
    nameEn: 'Alexandria Branch - Smouha',
    address: 'شارع ألبير الأول، سموحة، الإسكندرية',
    latitude: 31.2156,
    longitude: 29.9553,
    radiusMeters: 150,
    isMain: false,
    isActive: true,
  },
  {
    id: 'branch-giza',
    code: 'BR-GIZA-03',
    nameAr: 'مركز التوزيع والحركة - الجيزة',
    nameEn: 'Logistics Center - Giza',
    address: 'المنطقة الصناعية، 6 أكتوبر، الجيزة',
    latitude: 29.9792,
    longitude: 30.9353,
    radiusMeters: 300,
    isMain: false,
    isActive: true,
  },
];

export const INITIAL_SHIFTS: WorkShift[] = [
  {
    id: 'shift-1',
    name: 'الوردية الصباحية (النهارية)',
    code: 'SHIFT-MORNING',
    type: 'MORNING',
    startTime: '08:00',
    endTime: '16:00',
    gracePeriodMinutes: 15,
    color: 'cyan',
    isDefault: true,
    isActive: true,
  },
  {
    id: 'shift-2',
    name: 'الوردية المسائية',
    code: 'SHIFT-EVENING',
    type: 'EVENING',
    startTime: '16:00',
    endTime: '00:00',
    gracePeriodMinutes: 15,
    color: 'amber',
    isDefault: false,
    isActive: true,
  },
  {
    id: 'shift-3',
    name: 'وردية الليل (الثالثة)',
    code: 'SHIFT-NIGHT',
    type: 'NIGHT',
    startTime: '00:00',
    endTime: '08:00',
    gracePeriodMinutes: 15,
    color: 'purple',
    isDefault: false,
    isActive: true,
  },
];

const DEFAULT_SETTINGS: SystemSettings = {
  companyName: 'مؤسسة الحلول المتقدمة البرمجية (AS Solution)',
  workStartTime: '08:00',
  workEndTime: '16:00',
  gracePeriodMinutes: 15,
  autoBackupIntervalHours: 24,
  autoBackupEnabled: true,
  language: 'ar',
  theme: 'light',
  mainBranchLat: 30.0444,
  mainBranchLng: 31.2357,
  mainBranchRadiusMeters: 200,
  overtimeHourRateMultiplier: 1.5,
  nightBonusRateMultiplier: 1.25,
};

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-101',
    code: '1001',
    name: 'أحمد محمود علي',
    department: 'تكنولوجيا المعلومات',
    position: 'مهندس برمجيات رئيسي',
    nationalId: '29801011234567',
    phone: '01012345678',
    email: 'ahmed.ali@assolution.com',
    hireDate: '2023-01-15',
    biometricId: '1001',
    status: 'ACTIVE',
    branchId: 'branch-main',
    basicSalary: 18000,
    createdAt: '2023-01-15T08:00:00Z',
  },
  {
    id: 'emp-102',
    code: '1002',
    name: 'سارة إبراهيم حسن',
    department: 'الموارد البشرية',
    position: 'مدير الموارد البشرية',
    nationalId: '29505121234568',
    phone: '01123456789',
    email: 'sara.ibrahim@assolution.com',
    hireDate: '2022-06-01',
    biometricId: '1002',
    status: 'ACTIVE',
    branchId: 'branch-main',
    basicSalary: 22000,
    createdAt: '2022-06-01T08:00:00Z',
  },
  {
    id: 'emp-103',
    code: '1003',
    name: 'محمد عبد الله مصطفى',
    department: 'الحسابات والمالية',
    position: 'محاسب أول',
    nationalId: '29108201234569',
    phone: '01234567890',
    email: 'm.abdallah@assolution.com',
    hireDate: '2023-03-10',
    biometricId: '1003',
    status: 'ACTIVE',
    branchId: 'branch-main',
    basicSalary: 15000,
    createdAt: '2023-03-10T08:00:00Z',
  },
  {
    id: 'emp-104',
    code: '1004',
    name: 'خالد عمر الشريف',
    department: 'قسم الحركة والأسطول',
    position: 'كبير سائقين نقل وسفريات',
    nationalId: '29711051234570',
    phone: '01543210987',
    email: 'khalid.omar@assolution.com',
    hireDate: '2023-09-01',
    biometricId: '1004',
    status: 'ACTIVE',
    branchId: 'branch-giza',
    isDriver: true,
    basicSalary: 11000,
    createdAt: '2023-09-01T08:00:00Z',
  },
  {
    id: 'emp-105',
    code: '1005',
    name: 'منى يوسف خليل',
    department: 'الدعم الفني والعمليات',
    position: 'أخصائي دعم أجهزة',
    nationalId: '29903151234571',
    phone: '01098765432',
    email: 'mona.youssef@assolution.com',
    hireDate: '2024-02-01',
    biometricId: '1005',
    status: 'ACTIVE',
    branchId: 'branch-alex',
    basicSalary: 12500,
    createdAt: '2024-02-01T08:00:00Z',
  },
];

const INITIAL_DEVICES: BiometricDevice[] = [
  {
    id: 'dev-1',
    name: 'جهاز المبنى الرئيسي - المدخل (ZK-Face-01)',
    ipAddress: '192.168.1.201',
    port: 4370,
    location: 'المدخل الرئيسي - الدور الأرضي',
    status: 'ONLINE',
    lastSync: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    totalLogs: 1420,
    model: 'ZKTeco SpeedFace-V5L',
    branchId: 'branch-main',
  },
  {
    id: 'dev-2',
    name: 'جهاز البصمة - قسم الموارد البشرية',
    ipAddress: '192.168.1.202',
    port: 4370,
    location: 'الدور الأول - الباب الخلفي',
    status: 'ONLINE',
    lastSync: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    totalLogs: 890,
    model: 'ZKTeco K40 Fingerprint',
    branchId: 'branch-main',
  },
  {
    id: 'dev-3',
    name: 'جهاز فرع الإسكندرية - المدخل',
    ipAddress: '10.0.0.50',
    port: 4370,
    location: 'فرع سموحة - الإسكندرية',
    status: 'OFFLINE',
    lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    totalLogs: 450,
    model: 'Hikvision DS-K1T341AM',
    branchId: 'branch-alex',
  },
];

const getTodayString = (daysOffset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-101',
    employeeId: 'emp-101',
    employeeCode: '1001',
    employeeName: 'أحمد محمود علي',
    department: 'تكنولوجيا المعلومات',
    date: getTodayString(0),
    checkIn: '07:52:10',
    checkOut: '16:05:30',
    lateMinutes: 0,
    overtimeMinutes: 5,
    status: 'PRESENT',
    deviceId: 'dev-1',
    branchId: 'branch-main',
  },
  {
    id: 'att-102',
    employeeId: 'emp-102',
    employeeCode: '1002',
    employeeName: 'سارة إبراهيم حسن',
    department: 'الموارد البشرية',
    date: getTodayString(0),
    checkIn: '08:22:45',
    checkOut: undefined,
    lateMinutes: 22,
    overtimeMinutes: 0,
    status: 'LATE',
    notes: 'تأخير بسبب ازدحام المرور',
    deviceId: 'dev-2',
    branchId: 'branch-main',
  },
  {
    id: 'att-103',
    employeeId: 'emp-103',
    employeeCode: '1003',
    employeeName: 'محمد عبد الله مصطفى',
    department: 'الحسابات والمالية',
    date: getTodayString(0),
    checkIn: '08:00:00',
    checkOut: '16:00:00',
    lateMinutes: 0,
    overtimeMinutes: 0,
    status: 'PRESENT',
    deviceId: 'dev-1',
    branchId: 'branch-main',
  },
  {
    id: 'att-104',
    employeeId: 'emp-104',
    employeeCode: '1004',
    employeeName: 'خالد عمر الشريف',
    department: 'قسم الحركة والأسطول',
    date: getTodayString(0),
    checkIn: '08:10:00',
    checkOut: '17:30:00',
    lateMinutes: 0,
    overtimeMinutes: 90,
    status: 'PRESENT',
    deviceId: 'dev-1',
    branchId: 'branch-giza',
  },
  {
    id: 'att-105',
    employeeId: 'emp-105',
    employeeCode: '1005',
    employeeName: 'منى يوسف خليل',
    department: 'الدعم الفني والعمليات',
    date: getTodayString(0),
    checkIn: undefined,
    checkOut: undefined,
    lateMinutes: 0,
    overtimeMinutes: 0,
    status: 'ABSENT',
    notes: 'غيب بدون إذن مسبق',
    branchId: 'branch-alex',
  },
];

const INITIAL_ESS_REQUESTS: ESSRequest[] = [
  {
    id: 'ess-1',
    employeeId: 'emp-102',
    employeeName: 'سارة إبراهيم حسن',
    employeeCode: '1002',
    type: 'VACATION',
    startDate: getTodayString(2),
    endDate: getTodayString(4),
    reason: 'إجازة اعتيادية سنوية لمرافقة عائلة',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    branchId: 'branch-main',
  },
  {
    id: 'ess-2',
    employeeId: 'emp-101',
    employeeName: 'أحمد محمود علي',
    employeeCode: '1001',
    type: 'ADVANCE',
    startDate: getTodayString(0),
    amount: 3000,
    reason: 'طلب سلفة مالية طارئة مخصومة من مرتب الشهر القادم',
    status: 'APPROVED',
    approvedBy: 'مدير النظام الرئيسي',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    branchId: 'branch-main',
  },
];

class SQLiteAdapter {
  private dbName: string = DB_NAME;

  constructor() {
    this.initDatabase();
  }

  public getDbName(): string {
    return this.dbName;
  }

  private initDatabase(): void {
    const raw = localStorage.getItem(DB_STORAGE_KEY);
    if (!raw) {
      const initialDb: DatabaseTables = {
        branches: INITIAL_BRANCHES,
        employees: INITIAL_EMPLOYEES,
        attendance: INITIAL_ATTENDANCE,
        exitReasons: [
          {
            id: 'ex-1',
            employeeId: 'emp-104',
            employeeName: 'خالد عمر الشريف',
            date: getTodayString(0),
            departureTime: '14:30',
            returnTime: undefined,
            reason: 'زيارة موقع عميل شركة النور',
            approvedBy: 'سارة إبراهيم حسن',
            notes: 'إذن خروج رسمي معتمد',
            branchId: 'branch-giza',
          },
        ],
        essRequests: INITIAL_ESS_REQUESTS,
        driverTripLogs: [],
        payrollEntries: [],
        scannedDocuments: [],
        devices: INITIAL_DEVICES,
        shifts: INITIAL_SHIFTS,
        auditLogs: [
          {
            id: 'audit-1',
            timestamp: new Date().toISOString(),
            userId: 'usr-admin',
            userName: 'مدير النظام الرئيسي',
            action: 'INITIALIZE_SYSTEM',
            module: 'SYSTEM',
            details: 'تم تهيئة وتسهيل ملف قاعدة البيانات as_solution.db بنجاح',
            severity: 'INFO',
            ipAddress: '127.0.0.1',
          },
        ],
        systemLogs: [
          {
            id: 'syslog-1',
            timestamp: new Date().toISOString(),
            level: 'INFO',
            module: 'DATABASE',
            message: 'Database initialized successfully: as_solution.db',
          },
        ],
        settings: DEFAULT_SETTINGS,
        license: {
          licenseKey: '',
          lastKnownTime: new Date().toISOString(),
          tampered: false,
        },
      };
      this.saveDatabase(initialDb);
    }
  }

  public getDatabase(): DatabaseTables {
    const raw = localStorage.getItem(DB_STORAGE_KEY);
    if (!raw) {
      this.initDatabase();
      return JSON.parse(localStorage.getItem(DB_STORAGE_KEY)!);
    }
    try {
      const parsed: DatabaseTables = JSON.parse(raw);
      let modified = false;

      // Schema patch fallbacks for new tables
      if (!parsed.branches || parsed.branches.length === 0) {
        parsed.branches = INITIAL_BRANCHES;
        modified = true;
      }
      if (!parsed.essRequests) {
        parsed.essRequests = INITIAL_ESS_REQUESTS;
        modified = true;
      }
      if (!parsed.driverTripLogs) {
        parsed.driverTripLogs = [];
        modified = true;
      }
      if (!parsed.payrollEntries) {
        parsed.payrollEntries = [];
        modified = true;
      }
      if (!parsed.scannedDocuments) {
        parsed.scannedDocuments = [];
        modified = true;
      }

      if (modified) {
        this.saveDatabase(parsed);
      }
      return parsed;
    } catch (e) {
      console.error('Failed to parse database, re-initializing', e);
      this.initDatabase();
      return JSON.parse(localStorage.getItem(DB_STORAGE_KEY)!);
    }
  }

  public saveDatabase(data: DatabaseTables): void {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(data));
  }

  // Generic collection operations
  public getTable<K extends keyof DatabaseTables>(tableName: K): DatabaseTables[K] {
    const db = this.getDatabase();
    return db[tableName];
  }

  public updateTable<K extends keyof DatabaseTables>(tableName: K, data: DatabaseTables[K]): void {
    const db = this.getDatabase();
    db[tableName] = data;
    this.saveDatabase(db);
  }

  public resetToDefaults(): void {
    localStorage.removeItem(DB_STORAGE_KEY);
    this.initDatabase();
  }

  public getDatabaseSizeInBytes(): number {
    const raw = localStorage.getItem(DB_STORAGE_KEY) || '';
    return new Blob([raw]).size;
  }
}

export const sqliteAdapter = new SQLiteAdapter();
