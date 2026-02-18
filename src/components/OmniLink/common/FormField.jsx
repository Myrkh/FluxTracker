import React from 'react';
import { AlertCircle } from 'lucide-react';

export function FormField({ label, required, error, helpText, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {helpText && <span className="text-xs font-normal text-gray-400 ml-2">({helpText})</span>}
      </label>
      {children}
      {error && (
        <div className="flex items-center space-x-1 text-red-600 text-xs mt-1">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
