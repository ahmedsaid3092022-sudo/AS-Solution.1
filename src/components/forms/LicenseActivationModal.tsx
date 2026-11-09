import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Modal } from '../common/Modal';
import { Key, ShieldCheck, AlertCircle, Wrench } from 'lucide-react';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';
import { useLanguageStore } from '../../stores/useLanguageStore';
import { AdminKeyGeneratorModal } from './AdminKeyGeneratorModal';

interface LicenseActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LicenseActivationModal: React.FC<LicenseActivationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { subscriptionInfo, activateLicenseKey, refreshSubscription } = useSubscriptionStore();
  const { t, isRtl } = useLanguageStore();
  const [licenseInput, setLicenseInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showAdminGenerator, setShowAdminGenerator] = useState(false);

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const result = activateLicenseKey(licenseInput.trim());

    if (result.success) {
      setFeedback({ type: 'success', message: result.message });
      try {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      } catch {}
      refreshSubscription();
    } else {
      setFeedback({ type: 'error', message: result.message });
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t.licenseManagementTitle}
        subtitle={t.licenseManagementSubtitle}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5 text-xs">
          {/* Current Status Card */}
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-600 text-white rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    {subscriptionInfo.companyName}
                  </h4>
                  <p className="text-slate-400">
                    {t.subscriptionPlan}: {subscriptionInfo.planNameAr}
                  </p>
                </div>
              </div>

              <div
                className={`px-3 py-1 rounded-full font-bold text-xs ${
                  subscriptionInfo.status === 'ACTIVE'
                    ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                    : subscriptionInfo.status === 'WARNING'
                    ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                    : 'bg-red-500/15 text-red-500 border border-red-500/30'
                }`}
              >
                {subscriptionInfo.status === 'ACTIVE'
                  ? t.activeAndStable
                  : subscriptionInfo.status === 'WARNING'
                  ? t.approachingExpiry
                  : t.expiredOrLocked}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center border-t border-slate-200 dark:border-slate-700/80">
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl">
                <span className="text-slate-400 block text-[10px]">{t.activationDate}</span>
                <span className="font-bold font-mono text-slate-700 dark:text-slate-200">
                  {subscriptionInfo.activationDate}
                </span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl">
                <span className="text-slate-400 block text-[10px]">{t.expirationDate}</span>
                <span className="font-bold font-mono text-slate-700 dark:text-slate-200">
                  {subscriptionInfo.expirationDate}
                </span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl">
                <span className="text-slate-400 block text-[10px]">{t.daysRemaining}</span>
                <span className="font-bold font-mono text-emerald-500 text-sm">
                  {subscriptionInfo.daysRemaining} {isRtl ? 'يوم' : 'Days'}
                </span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl">
                <span className="text-slate-400 block text-[10px]">{t.hardwareSignature}</span>
                <span className="font-bold font-mono text-blue-500 text-[10px]">{subscriptionInfo.hardwareId}</span>
              </div>
            </div>
          </div>

          {/* Key Activation Input */}
          <form onSubmit={handleActivate} className="space-y-3">
            <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs">
              {t.licenseKeyInputLabel}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Key
                  className={`w-4 h-4 text-slate-400 absolute top-3 ${isRtl ? 'right-3' : 'left-3'}`}
                />
                <input
                  type="text"
                  value={licenseInput}
                  onChange={(e) => setLicenseInput(e.target.value)}
                  placeholder="AS-LIC-..."
                  className={`w-full py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 ${
                    isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
                  }`}
                  required
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl cursor-pointer shadow-md shadow-blue-600/20 whitespace-nowrap"
              >
                {t.activateKey}
              </button>
            </div>
          </form>

          {feedback && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-300'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Admin Generator Link */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <span className="text-slate-400 text-[11px]">
              {isRtl ? 'هل أنت مسؤول النظام وتريد توليد مفتاح ترخيص للعميل؟' : 'Are you system admin generating a key?'}
            </span>
            <button
              onClick={() => setShowAdminGenerator(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5 text-blue-400" />
              <span>{t.adminGeneratorButton}</span>
            </button>
          </div>
        </div>
      </Modal>

      <AdminKeyGeneratorModal isOpen={showAdminGenerator} onClose={() => setShowAdminGenerator(false)} />
    </>
  );
};
