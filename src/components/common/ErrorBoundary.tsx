import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Download, Trash2, Bug } from 'lucide-react';
import { loggerService } from '../../services/loggerService';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    loggerService.logCritical(
      'UI_ERROR_BOUNDARY',
      `تم التقاط خطأ في واجهة المستخدم: ${error.message}`,
      error.stack
    );
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleClearCacheAndReset = () => {
    if (confirm('هل أنت تأكد من إعادة ضبط الذاكرة المؤقتة للتطبيق؟ لن يتم حذف قاعدة البيانات الأساسية.')) {
      sessionStorage.clear();
      window.location.reload();
    }
  };

  private handleDownloadLog = () => {
    loggerService.downloadLogsFile('txt');
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 dir-rtl font-sans">
          <div className="max-w-2xl w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl space-y-6">
            <div className="flex items-center space-x-4 space-x-reverse text-amber-400">
              <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                <AlertTriangle className="w-10 h-10 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">تنبيه: حدث خطأ أثناء تشغيل الواجهة</h1>
                <p className="text-sm text-slate-400 mt-1">
                  تم حماية التطبيق ومنع توقفه بالكامل بواسطة جدار الأخطاء (Global Error Boundary).
                </p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 text-sm text-red-300 font-mono overflow-x-auto">
              <p className="font-semibold text-red-400 mb-1">
                {this.state.error?.name}: {this.state.error?.message}
              </p>
              {this.state.showDetails && (
                <pre className="mt-3 text-xs text-slate-400 whitespace-pre-wrap font-mono leading-relaxed border-t border-slate-800 pt-3">
                  {this.state.error?.stack}
                  {'\n\nComponent Stack:'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <Bug className="w-4 h-4" />
                {this.state.showDetails ? 'إخفاء التفاصيل البرمجية' : 'عرض التفاصيل البرمجية الكاملة'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={this.handleDownloadLog}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  تصدير سجل الأخطاء
                </button>

                <button
                  onClick={this.handleClearCacheAndReset}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  إعادة ضبط المؤقتة
                </button>

                <button
                  onClick={this.handleReset}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  <RefreshCw className="w-4 h-4" />
                  إعادة تشغيل الواجهة
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
