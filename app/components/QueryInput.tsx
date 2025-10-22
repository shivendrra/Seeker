import React, { useState, useRef, useEffect } from 'react';
import { SendIcon } from './icons';

interface QueryInputProps {
  onSend: (query: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const QueryInput: React.FC<QueryInputProps> = ({ onSend, isLoading, disabled = false }) => {
  const [query, setQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (query.trim() && !isLoading && !disabled) {
      onSend(query);
      setQuery('');
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
  
  // Clear input when disabled state changes (e.g. session changes)
  useEffect(() => {
    if (disabled) {
      setQuery('');
    }
  }, [disabled]);


  return (
    <div className="p-4 bg-white border-t border-gray-200 shrink-0">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Select or start a new research session" : "Ask Seeker a research question..."}
          className="w-full p-4 pr-16 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none overflow-y-hidden bg-white disabled:bg-gray-100 transition-colors"
          rows={1}
          disabled={isLoading || disabled}
          style={{ maxHeight: '200px' }}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !query.trim() || disabled}
          className="absolute top-1/2 right-4 transform -translate-y-1/2 p-2 text-indigo-600 rounded-full hover:bg-indigo-100 disabled:text-gray-400 disabled:bg-transparent transition-colors"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-t-indigo-600 border-gray-200 rounded-full animate-spin"></div>
          ) : (
            <SendIcon className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
};

export default QueryInput;