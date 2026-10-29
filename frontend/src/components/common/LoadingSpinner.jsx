import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ label = 'Loading...', size = 'w-8 h-8', fullPage = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 p-8">
      <Loader2 className={`${size} animate-spin text-emerald-600 dark:text-emerald-400`} />
      {label && <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
