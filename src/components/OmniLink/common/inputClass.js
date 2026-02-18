export const inputClass = (hasError) => `w-full px-4 py-2.5 text-sm border-2 rounded-lg transition-all ${
  hasError
    ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
    : 'border-gray-200 focus:border-[#00375A] focus:ring-4 focus:ring-[#00375A]/10'
} outline-none`;
