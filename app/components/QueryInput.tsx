import React, { useState, useRef, useEffect } from 'react';
import { SendIcon } from './icons';

interface QueryInputProps {
  onSend: (query: string) => void;
  isLoading: boolean;
  activeSessionId: string | null;
}

const QueryInput: React.FC<QueryInputProps> = ({ onSend, isLoading, activeSessionId }) => {
  const [query, setQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const disabled = !activeSessionId;

  const getStorageKey = (sessionId: string | null) => sessionId ? `autosave_query_${sessionId}` : null;

  // Restore saved query on session change
  useEffect(() => {
    const storageKey = getStorageKey(activeSessionId);
    if (storageKey) {
      const savedQuery = localStorage.getItem(storageKey);
      setQuery(savedQuery || '');
    } else {
      setQuery('');
    }
  }, [activeSessionId]);

  // Auto-save query every 15 seconds
  useEffect(() => {
    const storageKey = getStorageKey(activeSessionId);
    if (!storageKey) return;

    const intervalId = setInterval(() => {
      // Use a ref to get the latest query value inside setInterval
      const currentQuery = textareaRef.current?.value || '';
      if (currentQuery.trim()) {
        localStorage.setItem(storageKey, currentQuery);
      } else {
        // Also remove if user clears the input manually
        localStorage.removeItem(storageKey);
      }
    }, 15000); // 15 seconds

    return () => clearInterval(intervalId);
  }, [activeSessionId]);


  const handleSend = () => {
    const storageKey = getStorageKey(activeSessionId);
    if (query.trim() && !isLoading && !disabled && storageKey) {
      onSend(query);
      setQuery('');
      localStorage.removeItem(storageKey);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [query]);


  return (
    <div className="p-4 bg-white dark:bg-zinc-950 border-t border-gray-200 dark:border-zinc-800 shrink-0">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Select or start a new research session" : "Ask Seeker a research question..."}
          className="w-full p-4 pr-16 text-gray-900 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none overflow-y-hidden disabled:bg-gray-100 dark:disabled:bg-zinc-800/50 dark:placeholder-zinc-500 transition-colors"
          rows={1}
          disabled={isLoading || disabled}
          style={{ maxHeight: '200px' }}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !query.trim() || disabled}
          className="absolute top-1/2 right-4 transform -translate-y-1/2 p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:text-gray-400 dark:disabled:text-zinc-500 disabled:bg-transparent transition-all duration-150 ease-in-out hover:scale-110 flex items-center justify-center w-10 h-10"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-t-indigo-600 border-gray-200 dark:border-zinc-600 animate-spin"></div>
          ) : (
            <SendIcon className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
};

export default QueryInput;