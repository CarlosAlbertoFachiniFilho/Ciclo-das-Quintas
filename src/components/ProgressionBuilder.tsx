import React, { useState, useEffect, useRef } from 'react';
import type { Chord, PlaybackStyle } from '../types';
import { playChord, playChordMelodically } from '../utils/audioPlayer';
import { PlayIcon } from './icons/PlayIcon';
import { StopIcon } from './icons/StopIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ProgressionBuilderProps {
  progression: Chord[];
  onRemoveFromProgression: (index: number) => void;
  onClearProgression: () => void;
  onChordHighlight: (notes: string[]) => void;
  playbackStyle: PlaybackStyle;
  baseOctave: number;
}

export const ProgressionBuilder: React.FC<ProgressionBuilderProps> = ({
  progression,
  onRemoveFromProgression,
  onClearProgression,
  onChordHighlight,
  playbackStyle,
  baseOctave,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef<number | null>(null);
  const Bpm = 120;
  const chordDuration = 60 / Bpm * 1000; // Duration of one beat in ms

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
    onChordHighlight([]);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handlePlay = () => {
    if (progression.length === 0) return;
    if (isPlaying) {
      handleStop();
    } else {
      setCurrentIndex(0);
      setIsPlaying(true);
    }
  };
  
  useEffect(() => {
    if (isPlaying && progression.length > 0) {
      if (currentIndex >= progression.length) {
        handleStop(); // Stop when progression ends
        return;
      }

      const chord = progression[currentIndex];
      onChordHighlight(chord.notes);
      
      if (playbackStyle === 'melodic') {
        playChordMelodically(chord.notes, 0.375, baseOctave);
      } else {
        playChord(chord.notes, baseOctave);
      }

      timeoutRef.current = window.setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, chordDuration * 2); // Play each chord for 2 beats

    } else if (!isPlaying) {
        handleStop();
    }
    
    return () => {
       if (timeoutRef.current) {
         clearTimeout(timeoutRef.current);
       }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentIndex, progression]);


  return (
    <div className="w-full bg-slate-800/50 p-4 rounded-2xl shadow-lg border border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Progression Builder</h3>
        <div className="flex items-center gap-2">
           <button 
             onClick={handlePlay}
             className="w-10 h-10 flex items-center justify-center bg-cyan-500 text-slate-900 rounded-full hover:bg-cyan-400 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
             disabled={progression.length === 0}
             aria-label={isPlaying ? 'Stop progression' : 'Play progression'}
            >
            {isPlaying ? <StopIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
          </button>
          <button 
            onClick={onClearProgression}
            disabled={progression.length === 0}
            className="w-10 h-10 flex items-center justify-center bg-slate-700 text-slate-300 rounded-full hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Clear progression"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="min-h-[6rem] bg-slate-900/50 rounded-lg p-2 border border-slate-700/50 flex flex-wrap items-center gap-2">
        {progression.length === 0 ? (
          <p className="w-full text-center text-slate-500">Add chords to your progression using the '+' button.</p>
        ) : (
          progression.map((chord, index) => (
            <div
              key={`${chord.name}-${index}`}
              className={`relative p-2 rounded-md border text-center transition-all ${currentIndex === index && isPlaying ? 'bg-cyan-400/30 border-cyan-300' : 'bg-slate-800 border-slate-600'}`}
            >
              <div className="font-semibold text-lg">{chord.name}</div>
              <div className="text-xs font-mono opacity-70">{chord.degree}</div>
              <button
                onClick={() => onRemoveFromProgression(index)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-400"
                aria-label={`Remove ${chord.name} from progression`}
              >
                &times;
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
