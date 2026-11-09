import React, { useState } from 'react';
import { X, QrCode, ShieldCheck, Cpu, Users, Smartphone, Key, AlertCircle, Copy, Check } from 'lucide-react';
import { subscriptionService } from '../../services/subscriptionService';

interface QRLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivated: () => void;
}

export const QRLicenseModal: React.FC<QRLicenseModalProps> = ({ isOpen, onClose, onActivated }) => {
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [rawKeyInput, setRawKeyInput] = useState('');
  const [copiedHw, setCopiedHw] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  const subInfo = subscriptionService.getSubscriptionInfo();
  const empCapacity = subscriptionService.canAddEmployee();
  const devCapacity = subscriptionService.canAddDevice();

  const handleCopyHardwareId = () => {
    navigator.clipboard.writeText(subInfo.hardwareId);
    setCopiedHw(true);
    setTimeout(() => setCopiedHw(false), 2000);
  };

  const handleActivateQR = (e: React.FormEvent) => {
    e.preventDefault();
    const input = qrCodeInput.trim() || rawKeyInput.trim();
    if (!input) {
      setMessage({ text: 'يرجى إدخال كود الترخيص أو الـ QR أولاً', success: false });
      return;
    }

    const res = subscriptionService.activateFromQRPayload(input);
    setMessage({ text: res.message, success: res.success });

    if (res.success) {
      setTimeout(() => {
        onActivated();
        onClose();
      }, 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-cyan-900/40 via-blue-900/30 to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">تفعيل الترخيص وبصمة العتاد (QR & Hardware License)</h3>
              <p className="text-xs text-cyan-300/80">ربط سيرفر النظام بـ Hardware Fingerprint وتفعيل الترخيص المشفر</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Hardware Signature Card */}
          <div className="p-4 bg-slate-950/90 rounded-2xl border border-cyan-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>بصمة عتاد السيرفر الحالية (Hardware Fingerprint):</span>
              </span>
              <button
                onClick={handleCopyHardwareId}
                className="text-[11px] font-bold text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedHw ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedHw ? 'تم النسخ!' : 'نسخ البصمة'}</span>
              </button>
            </div>
            <div className="p-2.5 bg-slate-900 rounded-xl font-mono text-xs text-cyan-300 border border-white/5 tracking-wider select-all text-center font-bold">
              {subInfo.hardwareId}
            </div>
          </div>

          {/* Current Capacity Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-white/10 flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">سعة الموظفين</span>
                <span className="text-xs font-bold text-white">
                  {empCapacity.currentCount} / {empCapacity.maxCount}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-white/10 flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">سعة أجهزة البصمة</span>
                <span className="text-xs font-bold text-white">
                  {devCapacity.currentCount} / {devCapacity.maxCount}
                </span>
              </div>
            </div>
          </div>

          {/* Activation Form */}
          <form onSubmit={handleActivateQR} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                <span>أدخل رمز الترخيص أو كود الـ QR:</span>
              </label>
              <textarea
                rows={3}
                value={qrCodeInput}
                onChange={(e) => setQrCodeInput(e.target.value)}
                placeholder="ضع كود التفعيل المشفر AS-LIC-..."
                className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-xs text-cyan-200 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            {message && (
              <div
                className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  message.success ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-red-500/15 border-red-500/30 text-red-300'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{message.text}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>تفعيل الاشتراك فورياً (Activate Subscription)</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
