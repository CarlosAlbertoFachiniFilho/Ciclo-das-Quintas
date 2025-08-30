import React, { useState, useEffect } from 'react';
import type { KeyInfo } from '../types';

interface CircleOfFifthsProps {
  keys: KeyInfo[];
  selectedKeyIndex: number;
  onKeySelect: (index: number) => void;
}

const KeySegment: React.FC<{
  keyData: KeyInfo;
  index: number;
  totalKeys: number;
  isSelected: boolean;
  isFocused: boolean;
  onSelect: () => void;
}> = ({ keyData, index, totalKeys, isSelected, isFocused, onSelect }) => {
  const angle = (index / totalKeys) * 2 * Math.PI - Math.PI / 2; // Start from top
  const radius = 42; // Percentage
  const x = 50 + radius * Math.cos(angle);
  const y = 50 + radius * Math.sin(angle);

  const selectedClasses = isSelected
    ? 'bg-cyan-500 text-slate-900 scale-110 shadow-lg shadow-cyan-500/50 border-cyan-300'
    : 'bg-slate-700 hover:bg-slate-600 border-slate-600 hover:scale-105 hover:shadow-md';
  
  const focusClasses = isFocused ? 'ring-4 ring-cyan-400 ring-offset-2 ring-offset-slate-900' : '';

  return (
    <div
      className={`absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center cursor-pointer
                  border-2 transition-all duration-300 ease-in-out transform -translate-x-1/2 -translate-y-1/2 ${selectedClasses} ${focusClasses}`}
      style={{ left: `${x}%`, top: `${y}%` }}
      onClick={onSelect}
      role="button"
      aria-pressed={isSelected}
      aria-label={`Key of ${keyData.major}`}
    >
      <span className="text-xl sm:text-2xl font-bold">{keyData.major}</span>
      <span className="text-sm sm:text-base opacity-80">{keyData.relativeMinor}</span>
    </div>
  );
};

export const CircleOfFifths: React.FC<CircleOfFifthsProps> = ({ keys, selectedKeyIndex, onKeySelect }) => {
  const [focusedKeyIndex, setFocusedKeyIndex] = useState(selectedKeyIndex);

  // Sync focused index when the selected index prop changes (e.g. from a mouse click)
  useEffect(() => {
    setFocusedKeyIndex(selectedKeyIndex);
  }, [selectedKeyIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Prevent default browser behavior for arrow keys (scrolling) and space (scrolling)
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    
    let newIndex = focusedKeyIndex;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        newIndex = (focusedKeyIndex + 1) % keys.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        newIndex = (focusedKeyIndex - 1 + keys.length) % keys.length;
        break;
      case 'Enter':
      case ' ':
        onKeySelect(focusedKeyIndex);
        break;
      default:
        return; // Do nothing for other keys
    }
    setFocusedKeyIndex(newIndex);
  };

  return (
    <div
      className="relative w-full aspect-square max-w-xs sm:max-w-md mx-auto focus:outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="group"
      aria-label="Circle of Fifths. Use arrow keys to navigate, press Enter or Space to select."
    >
      <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-40 h-40 sm:w-48 sm:h-48 bg-slate-800 rounded-full flex items-center justify-center
                      text-center p-4 shadow-inner">
        <span className="text-slate-400 text-sm">
          Select a key to view its chords
        </span>
      </div>
      {keys.map((keyData, index) => (
        <KeySegment
          key={keyData.major}
          keyData={keyData}
          index={index}
          totalKeys={keys.length}
          isSelected={index === selectedKeyIndex}
          isFocused={index === focusedKeyIndex}
          onSelect={() => onKeySelect(index)}
        />
      ))}
    </div>
  );
};
