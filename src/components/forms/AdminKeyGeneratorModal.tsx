import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { subscriptionService } from '../../services/subscriptionService';
import { SubscriptionPlan } from '../../types';
import { Copy, Check, Key } from 'lucide-react';
import { useLanguageStore } from '../../stores/useLanguageStore';

interface AdminKeyGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminKeyGeneratorModal: React.FC<AdminKeyGeneratorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t, isRtl } = useLanguageStore();
  const [companyName, setCompanyName] = useState('شركة الحلول الحديثة');
  const [plan, setPlan] = useState<SubscriptionPlan>('1_YEAR');
  const [customDays, setCustomDays] = useState(30);
  const [maxDevices, setMaxDevices] = useState(10);
  const [maxEmployees, setMaxEmployees] = useState(500);
  const [hardwareId, setHardwareId] = useState('ALL_HARDWARE');

  const [generatedKey, setGeneratedKey] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = new Date().toISOString().split('T')[0];

    const key = subscriptionService.generateLicenseKey({
      companyName,
      plan,
      activationDate: todayStr,
      customDays: Number(customDays),
      maxDevices: Number(maxDevices),
      maxEmployees: Number(maxEmployees),
      hardwareId: hardwareId.trim() || 'ALL_HARDWARE',
    });

    setGeneratedKey(key);
    setCopied(false);
  };

  const handleCopy = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.adminGeneratorTitle}
      subtitle={t.adminGeneratorSubtitle}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleGenerate} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
            {t.companyNameLabel}
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t.planSelectLabel}</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as SubscriptionPlan)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
            >
              <option value="1_MONTH">{isRtl ? 'شهر واحد (1 Month)' : '1 Month'}</option>
              <option value="2_MONTHS">{isRtl ? 'شهرين (2 Months)' : '2 Months'}</option>
              <option value="3_MONTHS">{isRtl ? '3 أشهر (3 Months)' : '3 Months'}</option>
              <option value="6_MONTHS">{isRtl ? '6 أشهر (6 Months)' : '6 Months'}</option>
              <option value="1_YEAR">{isRtl ? 'سنة كاملة (1 Year / 12 Months)' : '1 Year (12 Months)'}</option>
              <option value="CUSTOM">{isRtl ? 'فترة مخصصة (Custom Days)' : 'Custom Days'}</option>
            </select>
          </div>

          {plan === 'CUSTOM' ? (
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t.customDaysLabel}</label>
              <input
                type="number"
                value={customDays}
                onChange={(e) => setCustomDays(Number(e.target.value))}
                min={1}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>
          ) : (
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t.hardwareBindingLabel}</label>
              <input
                type="text"
                value={hardwareId}
                onChange={(e) => setHardwareId(e.target.value)}
                placeholder={isRtl ? 'ALL_HARDWARE أو كود الجهاز' : 'ALL_HARDWARE or Hardware Code'}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t.maxEmployeesLabel}</label>
            <input
              type="number"
              value={maxEmployees}
              onChange={(e) => setMaxEmployees(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t.maxDevicesLabel}</label>
            <input
              type="number"
              value={maxDevices}
              onChange={(e) => setMaxDevices(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer shadow-md flex items-center justify-center gap-1.5"
        >
          <Key className="w-4 h-4" />
          <span>{t.generateKeyNow}</span>
        </button>

        {generatedKey && (
          <div className="p-3 bg-slate-900 text-slate-200 rounded-xl border border-slate-700 space-y-2">
            <span className="text-[10px] text-slate-400 block font-semibold">
              {t.generatedKeyTitle}
            </span>
            <div className="p-2 bg-slate-950 rounded-lg text-emerald-400 font-mono text-[11px] break-all border border-slate-800">
              {generatedKey}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? t.copied : t.copyToClipboard}</span>
            </button>
          </div>
        )}
      </form>
    </Modal>
  );
};
