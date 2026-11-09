import React, { useState, useEffect } from 'react';
import { X, MapPin, Navigation, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { geoService, GeofenceValidationResult } from '../../services/geoService';
import { attendanceService } from '../../services/attendanceService';
import { sqliteAdapter } from '../../db/sqliteAdapter';
import { useBranchStore } from '../../stores/useBranchStore';

interface MobileGPSPunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MobileGPSPunchModal: React.FC<MobileGPSPunchModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { activeBranch } = useBranchStore();
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [punchType, setPunchType] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoValidation, setGeoValidation] = useState<GeofenceValidationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const employees = sqliteAdapter.getTable('employees').filter((e) => e.status === 'ACTIVE');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      if (employees.length > 0 && !selectedEmpId) {
        setSelectedEmpId(employees[0].id);
      }
      fetchLocation();
    }
  }, [isOpen]);

  const fetchLocation = async () => {
    setLoadingLoc(true);
    setErrorMsg('');
    try {
      const location = await geoService.getCurrentLocation();
      setCoords({ lat: location.latitude, lng: location.longitude });

      const targetLat = activeBranch?.latitude || 30.0444;
      const targetLng = activeBranch?.longitude || 31.2357;
      const radius = activeBranch?.radiusMeters || 200;

      const res = geoService.validateGeofence(location.latitude, location.longitude, targetLat, targetLng, radius);
      setGeoValidation(res);
    } catch (err: any) {
      setErrorMsg('تعذر تحديد الإحداثيات الدقيقة من نظام الـ GPS. تم الاعتماد على موقع المقر.');
    } finally {
      setLoadingLoc(false);
    }
  };

  const handlePunchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) {
      setErrorMsg('يرجى اختيار الموظف أولاً');
      return;
    }
    if (!coords) {
      setErrorMsg('جاري جلب إحداثيات الموقع الحالي، يرجى الانتظار...');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const nowStr = new Date().toTimeString().split(' ')[0];
      const { record, geoResult } = await attendanceService.recordMobilePunchWithGPS(
        selectedEmpId,
        punchType,
        nowStr,
        coords.lat,
        coords.lng
      );

      setSuccessMsg(
        `تم تسجيل البصمة بنجاح! المسافة من مقر العمل: ${geoResult.distanceMeters} متر (${geoResult.isWithin ? 'داخل النطاق' : 'خارج النطاق المسموح'})`
      );

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMsg(err?.message || 'حدث خطأ أثناء حفظ البصمة الذكية');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-cyan-900/40 via-blue-900/30 to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                تسجيل البصمة الجغرافية (GPS Attendance)
              </h3>
              <p className="text-xs text-cyan-300/80">التحقق اللحظي من النطاق الجغرافي للموقع (Geofenced Punch)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handlePunchSubmit} className="p-6 space-y-4">
          {/* Employee Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">اختر الموظف:</label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.code}) - {emp.department}
                </option>
              ))}
            </select>
          </div>

          {/* Punch Type Selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPunchType('CHECK_IN')}
              className={`py-2.5 px-4 rounded-xl font-bold text-xs border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                punchType === 'CHECK_IN'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-800/60 text-slate-400 border-white/10'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>حضور (Check In)</span>
            </button>
            <button
              type="button"
              onClick={() => setPunchType('CHECK_OUT')}
              className={`py-2.5 px-4 rounded-xl font-bold text-xs border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                punchType === 'CHECK_OUT'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-800/60 text-slate-400 border-white/10'
              }`}
            >
              <Navigation className="w-4 h-4 text-cyan-400" />
              <span>انصراف (Check Out)</span>
            </button>
          </div>

          {/* Location & Geofence Status Card */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                <span>موقعك الجغرافي الحالي:</span>
              </span>
              <button
                type="button"
                onClick={fetchLocation}
                disabled={loadingLoc}
                className="text-[11px] font-bold text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loadingLoc ? 'animate-spin' : ''}`} />
                <span>تحديث GPS</span>
              </button>
            </div>

            {coords ? (
              <div className="text-xs text-slate-400 font-mono flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-white/5">
                <span>خط العرض: {coords.lat.toFixed(5)}</span>
                <span>خط الطول: {coords.lng.toFixed(5)}</span>
              </div>
            ) : (
              <div className="text-xs text-amber-400 animate-pulse">جاري تحديد موقع الجوال بالـ GPS...</div>
            )}

            {geoValidation && (
              <div
                className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs font-semibold ${
                  geoValidation.isWithin
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                {geoValidation.isWithin ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p>{geoValidation.messageAr}</p>
                  <p className="text-[10px] opacity-80 mt-0.5">
                    النطاق المسموح للفرع: {geoValidation.allowedRadiusMeters} متر من المركز الجغرافي
                  </p>
                </div>
              </div>
            )}
          </div>

          {errorMsg && <div className="p-3 bg-red-500/15 border border-red-500/30 text-red-300 rounded-xl text-xs font-bold">{errorMsg}</div>}
          {successMsg && <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold">{successMsg}</div>}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting || loadingLoc}
              className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {submitting ? 'جاري تسجيل البصمة...' : 'تأكيد البصمة الجغرافية المعتمدة'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
