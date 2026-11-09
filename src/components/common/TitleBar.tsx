import React from 'react';
import { DesktopTitleBar } from '../desktop/DesktopTitleBar';

interface TitleBarProps {
  onOpenLicenseModal?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({ onOpenLicenseModal }) => {
  return <DesktopTitleBar onOpenLicenseModal={onOpenLicenseModal} />;
};
