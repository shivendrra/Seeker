import React from 'react';
import { User, ChatSession } from '../types';
import { logout } from '../services/firebaseService';
import { LogoIcon, DocumentIcon, SettingsIcon, UserCircleIcon } from './icons';

interface LeftSidebarProps {
  user: User;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onNewSession: () => void;
  onSelectSession: (sessionId: string) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ user, sessions, activeSessionId, onNewSession, onSelectSession }) => {
  return (
    <div className="w-72 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center gap-3">
        <LogoIcon className="w-8 h-8 text-indigo-600" />
        <h1 className="text-xl font-bold text-gray-800">Seeker</h1>
      </div>

      <div className="p-2">
        <button
          onClick={onNewSession}
          className="w-full flex items-center gap-3 p-2 rounded-md text-gray-700 hover:bg-indigo-100 font-semibold"
        >
          <DocumentIcon className="w-5 h-5" />
          <span>New Research</span>
        </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {sessions.map((session) => (
          <a
            key={session.id}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onSelectSession(session.id);
            }}
            className={`flex items-center gap-3 p-2 rounded-md text-sm truncate ${
              activeSessionId === session.id
                ? 'bg-indigo-100 text-indigo-700 font-semibold'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
             <span className="flex-shrink-0 w-5 h-5 text-gray-400">
                <DocumentIcon className="w-5 h-5" />
            </span>
            <span className="truncate">{session.title}</span>
          </a>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          {user.photoURL ? (
            <img src={user.photoURL} alt="User" className="w-9 h-9 rounded-full" />
          ) : (
            <UserCircleIcon className="w-9 h-9 text-gray-500" />
          )}
          <span className="font-medium text-gray-800 truncate">
            {user.displayName || user.email}
          </span>
        </div>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 p-2 rounded-md text-gray-700 hover:bg-gray-200"
        >
          <SettingsIcon className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default LeftSidebar;
