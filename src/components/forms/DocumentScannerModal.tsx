import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Employee, ScannedDocumentRecord, AttendanceRecord, ExitReasonRecord } from '../../types';
import { sqliteAdapter } from '../../db/sqliteAdapter';
import { loggerService } from '../../services/loggerService';
import { useLanguageStore } from '../../stores/useLanguageStore';
import {
  Scan,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  User,
  FileCheck2,
  Stethoscope,
  Briefcase,
  Layers,
  RefreshCw,
  FileUp,
} from 'lucide-react';

interface DocumentScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialEmployeeId?: string;
  initialCategory?: 'VACATION' | 'SICK_LEAVE' | 'MISSION' | 'GENERAL';
}

export const DocumentScannerModal: React.FC<DocumentScannerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialEmployeeId,
  initialCategory = 'GENERAL',
}) => {
  if (!isOpen) return null;

  const { t, isRtl } = useLanguageStore();

  const [inputMode, setInputMode] = useState<'upload' | 'camera'>('upload');
  const [selectedCategory, setSelectedCategory] = useState<'VACATION' | 'SICK_LEAVE' | 'MISSION' | 'GENERAL'>(
    initialCategory
  );

  // File state
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');

  // Scanning & AI status
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [scanError, setScanError] = useState<string | null>(null);

  // Extracted Result Form
  const [extractedData, setExtractedData] = useState<{
    documentType: string;
    category: 'VACATION' | 'SICK_LEAVE' | 'MISSION' | 'GENERAL';
    employeeId: string;
    employeeNameCandidate: string;
    employeeCodeCandidate: string;
    documentDate: string;
    startDate: string;
    endDate: string;
    daysOrHoursCount: string;
    departureTime: string;
    returnTime: string;
    reasonOrDiagnosis: string;
    issuingAuthority: string;
    referenceNumber: string;
    approvedByCandidate: string;
    summaryArabic: string;
    confidenceScore: string;
  } | null>(null);

  // Camera stream state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Employees list for selection & matching
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const list = sqliteAdapter.getTable('employees') || [];
    setEmployees(list.filter((e) => e.status === 'ACTIVE'));
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputMode === 'camera' && !extractedData && !isScanning) {
      startCamera();
    } else if (!isOpen || inputMode !== 'camera' || extractedData || isScanning) {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, inputMode, extractedData, isScanning]);

  const resetForm = () => {
    setFileData(null);
    setFileName('');
    setFileType('');
    setIsScanning(false);
    setScanError(null);
    setExtractedData(null);
    stopCamera();
  };

  // Camera Controls
  const startCamera = async () => {
    try {
      setScanError(null);
      stopCamera();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('CAMERA_NOT_SUPPORTED');
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      } catch (firstErr) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play error:', playErr);
        }
        setCameraActive(true);
      } else {
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
            setCameraActive(true);
          }
        }, 150);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      let errorMessage = isRtl
        ? 'تعذر الاتصال بالكاميرا. يرجى التأكد من السماح بإذن الكاميرا من المتصفح، أو استخدام خاصية رفع الملفات.'
        : 'Failed to access camera. Please check camera permissions or select file upload.';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = isRtl
          ? 'تم رفض إذن الوصول للكاميرا. يرجى إعطاء الإذن للكاميرا من إعدادات المتصفح وإعادة المحاولة.'
          : 'Camera permission denied. Please allow camera access in browser settings and retry.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = isRtl
          ? 'لم يتم العثور على كاميرا متصلة بالجهاز. يمكنك اختيار رفع المستند كملف أو تجربة النماذج الجاهزة.'
          : 'No camera device found on this machine. You can upload a document or use sample templates.';
      }

      setScanError(errorMessage);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const captureCameraSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.9);
      setFileData(base64);
      setFileName(`scanned_doc_${Date.now()}.jpg`);
      setFileType('image/jpeg');
      stopCamera();
      processScanDocument(base64, 'image/jpeg');
    }
  };

  // Handle File Selection (PDF, Images)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert(isRtl ? 'حجم الملف كبير جداً. أقل من 15 ميجابايت' : 'File is too large. Max 15MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setFileData(base64);
      setFileName(file.name);
      setFileType(file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/png'));
      processScanDocument(base64, file.type || 'image/png');
    };
    reader.readAsDataURL(file);
  };

  // Sample Documents Generator for direct testing
  const loadSampleDocument = (sampleType: 'SICK' | 'VACATION' | 'MISSION') => {
    let mockName = 'تقرير طبي - إجازة مرضية.jpg';
    let mockCategory: 'SICK_LEAVE' | 'VACATION' | 'MISSION' = 'SICK_LEAVE';

    if (sampleType === 'VACATION') {
      mockName = 'طلب إجازة سنوية معتمدة.jpg';
      mockCategory = 'VACATION';
    } else if (sampleType === 'MISSION') {
      mockName = 'أمر مأمورية خارجية رسمي.jpg';
      mockCategory = 'MISSION';
    }

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 800, 1000);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 800, 100);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.direction = 'rtl';
      ctx.fillText('مستشفى السلام الدولي - الإدارة الطبية والشؤون الوظيفية', 750, 60);

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 28px sans-serif';

      if (sampleType === 'SICK') {
        ctx.fillText('تقرير إجازة مرضية ومعاينة طبيب', 750, 180);
        ctx.font = '20px sans-serif';
        ctx.fillText('اسم الموظف: أحمد محمود علي (كود: 1001)', 750, 240);
        ctx.fillText('التشخيص الطبي: إجهاد حاد ونزلة شعبية تستدعي الراحة التامة', 750, 290);
        ctx.fillText('فترة الراحة الموصى بها: 3 أيام اعتباراً من اليوم', 750, 340);
      } else if (sampleType === 'VACATION') {
        ctx.fillText('نموذج طلب إجازة اعتادية سنوية', 750, 180);
        ctx.font = '20px sans-serif';
        ctx.fillText('اسم الموظف: سارة إبراهيم حسن (كود: 1002)', 750, 240);
        ctx.fillText('المدة: يومان (من تاريخ اليوم إلى الغد)', 750, 340);
      } else {
        ctx.fillText('أمر مأمورية وإذن خروج رسمي', 750, 180);
        ctx.font = '20px sans-serif';
        ctx.fillText('اسم الموظف: خالد عمر الشريف (كود: 1004)', 750, 240);
        ctx.fillText('توقيت المغادرة: 12:30 | العودة المتوقعة: 15:30', 750, 390);
      }

      const base64 = canvas.toDataURL('image/jpeg', 0.9);
      setFileData(base64);
      setFileName(mockName);
      setFileType('image/jpeg');
      setSelectedCategory(mockCategory);
      processScanDocument(base64, 'image/jpeg');
    }
  };

  // Process Document Scan through API
  const processScanDocument = async (base64Str: string, mime: string) => {
    setIsScanning(true);
    setScanError(null);
    setScanStep(isRtl ? 'جاري المسح الضوئي البصري وقراءة النصوص...' : 'Performing OCR scan...');

    try {
      setTimeout(() => {
        setScanStep(isRtl ? 'جاري تحليل المحتوى والتعرف على بيانات الموظف...' : 'Extracting employee info & AI fields...');
      }, 1200);

      const response = await fetch('/api/scan-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: base64Str,
          mimeType: mime,
          categoryHint: selectedCategory,
        }),
      });

      const resData = await response.json();

      if (!resData.success || !resData.data) {
        throw new Error(resData.error || (isRtl ? 'فشل في استخراج البيانات من المستند' : 'Failed to parse document'));
      }

      const data = resData.data;

      let matchedEmpId = initialEmployeeId || '';
      if (!matchedEmpId && (data.employeeNameCandidate || data.employeeCodeCandidate)) {
        const candidateName = (data.employeeNameCandidate || '').toLowerCase();
        const candidateCode = (data.employeeCodeCandidate || '').trim();

        const match = employees.find((emp) => {
          if (candidateCode && (emp.code === candidateCode || emp.biometricId === candidateCode)) return true;
          if (candidateName && (emp.name.toLowerCase().includes(candidateName) || candidateName.includes(emp.name.toLowerCase()))) {
            return true;
          }
          return false;
        });

        if (match) {
          matchedEmpId = match.id;
        }
      }

      if (!matchedEmpId && employees.length > 0) {
        matchedEmpId = employees[0].id;
      }

      const todayStr = new Date().toISOString().split('T')[0];

      setExtractedData({
        documentType: data.documentType || (isRtl ? 'تقرير إداري' : 'Official Document'),
        category: (data.category as any) || selectedCategory || 'GENERAL',
        employeeId: matchedEmpId,
        employeeNameCandidate: data.employeeNameCandidate || '',
        employeeCodeCandidate: data.employeeCodeCandidate || '',
        documentDate: data.documentDate || todayStr,
        startDate: data.startDate || data.documentDate || todayStr,
        endDate: data.endDate || data.startDate || todayStr,
        daysOrHoursCount: data.daysOrHoursCount || '',
        departureTime: data.departureTime || '10:00',
        returnTime: data.returnTime || '14:00',
        reasonOrDiagnosis: data.reasonOrDiagnosis || '',
        issuingAuthority: data.issuingAuthority || '',
        referenceNumber: data.referenceNumber || '',
        approvedByCandidate: data.approvedByCandidate || '',
        summaryArabic: data.summaryArabic || (isRtl ? 'تم سحب المستند بنجاح' : 'Document scanned successfully'),
        confidenceScore: data.confidenceScore || 'HIGH',
      });
    } catch (err: any) {
      console.error('Scan Error:', err);
      setScanError(err.message || (isRtl ? 'حدث خطأ أثناء معالجة المستند' : 'Error processing document'));
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveAndLink = () => {
    if (!extractedData) return;

    if (!extractedData.employeeId) {
      alert(isRtl ? 'يرجى اختيار الموظف المرتبط بهذا المستند.' : 'Please select an employee');
      return;
    }

    const selectedEmp = employees.find((e) => e.id === extractedData.employeeId);
    if (!selectedEmp) {
      alert(isRtl ? 'الموظف المختار غير موجود.' : 'Selected employee not found');
      return;
    }

    const nowIso = new Date().toISOString();
    const docId = `scan-${Date.now()}`;

    let createdAttendanceId: string | undefined = undefined;
    let createdExitReasonId: string | undefined = undefined;

    if (extractedData.category === 'SICK_LEAVE' || extractedData.category === 'VACATION') {
      const attendanceList = sqliteAdapter.getTable('attendance') || [];
      const targetDate = extractedData.startDate || extractedData.documentDate;

      const existingAtt = attendanceList.find(
        (a) => a.employeeId === selectedEmp.id && a.date === targetDate
      );

      const leaveStatusNote =
        extractedData.category === 'SICK_LEAVE'
          ? `Sick leave via scanned report (${extractedData.reasonOrDiagnosis || 'Medical'})`
          : `Vacation leave (${extractedData.reasonOrDiagnosis || 'Leave Request'})`;

      if (existingAtt) {
        createdAttendanceId = existingAtt.id;
        const updatedAtt = attendanceList.map((att) =>
          att.id === existingAtt.id
            ? {
                ...att,
                status: 'LEAVE' as const,
                notes: leaveStatusNote,
                exitReason: extractedData.reasonOrDiagnosis,
              }
            : att
        );
        sqliteAdapter.updateTable('attendance', updatedAtt);
      } else {
        createdAttendanceId = `att-scan-${Date.now()}`;
        const newAtt: AttendanceRecord = {
          id: createdAttendanceId,
          employeeId: selectedEmp.id,
          employeeCode: selectedEmp.code,
          employeeName: selectedEmp.name,
          department: selectedEmp.department,
          date: targetDate,
          lateMinutes: 0,
          overtimeMinutes: 0,
          status: 'LEAVE',
          notes: leaveStatusNote,
          exitReason: extractedData.reasonOrDiagnosis,
        };
        sqliteAdapter.updateTable('attendance', [...attendanceList, newAtt]);
      }
    }

    if (extractedData.category === 'MISSION') {
      const exitReasonsList = sqliteAdapter.getTable('exitReasons') || [];
      createdExitReasonId = `ex-scan-${Date.now()}`;

      const newExitRecord: ExitReasonRecord = {
        id: createdExitReasonId,
        employeeId: selectedEmp.id,
        employeeName: selectedEmp.name,
        date: extractedData.startDate || extractedData.documentDate,
        departureTime: extractedData.departureTime || '10:00',
        returnTime: extractedData.returnTime || '14:00',
        reason: extractedData.reasonOrDiagnosis || 'Official Mission via Scanned Doc',
        approvedBy: extractedData.approvedByCandidate || 'System Admin',
        notes: `Auto-generated via Document Scanner (${extractedData.referenceNumber || fileName})`,
      };

      sqliteAdapter.updateTable('exitReasons', [...exitReasonsList, newExitRecord]);

      const attendanceList = sqliteAdapter.getTable('attendance') || [];
      const targetDate = extractedData.startDate || extractedData.documentDate;
      const existingAtt = attendanceList.find(
        (a) => a.employeeId === selectedEmp.id && a.date === targetDate
      );

      if (existingAtt) {
        createdAttendanceId = existingAtt.id;
        const updatedAtt = attendanceList.map((att) =>
          att.id === existingAtt.id
            ? {
                ...att,
                status: 'EARLY_EXIT' as const,
                exitReason: extractedData.reasonOrDiagnosis || 'Official Mission',
              }
            : att
        );
        sqliteAdapter.updateTable('attendance', updatedAtt);
      } else {
        createdAttendanceId = `att-scan-${Date.now()}`;
        const newAtt: AttendanceRecord = {
          id: createdAttendanceId,
          employeeId: selectedEmp.id,
          employeeCode: selectedEmp.code,
          employeeName: selectedEmp.name,
          department: selectedEmp.department,
          date: targetDate,
          lateMinutes: 0,
          overtimeMinutes: 0,
          status: 'EARLY_EXIT',
          exitReason: extractedData.reasonOrDiagnosis || 'Official Mission',
        };
        sqliteAdapter.updateTable('attendance', [...attendanceList, newAtt]);
      }
    }

    const scannedDocsList = (sqliteAdapter.getTable('scannedDocuments') as unknown as ScannedDocumentRecord[]) || [];

    const newScannedDoc: ScannedDocumentRecord = {
      id: docId,
      employeeId: selectedEmp.id,
      employeeName: selectedEmp.name,
      employeeCode: selectedEmp.code,
      category: extractedData.category,
      documentType: extractedData.documentType,
      documentDate: extractedData.documentDate,
      startDate: extractedData.startDate,
      endDate: extractedData.endDate,
      daysOrHoursCount: extractedData.daysOrHoursCount,
      departureTime: extractedData.departureTime,
      returnTime: extractedData.returnTime,
      reasonOrDiagnosis: extractedData.reasonOrDiagnosis,
      issuingAuthority: extractedData.issuingAuthority,
      referenceNumber: extractedData.referenceNumber,
      approvedBy: extractedData.approvedByCandidate,
      summary: extractedData.summaryArabic,
      fileName: fileName || `scanned_${docId}.png`,
      mimeType: fileType || 'image/png',
      fileData: fileData || undefined,
      createdAt: nowIso,
      linkedAttendanceId: createdAttendanceId,
      linkedExitReasonId: createdExitReasonId,
    };

    sqliteAdapter.updateTable('scannedDocuments', [newScannedDoc, ...scannedDocsList] as any);

    loggerService.logInfo('SCANNER', `Saved document for employee ${selectedEmp.name}`);

    alert(
      isRtl
        ? `تم مسح المستند وتحويل البيانات وربطها بنجاح مع ملف الموظف (${selectedEmp.name})!`
        : `Document processed and linked successfully with (${selectedEmp.name})!`
    );

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isRtl ? 'الماسح الضوئي الذكي للمستندات والتقرير' : 'Smart Document Scanner & OCR'}
      subtitle={
        isRtl
          ? 'سحب وصور وقراءة مستندات الإجازات المرضية والاعتيادية والمأموريات وتحويلها أوتوماتيكياً لبيانات مسجلة'
          : 'Scan medical reports, leaves, and missions to seamlessly convert to structured records'
      }
      maxWidth="max-w-4xl"
    >
      <div className="space-y-5 text-xs">
        {/* Category Selector Tabs */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-2 flex flex-wrap items-center gap-2">
          <span className="text-slate-400 font-bold px-3">{isRtl ? 'نوع المستند:' : 'Document Type:'}</span>

          <button
            onClick={() => setSelectedCategory('SICK_LEAVE')}
            className={`px-3 py-1.5 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'SICK_LEAVE'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'bg-white/5 text-slate-300 hover:text-white'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>{t.sickLeave}</span>
          </button>

          <button
            onClick={() => setSelectedCategory('VACATION')}
            className={`px-3 py-1.5 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'VACATION'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-slate-300 hover:text-white'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>{t.vacation}</span>
          </button>

          <button
            onClick={() => setSelectedCategory('MISSION')}
            className={`px-3 py-1.5 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'MISSION'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                : 'bg-white/5 text-slate-300 hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>{t.mission}</span>
          </button>

          <button
            onClick={() => setSelectedCategory('GENERAL')}
            className={`px-3 py-1.5 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'GENERAL'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                : 'bg-white/5 text-slate-300 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t.general}</span>
          </button>
        </div>

        {/* Input Source Buttons & Camera Canvas */}
        {!extractedData && !isScanning && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <button
                onClick={() => {
                  setInputMode('upload');
                  stopCamera();
                }}
                className={`px-4 py-2 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  inputMode === 'upload'
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>{isRtl ? 'رفع ملف (PDF / صورة)' : 'Upload File (PDF / Image)'}</span>
              </button>

              <button
                onClick={() => {
                  setScanError(null);
                  setInputMode('camera');
                }}
                className={`px-4 py-2 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  inputMode === 'camera'
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>{isRtl ? 'ماسح الكاميرا المباشر' : 'Live Camera Scanner'}</span>
              </button>
            </div>

            {/* Mode 1: File Upload Box */}
            {inputMode === 'upload' && (
              <div className="border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/60 bg-cyan-950/20 rounded-2xl p-8 text-center transition-all space-y-4">
                <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
                  <FileUp className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">
                    {isRtl ? 'اسحب وأسقط ملف المستند هنا، أو قم بالتصفح' : 'Drag & drop document file here, or browse'}
                  </h3>
                  <p className="text-slate-400 text-[11px] mt-1">
                    {isRtl ? 'يدعم PDF والصور حتى 15 ميجابايت' : 'Supports PDF & Image files up to 15MB'}
                  </p>
                </div>

                <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 cursor-pointer transition-all">
                  <Upload className="w-4 h-4" />
                  <span>{isRtl ? 'اختيار المستند من الجهاز' : 'Browse Files'}</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {/* Test Sample Quick Buttons */}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <span className="text-slate-400 font-medium block">
                    {isRtl ? 'أو جرب مع نموذج تجريبي اختباري جاهز:' : 'Or try with a sample document:'}
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => loadSampleDocument('SICK')}
                      className="px-3 py-1.5 bg-rose-500/20 border border-rose-500/30 hover:bg-rose-500/30 text-rose-300 font-semibold rounded-xl cursor-pointer"
                    >
                      {isRtl ? 'تجربة: تقرير طبي مرضية' : 'Sample: Sick Leave'}
                    </button>
                    <button
                      onClick={() => loadSampleDocument('VACATION')}
                      className="px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 text-amber-300 font-semibold rounded-xl cursor-pointer"
                    >
                      {isRtl ? 'تجربة: طلب إجازة سنوية' : 'Sample: Annual Leave'}
                    </button>
                    <button
                      onClick={() => loadSampleDocument('MISSION')}
                      className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 text-purple-300 font-semibold rounded-xl cursor-pointer"
                    >
                      {isRtl ? 'تجربة: إذن مأمورية رسمية' : 'Sample: Mission Slip'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: Live Camera View */}
            {inputMode === 'camera' && (
              <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 text-center space-y-3">
                <div className="relative max-w-lg mx-auto bg-black rounded-xl overflow-hidden border border-white/20 aspect-video flex items-center justify-center">
                  <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                  {!cameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">
                      {isRtl ? 'جاري تفعيل الكاميرا...' : 'Starting camera...'}
                    </div>
                  )}

                  <div className="absolute inset-6 border-2 border-dashed border-cyan-400/70 rounded-xl pointer-events-none flex items-center justify-center">
                    <span className="bg-black/60 px-3 py-1 rounded text-[10px] text-cyan-300 font-bold">
                      {isRtl ? 'قم بمحاذاة ورقة المستند داخل هذا الإطار' : 'Align document inside frame'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={captureCameraSnapshot}
                    disabled={!cameraActive}
                    className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isRtl ? 'التقاط صورة المستند الآن' : 'Capture Document'}</span>
                  </button>

                  <button
                    onClick={stopCamera}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl font-semibold cursor-pointer"
                  >
                    {isRtl ? 'إيقاف الكاميرا' : 'Stop Camera'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading / Scanning Progress */}
        {isScanning && (
          <div className="p-8 bg-cyan-950/30 border border-cyan-500/30 rounded-2xl text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <RefreshCw className="w-16 h-16 text-cyan-400 animate-spin" />
              <Sparkles className="w-6 h-6 text-amber-400 absolute inset-0 m-auto animate-pulse" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                {isRtl ? 'جاري المسح الضوئي وتحليل الذكاء الاصطناعي (Gemini OCR)...' : 'Scanning & AI Analyzing (Gemini OCR)...'}
              </h3>
              <p className="text-cyan-300 font-mono text-xs">{scanStep}</p>
            </div>

            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/10 max-w-md mx-auto">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full w-3/4 animate-pulse rounded-full" />
            </div>
          </div>
        )}

        {/* Scan Error Message */}
        {scanError && (
          <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-2xl space-y-3 text-red-300">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-xs leading-relaxed">{scanError}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-red-500/20">
              <button
                onClick={() => {
                  setScanError(null);
                  startCamera();
                }}
                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-red-400" />
                <span>{isRtl ? 'إعادة محاولة الكاميرا' : 'Retry Camera'}</span>
              </button>

              <button
                onClick={() => {
                  setScanError(null);
                  setInputMode('upload');
                  stopCamera();
                }}
                className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isRtl ? 'التبديل إلى رفع ملف' : 'Switch to Upload'}</span>
              </button>

              <button
                onClick={() => {
                  setScanError(null);
                  loadSampleDocument('SICK');
                }}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{isRtl ? 'تجربة نموذج مستند جاهز' : 'Try Sample Document'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Extracted Data Review & Confirmation Form */}
        {extractedData && !isScanning && (
          <div className="space-y-4 bg-slate-900/60 border border-white/10 rounded-2xl p-5">
            {/* Header Result Banner */}
            <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                  <CheckCircle2 className="w-6 h-6" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-sm">
                      {isRtl ? 'تم استخراج وقراءة المستند بنجاح' : 'Document Parsed Successfully'}
                    </h3>
                    <Badge variant="emerald">{isRtl ? 'دقة عالية' : 'High Accuracy'}</Badge>
                  </div>
                  <p className="text-slate-300 text-[11px] font-mono mt-0.5">{extractedData.summaryArabic}</p>
                </div>
              </div>

              <button
                onClick={resetForm}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl font-semibold cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isRtl ? 'مسح مستند آخر' : 'Scan Another'}</span>
              </button>
            </div>

            {/* Editable Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Linked Employee Selection */}
              <div className="space-y-1.5 md:col-span-2 bg-cyan-950/30 border border-cyan-500/20 rounded-xl p-3">
                <label className="text-cyan-300 font-bold flex items-center gap-1.5">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>{isRtl ? 'ربط المستند بالموظف:' : 'Link to Employee:'}</span>
                </label>
                <select
                  value={extractedData.employeeId}
                  onChange={(e) => setExtractedData({ ...extractedData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/20 rounded-xl font-bold text-white"
                >
                  <option value="">{isRtl ? '-- اختر الموظف --' : '-- Select Employee --'}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({t.employeeId}: {emp.code} | {t.fingerprintId}: {emp.biometricId}) - {emp.department}
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Category & Type */}
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">{isRtl ? 'تصنيف المستند:' : 'Category:'}</label>
                <select
                  value={extractedData.category}
                  onChange={(e) =>
                    setExtractedData({
                      ...extractedData,
                      category: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white font-bold"
                >
                  <option value="SICK_LEAVE">{t.sickLeave}</option>
                  <option value="VACATION">{t.vacation}</option>
                  <option value="MISSION">{t.mission}</option>
                  <option value="GENERAL">{t.general}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">{isRtl ? 'نوع الورقة:' : 'Document Title:'}</label>
                <input
                  type="text"
                  value={extractedData.documentType}
                  onChange={(e) => setExtractedData({ ...extractedData, documentType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white font-semibold"
                />
              </div>

              {/* Document Date & Start/End Dates */}
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">{t.documentDate}:</label>
                <input
                  type="date"
                  value={extractedData.documentDate}
                  onChange={(e) => setExtractedData({ ...extractedData, documentDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl font-mono text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">{isRtl ? 'تاريخ البداية:' : 'Start Date:'}</label>
                <input
                  type="date"
                  value={extractedData.startDate}
                  onChange={(e) => setExtractedData({ ...extractedData, startDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl font-mono text-white"
                />
              </div>

              {extractedData.category === 'MISSION' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold block">{t.departureTime}:</label>
                    <input
                      type="time"
                      value={extractedData.departureTime}
                      onChange={(e) => setExtractedData({ ...extractedData, departureTime: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl font-mono text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold block">{t.returnTime}:</label>
                    <input
                      type="time"
                      value={extractedData.returnTime}
                      onChange={(e) => setExtractedData({ ...extractedData, returnTime: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl font-mono text-white"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">{isRtl ? 'تاريخ النهاية:' : 'End Date:'}</label>
                  <input
                    type="date"
                    value={extractedData.endDate}
                    onChange={(e) => setExtractedData({ ...extractedData, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl font-mono text-white"
                  />
                </div>
              )}

              {/* Issuing Authority & Serial Ref */}
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">{t.issuingAuthority}:</label>
                <input
                  type="text"
                  value={extractedData.issuingAuthority}
                  onChange={(e) => setExtractedData({ ...extractedData, issuingAuthority: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">{t.referenceNumber}:</label>
                <input
                  type="text"
                  value={extractedData.referenceNumber}
                  onChange={(e) => setExtractedData({ ...extractedData, referenceNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl font-mono text-white"
                />
              </div>

              {/* Reason / Diagnosis */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-slate-300 font-semibold block">{t.reasonOrDiagnosis}:</label>
                <textarea
                  rows={2}
                  value={extractedData.reasonOrDiagnosis}
                  onChange={(e) => setExtractedData({ ...extractedData, reasonOrDiagnosis: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white font-medium resize-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
              <span className="text-[11px] text-cyan-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {isRtl ? 'سيتم ربط المستند أوتوماتيكياً بسجل الحضور' : 'Will link automatically to attendance records'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-300 font-bold rounded-xl cursor-pointer text-xs"
                >
                  {t.cancel}
                </button>

                <button
                  onClick={handleSaveAndLink}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all text-xs"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>{t.save}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

