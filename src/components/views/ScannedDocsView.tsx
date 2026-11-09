import React, { useState, useEffect } from 'react';
import { sqliteAdapter } from '../../db/sqliteAdapter';
import { ScannedDocumentRecord, Employee } from '../../types';
import { DocumentScannerModal } from '../forms/DocumentScannerModal';
import { Badge } from '../common/Badge';
import { useLanguageStore } from '../../stores/useLanguageStore';
import {
  Scan,
  Search,
  Stethoscope,
  FileCheck2,
  Briefcase,
  Layers,
  Calendar,
  User,
  Eye,
  Trash2,
  Sparkles,
  Building,
  Hash,
} from 'lucide-react';

export const ScannedDocsView: React.FC = () => {
  const { t, isRtl } = useLanguageStore();
  const [documents, setDocuments] = useState<ScannedDocumentRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'SICK_LEAVE' | 'VACATION' | 'MISSION' | 'GENERAL'>('ALL');

  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<ScannedDocumentRecord | null>(null);

  const loadData = () => {
    const docs = (sqliteAdapter.getTable('scannedDocuments') as unknown as ScannedDocumentRecord[]) || [];
    const emps = (sqliteAdapter.getTable('employees') as unknown as Employee[]) || [];
    setDocuments(docs);
    setEmployees(emps);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteDoc = (id: string) => {
    const confirmMsg = isRtl
      ? 'هل أنت تأكد من رغبتك في حذف هذا المستند الممسوح ضوئياً؟'
      : 'Are you sure you want to delete this scanned document?';
    if (window.confirm(confirmMsg)) {
      const updated = documents.filter((d) => d.id !== id);
      sqliteAdapter.updateTable('scannedDocuments', updated as any);
      loadData();
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesCategory = categoryFilter === 'ALL' || doc.category === categoryFilter;

    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (doc.employeeName || '').toLowerCase().includes(term) ||
      (doc.employeeCode || '').toLowerCase().includes(term) ||
      (doc.documentType || '').toLowerCase().includes(term) ||
      (doc.reasonOrDiagnosis || '').toLowerCase().includes(term) ||
      (doc.issuingAuthority || '').toLowerCase().includes(term) ||
      (doc.referenceNumber || '').toLowerCase().includes(term);

    return matchesCategory && matchesSearch;
  });

  // Metrics
  const totalCount = documents.length;
  const sickCount = documents.filter((d) => d.category === 'SICK_LEAVE').length;
  const vacationCount = documents.filter((d) => d.category === 'VACATION').length;
  const missionCount = documents.filter((d) => d.category === 'MISSION').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-white/10 rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
            <Scan className="w-8 h-8" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">{t.ocrArchiveTitle}</h1>
              <Badge variant="cyan">
                <Sparkles className="w-3 h-3 inline mr-1 text-amber-400" />
                {isRtl ? 'مدعوم بالذكاء الاصطناعي' : 'AI Powered'}
              </Badge>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              {isRtl
                ? 'إدارة وقراءة التقارير الطبية، أذونات الخروج، والمأموريات المرفوعة ومتابعة ارتباطها بالموظفين وسجلات الحضور'
                : 'Manage and convert medical reports, leaves, and missions to automated employee attendance links'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsScannerModalOpen(true)}
          className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-xs rounded-2xl shadow-xl shadow-cyan-500/25 flex items-center gap-2 transition-all cursor-pointer transform hover:scale-[1.02]"
        >
          <Scan className="w-4 h-4" />
          <span>{t.scanDoc}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[11px] font-medium block">
              {isRtl ? 'إجمالي المستندات الممسوحة' : 'Total Scanned Docs'}
            </span>
            <span className="text-xl font-black text-white">{totalCount}</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[11px] font-medium block">
              {isRtl ? 'التقارير والإجازات المرضية' : 'Sick Leaves'}
            </span>
            <span className="text-xl font-black text-rose-300">{sickCount}</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[11px] font-medium block">
              {isRtl ? 'طلبات الإجازات الاعتادية' : 'Vacations'}
            </span>
            <span className="text-xl font-black text-amber-300">{vacationCount}</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-purple-500/20 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[11px] font-medium block">
              {isRtl ? 'أوامر المأموريات الرسمية' : 'Official Missions'}
            </span>
            <span className="text-xl font-black text-purple-300">{missionCount}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer ${
              categoryFilter === 'ALL'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            {isRtl ? 'الكل' : 'All'} ({totalCount})
          </button>

          <button
            onClick={() => setCategoryFilter('SICK_LEAVE')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === 'SICK_LEAVE'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>{t.sickLeave} ({sickCount})</span>
          </button>

          <button
            onClick={() => setCategoryFilter('VACATION')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === 'VACATION'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>{t.vacation} ({vacationCount})</span>
          </button>

          <button
            onClick={() => setCategoryFilter('MISSION')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === 'MISSION'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>{t.mission} ({missionCount})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className={`w-4 h-4 text-slate-400 absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5`} />
          <input
            type="text"
            placeholder={t.searchEmployeePlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full ${isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none`}
          />
        </div>
      </div>

      {/* Documents List Table / Cards */}
      {filteredDocs.length === 0 ? (
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-12 text-center space-y-3">
          <Scan className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">{t.noData}</h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            {isRtl
              ? 'يمكنك استخدام زر "الماسح الضوئي الذكي" أعلى الصفحة لسحب وتقريغ مستندات الإجازات والتقرير والمأموريات.'
              : 'Use the Smart Document Scanner button to upload and process leave & medical documents.'}
          </p>
          <button
            onClick={() => setIsScannerModalOpen(true)}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            {t.scanDoc}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-slate-900 border border-white/10 hover:border-cyan-500/40 rounded-2xl p-4 space-y-3 transition-all hover:shadow-xl hover:shadow-cyan-500/5 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    {doc.category === 'SICK_LEAVE' && (
                      <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        <Stethoscope className="w-4 h-4" />
                      </span>
                    )}
                    {doc.category === 'VACATION' && (
                      <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <FileCheck2 className="w-4 h-4" />
                      </span>
                    )}
                    {doc.category === 'MISSION' && (
                      <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        <Briefcase className="w-4 h-4" />
                      </span>
                    )}
                    {doc.category === 'GENERAL' && (
                      <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        <Layers className="w-4 h-4" />
                      </span>
                    )}

                    <div>
                      <h3 className="font-bold text-white text-xs">{doc.documentType}</h3>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(doc.createdAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                      </span>
                    </div>
                  </div>

                  <Badge
                    variant={
                      doc.category === 'SICK_LEAVE'
                        ? 'rose'
                        : doc.category === 'VACATION'
                        ? 'amber'
                        : doc.category === 'MISSION'
                        ? 'purple'
                        : 'cyan'
                    }
                  >
                    {doc.category === 'SICK_LEAVE'
                      ? t.sickLeave
                      : doc.category === 'VACATION'
                      ? t.vacation
                      : doc.category === 'MISSION'
                      ? t.mission
                      : t.general}
                  </Badge>
                </div>

                {/* Linked Employee Information */}
                <div className="bg-slate-950 rounded-xl p-2.5 flex items-center gap-2.5 border border-white/5">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-cyan-300 font-bold text-xs shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-slate-200 font-bold text-xs truncate block">{doc.employeeName || (isRtl ? 'غير معرف' : 'Unknown')}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{t.employeeId}: {doc.employeeCode || 'N/A'}</span>
                  </div>
                </div>

                {/* Extracted Details */}
                <div className="space-y-1 text-[11px] text-slate-300">
                  <p className="line-clamp-2 bg-white/5 p-2 rounded-lg text-slate-200 font-medium">
                    <strong className="text-cyan-400">{t.reasonOrDiagnosis}:</strong> {doc.reasonOrDiagnosis || doc.summary}
                  </p>

                  {doc.issuingAuthority && (
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                      <Building className="w-3 h-3 text-slate-500" />
                      <span>{t.issuingAuthority}: {doc.issuingAuthority}</span>
                    </div>
                  )}

                  {doc.referenceNumber && (
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono">
                      <Hash className="w-3 h-3 text-slate-500" />
                      <span>{t.referenceNumber}: {doc.referenceNumber}</span>
                    </div>
                  )}

                  {doc.startDate && (
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{isRtl ? 'الفترة:' : 'Period:'} {doc.startDate} {doc.endDate ? `${isRtl ? 'إلى' : 'to'} ${doc.endDate}` : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 mt-2">
                <button
                  onClick={() => setSelectedPreviewDoc(doc)}
                  className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-[11px] rounded-xl flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'معاينة الصورة/الملف' : 'Preview Document'}</span>
                </button>

                <button
                  onClick={() => handleDeleteDoc(doc.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-all"
                  title={t.delete}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal for Scanned File */}
      {selectedPreviewDoc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 rounded-3xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">{selectedPreviewDoc.documentType}</h3>
                <p className="text-xs text-slate-400">
                  {t.employeeName}: {selectedPreviewDoc.employeeName} | {t.documentDate}: {selectedPreviewDoc.documentDate}
                </p>
              </div>
              <button
                onClick={() => setSelectedPreviewDoc(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer text-xs"
              >
                {t.close} ✕
              </button>
            </div>

            {/* Display Image or PDF data if available */}
            {selectedPreviewDoc.fileData ? (
              <div className="bg-black rounded-2xl overflow-hidden border border-white/10 max-h-96 flex items-center justify-center p-2">
                <img
                  src={selectedPreviewDoc.fileData}
                  alt={selectedPreviewDoc.fileName}
                  className="max-h-88 object-contain rounded-xl"
                />
              </div>
            ) : (
              <div className="p-8 bg-slate-950 rounded-2xl text-center text-slate-400 text-xs">
                {isRtl
                  ? `لا يتوفر معاينة مباشرة. تفاصيل المستند المسجلة: ${selectedPreviewDoc.summary}`
                  : `Direct preview unavailable. Extracted summary: ${selectedPreviewDoc.summary}`}
              </div>
            )}

            <div className="bg-slate-950 p-4 rounded-2xl space-y-2 text-xs text-slate-300 border border-white/5">
              <h4 className="font-bold text-cyan-400">{isRtl ? 'ملخص المستند المسحوب بالذكاء الاصطناعي:' : 'AI Extracted Document Summary:'}</h4>
              <p>{selectedPreviewDoc.summary}</p>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-white/10">
                <div>{t.issuingAuthority}: {selectedPreviewDoc.issuingAuthority || 'N/A'}</div>
                <div>{t.referenceNumber}: {selectedPreviewDoc.referenceNumber || 'N/A'}</div>
                <div>{t.documentDate}: {selectedPreviewDoc.startDate || selectedPreviewDoc.documentDate}</div>
                <div>{isRtl ? 'تاريخ السحب:' : 'Scan Timestamp:'} {new Date(selectedPreviewDoc.createdAt).toLocaleString(isRtl ? 'ar-EG' : 'en-US')}</div>
              </div>
            </div>

            <div className={isRtl ? 'text-left' : 'text-right'}>
              <button
                onClick={() => setSelectedPreviewDoc(null)}
                className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl cursor-pointer text-xs"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Document Scanner Modal */}
      <DocumentScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};

