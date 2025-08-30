
import React, { useMemo } from 'react';
import { playNote } from '../utils/audioPlayer';
import { NOTE_EQUIVALENTS } from '../constants/musicTheory';

const ALL_NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

interface PianoKeyboardProps {
  highlightedNotes: string[];
  scaleNotes: string[];
  baseOctave: number;
}

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({ highlightedNotes = [], scaleNotes = [], baseOctave }) => {
  
  const pianoKeys = useMemo(() => {
    // Corrected logic: All keys within this component instance share the same base octave.
    return ALL_NOTES_SHARP.map(note => ({
      note,
      octave: baseOctave, 
      type: note.includes('#') ? 'black' : 'white',
    }));
  }, [baseOctave]);
  
  const scaleDegreeMap = useMemo(() => {
    const map = new Map<string, number[]>();
    scaleNotes.forEach((note, index) => {
      const degree = index + 1;
      const notesToUpdate = [note, ...(NOTE_EQUIVALENTS[note] || [])];
      notesToUpdate.forEach(n => {
        if (!map.has(n)) {
          map.set(n, []);
        }
        map.get(n)!.push(degree);
      });
    });
    return map;
  }, [scaleNotes]);


  const isHighlighted = (note: string): boolean => {
    if (highlightedNotes.includes(note)) return true;
    const equivalents = NOTE_EQUIVALENTS[note] || [];
    return equivalents.some(eq => highlightedNotes.includes(eq));
  };

  const whiteKeys = pianoKeys.filter(k => k.type === 'white');
  const blackKeys = pianoKeys.filter(k => k.type === 'black');
  
  const blackKeyPositions: { [key: string]: number } = {
    'C#': 10.5, 'D#': 25, 'F#': 53.5, 'G#': 68, 'A#': 82.5
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 bg-slate-800/50 rounded-2xl shadow-lg border border-slate-700">
      <div className="relative flex w-full h-40 sm:h-48 select-none">
        {/* White Keys */}
        {whiteKeys.map(({ note, octave }, index) => {
          const highlighted = isHighlighted(note);
          const degrees = scaleDegreeMap.get(note);
          return (
            <div 
              key={`${note}${octave}-${index}`}
              className="relative h-full flex-1 border-2 border-slate-900 rounded-b-md flex items-end justify-center pb-2 box-border cursor-pointer transition-transform active:scale-[0.98]"
              onClick={() => playNote(note, octave)}
              role="button"
              tabIndex={0}
              aria-label={`Play note ${note}`}
            >
              <div className={`w-full h-full transition-colors duration-150 ${highlighted ? 'bg-cyan-500' : 'bg-slate-100'}`}></div>
              <div className="absolute bottom-2 flex flex-col items-center">
                <span className={`text-base sm:text-lg font-semibold pointer-events-none ${highlighted ? 'text-white' : 'text-slate-600'}`}>
                  {note}
                </span>
                {degrees && degrees.length > 0 && (
                  <span className={`mt-1 flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-xs font-bold pointer-events-none ${highlighted ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {degrees.join('/')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {/* Black Keys */}
        {blackKeys.map(({ note, octave }) => {
            const highlighted = isHighlighted(note);
            const degrees = scaleDegreeMap.get(note);
            return (
              <div 
                key={`${note}${octave}`} 
                style={{ left: `${blackKeyPositions[note as keyof typeof blackKeyPositions]}%` }} 
                className="absolute top-0 h-[60%] w-[8%] border-2 border-slate-900 rounded-b-md z-10 box-border cursor-pointer transition-transform active:scale-[0.97]"
                onClick={() => playNote(note, octave)}
                role="button"
                tabIndex={0}
                aria-label={`Play note ${note}`}
              >
                <div className={`w-full h-full transition-colors duration-150 flex flex-col items-center justify-between p-1 ${highlighted ? 'bg-cyan-400 border-cyan-200' : 'bg-slate-900'}`}>
                  <span className="text-sm font-semibold text-slate-300 pointer-events-none">{note.charAt(0)}&#9839;</span>
                  {degrees && degrees.length > 0 && (
                    <span className={`flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-xs font-bold pointer-events-none ${highlighted ? 'bg-black/20 text-white' : 'bg-slate-700 text-slate-300'}`}>
                      {degrees.join('/')}
                    </span>
                  )}
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );
};
