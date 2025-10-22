import React, { useState } from 'react';
import { User, ChatSession } from '../types';
import { logout } from '../services/firebaseService';
import {
  LogoIcon,
  DocumentIcon,
  SettingsIcon,
  UserCircleIcon,
  LogoutIcon,
  DeleteIcon,
} from './icons';
import ConfirmationDialog from './ConfirmationDialog';

interface LeftSidebarProps {
  user: User;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onNewSession: () => void;
  onSelectSession: (sessionId: string) => void;
  onOpenSettings: () => void;
  onDeleteSession: (sessionId: string) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  user,
  sessions,
  activeSessionId,
  onNewSession,
  onSelectSession,
  onOpenSettings,
  onDeleteSession,
}) => {
  const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null);

  const handleDeleteClick = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessionToDelete(session);
  };

  const confirmDelete = () => {
    if (sessionToDelete) {
      onDeleteSession(sessionToDelete.id);
      setSessionToDelete(null);
    }
  };

  return (
    <>
      <div className="w-72 bg-gray-50 dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 flex flex-col font-[500] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9">
            <LogoIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-zinc-100 leading-none">
            Seeker
          </h1>
        </div>

        {/* New Research Button */}
        <div className="p-3">
          <button
            onClick={onNewSession}
            className="w-full flex items-center gap-2.5 p-3 text-gray-700 dark:text-zinc-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 font-semibold tracking-wide transition-all"
          >
            <div className="flex items-center justify-center w-5 h-5">
              <DocumentIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="leading-tight">New Research</span>
          </button>
        </div>

        {/* Sessions List */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <a
                key={session.id}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onSelectSession(session.id);
                }}
                className={`group flex items-center justify-between p-3 text-sm truncate transition-colors ${
                  activeSessionId === session.id
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 font-semibold'
                    : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="flex items-center justify-center w-5 h-5">
                    <DocumentIcon className="w-4.5 h-4.5 text-gray-500 dark:text-zinc-500" />
                  </div>
                  <span className="truncate leading-snug">{session.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteClick(session, e)}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 focus:opacity-100 p-1.5 rounded-md transition-all duration-150 transform hover:scale-110 flex items-center justify-center"
                  aria-label={`Delete session ${session.title}`}
                >
                  <DeleteIcon className="w-4 h-4" />
                </button>
              </a>
            ))
          ) : (
            <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-zinc-400 italic">
              No research sessions yet. Start a new one to begin!
            </div>
          )}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 mb-4 p-2 rounded-lg">
            <div className="flex items-center justify-center w-9 h-9 overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="User"
                  className="w-9 h-9 object-cover rounded-full"
                />
              ) : (
                <UserCircleIcon className="w-7 h-7 text-gray-500 dark:text-zinc-400" />
              )}
            </div>
            <span className="font-medium text-gray-800 dark:text-zinc-200 truncate leading-tight">
              {user.displayName || user.email}
            </span>
          </div>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-2.5 p-3 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-800 mb-2 transition-all"
          >
            <div className="flex items-center justify-center w-5 h-5">
              <SettingsIcon className="w-5 h-5 text-gray-600 dark:text-zinc-400" />
            </div>
            <span className="leading-tight">Settings</span>
          </button>

          {/* Logout */}
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2.5 p-3 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-800 transition-all"
          >
            <div className="flex items-center justify-center w-5 h-5">
              <LogoutIcon className="w-5 h-5 text-gray-600 dark:text-zinc-400" />
            </div>
            <span className="leading-tight">Logout</span>
          </button>
        </div>
      </div>

      {sessionToDelete && (
        <ConfirmationDialog
          isOpen={!!sessionToDelete}
          onClose={() => setSessionToDelete(null)}
          onConfirm={confirmDelete}
          title="Delete Research Session"
          message={
            <>
              Are you sure you want to permanently delete the session:
              <strong className="font-semibold text-gray-800 dark:text-zinc-100 block mt-2">
                {sessionToDelete.title}
              </strong>
              This action cannot be undone.
            </>
          }
        />
      )}
    </>
  );
};

export default LeftSidebar;
