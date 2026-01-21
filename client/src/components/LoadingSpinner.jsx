import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0f]">
      <div className="relative h-16 w-16">
        <div className="absolute top-0 left-0 h-full w-full rounded-full border-4 border-slate-700/30"></div>
        <div className="absolute top-0 left-0 h-full w-full animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-violet-400"></div>
        </div>
      </div>
      <span className="ml-4 animate-pulse text-sm font-bold uppercase tracking-widest text-violet-400">Loading Nexus...</span>
    </div>
  );
};

export default LoadingSpinner;
