export type Language = 'ar' | 'en';

export interface Translations {
  // General & App Info
  appName: string;
  appSubtitle: string;
  companyName: string;
  systemVersion: string;

  // Language selector
  languageName: string;

  // Navigation
  navDashboard: string;
  navAttendance: string;
  navScannedDocs: string;
  navEmployees: string;
  navDevices: string;
  navReports: string;
  navAudit: string;
  navSettings: string;

  // Header
  scannerButton: string;
  exitReasonButton: string;
  manualLogButton: string;
  roleAdmin: string;
  roleHR: string;
  roleSecurity: string;
  roleManager: string;
  roleUser: string;
  logoutTooltip: string;

  // Common Actions & Badges
  add: string;
  edit: string;
  delete: string;
  cancel: string;
  save: string;
  close: string;
  search: string;
  filter: string;
  export: string;
  refresh: string;
  preview: string;
  attachDoc: string;
  scanDoc: string;
  history: string;
  status: string;
  active: string;
  inactive: string;
  all: string;
  allDepartments: string;
  allStatuses: string;
  actions: string;
  noData: string;
  confirmDelete: string;

  // Employees View
  addNewEmployee: string;
  searchEmployeePlaceholder: string;
  employeeId: string;
  employeeName: string;
  department: string;
  jobTitle: string;
  phone: string;
  email: string;
  nationalId: string;
  hireDate: string;
  fingerprintId: string;

  // Attendance View
  attendanceRecords: string;
  dateFrom: string;
  dateTo: string;
  checkIn: string;
  checkOut: string;
  lateMinutes: string;
  overtimeMinutes: string;
  present: string;
  absent: string;
  late: string;
  earlyExit: string;
  notesAndExcuses: string;

  // Scanner & Scanned Docs View
  documentScannerTitle: string;
  documentScannerSubtitle: string;
  ocrArchiveTitle: string;
  dragDropText: string;
  uploadFile: string;
  useCamera: string;
  documentType: string;
  documentNumber: string;
  documentDate: string;
  extractedText: string;
  extractedSummary: string;
  confidenceScore: string;
  linkedEmployee: string;
  sickLeave: string;
  vacationRequest: string;
  officialMission: string;
  exitPermit: string;
  generalDoc: string;
  saveDocumentRecord: string;

  // Employee Details Modal
  tabAttendanceHistory: string;
  tabScannedDocs: string;
  tabPersonalInfo: string;
  scannedDocsArchive: string;
  noDocsFound: string;
  totalPresentDays: string;
  totalAbsentDays: string;
  totalLateMinutes: string;

  // License & Subscription
  subscriptionStatus: string;
  expiresIn: string;
  daysRemaining: string;
  manageLicense: string;

  // Form & Modal Shared Labels
  selectEmployee: string;
  selectEmployeePrompt: string;
  movementType: string;
  timeHHMM: string;
  saveManualLog: string;
  manualLogTitle: string;
  manualLogSubtitle: string;
  departureTime: string;
  returnTime: string;
  exitReasonTitle: string;
  exitReasonSubtitle: string;
  exitReasonLabel: string;
  exitReasonPlaceholder: string;
  additionalNotes: string;
  approveAndSavePermit: string;
  employeeFormTitleAdd: string;
  employeeFormTitleEdit: string;
  employeeFormSubtitle: string;
  fullName: string;
  fullNamePlaceholder: string;
  positionPlaceholder: string;
  serviceStatus: string;
  activeOnDuty: string;
  inactiveResigned: string;
  saveEmployee: string;
  licenseKeyInputLabel: string;
  activateKey: string;
  activateAndReturn: string;
  systemLockedTampered: string;
  subscriptionExpiredAlert: string;
  hardwareSignature: string;
  dbStatus: string;
  dbSecured: string;
  techSupport: string;
  licenseManagementTitle: string;
  licenseManagementSubtitle: string;
  subscriptionPlan: string;
  activeAndStable: string;
  approachingExpiry: string;
  expiredOrLocked: string;
  activationDate: string;
  expirationDate: string;
  adminGeneratorTitle: string;
  adminGeneratorSubtitle: string;
  companyNameLabel: string;
  planSelectLabel: string;
  customDaysLabel: string;
  hardwareBindingLabel: string;
  maxEmployeesLabel: string;
  maxDevicesLabel: string;
  generateKeyNow: string;
  generatedKeyTitle: string;
  copyToClipboard: string;
  copied: string;
  adminGeneratorButton: string;
  reasonOrDiagnosis: string;
  issuingAuthority: string;
  referenceNumber: string;
  vacation: string;
  mission: string;
  general: string;

  // Reports View
  reportTabCompany: string;
  reportTabAllEmployees: string;
  reportTabIndividual: string;
  selectEmployeeReport: string;
  attendanceRate: string;
  onTimeRate: string;
  printOfficialReport: string;
  exportCSV: string;
  exportJSON: string;
  departmentSummary: string;
  totalEmployees: string;
  activeEmployees: string;
  absentDays: string;
  totalLateHours: string;
  totalOvertimeHours: string;
  exitPermitsCount: string;

  // Shifts
  shiftsManagement: string;
  shiftName: string;
  shiftCode: string;
  shiftType: string;
  shiftStartTime: string;
  shiftEndTime: string;
  shiftGracePeriod: string;
  shiftPresets: string;
  presetSingle: string;
  presetDouble: string;
  presetTriple: string;
  presetCustom: string;
  addNewShift: string;
  editShift: string;
  deleteShift: string;
  selectShift: string;
  assignedShift: string;
  allShifts: string;
  shiftMorning: string;
  shiftEvening: string;
  shiftNight: string;
  shiftCustom: string;
  noShiftAssigned: string;
}

export const translations: Record<Language, Translations> = {
  ar: {
    appName: 'أيه إس سوليوشن',
    appSubtitle: 'مؤسسة أيه إس للحلول البرمجية - نظام إدارة الموظفين والأجهزة الحيوية',
    companyName: 'مؤسسة الحلول المتقدمة البرمجية (AS Solution)',
    systemVersion: 'إصدار النظام v2.5.0 Clean Architecture',

    languageName: 'العربية',

    navDashboard: 'لوحة التحكم الرئيسية',
    navAttendance: 'سجلات الحضور والانصراف',
    navScannedDocs: 'الماسح الضوئي والأرشيف',
    navEmployees: 'إدارة الموظفين',
    navDevices: 'أجهزة البصمة والربط',
    navReports: 'التقارير والإحصائيات',
    navAudit: 'سجل التدقيق والربط',
    navSettings: 'الإعدادات والنسخ الاحتياطي',

    scannerButton: 'الماسح الضوئي (OCR)',
    exitReasonButton: 'تسجيل إذن خروج',
    manualLogButton: 'تسجيل حضور يدوياً',
    roleAdmin: 'مدير النظام',
    roleHR: 'إدارة HR',
    roleSecurity: 'مسؤول الأجهزة',
    roleManager: 'مدير قسم',
    roleUser: 'مستخدم',
    logoutTooltip: 'تسجيل الخروج',

    add: 'إضافة',
    edit: 'تعديل',
    delete: 'حذف',
    cancel: 'إلغاء',
    save: 'حفظ',
    close: 'إغلاق',
    search: 'بحث...',
    filter: 'تصفية',
    export: 'تصدير',
    refresh: 'تحديث',
    preview: 'معاينة',
    attachDoc: 'إرفاق مستند',
    scanDoc: 'مسح مستند',
    history: 'السجل',
    status: 'الحالة',
    active: 'نشط',
    inactive: 'غير نشط',
    all: 'الكل',
    allDepartments: 'جميع الأقسام',
    allStatuses: 'جميع الحالات',
    actions: 'الإجراءات',
    noData: 'لا توجد بيانات للعرض',
    confirmDelete: 'هل أنت تأكد من رغبتك في الحذف؟',

    addNewEmployee: 'إضافة موظف جديد',
    searchEmployeePlaceholder: 'ابحث بالاسم، الكود، القسم، أو الهاتف...',
    employeeId: 'كود الموظف',
    employeeName: 'اسم الموظف',
    department: 'القسم',
    jobTitle: 'المسمى الوظيفي',
    phone: 'رقم الهاتف',
    email: 'البريد الإلكتروني',
    nationalId: 'الرقم القومي / الهوية',
    hireDate: 'تاريخ التعيين',
    fingerprintId: 'رقم البصمة',

    attendanceRecords: 'سجلات الحضور والانصراف',
    dateFrom: 'من تاريخ',
    dateTo: 'إلى تاريخ',
    checkIn: 'وقت الحضور',
    checkOut: 'وقت الانصراف',
    lateMinutes: 'التأخير (دقيقة)',
    overtimeMinutes: 'الإضافي (دقيقة)',
    present: 'حاضر',
    absent: 'غائب',
    late: 'متأخر',
    earlyExit: 'خروج مبكر',
    notesAndExcuses: 'ملاحظات / أعذار',

    documentScannerTitle: 'الماسح الضوئي والتعرف الآلي على النصوص (OCR)',
    documentScannerSubtitle: 'سحب صورة الإجازة الطبية أو إذن الخروج واستخراج البيانات تلقائياً',
    ocrArchiveTitle: 'أرشيف المستندات الممسوحة ضوئياً',
    dragDropText: 'اسحب صورة المستند واسقطها هنا أو انقر للاختيار',
    uploadFile: 'رفع صورة',
    useCamera: 'التقاط بالكاميرا',
    documentType: 'نوع المستند',
    documentNumber: 'رقم المستند / السند',
    documentDate: 'تاريخ المستند',
    extractedText: 'النص المستخرج بالكامل',
    extractedSummary: 'البيانات المستخرجة ذكياً',
    confidenceScore: 'دقة الاستخراج (OCR)',
    linkedEmployee: 'الموظف المرتبط بالمستند',
    sickLeave: 'إجازة مرضية',
    vacationRequest: 'طلب إجازة',
    officialMission: 'مأمورية رسمية',
    exitPermit: 'إذن خروج',
    generalDoc: 'مستند عام',
    saveDocumentRecord: 'حفظ المستند في الأرشيف',

    tabAttendanceHistory: 'سجل الحضور والغياب',
    tabScannedDocs: 'المستندات والأعذار الممسوحة',
    tabPersonalInfo: 'البيانات الشخصية والوظيفية',
    scannedDocsArchive: 'أرشيف المستندات والتقارير الطبية الممسوحة ضوئياً',
    noDocsFound: 'لا توجد مستندات مسجلة حتى الآن',
    totalPresentDays: 'أيام الحضور',
    totalAbsentDays: 'أيام الغياب',
    totalLateMinutes: 'إجمالي التأخير',

    subscriptionStatus: 'حالة الاشتراك',
    expiresIn: 'ينتهي في',
    daysRemaining: 'المتبقي',
    manageLicense: 'إدارة الترخيص والمفاتيح',

    selectEmployee: 'اختر الموظف',
    selectEmployeePrompt: '-- اختر موظف من القائمة --',
    movementType: 'نوع الحركة',
    timeHHMM: 'الوقت (ساعة:دقيقة)',
    saveManualLog: 'حفظ الحركة اليدوية',
    manualLogTitle: 'تسجيل حضور أو انصراف يدوي',
    manualLogSubtitle: 'إدخال سجل بصمة يدوية في حالة أخطاء الأجهزة أو الأعذار الرسمية',
    departureTime: 'وقت المغادرة / الخروج',
    returnTime: 'وقت العودة / الانصراف',
    exitReasonTitle: 'تسجيل إذن خروج مبكر أو مأمورية',
    exitReasonSubtitle: 'تسجيل الأسباب والأعذار الرسمية للخروج أثناء ساعات العمل',
    exitReasonLabel: 'سبب الخروج / المأمورية',
    exitReasonPlaceholder: 'مثال: مأمورية خارجية لجهة حكومية / إذن شرفي طبي',
    additionalNotes: 'ملاحظات إضافية (اختياري)',
    approveAndSavePermit: 'اعتماد وحفظ الإذن',
    employeeFormTitleAdd: 'إضافة موظف جديد',
    employeeFormTitleEdit: 'تعديل بيانات موظف',
    employeeFormSubtitle: 'أدخل البيانات الوظيفية ورقم جهاز البصمة المرتبط',
    fullName: 'الاسم بالكامل',
    fullNamePlaceholder: 'مثال: محمود أحمد عبد القادر',
    positionPlaceholder: 'مثال: محاسب أول',
    serviceStatus: 'حالة الخدمة',
    activeOnDuty: 'على رأس العمل (نشط)',
    inactiveResigned: 'غير نشط (مستقيل/موقوف)',
    saveEmployee: 'حفظ الموظف',
    licenseKeyInputLabel: 'إدخال مفتاح التفعيل الجديد (License Key)',
    activateKey: 'تفعيل المفتاح',
    activateAndReturn: 'تفعيل والرجوع للبرنامج',
    systemLockedTampered: 'تم قفل النظام: اكتشاف تلاعب بساعة الجهاز',
    subscriptionExpiredAlert: 'تنبيه: انتهت فترة ترخيص واستخدام البرنامج',
    hardwareSignature: 'معرف العتاد الخاص بك (Hardware Signature)',
    dbStatus: 'الحالة الحالية لقاعدة البيانات',
    dbSecured: 'محفوظة وآمنة بالكامل (as_solution.db)',
    techSupport: 'الدعم الفني والخدمات',
    licenseManagementTitle: 'إدارة اشتراك وترخيص النظام',
    licenseManagementSubtitle: 'تفعيل مفتاح الترخيص ومتابعة مدة الصلاحية وتفاصيل الاشتراك',
    subscriptionPlan: 'باقة الاشتراك',
    activeAndStable: 'اشتراك نشط ومستقر',
    approachingExpiry: 'يقترب من الانتهاء',
    expiredOrLocked: 'اشتراك منتهي/مقفل',
    activationDate: 'تاريخ التفعيل',
    expirationDate: 'تاريخ الانتهاء',
    adminGeneratorTitle: 'أداة مولّد المفاتيح والاشتراكات (Admin Generator)',
    adminGeneratorSubtitle: 'توليد مفاتيح ترخيص مشفرة وموقعة رقمياً للعملاء الجدد مع حماية من التلاعب',
    companyNameLabel: 'اسم شركة / مؤسسة العميل',
    planSelectLabel: 'خطة الاشتراك (Plan)',
    customDaysLabel: 'عدد الأيام المخصصة',
    hardwareBindingLabel: 'ربط الجهاز (Hardware Binding)',
    maxEmployeesLabel: 'الحد الأقصى للموظفين',
    maxDevicesLabel: 'الحد الأقصى للأجهزة',
    generateKeyNow: 'توليد مفتاح الترخيص الآن',
    generatedKeyTitle: 'المفتاح المولد (قم بنسخه وإرساله للعميل):',
    copyToClipboard: 'نسخ المفتاح للحافظة',
    copied: 'تم نسخ المفتاح للحافظة!',
    adminGeneratorButton: 'مولّد مفاتيح الترخيص (Admin Generator)',
    reasonOrDiagnosis: 'سبب الخروج / التشخيص / التفاصيل',
    issuingAuthority: 'الجهة المصدرة',
    referenceNumber: 'رقم المرجع / المسلسل',
    vacation: 'إجازة اعتيادية',
    mission: 'مأمورية رسمية',
    general: 'عام',

    reportTabCompany: 'تقرير الشركة الشامل',
    reportTabAllEmployees: 'تقرير جميع العاملين',
    reportTabIndividual: 'تقرير موظف على حدة',
    selectEmployeeReport: 'اختر الموظف لعرض تقريره',
    attendanceRate: 'نسبة الالتزام بالحضور',
    onTimeRate: 'نسبة الانضباط بالموعد',
    printOfficialReport: 'طباعة تقرير رسمي',
    exportCSV: 'تصدير CSV / Excel',
    exportJSON: 'تصدير JSON',
    departmentSummary: 'ملخص الأقسام والإدارات',
    totalEmployees: 'إجمالي العاملين',
    activeEmployees: 'العاملين النشطين',
    absentDays: 'أيام الغياب',
    totalLateHours: 'ساعات التأخير',
    totalOvertimeHours: 'ساعات الإضافي',
    exitPermitsCount: 'أذونات الخروج',

    shiftsManagement: 'إدارة وتخصيص الورادي',
    shiftName: 'اسم الوردية',
    shiftCode: 'كود الوردية',
    shiftType: 'نوع الوردية',
    shiftStartTime: 'وقت الحضور (البداية)',
    shiftEndTime: 'وقت الانصراف (النهاية)',
    shiftGracePeriod: 'فترة السماح (بالدقائق)',
    shiftPresets: 'الأنظمة والأنماط الجاهزة للورادي',
    presetSingle: 'وردية واحدة (صباحية 08:00 - 16:00)',
    presetDouble: 'نظام ورديتين (نهاري ومسائي)',
    presetTriple: 'نظام 3 ورادي (صباحي، مسائي، وليل)',
    presetCustom: 'ورادي مخصصة بالكامل',
    addNewShift: 'إضافة وردية جديدة',
    editShift: 'تعديل الوردية',
    deleteShift: 'حذف الوردية',
    selectShift: 'اختر الوردية',
    assignedShift: 'الوردية المخصصة',
    allShifts: 'جميع الورادي',
    shiftMorning: 'وردية نهارية (صباحية)',
    shiftEvening: 'وردية مسائية',
    shiftNight: 'وردية ليلية (الثالثة)',
    shiftCustom: 'وردية مخصصة',
    noShiftAssigned: 'غير محدد وردية (قياسي)',
  },

  en: {
    appName: 'AS Solution',
    appSubtitle: 'AS Software Solutions - Employee & Biometric Management System',
    companyName: 'Advanced Software Solutions (AS Solution)',
    systemVersion: 'System Version v2.5.0 Clean Architecture',

    languageName: 'English',

    navDashboard: 'Dashboard',
    navAttendance: 'Attendance Records',
    navScannedDocs: 'Scanner & Archive',
    navEmployees: 'Employees',
    navDevices: 'Biometric Devices',
    navReports: 'Reports & Analytics',
    navAudit: 'Audit Logs & Integration',
    navSettings: 'Settings & Backups',

    scannerButton: 'Document Scanner (OCR)',
    exitReasonButton: 'Record Exit Permit',
    manualLogButton: 'Manual Clock-In',
    roleAdmin: 'System Admin',
    roleHR: 'HR Admin',
    roleSecurity: 'Device Admin',
    roleManager: 'Department Manager',
    roleUser: 'User',
    logoutTooltip: 'Logout',

    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save',
    close: 'Close',
    search: 'Search...',
    filter: 'Filter',
    export: 'Export',
    refresh: 'Refresh',
    preview: 'Preview',
    attachDoc: 'Attach Doc',
    scanDoc: 'Scan Document',
    history: 'History',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    all: 'All',
    allDepartments: 'All Departments',
    allStatuses: 'All Statuses',
    actions: 'Actions',
    noData: 'No records available',
    confirmDelete: 'Are you sure you want to delete this item?',

    addNewEmployee: 'Add New Employee',
    searchEmployeePlaceholder: 'Search by name, ID, department, or phone...',
    employeeId: 'Employee ID',
    employeeName: 'Employee Name',
    department: 'Department',
    jobTitle: 'Job Title',
    phone: 'Phone Number',
    email: 'Email',
    nationalId: 'National ID',
    hireDate: 'Hire Date',
    fingerprintId: 'Biometric ID',

    attendanceRecords: 'Attendance & Time Logs',
    dateFrom: 'From Date',
    dateTo: 'To Date',
    checkIn: 'Check-In Time',
    checkOut: 'Check-Out Time',
    lateMinutes: 'Late (min)',
    overtimeMinutes: 'Overtime (min)',
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    earlyExit: 'Early Leave',
    notesAndExcuses: 'Notes / Excuses',

    documentScannerTitle: 'Optical Character Recognition (OCR) Scanner',
    documentScannerSubtitle: 'Scan sick leave medical notes or exit permits and extract data automatically',
    ocrArchiveTitle: 'Scanned Document Archive',
    dragDropText: 'Drag and drop document image here or click to select',
    uploadFile: 'Upload Image',
    useCamera: 'Capture Camera',
    documentType: 'Document Type',
    documentNumber: 'Doc Reference #',
    documentDate: 'Document Date',
    extractedText: 'Extracted OCR Text',
    extractedSummary: 'Smart Extracted Analysis',
    confidenceScore: 'OCR Accuracy',
    linkedEmployee: 'Linked Employee',
    sickLeave: 'Sick Leave Note',
    vacationRequest: 'Vacation Request',
    officialMission: 'Official Duty',
    exitPermit: 'Exit Permit',
    generalDoc: 'General Document',
    saveDocumentRecord: 'Save Record to Archive',

    tabAttendanceHistory: 'Attendance History',
    tabScannedDocs: 'Scanned Documents & Notes',
    tabPersonalInfo: 'Personal & Job Info',
    scannedDocsArchive: 'Scanned Medical Notes & Document Archive',
    noDocsFound: 'No scanned documents recorded yet',
    totalPresentDays: 'Days Present',
    totalAbsentDays: 'Days Absent',
    totalLateMinutes: 'Total Late (Mins)',

    subscriptionStatus: 'Subscription Status',
    expiresIn: 'Expires On',
    daysRemaining: 'Remaining',
    manageLicense: 'Manage License & Keys',

    selectEmployee: 'Select Employee',
    selectEmployeePrompt: '-- Select employee from list --',
    movementType: 'Movement Type',
    timeHHMM: 'Time (HH:MM)',
    saveManualLog: 'Save Manual Punch',
    manualLogTitle: 'Manual Clock-In / Clock-Out',
    manualLogSubtitle: 'Enter manual punch log for hardware issues or official excuses',
    departureTime: 'Departure Time',
    returnTime: 'Return Time',
    exitReasonTitle: 'Record Early Exit or Mission',
    exitReasonSubtitle: 'Log official excuses and reasons for leaving during work hours',
    exitReasonLabel: 'Exit Reason / Mission',
    exitReasonPlaceholder: 'e.g. External government mission / Medical permit',
    additionalNotes: 'Additional Notes (Optional)',
    approveAndSavePermit: 'Approve & Save Permit',
    employeeFormTitleAdd: 'Add New Employee',
    employeeFormTitleEdit: 'Edit Employee Details',
    employeeFormSubtitle: 'Enter employment details and linked biometric device ID',
    fullName: 'Full Name',
    fullNamePlaceholder: 'e.g. John Smith',
    positionPlaceholder: 'e.g. Senior Accountant',
    serviceStatus: 'Service Status',
    activeOnDuty: 'Active On Duty',
    inactiveResigned: 'Inactive (Resigned/Suspended)',
    saveEmployee: 'Save Employee',
    licenseKeyInputLabel: 'Enter New License Key',
    activateKey: 'Activate Key',
    activateAndReturn: 'Activate & Return to App',
    systemLockedTampered: 'System Locked: Device Clock Tampering Detected',
    subscriptionExpiredAlert: 'Alert: Subscription & License Period Has Expired',
    hardwareSignature: 'Hardware Signature',
    dbStatus: 'Current Database Status',
    dbSecured: 'Fully Secured & Saved (as_solution.db)',
    techSupport: 'Technical Support & Services',
    licenseManagementTitle: 'Manage License & Subscription',
    licenseManagementSubtitle: 'Activate license key and monitor validity period & details',
    subscriptionPlan: 'Subscription Plan',
    activeAndStable: 'Active & Stable Subscription',
    approachingExpiry: 'Approaching Expiry',
    expiredOrLocked: 'Expired / Locked Subscription',
    activationDate: 'Activation Date',
    expirationDate: 'Expiration Date',
    adminGeneratorTitle: 'License Key Generator (Admin Tool)',
    adminGeneratorSubtitle: 'Generate digitally signed encrypted license keys for clients',
    companyNameLabel: 'Client Company / Organization Name',
    planSelectLabel: 'Subscription Plan',
    customDaysLabel: 'Custom Days',
    hardwareBindingLabel: 'Hardware Binding',
    maxEmployeesLabel: 'Max Employees',
    maxDevicesLabel: 'Max Devices',
    generateKeyNow: 'Generate License Key Now',
    generatedKeyTitle: 'Generated Key (Copy and send to client):',
    copyToClipboard: 'Copy Key to Clipboard',
    copied: 'Copied to Clipboard!',
    adminGeneratorButton: 'License Key Generator',
    reasonOrDiagnosis: 'Reason / Medical Diagnosis / Details',
    issuingAuthority: 'Issuing Authority',
    referenceNumber: 'Reference / Serial Number',
    vacation: 'Vacation',
    mission: 'Official Mission',
    general: 'General',

    reportTabCompany: 'Company Executive Report',
    reportTabAllEmployees: 'All Employees Report',
    reportTabIndividual: 'Individual Employee Report',
    selectEmployeeReport: 'Select Employee to View Report',
    attendanceRate: 'Attendance Rate',
    onTimeRate: 'On-Time Rate',
    printOfficialReport: 'Print Official Report',
    exportCSV: 'Export CSV / Excel',
    exportJSON: 'Export JSON',
    departmentSummary: 'Department Summary',
    totalEmployees: 'Total Workforce',
    activeEmployees: 'Active Staff',
    absentDays: 'Absent Days',
    totalLateHours: 'Late Hours',
    totalOvertimeHours: 'Overtime Hours',
    exitPermitsCount: 'Exit Permits',

    shiftsManagement: 'Shift System & Configuration',
    shiftName: 'Shift Name',
    shiftCode: 'Shift Code',
    shiftType: 'Shift Type',
    shiftStartTime: 'Shift Start Time',
    shiftEndTime: 'Shift End Time',
    shiftGracePeriod: 'Grace Period (mins)',
    shiftPresets: 'Shift System Presets',
    presetSingle: 'Single Shift (08:00 - 16:00)',
    presetDouble: 'Double Shifts (Day & Night)',
    presetTriple: 'Triple Shifts (Morning, Evening & Night)',
    presetCustom: 'Custom Shifts',
    addNewShift: 'Add New Shift',
    editShift: 'Edit Shift',
    deleteShift: 'Delete Shift',
    selectShift: 'Select Shift',
    assignedShift: 'Assigned Shift',
    allShifts: 'All Shifts',
    shiftMorning: 'Morning / Day Shift',
    shiftEvening: 'Evening Shift',
    shiftNight: 'Night Shift',
    shiftCustom: 'Custom Shift',
    noShiftAssigned: 'Standard / Default Shift',
  },
};
