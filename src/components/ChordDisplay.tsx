import React from 'react';
import type { Chord, PlaybackStyle } from '../types';
import { playChord, playChordMelodically } from '../utils/audioPlayer';
import { PlusIcon } from './icons/PlusIcon';

const getChordColor = (degree: string): string => {
  const normalizedDegree = degree.toLowerCase().replace(/[°+]/g, '');
  switch (normalizedDegree) {
    case 'i':
    case 'vi':
      return 'bg-red-500/20 border-red-400 text-red-300'; // Tonic Function
    case 'v':
    case 'vii':
      return 'bg-blue-500/20 border-blue-400 text-blue-300'; // Dominant Function
    case 'iv':
    case 'ii':
      return 'bg-orange-500/20 border-orange-400 text-orange-300'; // Subdominant Function
    case 'iii':
      return 'bg-purple-500/20 border-purple-400 text-purple-300'; // Mediant / Other
    default:
      return 'bg-slate-700 border-slate-600';
  }
};

const ChordCard: React.FC<{
  chord: Chord;
  onHighlight: (notes: string[]) => void;
  onAddToProgression: (chord: Chord) => void;
  playbackStyle: PlaybackStyle;
  baseOctave: number;
}> = ({ chord, onHighlight, onAddToProgression, playbackStyle, baseOctave }) => {
  const handleCardClick = () => {
    if (playbackStyle === 'melodic') {
      playChordMelodically(chord.notes, 0.375, baseOctave);
    } else {
      playChord(chord.notes, baseOctave);
    }
    onHighlight(chord.notes);
  };
  
  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event from firing
    onAddToProgression(chord);
  };

  return (
    <div 
      className={`relative p-4 rounded-lg border text-center transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer flex flex-col justify-between ${getChordColor(chord.degree)}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      aria-label={`Play and highlight ${chord.name} chord`}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleCardClick()}
    >
       <button
        onClick={handleAddClick}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-900/40 text-slate-300 hover:bg-cyan-500 hover:text-slate-900 flex items-center justify-center transition-colors"
        aria-label={`Add ${chord.name} to progression`}
      >
        <PlusIcon className="w-5 h-5" />
      </button>

      <div>
        <div className="text-xl font-mono opacity-80">{chord.degree}</div>
        <div className="text-3xl font-semibold mt-1">{chord.name}</div>
        <div className="text-sm capitalize mt-2 opacity-60">
            {chord.type}
        </div>
      </div>
      <div className="text-xs font-mono mt-3 opacity-70 tracking-wider h-4">
        {chord.notes.join(' - ')}
      </div>
    </div>
  );
};

interface ChordDisplayProps {
  title: string;
  chords: Chord[];
  onChordHighlight: (notes: string[]) => void;
  onAddToProgression: (chord: Chord) => void;
  playbackStyle: PlaybackStyle;
  baseOctave: number;
}

export const ChordDisplay: React.FC<ChordDisplayProps> = ({ title, chords, onChordHighlight, onAddToProgression, playbackStyle, baseOctave }) => {
  return (
    <div className="w-full bg-slate-800/50 p-6 rounded-2xl shadow-lg border border-slate-700">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6">
        Chords in <span className="text-cyan-400">{title}</span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {chords.map(chord => (
          <ChordCard
            key={chord.degree + chord.name} // More unique key
            chord={chord}
            onHighlight={onChordHighlight}
            onAddToProgression={onAddToProgression}
            playbackStyle={playbackStyle}
            baseOctave={baseOctave}
          />
        ))}
      </div>
    </div>
  );
};