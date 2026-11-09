import React from 'react';
import { SettingsView } from '../components/views/SettingsView';

interface SettingsPageProps {
  onOpenLicenseModal?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onOpenLicenseModal = () => {} }) => {
  return <SettingsView onOpenLicenseModal={onOpenLicenseModal} />;
};

export default SettingsPage;
