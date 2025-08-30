import React, { useState, useMemo } from 'react';
import type { PlaybackStyle, ScaleType, Chord, VocalRange } from './types';
import { CircleOfFifths } from './components/CircleOfFifths';
import { ChordDisplay } from './components/ChordDisplay';
import { PianoKeyboard } from './components/PianoKeyboard';
import { GuitarFretboard } from './components/GuitarFretboard';
import { EarTrainer } from './components/EarTrainer';
import { ProgressionBuilder } from './components/ProgressionBuilder';
import { MusicNoteIcon } from './components/icons/MusicNoteIcon';
import { 
  CIRCLE_OF_FIFTHS_DATA,
  getMajorScaleNotes,
  getMajorPentatonicScaleNotes,
  getBluesScaleNotes,
  getDiatonicChords,
  getMinorDiatonicChords,
  getPentatonicChords,
  getBluesChords,
} from './constants/musicTheory';

const ScaleSelector: React.FC<{
  selected: ScaleType;
  onChange: (scale: ScaleType) => void;
}> = ({ selected, onChange }) => (
  <div className="bg-slate-800/60 p-1 rounded-lg flex gap-1 border border-slate-700">
    <button onClick={() => onChange('major')} className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors ${selected === 'major' ? 'bg-cyan-500 text-slate-900' : 'text-slate-300 hover:bg-slate-700/50'}`}>Major</button>
    <button onClick={() => onChange('major_pentatonic')} className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors ${selected === 'major_pentatonic' ? 'bg-cyan-500 text-slate-900' : 'text-slate-300 hover:bg-slate-700/50'}`}>Pentatonic</button>
    <button onClick={() => onChange('blues')} className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors ${selected === 'blues' ? 'bg-cyan-500 text-slate-900' : 'text-slate-300 hover:bg-slate-700/50'}`}>Blues</button>
  </div>
);

function App() {
  const [selectedKeyIndex, setSelectedKeyIndex] = useState(0);
  const [highlightedNotes, setHighlightedNotes] = useState<string[]>([]);
  const [playbackStyle, setPlaybackStyle] = useState<PlaybackStyle>('harmonic');
  const [baseOctave, setBaseOctave] = useState(4);
  const [scaleType, setScaleType] = useState<ScaleType>('major');
  const [progression, setProgression] = useState<Chord[]>([]);
  const [vocalRange, setVocalRange] = useState<VocalRange | null>(null);

  const selectedKeyInfo = CIRCLE_OF_FIFTHS_DATA[selectedKeyIndex];

  const { scaleNotes, majorChords, relativeMinorChords, keyTitle } = useMemo(() => {
    const rootNote = selectedKeyInfo.major;
    switch (scaleType) {
      case 'major_pentatonic':
        return {
          scaleNotes: getMajorPentatonicScaleNotes(rootNote),
          majorChords: getPentatonicChords(rootNote),
          relativeMinorChords: [],
          keyTitle: `${rootNote} Pentatonic`,
        };
      case 'blues':
        return {
          scaleNotes: getBluesScaleNotes(rootNote),
          majorChords: getBluesChords(rootNote),
          relativeMinorChords: [],
          keyTitle: `${rootNote} Blues`,
        };
      case 'major':
      default:
        return {
          scaleNotes: getMajorScaleNotes(rootNote, false),
          majorChords: getDiatonicChords(rootNote),
          relativeMinorChords: getMinorDiatonicChords(selectedKeyInfo.relativeMinor),
          keyTitle: `${rootNote} Major`,
        };
    }
  }, [selectedKeyIndex, scaleType, selectedKeyInfo]);

  const handleKeySelect = (index: number) => {
    setSelectedKeyIndex(index);
    setHighlightedNotes([]);
  };
  
  const handleScaleChange = (newScale: ScaleType) => {
    setScaleType(newScale);
    setHighlightedNotes([]);
  };

  const handleAddToProgression = (chord: Chord) => {
    setProgression(prev => [...prev, chord]);
  };

  const handleRemoveFromProgression = (index: number) => {
    setProgression(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleClearProgression = () => {
    setProgression([]);
    setHighlightedNotes([]);
  };

  const handleVocalRangeDefined = (range: VocalRange) => {
    setVocalRange(range);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <div className="flex items-center justify-center gap-3">
          <MusicNoteIcon className="w-8 h-8 text-cyan-400" />
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500">
            Interactive Music Tool
          </h1>
        </div>
        <p className="text-slate-400 mt-2 text-lg">Circle of Fifths, Scales, Chords, and Instruments.</p>
      </header>

      <div className="w-full flex-grow flex flex-col">
        <main className="w-full grid grid-cols-1 lg:grid-cols-5 gap-6 xl:gap-8 items-start">
          <div className="lg:col-span-2 flex justify-center items-start lg:sticky lg:top-8">
            <CircleOfFifths
              keys={CIRCLE_OF_FIFTHS_DATA}
              selectedKeyIndex={selectedKeyIndex}
              onKeySelect={handleKeySelect}
            />
          </div>

          <div className="lg:col-span-3 flex flex-col gap-6 w-full">
            <div className="flex flex-wrap justify-center items-center gap-4">
               <div className="bg-slate-800/60 p-1 rounded-lg flex gap-1 border border-slate-700">
                <button onClick={() => setPlaybackStyle('harmonic')} className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors ${playbackStyle === 'harmonic' ? 'bg-cyan-500 text-slate-900' : 'text-slate-300 hover:bg-slate-700/50'}`}>Harmonic</button>
                <button onClick={() => setPlaybackStyle('melodic')} className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors ${playbackStyle === 'melodic' ? 'bg-cyan-500 text-slate-900' : 'text-slate-300 hover:bg-slate-700/50'}`}>Melodic</button>
              </div>
              <ScaleSelector selected={scaleType} onChange={handleScaleChange} />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <ChordDisplay
                title={keyTitle}
                chords={majorChords}
                onChordHighlight={setHighlightedNotes}
                onAddToProgression={handleAddToProgression}
                playbackStyle={playbackStyle}
                baseOctave={baseOctave}
              />
              {scaleType === 'major' && (
                <ChordDisplay
                  title={`${selectedKeyInfo.relativeMinor.replace('m','')} Minor`}
                  chords={relativeMinorChords}
                  onChordHighlight={setHighlightedNotes}
                  onAddToProgression={handleAddToProgression}
                  playbackStyle={playbackStyle}
                  baseOctave={baseOctave}
                />
              )}
            </div>
             <ProgressionBuilder
              progression={progression}
              onRemoveFromProgression={handleRemoveFromProgression}
              onClearProgression={handleClearProgression}
              onChordHighlight={setHighlightedNotes}
              playbackStyle={playbackStyle}
              baseOctave={baseOctave}
            />
          </div>
        </main>

        <div className="w-full mt-8 flex flex-col gap-8">
          <div className="max-w-3xl mx-auto flex items-center justify-center gap-4">
            <span className="text-sm font-semibold text-slate-400">Octave</span>
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg p-1">
              <button onClick={() => setBaseOctave(o => Math.max(2, o - 1))} disabled={baseOctave <= 2} aria-label="Decrease octave" className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">-</button>
              <span className="w-8 text-center font-mono font-bold text-cyan-400">{baseOctave}</span>
              <button onClick={() => setBaseOctave(o => Math.min(6, o + 1))} disabled={baseOctave >= 6} aria-label="Increase octave" className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">+</button>
            </div>
          </div>
          <PianoKeyboard 
            highlightedNotes={highlightedNotes}
            scaleNotes={scaleNotes}
            baseOctave={baseOctave}
          />
           <GuitarFretboard
            highlightedNotes={highlightedNotes}
            scaleNotes={scaleNotes}
            rootNote={selectedKeyInfo.major}
          />
          <EarTrainer 
            vocalRange={vocalRange}
            onVocalRangeDefined={handleVocalRangeDefined}
          />
        </div>
      </div>
      
      <footer className="mt-auto pt-12 text-center text-slate-500 text-sm">
        <p>Built with React, TypeScript, and Tailwind CSS.</p>
        <p>Select a key, scale, and chord to see and hear the results.</p>
      </footer>
    </div>
  );
}

export default App;