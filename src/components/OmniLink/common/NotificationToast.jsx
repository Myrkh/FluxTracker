import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export function NotificationToast({ notification, onClose }) {
  if (!notification) return null;
  const isSuccess = notification.type === 'success';
  return (
    <div className={`fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 duration-300 ${
      isSuccess ? 'bg-green-50 border-green-200 border-l-green-500' : 'bg-red-50 border-red-200 border-l-red-500'
    } border-l-4 px-4 py-3 rounded-lg shadow-xl max-w-md`}>
      <div className="flex items-start space-x-3">
        {isSuccess ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> :
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
        <p className={`text-sm font-medium ${isSuccess ? 'text-green-900' : 'text-red-900'}`}>
          {notification.message}
        </p>
        <button onClick={onClose} className="flex-shrink-0 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
