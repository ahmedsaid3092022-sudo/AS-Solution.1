import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Database,
  Download,
  Upload,
  ShieldCheck,
  HardDrive,
  Clock,
  Building,
  Key,
  Check,
  Palette,
  Sun,
  Moon,
  Laptop,
  Cpu,
  RefreshCw,
  AlertTriangle,
  Zap,
  Sparkles,
  Server,
  Activity,
  CheckCircle2,
  Sliders,
  Radio,
  FileCheck2,
  Lock,
  Unlock,
  Wrench,
  MapPin,
  Navigation,
  Crosshair,
  Link2,
  Share2,
  ShieldAlert,
  Plus,
  Trash2,
  Edit,
  Globe,
  Copy,
  QrCode,
  Users
} from 'lucide-react';
import { sqliteAdapter } from '../../db/sqliteAdapter';
import { backupService } from '../../services/backupService';
import { deviceService } from '../../services/deviceService';
import { subscriptionService } from '../../services/subscriptionService';
import { platformService } from '../../services/platformService';
import { moduleBridgeService } from '../../services/moduleBridgeService';
import { SystemSettings, BackupMetadata, Branch } from '../../types';
import { loggerService } from '../../services/loggerService';
import { useThemeStore, ACCENT_COLORS, ThemeMode, AccentColor } from '../../stores/useThemeStore';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';
import { useLanguageStore } from '../../stores/useLanguageStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useBranchStore } from '../../stores/useBranchStore';
import { AdminKeyGeneratorModal } from '../forms/AdminKeyGeneratorModal';

type SettingsTab =
  | 'license'
  | 'geofencing'
  | 'integration'
  | 'branches'
  | 'system'
  | 'themes'
  | 'database'
  | 'devices';

interface SettingsViewProps {
  onOpenLicenseModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenLicenseModal }) => {
  const { t, isRtl } = useLanguageStore();
  const { mode, accent, accentConfig, setMode, setAccent } = useThemeStore();
  const { subscriptionInfo, refreshSubscription, activateLicenseKey } = useSubscriptionStore();
  const { settings, updateSettings } = useSettingsStore();
  const { branches, addBranch, updateBranch, deleteBranch, setActiveBranchId } = useBranchStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('license');
  const [showAdminGenerator, setShowAdminGenerator] = useState(false);
  const [copiedHw, setCopiedHw] = useState(false);

  // Local state copy for system & geofence form
  const [localSettings, setLocalSettings] = useState<SystemSettings>({ ...settings });

  // Multi-Branch Add/Edit Form State
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchForm, setBranchForm] = useState<Omit<Branch, 'id'>>({
    code: 'BR-01',
    nameAr: '',
    nameEn: '',
    address: '',
    latitude: 30.0444,
    longitude: 31.2357,
    radiusMeters: 150,
    isMain: false,
    isActive: true,
  });

  // Database Backup state
  const [backupHistory, setBackupHistory] = useState<BackupMetadata[]>([]);
  const [backupNote, setBackupNote] = useState('');
  const [encryptBackup, setEncryptBackup] = useState(false);
  const [backupPassphrase, setBackupPassphrase] = useState('');
  const [restorePassphrase, setRestorePassphrase] = useState('');
  const [dbSizeKb, setDbSizeKb] = useState(0);

  // Hardware Sync settings
  const [syncIntervalMins, setSyncIntervalMins] = useState(5);
  const [defaultPort, setDefaultPort] = useState(4370);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [devicesCount, setDevicesCount] = useState(0);

  // License Testing state
  const [testLicenseInput, setTestLicenseInput] = useState('');
  const [testMessage, setTestMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [locationDetecting, setLocationDetecting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inter-Module History logs
  const [pipelineLogs, setPipelineLogs] = useState<any[]>([]);

  useEffect(() => {
    setLocalSettings({ ...settings });
    setBackupHistory(backupService.getBackupHistory());
    setDbSizeKb(Math.round(sqliteAdapter.getDatabaseSizeInBytes() / 1024));

    const devs = deviceService.getDevices();
    setDevicesCount(devs.length);

    setPipelineLogs(moduleBridgeService.getHistory());
  }, [settings]);

  const handleSaveLocalSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(localSettings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleDetectCurrentGps = async () => {
    setLocationDetecting(true);
    try {
      const pos = await platformService.getCurrentLocation();
      setLocalSettings((prev) => ({
        ...prev,
        mainBranchLat: pos.lat,
        mainBranchLng: pos.lng,
      }));
      alert(`تم تحديد الإحداثيات الحالية بنجاح عبر (${pos.provider}):\nخط العرض: ${pos.lat}\nخط الطول: ${pos.lng}`);
    } catch {
      alert('تعذر الوصول لمستشعر GPS المباشر.');
    } finally {
      setLocationDetecting(false);
    }
  };

  const handleCopyHardwareId = () => {
    navigator.clipboard.writeText(subscriptionInfo.hardwareId);
    setCopiedHw(true);
    setTimeout(() => setCopiedHw(false), 2000);
  };

  const handleCreateBackup = () => {
    try {
      backupService.downloadBackupFile(
        backupNote || 'نسخة احتياطية سريعة',
        encryptBackup ? backupPassphrase : undefined
      );
      setBackupHistory(backupService.getBackupHistory());
      setBackupNote('');
      setBackupPassphrase('');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e: any) {
      alert(`خطأ أثناء إنشاء النسخة الاحتياطية: ${e?.message || e}`);
    }
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      if (confirm('تنبيه أمان: استرجاع النسخة الاحتياطية سيعيد كتابة قاعدة البيانات الحالية تماماً. هل تريد المتابعة؟')) {
        const res = backupService.restoreBackup(content, restorePassphrase);
        if (res.success) {
          alert('تم استرجاع قاعدة البيانات بنجاح! يتم إعادة تحميل الشاشات الآن.');
          window.location.reload();
        } else {
          alert(`فشل استرجاع البيانات: ${res.message}`);
        }
      }
    };
    reader.readAsText(file);
  };

  // Subscription Mock Testing actions
  const handleSimulateExpiration = () => {
    if (confirm('هل تريد محاكاة انتهاء مدة الاشتراك لاختبار شاشة القفل وإعادة التفعيل؟')) {
      const db = sqliteAdapter.getDatabase();
      const expiredKey = subscriptionService.generateLicenseKey({
        companyName: db.settings.companyName || 'اختبار انتهاء الاشتراك',
        plan: 'CUSTOM',
        activationDate: '2025-01-01',
        expirationDate: '2025-01-02',
      });
      db.license.licenseKey = expiredKey;
      sqliteAdapter.saveDatabase(db);
      refreshSubscription();
      setTestMessage({
        type: 'error',
        text: 'تم تعيين الترخيص لمنتهي الصلاحية لتجربة القفل بنجاح!',
      });
    }
  };

  const handleActivateDemo = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const demoKey = subscriptionService.generateLicenseKey({
      companyName: settings.companyName || 'شركة التجربة والحلول',
      plan: '1_MONTH',
      activationDate: todayStr,
      customDays: 30,
      maxDevices: 10,
      maxEmployees: 500,
    });
    const res = activateLicenseKey(demoKey);
    if (res.success) {
      setTestMessage({
        type: 'success',
        text: 'تم تفعيل اشتراك تجريبي لمدة 30 يوماً بنجاح!',
      });
    }
  };

  const handleApplyTestKey = () => {
    if (!testLicenseInput.trim()) return;
    const res = activateLicenseKey(testLicenseInput.trim());
    if (res.success) {
      setTestMessage({ type: 'success', text: res.message });
      setTestLicenseInput('');
    } else {
      setTestMessage({ type: 'error', text: res.message });
    }
  };

  // Branch Modal Handlers
  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBranch) {
      updateBranch({ ...branchForm, id: editingBranch.id });
    } else {
      addBranch(branchForm);
    }
    setShowBranchModal(false);
    setEditingBranch(null);
  };

  const handleOpenNewBranch = () => {
    setEditingBranch(null);
    setBranchForm({
      code: `BR-0${branches.length + 1}`,
      nameAr: '',
      nameEn: '',
      address: '',
      latitude: settings.mainBranchLat || 30.0444,
      longitude: settings.mainBranchLng || 31.2357,
      radiusMeters: 150,
      isMain: false,
      isActive: true,
    });
    setShowBranchModal(true);
  };

  const handleEditBranchClick = (b: Branch) => {
    setEditingBranch(b);
    setBranchForm({
      code: b.code,
      nameAr: b.nameAr,
      nameEn: b.nameEn,
      address: b.address || '',
      latitude: b.latitude || 30.0444,
      longitude: b.longitude || 31.2357,
      radiusMeters: b.radiusMeters || 150,
      isMain: b.isMain || false,
      isActive: b.isActive,
    });
    setShowBranchModal(true);
  };

  const employeesCount = subscriptionInfo.currentEmployeesCount || 45;
  const maxEmployees = subscriptionInfo.maxEmployees || 500;
  const empUsagePct = Math.min(100, Math.round((employeesCount / maxEmployees) * 100));

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 text-white rounded-xl shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
            <Settings className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-tight">إعدادات النظام والتهيئة الشاملة (System Settings)</h2>
            <p className="text-xs text-slate-400">إدارة التراخيص، الحضور الميداني بالـ GPS، الربط بين الأقسام، وإدارة الفروع</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-slate-950/80 border border-white/10 rounded-xl text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>SQLite Active ({dbSizeKb} KB)</span>
          </span>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 shadow-lg text-xs font-bold">
        <button
          onClick={() => setActiveTab('license')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'license'
              ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>التراخيص والنظام</span>
        </button>

        <button
          onClick={() => setActiveTab('geofencing')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'geofencing'
              ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <MapPin className="w-4 h-4 text-cyan-400" />
          <span>الحضور الميداني (GPS)</span>
        </button>

        <button
          onClick={() => setActiveTab('integration')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'integration'
              ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Link2 className="w-4 h-4 text-emerald-400" />
          <span>الربط بين الأقسام</span>
        </button>

        <button
          onClick={() => setActiveTab('branches')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'branches'
              ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-500/40 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Building className="w-4 h-4 text-purple-400" />
          <span>الفروع والشركات</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'system'
              ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/40 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sliders className="w-4 h-4 text-blue-400" />
          <span>مواعيد الدوام</span>
        </button>

        <button
          onClick={() => setActiveTab('themes')}
          className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'themes'
              ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/40 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Palette className="w-4 h-4 text-pink-400" />
          <span>الثيمات</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'database'
              ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-300 border border-emerald-500/40 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <span>النسخ الاحتياطي</span>
        </button>
      </div>

      {/* TAB 1: License & System (التراخيص والنظام) */}
      {activeTab === 'license' && (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-bold text-white text-base">حالة الترخيص واستهلاك الموارد بالنظام</h3>
                <p className="text-xs text-slate-400">متابعة تراخيص الأجهزة، استهلاك الموظفين، وبصمة الجهاز الرقمية</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenLicenseModal}
                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5 text-amber-200" />
                <span>إدخال مفتاح ترخيص جديد</span>
              </button>

              <button
                onClick={() => setShowAdminGenerator(true)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Wrench className="w-3.5 h-3.5 text-cyan-300" />
                <span>أداة المولد الإداري</span>
              </button>
            </div>
          </div>

          {/* Subscription Info Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Status Card */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/10 space-y-2">
              <span className="text-slate-400 text-[10px] font-bold block">حالة الاشتراك الحالية</span>
              <div className="flex items-center justify-between">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black border ${
                    subscriptionInfo.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border-red-500/30'
                  }`}
                >
                  {subscriptionInfo.status}
                </span>
                <span className="text-slate-300 font-bold">{subscriptionInfo.planNameAr}</span>
              </div>
              <p className="text-[11px] text-slate-400">متبقي {subscriptionInfo.daysRemaining} يوم قبل التجديد</p>
            </div>

            {/* Employees Quota Progress */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] font-bold">الموظفين المستهلكين</span>
                <span className="font-mono font-bold text-cyan-400 text-xs">
                  {employeesCount} / {maxEmployees}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                  style={{ width: `${empUsagePct}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-400">استهلاك {empUsagePct}% من السعة المسموحة بالترخيص</p>
            </div>

            {/* Devices Quota */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] font-bold">أجهزة البصمة المسموحة</span>
                <span className="font-mono font-bold text-emerald-400 text-xs">
                  {devicesCount} / {subscriptionInfo.maxDevices || 10}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((devicesCount / (subscriptionInfo.maxDevices || 10)) * 100)
                    )}%`,
                  }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-400">الأجهزة النشطة المسجلة في DB</p>
            </div>

            {/* Registered Company */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/10 space-y-1">
              <span className="text-slate-400 text-[10px] font-bold block">الشركة / العميل المعتمد</span>
              <h4 className="font-black text-white text-sm truncate">{subscriptionInfo.companyName}</h4>
              <p className="text-[10px] text-slate-400 font-mono">تاريخ الانتهاء: {subscriptionInfo.expirationDate}</p>
            </div>
          </div>

          {/* Hardware Fingerprint Section */}
          <div className="p-4 bg-slate-950/90 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>البصمة الرقمية للعتاد (Hardware Fingerprint UUID)</span>
              </div>
              <button
                type="button"
                onClick={handleCopyHardwareId}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-mono font-bold cursor-pointer flex items-center gap-1 transition-all"
              >
                {copiedHw ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedHw ? 'تم النسخ!' : 'نسخ البصمة'}</span>
              </button>
            </div>

            <p className="text-slate-400 text-[11px]">
              تُستخدم هذه البصمة لربط مفتاح الترخيص بجهاز الكمبيوتر/السيرفر الحالي لمنع نسخ البرنامج لأجهزة غير مرخصة.
            </p>

            <div className="p-3 bg-slate-900 rounded-xl border border-white/10 font-mono text-cyan-300 font-bold text-sm tracking-wider text-center select-all">
              {subscriptionInfo.hardwareId}
            </div>
          </div>

          {/* Quick Activation Form & Mock Tests */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/10 space-y-3">
              <h4 className="font-bold text-white text-xs flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" />
                تفعيل كود ترخيص مباشر
              </h4>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={testLicenseInput}
                  onChange={(e) => setTestLicenseInput(e.target.value)}
                  placeholder="أدخل الكود المشفر AS-LIC-..."
                  className="flex-1 px-3 py-2 bg-slate-900 border border-white/10 text-white rounded-xl font-mono text-xs focus:ring-2 focus:ring-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleApplyTestKey}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
                >
                  تفعيل
                </button>
              </div>

              {testMessage && (
                <div
                  className={`p-2.5 rounded-xl border text-xs font-bold ${
                    testMessage.type === 'success'
                      ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40'
                      : 'bg-red-950/50 text-red-300 border-red-500/40'
                  }`}
                >
                  {testMessage.text}
                </div>
              )}
            </div>

            <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>محاكاة انتهاء الاشتراك واختبار القفل</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSimulateExpiration}
                  className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1"
                >
                  <Lock className="w-3.5 h-3.5 text-red-400" />
                  <span>محاكاة القفل</span>
                </button>

                <button
                  type="button"
                  onClick={handleActivateDemo}
                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1"
                >
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>تفعيل 30 يوم تجريبي</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Geofencing & GPS (الحضور الميداني والجغرافي) */}
      {activeTab === 'geofencing' && (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="font-bold text-white text-base">إعدادات الحضور الجغرافي والنطاق المسموح (Geofencing Rules)</h3>
                <p className="text-xs text-slate-400">تحديد موقع المقر الرئيسي بالفروع وحظر تسجيل الحضور خارج النطاق</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDetectCurrentGps}
              disabled={locationDetecting}
              className="px-3.5 py-1.5 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <Crosshair className={`w-3.5 h-3.5 text-cyan-400 ${locationDetecting ? 'animate-spin' : ''}`} />
              <span>{locationDetecting ? 'جاري الفحص...' : 'تحديد موقعي الحالي GPS'}</span>
            </button>
          </div>

          <form onSubmit={handleSaveLocalSettings} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">خط العرض الرئيسي (Latitude)</label>
                <input
                  type="number"
                  step="0.000001"
                  value={localSettings.mainBranchLat || 30.0444}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, mainBranchLat: parseFloat(e.target.value) })
                  }
                  className="w-full px-3 py-2.5 bg-slate-950/80 border border-white/10 text-white rounded-xl font-mono focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">خط الطول الرئيسي (Longitude)</label>
                <input
                  type="number"
                  step="0.000001"
                  value={localSettings.mainBranchLng || 31.2357}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, mainBranchLng: parseFloat(e.target.value) })
                  }
                  className="w-full px-3 py-2.5 bg-slate-950/80 border border-white/10 text-white rounded-xl font-mono focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">نصف قطر النطاق المسموح (بالأمتار)</label>
                <input
                  type="number"
                  value={localSettings.mainBranchRadiusMeters || 150}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, mainBranchRadiusMeters: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2.5 bg-slate-950/80 border border-white/10 text-white rounded-xl font-mono focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>
            </div>

            {/* Geofence Rules Toggles */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <label className="flex items-center justify-between p-3.5 bg-slate-950/80 rounded-2xl border border-white/10 cursor-pointer hover:border-white/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl">
                    <Navigation className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-white block text-sm">تفعيل نظام الحضور الجغرافي (Geofencing Enabled)</span>
                    <span className="text-[11px] text-slate-400">سحب الإحداثيات عند بصمة الموبايل أو المتصفح بالـ GPS</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.geofencingEnabled !== false}
                  onChange={(e) => setLocalSettings({ ...localSettings, geofencingEnabled: e.target.checked })}
                  className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-slate-950/80 rounded-2xl border border-white/10 cursor-pointer hover:border-white/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 text-red-400 rounded-xl">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-white block text-sm">حظر تسجيل الحضور خارج النطاق (Strict Geofence Block)</span>
                    <span className="text-[11px] text-slate-400">رفض البصمة فوراً إذا تجاوز الموظف مسافة الـ ({localSettings.mainBranchRadiusMeters || 150}) متر</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.strictGeofenceBlock !== false}
                  onChange={(e) => setLocalSettings({ ...localSettings, strictGeofenceBlock: e.target.checked })}
                  className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-slate-950/80 rounded-2xl border border-white/10 cursor-pointer hover:border-white/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-white block text-sm">اعتماد تلقائي للبصمة الجغرافية الموثوقة</span>
                    <span className="text-[11px] text-slate-400">تحويل حالة البصمة الجغرافية الصحيحة إلى PRESENT مباشرة دون انتظار المراجعة</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.autoApproveGeoPunch !== false}
                  onChange={(e) => setLocalSettings({ ...localSettings, autoApproveGeoPunch: e.target.checked })}
                  className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-white/10">
              {savedSuccess && (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" /> تم حفظ قواعد الحضور الجغرافي بنجاح!
                </span>
              )}
              <button
                type="submit"
                className="mr-auto px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl cursor-pointer shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>حفظ إعدادات الـ GPS والجغرافيا</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: Inter-Module Integration (الربط والتكامل بين الأقسام) */}
      {activeTab === 'integration' && (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-white text-base">إعدادات الربط الآلي والتكامل بين الأقسام (Inter-Module Event Pipeline)</h3>
                <p className="text-xs text-slate-400">ربط كشوف الحضور بالمالية وحركة السائقين مع التوقيع الرقمي لمنع التلاعب</p>
              </div>
            </div>

            <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-500/30 rounded-xl text-xs font-mono font-bold text-emerald-300">
              Pipeline Status: Active
            </span>
          </div>

          <form onSubmit={handleSaveLocalSettings} className="space-y-4 text-xs">
            <div className="space-y-3">
              {/* Payroll Integration Toggle */}
              <label className="flex items-center justify-between p-4 bg-slate-950/80 rounded-2xl border border-white/10 cursor-pointer hover:border-white/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-white block text-sm">ربط الـ HR مع شاشة المالية والسالاري (Payroll Integration)</span>
                    <span className="text-[11px] text-slate-400">توليد مسودة قيد محاسبي موازن تلقائياً فور اعتماد كشف الحضور بنهاية الشهر</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.payrollIntegrationEnabled !== false}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, payrollIntegrationEnabled: e.target.checked })
                  }
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </label>

              {/* Fleet Integration Toggle */}
              <label className="flex items-center justify-between p-4 bg-slate-950/80 rounded-2xl border border-white/10 cursor-pointer hover:border-white/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-white block text-sm">ربط بصمة السائقين مع قسم الحركة (Fleet Management Sync)</span>
                    <span className="text-[11px] text-slate-400">احتساب ساعات الرحلة، الكيلومترات المقدرة، وبدل الانتقالات تلقائياً عند انصراف السائق</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.fleetIntegrationEnabled !== false}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, fleetIntegrationEnabled: e.target.checked })
                  }
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </label>

              {/* Encrypted Event Pipeline */}
              <label className="flex items-center justify-between p-4 bg-slate-950/80 rounded-2xl border border-white/10 cursor-pointer hover:border-white/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-white block text-sm">تشفير وتوقيع أحداث الـ Event Bus رقمياً (HMAC Signatures)</span>
                    <span className="text-[11px] text-slate-400">رفض أي حدث غير موثق يدوياً لمنع التلاعب بساعات العمل أو المستحقات المالية</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.encryptedEventsPipeline !== false}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, encryptedEventsPipeline: e.target.checked })
                  }
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-white/10">
              {savedSuccess && (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" /> تم حفظ مفاتيح الربط بين الأقسام!
                </span>
              )}
              <button
                type="submit"
                className="mr-auto px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl cursor-pointer shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>حفظ تفعيل التكامل</span>
              </button>
            </div>
          </form>

          {/* Event History Monitor */}
          <div className="space-y-3 pt-3">
            <h4 className="font-bold text-white text-xs flex items-center justify-between">
              <span>سجل أحداث الـ Event Pipeline المباشر بين الأقسام</span>
              <span className="text-[10px] text-slate-400 font-mono">آخر الأحداث: {pipelineLogs.length}</span>
            </h4>

            <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/80 max-h-56">
              <table className="w-full text-xs text-right font-mono">
                <thead>
                  <tr className="bg-white/5 text-slate-400 font-semibold border-b border-white/10">
                    <th className="p-2.5">الوقت</th>
                    <th className="p-2.5">نوع الحدث (Event)</th>
                    <th className="p-2.5">التوقيع الرقمي (Signature)</th>
                    <th className="p-2.5">ملخص البيانات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[11px]">
                  {pipelineLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-slate-500 font-sans">
                        لم يتم بث أحداث بين الأقسام حتى الآن
                      </td>
                    </tr>
                  ) : (
                    pipelineLogs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="p-2.5 text-slate-400">{new Date(log.timestamp).toLocaleTimeString('ar-EG')}</td>
                        <td className="p-2.5 font-bold text-cyan-400">{log.type}</td>
                        <td className="p-2.5 text-purple-300 text-[10px]">{log.signature || 'SIG-OK'}</td>
                        <td className="p-2.5 text-slate-300 truncate max-w-xs font-sans">
                          {JSON.stringify(log.payload)}
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

      {/* TAB 4: Multi-Branch Settings (الفروع والشركات) */}
      {activeTab === 'branches' && (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="font-bold text-white text-base">إدارة الفروع والقطاعات الجغرافية (Multi-Branch Management)</h3>
                <p className="text-xs text-slate-400">إضافة الفروع والقطاعات، وتعيين إحداثيات GPS ونطاق كل فرع</p>
              </div>
            </div>

            <button
              onClick={handleOpenNewBranch}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة فرع جديد</span>
            </button>
          </div>

          {/* Branches Table */}
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/80">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="bg-white/5 text-slate-300 font-bold border-b border-white/10">
                  <th className="p-3">كود الفرع</th>
                  <th className="p-3">اسم الفرع (عربي)</th>
                  <th className="p-3">اسم الفرع (En)</th>
                  <th className="p-3">الإحداثيات الجغرافية</th>
                  <th className="p-3">النطاق المسموح</th>
                  <th className="p-3">نوع الفرع</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {branches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-400">
                      لا توجد فروع مسجلة بالدليل
                    </td>
                  </tr>
                ) : (
                  branches.map((branch) => (
                    <tr key={branch.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-mono font-bold text-cyan-400">{branch.code}</td>
                      <td className="p-3 font-bold text-white">{branch.nameAr}</td>
                      <td className="p-3 text-slate-400 font-mono">{branch.nameEn}</td>
                      <td className="p-3 font-mono text-slate-300 text-[11px]">
                        {branch.latitude || 30.0444}, {branch.longitude || 31.2357}
                      </td>
                      <td className="p-3 font-mono text-emerald-400">{branch.radiusMeters || 150} متر</td>
                      <td className="p-3">
                        {branch.isMain ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            الفرع الرئيسي
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-white/10">
                            فرع فرعي
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditBranchClick(branch)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg cursor-pointer transition-colors"
                            title="تعديل بيانات الفرع"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {!branch.isMain && (
                            <button
                              onClick={() => {
                                if (confirm(`هل أنت تأكد من حذف فرع (${branch.nameAr})؟`)) {
                                  deleteBranch(branch.id);
                                }
                              }}
                              className="p-1.5 bg-red-950/50 hover:bg-red-900 text-red-300 rounded-lg cursor-pointer transition-colors"
                              title="حذف الفرع"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: System Work Hours & Defaults */}
      {activeTab === 'system' && (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Building className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-bold text-white text-base">إعدادات المؤسسة ومواعيد الدوام الرسمية</h3>
              <p className="text-xs text-slate-400">تعديل أوقات الحضور والانصراف وفترة السماح لحساب التأخيرات</p>
            </div>
          </div>

          <form onSubmit={handleSaveLocalSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">اسم الشركة / المؤسسة</label>
                <input
                  type="text"
                  value={localSettings.companyName}
                  onChange={(e) => setLocalSettings({ ...localSettings, companyName: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-950/80 border border-white/10 text-white rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">فترة السماح قبل احتساب التأخير (بالدقائق)</label>
                <input
                  type="number"
                  value={localSettings.gracePeriodMinutes}
                  onChange={(e) => setLocalSettings({ ...localSettings, gracePeriodMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-slate-950/80 border border-white/10 text-white rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">وقت بداية الدوام الرسمي</label>
                <input
                  type="time"
                  value={localSettings.workStartTime}
                  onChange={(e) => setLocalSettings({ ...localSettings, workStartTime: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-950/80 border border-white/10 text-white rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">وقت نهاية الدوام الرسمي</label>
                <input
                  type="time"
                  value={localSettings.workEndTime}
                  onChange={(e) => setLocalSettings({ ...localSettings, workEndTime: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-950/80 border border-white/10 text-white rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-white/10">
              {savedSuccess && (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" /> تم حفظ الإعدادات بنجاح!
                </span>
              )}
              <button
                type="submit"
                className="mr-auto px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl cursor-pointer shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>حفظ وتطبيق إعدادات النظام</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 6: Themes & Colors */}
      {activeTab === 'themes' && (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Palette className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="font-bold text-white text-base">تخصيص الواجهة ونظام الثيمات (Theme Switcher)</h3>
              <p className="text-xs text-slate-400">تغيير الألوان الرئيسية والتنقل بين وضع الإضاءة المظلم والمريح للعين</p>
            </div>
          </div>

          <div className="space-y-5 text-xs">
            {/* Display Mode Selection */}
            <div>
              <label className="block font-bold text-slate-200 mb-3">نمط الإضاءة (Mode Selector)</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('dark')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                    mode === 'dark'
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-white ring-2 ring-cyan-500/30'
                      : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="p-2.5 bg-slate-800 rounded-xl text-cyan-400">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <span className="font-bold block text-sm">الوضع الليلي (Dark Mode)</span>
                    <span className="text-[10px] text-slate-400">مريح للعين ومصمم للمكاتب</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('light')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                    mode === 'light'
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-white ring-2 ring-cyan-500/30'
                      : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <span className="font-bold block text-sm">الوضع النهارى (Light Mode)</span>
                    <span className="text-[10px] text-slate-400">تباين عالي للطباعة والقراءة</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('system')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                    mode === 'system'
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-white ring-2 ring-cyan-500/30'
                      : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="p-2.5 bg-purple-500/20 rounded-xl text-purple-400">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <span className="font-bold block text-sm">تلقائي حسب نظام الجهاز</span>
                    <span className="text-[10px] text-slate-400">يتكيف مع إعدادات الويندوز</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Accent Color Presets */}
            <div>
              <label className="block font-bold text-slate-200 mb-3">لون التميز الرئيسي (Custom Accent Color)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((key) => {
                  const item = ACCENT_COLORS[key];
                  const isSelected = accent === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setAccent(key)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer text-center relative overflow-hidden group ${
                        isSelected
                          ? `${item.badgeBg} ${item.borderClass} ring-2 ${item.ringClass}`
                          : 'bg-slate-950/60 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-full mx-auto mb-2 shadow-lg transition-transform group-hover:scale-110 flex items-center justify-center text-white"
                        style={{ backgroundColor: item.hex }}
                      >
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>
                      <span className="font-bold block text-slate-200 text-xs">{item.nameAr}</span>
                      <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{item.nameEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: Database Backup */}
      {activeTab === 'database' && (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-white text-base">إدارة قاعدة البيانات والنسخ الاحتياطي (as_solution.db)</h3>
                <p className="text-xs text-slate-400">تصدير واسترجاع قاعدة البيانات بأمان مع التشفير بكلمة سر AES-256</p>
              </div>
            </div>

            <span className="px-3 py-1 bg-slate-950/80 border border-white/10 rounded-xl text-xs font-mono font-bold text-emerald-400">
              حجم قاعدة البيانات: {dbSizeKb} KB
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
            {/* Export Panel */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/10 space-y-3">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />
                تصدير نسخة احتياطية جديدة (Export Backup)
              </h4>

              <div>
                <label className="block font-medium mb-1 text-slate-300">ملاحظة أو بيان النسخة</label>
                <input
                  type="text"
                  value={backupNote}
                  onChange={(e) => setBackupNote(e.target.value)}
                  placeholder="مثال: نسخة قبل التحديث الربع سنوي"
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-300">
                  <input
                    type="checkbox"
                    checked={encryptBackup}
                    onChange={(e) => setEncryptBackup(e.target.checked)}
                    className="rounded bg-slate-900 border-white/10 text-cyan-500"
                  />
                  <span>تشفير النسخة الاحتياطية بكلمة سر خافية (AES-256)</span>
                </label>

                {encryptBackup && (
                  <input
                    type="password"
                    value={backupPassphrase}
                    onChange={(e) => setBackupPassphrase(e.target.value)}
                    placeholder="أدخل كلمة مرور التشفير..."
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 text-white rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                )}
              </div>

              <button
                onClick={handleCreateBackup}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>تنزيل ملف النسخة الاحتياطية (.asbak)</span>
              </button>
            </div>

            {/* Import Panel */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/10 space-y-3">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-400" />
                استرجاع قاعدة البيانات (Restore Backup)
              </h4>

              <p className="text-slate-400 text-[11px] leading-relaxed">
                قم برفع ملف النسخة الاحتياطية المعتمد بصيغة (`.asbak` / `.json`) لاسترجاع كافة الموظفين والبصمات والاشتراكات.
              </p>

              <div>
                <label className="block font-medium mb-1 text-slate-300">كلمة المرور (إذا كانت النسخة مشفرة)</label>
                <input
                  type="password"
                  value={restorePassphrase}
                  onChange={(e) => setRestorePassphrase(e.target.value)}
                  placeholder="كلمة مرور التفكيك..."
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 text-white rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <input type="file" ref={fileInputRef} onChange={handleFileRestore} accept=".asbak,.json" className="hidden" />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl cursor-pointer shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>اختيار واسترجاع ملف النسخة الاحتياطية</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Branch Modal */}
      {showBranchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <Building className="w-4 h-4 text-purple-400" />
              <span>{editingBranch ? 'تعديل بيانات الفرع' : 'إضافة فرع جديد للمؤسسة'}</span>
            </h3>

            <form onSubmit={handleSaveBranch} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">كود الفرع</label>
                  <input
                    type="text"
                    value={branchForm.code}
                    onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 text-white rounded-xl font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-300">نوع الفرع</label>
                  <label className="flex items-center gap-2 pt-2 text-slate-300 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={branchForm.isMain}
                      onChange={(e) => setBranchForm({ ...branchForm, isMain: e.target.checked })}
                      className="rounded bg-slate-950 text-purple-500 w-4 h-4"
                    />
                    <span>تعيين كفرع رئيسي</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">اسم الفرع (عربي)</label>
                <input
                  type="text"
                  value={branchForm.nameAr}
                  onChange={(e) => setBranchForm({ ...branchForm, nameAr: e.target.value })}
                  placeholder="مثال: فرع التجمع الخامس"
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 text-white rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">اسم الفرع (إنجليزي)</label>
                <input
                  type="text"
                  value={branchForm.nameEn}
                  onChange={(e) => setBranchForm({ ...branchForm, nameEn: e.target.value })}
                  placeholder="e.g. Fifth Settlement Branch"
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 text-white rounded-xl font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Lat</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={branchForm.latitude}
                    onChange={(e) => setBranchForm({ ...branchForm, latitude: parseFloat(e.target.value) })}
                    className="w-full px-2.5 py-2 bg-slate-950 border border-white/10 text-white rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Lng</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={branchForm.longitude}
                    onChange={(e) => setBranchForm({ ...branchForm, longitude: parseFloat(e.target.value) })}
                    className="w-full px-2.5 py-2 bg-slate-950 border border-white/10 text-white rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Radius (m)</label>
                  <input
                    type="number"
                    value={branchForm.radiusMeters}
                    onChange={(e) => setBranchForm({ ...branchForm, radiusMeters: parseInt(e.target.value) })}
                    className="w-full px-2.5 py-2 bg-slate-950 border border-white/10 text-white rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowBranchModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl cursor-pointer shadow-md"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Key Generator Modal Launcher */}
      <AdminKeyGeneratorModal isOpen={showAdminGenerator} onClose={() => setShowAdminGenerator(false)} />
    </div>
  );
};
