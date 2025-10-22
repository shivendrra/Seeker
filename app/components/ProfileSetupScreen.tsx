import React, { useState } from 'react';
import { User, UserProfileData } from '../types';
import { createUserProfile } from '../services/firebaseService';
import { LogoIcon } from './icons';

interface ProfileSetupScreenProps {
  user: User;
}

const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ user }) => {
  const [displayName, setDisplayName] = useState('');
  const [profession, setProfession] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Your name is required.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const profileData: UserProfileData = {
        displayName,
        profession,
        description,
      };
      await createUserProfile(user, profileData);
      // After successful creation, the useAuth hook will detect the displayName
      // and automatically transition the user to the main app.
    } catch (err) {
      console.error("Error creating profile:", err);
      setError("Failed to save profile. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
            <LogoIcon className="mx-auto h-12 w-auto text-indigo-600" />
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                Complete Your Profile
            </h2>
            <p className="mt-2 text-md text-gray-600">
                Tell us a bit about yourself to get started.
            </p>
        </div>
        <div className="bg-white py-8 px-10 shadow-xl rounded-xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="displayName"
                  id="displayName"
                  autoComplete="name"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-gray-200 px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="profession" className="block text-sm font-medium text-gray-700">
                Profession (e.g., Journalist, Lawyer, Researcher)
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="profession"
                  id="profession"
                  autoComplete="organization-title"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-gray-200 px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                About Yourself
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A short bio..."
                  className="block w-full appearance-none rounded-lg border border-gray-200 px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                />
              </div>
            </div>
            
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-lg border border-transparent bg-indigo-600 py-3 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 transition-colors"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-t-white border-gray-200 rounded-full animate-spin"></div> : 'Save and Continue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupScreen;