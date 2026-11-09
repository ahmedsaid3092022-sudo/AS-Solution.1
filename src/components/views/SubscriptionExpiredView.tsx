import React, { useState } from 'react';
import { Lock, ShieldAlert, Key, PhoneCall, Mail, AlertCircle, RefreshCw } from 'lucide-react';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';
import { useLanguageStore } from '../../stores/useLanguageStore';
import confetti from 'canvas-confetti';

export const SubscriptionExpiredView: React.FC = () => {
  const { subscriptionInfo, activateLicenseKey } = useSubscriptionStore();
  const { t, isRtl } = useLanguageStore();
  const [licenseKey, setLicenseKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    setTimeout(() => {
      const res = activateLicenseKey(licenseKey.trim());
      setLoading(false);

      if (res.success) {
        try {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } catch {}
      } else {
        setErrorMsg(res.message);
      }
    }, 500);
  };

  const isTampered = subscriptionInfo.status === 'TAMPERED';

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans select-none overflow-y-auto"
    >
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 my-auto">
        {/* Header Icon */}
        <div className="text-center space-y-3">
          <div
            className={`inline-flex p-4 rounded-3xl border shadow-xl ${
              isTampered
                ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-red-500/10'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-amber-500/10'
            }`}
          >
            {isTampered ? <ShieldAlert className="w-12 h-12 animate-pulse" /> : <Lock className="w-12 h-12" />}
          </div>

          <h1 className="text-2xl font-bold text-white">
            {isTampered ? t.systemLockedTampered : t.subscriptionExpiredAlert}
          </h1>

          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {isTampered
              ? subscriptionInfo.tamperedReason ||
                (isRtl
                  ? 'حفاظاً على حقوق الترخيص والأمان، تم قفل واجهات برنامج أيه إس فوراً لاكتشاف تقديم أو تأخير تاريخ الجهاز.'
                  : 'To protect license rights, AS system has been locked due to detected device clock tampering.')
              : isRtl
              ? `عذراً، لقد انتهت صلاحية الترخيص لشركة (${subscriptionInfo.companyName}) بتاريخ ${subscriptionInfo.expirationDate}. يرجى إدخال مفتاح تفعيل جديد لإعادة فتح الخدمات بدون فقدان بيانات الحضور.`
              : `Sorry, license for (${subscriptionInfo.companyName}) expired on ${subscriptionInfo.expirationDate}. Please enter a new license key to restore full access.`}
          </p>
        </div>

        {/* Info card */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
          <div className="flex justify-between items-center text-slate-400 border-b border-slate-800/80 pb-2">
            <span>{t.hardwareSignature}:</span>
            <span className="font-mono text-blue-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {subscriptionInfo.hardwareId}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-400">
            <span>{t.dbStatus}:</span>
            <span className="text-emerald-400 font-semibold">{t.dbSecured}</span>
          </div>
        </div>

        {/* Form Input */}
        <form onSubmit={handleActivate} className="space-y-3">
          <label className="block font-semibold text-slate-300 text-xs">{t.licenseKeyInputLabel}</label>
          <div className="relative">
            <Key
              className={`w-4 h-4 text-slate-500 absolute top-3.5 ${isRtl ? 'right-3.5' : 'left-3.5'}`}
            />
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="AS-LIC-..."
              className={`w-full py-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isRtl ? 'pr-10 pl-3' : 'pl-10 pr-3'
              }`}
              required
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            <span>{t.activateAndReturn}</span>
          </button>
        </form>

        {/* Support contact info */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
            <span>{t.techSupport}: +20 1000000000</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-blue-400" />
            <span>support@assolution.com</span>
          </div>
        </div>
      </div>
    </div>
  );
};
