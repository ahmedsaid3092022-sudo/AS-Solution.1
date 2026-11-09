import React from 'react';
import { AlertCircle, Key, ChevronLeft } from 'lucide-react';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';

interface LicenseStatusBannerProps {
  onOpenLicenseModal: () => void;
}

export const LicenseStatusBanner: React.FC<LicenseStatusBannerProps> = ({ onOpenLicenseModal }) => {
  const { subscriptionInfo } = useSubscriptionStore();

  if (subscriptionInfo.status !== 'WARNING') {
    return null;
  }

  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-medium">
      <div className="flex items-center space-x-2 space-x-reverse">
        <div className="p-1 bg-amber-500/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-500 animate-bounce" />
        </div>
        <span>
          تنبيه انتهاء الاشتراك: متبقي <strong className="font-bold underline">{subscriptionInfo.daysRemaining} أيام</strong> فقط
          على انتهاء ترخيص برنامج أيه إس لشركة ({subscriptionInfo.companyName}). يرجى تجديد التفعيل لتفادي قفل الواجهات.
        </span>
      </div>

      <button
        onClick={onOpenLicenseModal}
        className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
      >
        <Key className="w-3.5 h-3.5" />
        <span>تجديد الاشتراك الآن</span>
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
