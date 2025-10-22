import React, { useState, useEffect } from 'react';
import { User, UserProfile, UserSettings } from '../types';
import { updateUserSettings, updateUserAccount, reauthenticateAndChangePassword } from '../services/firebaseService';
import { CloseIcon, LogoIcon, UserCircleIcon, LockIcon, SearchIcon, PaletteIcon } from './icons';

interface SettingsScreenProps {
  user: User;
  userProfile: UserProfile;
  onClose: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="space-y-4">
        <h3 className="text-md font-semibold text-gray-800 dark:text-zinc-200 border-b border-gray-200 dark:border-zinc-700 pb-2">{title}</h3>
        <div className="space-y-5 pl-2">
            {children}
        </div>
    </div>
);

const ToggleSwitch: React.FC<{
    id: string;
    label: string;
    description: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ id, label, description, checked, onChange }) => (
    <div className="flex items-center justify-between">
        <div className="flex-grow">
            <label htmlFor={id} className="block text-sm font-medium text-gray-800 dark:text-zinc-200 cursor-pointer">
                {label}
            </label>
            <p className="text-xs text-gray-500 dark:text-zinc-400">{description}</p>
        </div>
        <div className="relative inline-block w-10 ml-4 align-middle select-none transition duration-200 ease-in flex-shrink-0">
            <input
                type="checkbox"
                name={id}
                id={id}
                checked={checked}
                onChange={onChange}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
            />
            <label
                htmlFor={id}
                className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-zinc-600 cursor-pointer"
            ></label>
        </div>
        <style>{`
            .toggle-checkbox:checked { right: 0; border-color: #4f46e5; }
            .toggle-checkbox:checked + .toggle-label { background-color: #4f46e5; }
        `}</style>
    </div>
);

const TabButton: React.FC<{id: string, label: string, icon: React.ReactNode, active: boolean, onClick: () => void}> = ({id, label, icon, active, onClick}) => (
    <button
        type="button"
        role="tab"
        aria-selected={active}
        onClick={onClick}
        className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors ${
            active 
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
                : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700'
        }`}
    >
        {icon}
        <span>{label}</span>
    </button>
);


const SettingsScreen: React.FC<SettingsScreenProps> = ({ user, userProfile, onClose, theme, setTheme }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState<UserSettings>(userProfile.settings || {} as UserSettings);
  const [displayName, setDisplayName] = useState('');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    const initialSettings = {
        defaultJurisdiction: '', defaultDocTypes: '', showTrace: false,
        defaultDateFilter: 'Any Time', defaultSummaryStyle: 'Key Points',
        enableMemory: true, language: 'English', theme: 'light',
        ...userProfile.settings
    };
    setSettings(initialSettings);
    setDisplayName(userProfile.displayName || '');
  }, [userProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setSettings(prev => ({ ...prev, [name]: checked }));
    } else {
        setSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
        await Promise.all([
            updateUserSettings(user.uid, settings),
            updateUserAccount(user, { displayName })
        ]);
        setProfileSuccess('Settings saved successfully!');
        setTimeout(() => setProfileSuccess(null), 3000);
    } catch (err) {
      setProfileError('Failed to save settings. Please try again.');
    } finally {
      setIsProfileLoading(false);
    }
  };
  
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
        setPasswordError("New passwords do not match.");
        return;
    }
    if (newPassword.length < 6) {
        setPasswordError("New password must be at least 6 characters long.");
        return;
    }

    setIsPasswordLoading(true);
    try {
        await reauthenticateAndChangePassword(currentPassword, newPassword);
        setPasswordSuccess("Password changed successfully!");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err: any) {
        if (err.code === 'auth/wrong-password') {
            setPasswordError("Incorrect current password.");
        } else {
            setPasswordError("Failed to change password. Please try again.");
        }
    } finally {
        setIsPasswordLoading(false);
    }
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTheme = e.target.checked ? 'dark' : 'light';
    setTheme(newTheme);
    const newSettings = { ...settings, theme: newTheme };
    setSettings(newSettings);
    updateUserSettings(user.uid, newSettings).catch(err => {
        console.error("Failed to auto-save theme", err);
    });
  };

  const inputStyles = "block w-full rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-gray-900 dark:text-zinc-200 placeholder-gray-400 dark:placeholder-zinc-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(4px)' }}>
      <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-2xl w-full max-w-4xl relative animate-fade-in-up flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-zinc-700 flex-shrink-0">
            <div className="flex items-center gap-3">
                <LogoIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-zinc-100">Settings</h2>
            </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all transform hover:scale-110">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto flex min-h-0">
            <nav className="w-56 p-4 border-r border-gray-200 dark:border-zinc-700 flex-shrink-0 space-y-2">
                <TabButton id="profile" label="Profile" icon={<UserCircleIcon className="w-5 h-5" />} active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
                <TabButton id="security" label="Security" icon={<LockIcon className="w-5 h-5" />} active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
                <TabButton id="research" label="Research" icon={<SearchIcon className="w-5 h-5" />} active={activeTab === 'research'} onClick={() => setActiveTab('research')} />
                <TabButton id="appearance" label="Appearance" icon={<PaletteIcon className="w-5 h-5" />} active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} />
            </nav>

            <div className="flex-1 overflow-y-auto">
                {activeTab === 'profile' && (
                    <form onSubmit={handleProfileSave} className="p-8 space-y-8">
                        <FormSection title="Profile Information">
                            <div>
                                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Display Name</label>
                                <input type="text" name="displayName" id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputStyles} />
                            </div>
                        </FormSection>
                         <div className="flex items-center justify-end gap-4 pt-5 border-t border-gray-200 dark:border-zinc-700">
                             <div className="flex-grow text-sm">
                                {profileError && <p className="text-red-600">{profileError}</p>}
                                {profileSuccess && <p className="text-green-600">{profileSuccess}</p>}
                             </div>
                            <button type="submit" disabled={isProfileLoading} className="inline-flex items-center justify-center rounded-lg border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400">
                                {isProfileLoading ? <div className="w-5 h-5 border-2 border-t-white border-gray-200 rounded-full animate-spin"></div> : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                )}
                 {activeTab === 'security' && (
                     <form onSubmit={handleChangePassword} className="p-8 space-y-8">
                        <FormSection title="Change Password">
                            <div>
                                <label htmlFor="currentPassword"className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Current Password</label>
                                <input type="password" name="currentPassword" id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputStyles} required />
                            </div>
                            <div>
                                <label htmlFor="newPassword"className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">New Password</label>
                                <input type="password" name="newPassword" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputStyles} required />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword"className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Confirm New Password</label>
                                <input type="password" name="confirmPassword" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputStyles} required />
                            </div>
                        </FormSection>
                        <div className="flex items-center justify-end gap-4 pt-5 border-t border-gray-200 dark:border-zinc-700">
                             <div className="flex-grow text-sm">
                                {passwordError && <p className="text-red-600">{passwordError}</p>}
                                {passwordSuccess && <p className="text-green-600">{passwordSuccess}</p>}
                             </div>
                            <button type="submit" disabled={isPasswordLoading} className="inline-flex items-center justify-center rounded-lg border border-transparent bg-gray-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-500">
                                {isPasswordLoading ? <div className="w-5 h-5 border-2 border-t-white border-gray-200 rounded-full animate-spin"></div> : 'Change Password'}
                            </button>
                        </div>
                    </form>
                )}
                {activeTab === 'research' && (
                    <form onSubmit={handleProfileSave} className="p-8 space-y-8">
                        <FormSection title="Research Preferences">
                            <div>
                                <label htmlFor="defaultJurisdiction" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Default Jurisdiction</label>
                                <input type="text" name="defaultJurisdiction" id="defaultJurisdiction" value={settings.defaultJurisdiction} onChange={handleChange} placeholder="e.g., India, USA, UK" className={inputStyles} />
                            </div>
                             <div>
                                <label htmlFor="defaultDateFilter" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Default Date Filter</label>
                                <input type="text" name="defaultDateFilter" id="defaultDateFilter" value={settings.defaultDateFilter} onChange={handleChange} placeholder="e.g., Past Year, Since 2020" className={inputStyles} />
                            </div>
                             <div>
                                <label htmlFor="defaultSummaryStyle" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Default Summary Style</label>
                                <select name="defaultSummaryStyle" id="defaultSummaryStyle" value={settings.defaultSummaryStyle} onChange={handleChange} className={inputStyles}>
                                    <option>Key Points</option><option>Brief</option><option>Detailed</option>
                                </select>
                            </div>
                             <div>
                                <label htmlFor="defaultDocTypes" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Default Document Types</label>
                                <textarea name="defaultDocTypes" id="defaultDocTypes" rows={2} value={settings.defaultDocTypes} onChange={handleChange} placeholder="e.g., legal judgment, academic paper" className={inputStyles} />
                                 <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">Comma-separated list of document types to prioritize.</p>
                            </div>
                        </FormSection>
                        <FormSection title="Agent Behavior">
                            <ToggleSwitch id="showTrace" label="Show AI Agent Trace" description="Display the plan and steps for auditability." checked={settings.showTrace} onChange={handleChange} />
                            <ToggleSwitch id="enableMemory" label="Enable Long-Term Memory" description="Allow the agent to remember context from past sessions." checked={settings.enableMemory} onChange={handleChange} />
                        </FormSection>
                         <div className="flex items-center justify-end gap-4 pt-5 border-t border-gray-200 dark:border-zinc-700">
                             <div className="flex-grow text-sm">
                                {profileError && <p className="text-red-600">{profileError}</p>}
                                {profileSuccess && <p className="text-green-600">{profileSuccess}</p>}
                             </div>
                            <button type="submit" disabled={isProfileLoading} className="inline-flex items-center justify-center rounded-lg border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400">
                                {isProfileLoading ? <div className="w-5 h-5 border-2 border-t-white border-gray-200 rounded-full animate-spin"></div> : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                )}
                {activeTab === 'appearance' && (
                    <div className="p-8 space-y-8">
                        <FormSection title="Theme">
                            <ToggleSwitch id="theme" label="Dark Mode" description="Reduce eye strain in low-light conditions." checked={theme === 'dark'} onChange={handleThemeChange} />
                        </FormSection>
                    </div>
                )}
            </div>
        </div>
      </div>
       <style>{`
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
       `}</style>
    </div>
  );
};

export default SettingsScreen;