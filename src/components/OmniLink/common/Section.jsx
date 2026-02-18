import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export function Section({ icon, title, description, children, collapsible = false, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gradient-to-br from-white to-gray-50/30">
      <div
        className={`bg-[#00375A]/5 border-b-2 border-gray-200 px-6 py-4 ${collapsible ? 'cursor-pointer select-none' : ''}`}
        onClick={() => collapsible && setOpen(!open)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-[#00375A]">{icon}</div>
            <div>
              <h3 className="text-base font-bold text-gray-800">{title}</h3>
              {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
            </div>
          </div>
          {collapsible && (
            open ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>
      {open && <div className="p-6">{children}</div>}
    </div>
  );
}
