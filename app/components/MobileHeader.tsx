import React from 'react';
import { ChatSession } from '../types';
import { MenuIcon, LogoIcon, TraceIcon } from './icons';

interface MobileHeaderProps {
  onToggleSidebar: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onToggleTraceView: () => void;
  hasTraceDetails: boolean;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onToggleSidebar, sessions, activeSessionId, onToggleTraceView, hasTraceDetails }) => {
  const activeSession = sessions.find(s => s.id === activeSessionId);
  const title = activeSession ? activeSession.title : 'Seeker';

  return (
    <div className="xl:hidden flex items-center justify-between p-3 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-0 z-10">
      <button onClick={onToggleSidebar} className="p-2 text-gray-600 dark:text-zinc-300">
        <MenuIcon className="w-6 h-6" />
      </button>
      <div className="flex items-center gap-2 font-semibold text-gray-800 dark:text-zinc-200">
          <LogoIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-lg truncate">{title}</h1>
      </div>
      <button
        onClick={onToggleTraceView}
        disabled={!hasTraceDetails}
        className="p-2 text-gray-600 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Show details"
      >
        <TraceIcon className="w-6 h-6" />
      </button>
    </div>
  );
};

export default MobileHeader;