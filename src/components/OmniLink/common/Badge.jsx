import React from 'react';

export function Badge({ children, variant = 'default' }) {
  const styles = {
    BPCS: 'bg-blue-100 text-blue-800',
    SIS: 'bg-red-100 text-red-800',
    MAINT: 'bg-green-100 text-green-800',
    default: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant] || styles.default}`}>
      {children}
    </span>
  );
}
