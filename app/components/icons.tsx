import React from 'react';

// Helper component for Google Material Symbols
const GoogleIcon: React.FC<{ iconName: string; className?: string }> = ({ iconName, className }) => (
  <span className={`material-symbols-outlined flex-shrink-0 ${className}`}>{iconName}</span>
);

export const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <GoogleIcon iconName="search" className={className} />
);

export const DocumentIcon: React.FC<{ className?: string }> = ({ className }) => (
    <GoogleIcon iconName="article" className={className} />
);

export const TraceIcon: React.FC<{ className?: string }> = ({ className }) => (
    <GoogleIcon iconName="terminal" className={className} />
);

export const LogoIcon: React.FC<{ className?: string }> = ({ className = "text-indigo-600" }) => (
    <GoogleIcon iconName="travel_explore" className={className} />
);

export const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
    <GoogleIcon iconName="send" className={className} />
);

export const UserCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <GoogleIcon iconName="account_circle" className={className} />
);

export const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <GoogleIcon iconName="settings" className={className} />
);

export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <GoogleIcon iconName="check_circle" className={className} />
);

export const GoogleLogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
  </svg>
);

export const VisibilityIcon: React.FC<{ className?: string }> = ({ className }) => (
    <GoogleIcon iconName="visibility" className={className} />
);

export const VisibilityOffIcon: React.FC<{ className?: string }> = ({ className }) => (
    <GoogleIcon iconName="visibility_off" className={className} />
);

export const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <GoogleIcon iconName="close" className={className} />
);

export const LogoutIcon: React.FC<{ className?: string }> = ({ className }) => (
    <GoogleIcon iconName="logout" className={className} />
);

export const SourceIcon: React.FC<{ className?: string }> = ({ className }) => (
    <GoogleIcon iconName="menu_book" className={className} />
);

export const LockIcon: React.FC<{ className?: string }> = ({ className }) => (
    <GoogleIcon iconName="lock" className={className} />
);

export const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
    <GoogleIcon iconName="edit" className={className} />
);

export const DeleteIcon: React.FC<{ className?: string }> = ({ className }) => (
    <GoogleIcon iconName="delete" className={className} />
);

export const PaletteIcon: React.FC<{ className?: string }> = ({ className }) => (
    <GoogleIcon iconName="palette" className={className} />
);