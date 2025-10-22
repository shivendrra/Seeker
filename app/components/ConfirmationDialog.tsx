import React from 'react';
import { CloseIcon } from './icons';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(4px)' }}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white dark:bg-zinc-800 rounded-xl shadow-2xl w-full max-w-md relative animate-fade-in-up"
        role="document"
      >
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100">{title}</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-zinc-300 space-y-1">{message}</p>
        </div>

        <div className="bg-gray-50 dark:bg-zinc-700/50 px-6 py-4 flex justify-end items-center gap-3 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-200 bg-white dark:bg-zinc-600 border border-gray-300 dark:border-zinc-500 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center justify-center rounded-lg border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Delete
          </button>
        </div>
      </div>
       <style>{`
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.2s ease-out forwards; }
       `}</style>
    </div>
  );
};

export default ConfirmationDialog;