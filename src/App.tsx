import React, { useState } from 'react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { TitleBar } from './components/common/TitleBar';
import { Header } from './components/common/Header';
import { Sidebar, ViewType } from './components/common/Sidebar';
import { LicenseStatusBanner } from './components/common/LicenseStatusBanner';

// Views
import { DashboardView } from './components/views/DashboardView';
import { AttendanceView } from './components/views/AttendanceView';
import { ScannedDocsView } from './components/views/ScannedDocsView';
import { EmployeesView } from './components/views/EmployeesView';
import { DevicesView } from './components/views/DevicesView';
import { ReportsView } from './components/views/ReportsView';
import { AuditLogView } from './components/views/AuditLogView';
import { SettingsView } from './components/views/SettingsView';
import { SubscriptionExpiredView } from './components/views/SubscriptionExpiredView';
import { InterModulePipelineView } from './components/integration/InterModulePipelineView';

// Modals
import { EmployeeFormModal } from './components/forms/EmployeeFormModal';
import { ManualLogModal } from './components/forms/ManualLogModal';
import { AddExitReasonModal } from './components/forms/AddExitReasonModal';
import { LicenseActivationModal } from './components/forms/LicenseActivationModal';
import { DocumentScannerModal } from './components/forms/DocumentScannerModal';
import { MobileGPSPunchModal } from './components/attendance/MobileGPSPunchModal';
import { ESSManagementModal } from './components/ess/ESSManagementModal';
import { QRLicenseModal } from './components/license/QRLicenseModal';

import { useSubscriptionStore } from './stores/useSubscriptionStore';
import { useLanguageStore } from './stores/useLanguageStore';
import { Employee } from './types';

function AppContent() {
  const { isLocked } = useSubscriptionStore();
  const { dir, t, isRtl } = useLanguageStore();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [dataVersion, setDataVersion] = useState(0);

  // Modals state
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);

  const [isQuickLogModalOpen, setIsQuickLogModalOpen] = useState(false);
  const [selectedEmpForLog, setSelectedEmpForLog] = useState<string | undefined>(undefined);

  const [isExitReasonModalOpen, setIsExitReasonModalOpen] = useState(false);
  const [selectedEmpForExit, setSelectedEmpForExit] = useState<string | undefined>(undefined);

  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [selectedEmpForScanner, setSelectedEmpForScanner] = useState<string | undefined>(undefined);

  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [isGPSModalOpen, setIsGPSModalOpen] = useState(false);
  const [isESSModalOpen, setIsESSModalOpen] = useState(false);
  const [isQRLicenseModalOpen, setIsQRLicenseModalOpen] = useState(false);

  // If subscription is expired or clock tampering detected, lock entire system!
  if (isLocked) {
    return <SubscriptionExpiredView />;
  }

  const handleOpenEmployeeModal = (emp?: Employee) => {
    setEmployeeToEdit(emp || null);
    setIsEmployeeModalOpen(true);
  };

  const handleOpenQuickLogModal = (empId?: string) => {
    setSelectedEmpForLog(empId);
    setIsQuickLogModalOpen(true);
  };

  const handleOpenExitReasonModal = (empId?: string) => {
    setSelectedEmpForExit(empId);
    setIsExitReasonModalOpen(true);
  };

  const handleOpenScannerModal = (empId?: string) => {
    setSelectedEmpForScanner(empId);
    setIsScannerModalOpen(true);
  };

  const handleRefreshData = () => {
    setDataVersion((v) => v + 1);
  };

  const viewTitles: Record<ViewType, string> = {
    dashboard: t.navDashboard,
    attendance: t.navAttendance,
    scannedDocs: t.ocrArchiveTitle,
    employees: t.navEmployees,
    devices: t.navDevices,
    reports: t.navReports,
    audit: t.navAudit,
    settings: t.navSettings,
    ess: isRtl ? 'بوابة الخدمة الذاتية للموظفين (ESS)' : 'Employee Self-Service (ESS)',
    pipeline: isRtl ? 'جسر ربط الموديولات ونظام الـ ERP' : 'Inter-Module Integration Bridge',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none relative overflow-hidden" dir={dir}>
      {/* Background Decorative Gradients for Frosted Glass Depth */}
      <div className={`fixed -top-24 ${isRtl ? '-right-24' : '-left-24'} w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none z-0`}></div>
      <div className={`fixed -bottom-24 ${isRtl ? '-left-24' : '-right-24'} w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none z-0`}></div>

      {/* Top Desktop Window Bar */}
      <TitleBar onOpenLicenseModal={() => setIsQRLicenseModalOpen(true)} />

      {/* Subscription Warning Banner if < 7 days left */}
      <LicenseStatusBanner onOpenLicenseModal={() => setIsQRLicenseModalOpen(true)} />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden z-10">
        {/* Navigation Sidebar */}
        <Sidebar
          currentView={currentView}
          onSelectView={(view) => {
            if (view === 'ess') {
              setIsESSModalOpen(true);
            } else {
              setCurrentView(view);
            }
          }}
          onOpenLicenseModal={() => setIsQRLicenseModalOpen(true)}
        />

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Header
            currentViewTitle={viewTitles[currentView]}
            onOpenQuickLogModal={() => handleOpenQuickLogModal()}
            onOpenExitReasonModal={() => handleOpenExitReasonModal()}
            onOpenScannerModal={() => handleOpenScannerModal()}
          />

          <main className="p-6 flex-1 max-w-7xl w-full mx-auto" key={dataVersion}>
            {currentView === 'dashboard' && (
              <DashboardView
                onOpenQuickLogModal={() => handleOpenQuickLogModal()}
                onOpenExitReasonModal={() => handleOpenExitReasonModal()}
                onNavigateView={setCurrentView}
              />
            )}

            {currentView === 'attendance' && (
              <AttendanceView
                onOpenQuickLogModal={() => handleOpenQuickLogModal()}
                onOpenExitReasonModal={() => handleOpenExitReasonModal()}
                onOpenScannerModal={(empId) => handleOpenScannerModal(empId)}
              />
            )}

            {currentView === 'pipeline' && <InterModulePipelineView />}

            {currentView === 'scannedDocs' && <ScannedDocsView />}

            {currentView === 'employees' && (
              <EmployeesView
                onOpenEmployeeModal={handleOpenEmployeeModal}
                onOpenQuickLogModal={handleOpenQuickLogModal}
                onOpenExitReasonModal={handleOpenExitReasonModal}
                onOpenScannerModal={handleOpenScannerModal}
              />
            )}

            {currentView === 'devices' && <DevicesView />}

            {currentView === 'reports' && <ReportsView />}

            {currentView === 'audit' && <AuditLogView />}

            {currentView === 'settings' && (
              <SettingsView onOpenLicenseModal={() => setIsQRLicenseModalOpen(true)} />
            )}
          </main>
        </div>
      </div>

      {/* Shared Modals */}
      <EmployeeFormModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        onSuccess={handleRefreshData}
        employeeToEdit={employeeToEdit}
      />

      <ManualLogModal
        isOpen={isQuickLogModalOpen}
        onClose={() => {
          setIsQuickLogModalOpen(false);
          setSelectedEmpForLog(undefined);
        }}
        onSuccess={handleRefreshData}
        initialEmployeeId={selectedEmpForLog}
      />

      <AddExitReasonModal
        isOpen={isExitReasonModalOpen}
        onClose={() => {
          setIsExitReasonModalOpen(false);
          setSelectedEmpForExit(undefined);
        }}
        onSuccess={handleRefreshData}
        initialEmployeeId={selectedEmpForExit}
      />

      <DocumentScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => {
          setIsScannerModalOpen(false);
          setSelectedEmpForScanner(undefined);
        }}
        onSuccess={handleRefreshData}
        initialEmployeeId={selectedEmpForScanner}
      />

      <MobileGPSPunchModal
        isOpen={isGPSModalOpen}
        onClose={() => setIsGPSModalOpen(false)}
        onSuccess={handleRefreshData}
      />

      <ESSManagementModal
        isOpen={isESSModalOpen}
        onClose={() => setIsESSModalOpen(false)}
      />

      <QRLicenseModal
        isOpen={isQRLicenseModalOpen}
        onClose={() => setIsQRLicenseModalOpen(false)}
        onActivated={handleRefreshData}
      />

      <LicenseActivationModal
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
      />
    </div>
  );
}


export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
