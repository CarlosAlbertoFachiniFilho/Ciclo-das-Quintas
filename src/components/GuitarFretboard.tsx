import React, { useMemo } from 'react';
import { NOTE_EQUIVALENTS } from '../constants/musicTheory';
import { playNote } from '../utils/audioPlayer';

const ALL_NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SHARPS_MAP = {'C':0, 'C#':1, 'D':2, 'D#':3, 'E':4, 'F':5, 'F#':6, 'G':7, 'G#':8, 'A':9, 'A#':10, 'B':11};

const GUITAR_TUNING = ['E', 'A', 'D', 'G', 'B', 'E'].reverse(); // From high E to low E
const GUITAR_STRING_OCTAVES = [4, 3, 3, 3, 2, 2]; // Octaves for high E, B, G, D, A, low E
const NUM_FRETS = 12;
const FRET_MARKERS = [3, 5, 7, 9, 12];

interface GuitarFretboardProps {
  highlightedNotes: string[];
  scaleNotes: string[];
  rootNote: string;
}

const getNoteOnFret = (stringIndex: number, fret: number): { note: string, octave: number } => {
  const stringNote = GUITAR_TUNING[stringIndex];
  const stringOctave = GUITAR_STRING_OCTAVES[stringIndex];
  const stringNoteIndexInSharpScale = SHARPS_MAP[stringNote as keyof typeof SHARPS_MAP];

  const totalSemitones = stringNoteIndexInSharpScale + fret;
  
  const noteIndex = totalSemitones % 12;
  const octaveOffset = Math.floor(totalSemitones / 12);

  const note = ALL_NOTES_SHARP[noteIndex];
  const octave = stringOctave + octaveOffset;
  
  return { note, octave };
};

export const GuitarFretboard: React.FC<GuitarFretboardProps> = ({ highlightedNotes = [], scaleNotes = [], rootNote }) => {
  const scaleNotesSet = useMemo(() => {
    const noteSet = new Set<string>();
    scaleNotes.forEach(note => {
      noteSet.add(note);
      (NOTE_EQUIVALENTS[note] || []).forEach(eq => noteSet.add(eq));
    });
    return noteSet;
  }, [scaleNotes]);

  const isHighlighted = (note: string): boolean => {
    if (highlightedNotes.includes(note)) return true;
    const equivalents = NOTE_EQUIVALENTS[note] || [];
    return equivalents.some(eq => highlightedNotes.includes(eq));
  };
  
  const isRootNote = (note: string): boolean => {
    if (note === rootNote) return true;
    const equivalents = NOTE_EQUIVALENTS[note] || [];
    return equivalents.some(eq => eq === rootNote);
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 bg-slate-800/50 rounded-2xl shadow-lg border border-slate-700">
      <div className="relative font-sans select-none overflow-x-auto">
        {/* Fret Markers */}
        <div className="flex justify-between pl-8 pr-4">
          {Array.from({ length: NUM_FRETS }).map((_, fretIndex) => (
            <div key={`marker-fret-${fretIndex}`} className="flex-1 flex justify-center items-center h-6">
              {FRET_MARKERS.includes(fretIndex + 1) && (
                <div className={`w-2 h-2 rounded-full ${fretIndex + 1 === 12 ? 'w-6' : ''} bg-slate-600/50`}></div>
              )}
            </div>
          ))}
        </div>
        {/* Fretboard Grid */}
        <div className="relative bg-slate-800 rounded-lg p-2 pr-4 border-y-2 border-slate-700">
           {/* Frets (vertical lines) */}
           <div className="absolute top-0 left-0 h-full w-full flex">
            <div className="w-10 bg-slate-900 border-r-4 border-slate-500"></div> {/* Nut */}
            {Array.from({ length: NUM_FRETS }).map((_, i) => (
              <div key={`fret-${i}`} className="h-full flex-1 border-r-2 border-slate-600"></div>
            ))}
          </div>
          {/* Strings and Notes */}
          <div className="relative flex flex-col-reverse justify-around gap-y-2.5 sm:gap-y-3.5">
            {GUITAR_TUNING.map((stringNote, stringIndex) => (
              <div key={stringIndex} className="relative flex items-center w-full">
                {/* String line */}
                <div className="absolute top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-500/80 z-0"></div>
                {/* Notes on string */}
                <div className="relative flex items-center w-full">
                  <div className="w-10 text-center"></div> {/* Space for nut */}
                  {Array.from({ length: NUM_FRETS }).map((_, fretIndex) => {
                    const { note, octave } = getNoteOnFret(stringIndex, fretIndex + 1);
                    const showNote = scaleNotesSet.has(note);
                    const highlighted = isHighlighted(note);
                    const isRoot = isRootNote(note);

                    return (
                      <div key={fretIndex} className="flex-1 h-6 sm:h-8 flex justify-center items-center">
                        {showNote && (
                          <button
                            onClick={() => playNote(note, octave)}
                            aria-label={`Play note ${note}${octave}`}
                            className={`relative z-10 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center
                                       font-semibold text-xs sm:text-sm shadow-md transition-all duration-150 transform active:scale-95
                                       ${highlighted ? 'bg-cyan-400 text-slate-900 scale-110' : 'bg-slate-300 text-slate-800'}
                                       ${isRoot && !highlighted ? 'ring-2 ring-offset-2 ring-offset-slate-800 ring-white' : ''}
                                       ${isRoot && highlighted ? 'ring-2 ring-offset-2 ring-offset-cyan-400 ring-white' : ''}
                                       `}
                          >
                            {note}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};