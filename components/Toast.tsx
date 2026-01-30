
import React, { useEffect } from 'react';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

interface ToastProps {
  messages: ToastMessage[];
  removeToast: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ messages, removeToast }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col space-y-3 pointer-events-none">
      {messages.map((m) => (
        <ToastItem key={m.id} message={m} onRemove={() => removeToast(m.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ message: ToastMessage; onRemove: () => void }> = ({ message, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(onRemove, 3000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  const bg = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-blue-600'
  }[message.type];

  const icon = {
    success: '✅',
    error: '⚠️',
    info: 'ℹ️'
  }[message.type];

  return (
    <div className={`pointer-events-auto flex items-center space-x-3 px-6 py-4 rounded-2xl text-white shadow-2xl animate-in slide-in-from-right-full duration-300 ${bg}`}>
      <span className="text-lg">{icon}</span>
      <span className="font-bold text-sm tracking-tight">{message.text}</span>
      <button onClick={onRemove} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">✕</button>
    </div>
  );
};

export default Toast;
