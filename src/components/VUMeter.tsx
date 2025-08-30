import React from 'react';

export const VUMeter: React.FC<{ level: number }> = ({ level }) => {
  const widthPercentage = Math.min(100, Math.max(0, level * 100));
  
  return (
    <div className="w-full h-8 bg-slate-900/50 rounded-full border border-slate-700 overflow-hidden p-1">
      <div
        className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full transition-[width] duration-75 ease-linear"
        style={{ width: `${widthPercentage}%` }}
      />
    </div>
  );
};
