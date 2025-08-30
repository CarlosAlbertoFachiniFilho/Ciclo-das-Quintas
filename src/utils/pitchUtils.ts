const ALL_NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const A4_FREQUENCY = 440;
const A4_MIDI_NUMBER = 69;

export const frequencyToNoteName = (frequency: number): { noteName: string, octave: number } | null => {
  if (frequency <= 0) return null;

  const midiNoteNumber = 12 * (Math.log(frequency / A4_FREQUENCY) / Math.log(2)) + A4_MIDI_NUMBER;
  const roundedMidi = Math.round(midiNoteNumber);

  const octave = Math.floor(roundedMidi / 12) - 1;
  const noteIndex = roundedMidi % 12;

  const noteName = ALL_NOTES_SHARP[noteIndex];
  
  return { noteName, octave };
};

export const centsOff = (targetFreq: number, detectedFreq: number): number => {
    if (targetFreq <= 0 || detectedFreq <= 0) return 0;
    // Formula for cents difference between two frequencies
    return 1200 * Math.log2(detectedFreq / targetFreq);
};

export const noteToMidi = (note: string): number | null => {
    const match = note.match(/^([A-G]#?b?)(-?\d+)$/);
    if (!match) return null;

    const SHARPS_MAP: { [key: string]: number } = {'C':0, 'C#':1, 'D':2, 'D#':3, 'E':4, 'F':5, 'F#':6, 'G':7, 'G#':8, 'A':9, 'A#':10, 'B':11};
    const FLATS_MAP: { [key: string]: number } = {'C':0, 'Db':1, 'D':2, 'Eb':3, 'E':4, 'F':5, 'Gb':6, 'G':7, 'Ab':8, 'A':9, 'Bb':10, 'B':11};

    let [, noteName, octaveStr] = match;
    const octave = parseInt(octaveStr, 10);
    
    let noteIndex = SHARPS_MAP[noteName as keyof typeof SHARPS_MAP];
    if (noteIndex === undefined) {
        noteIndex = FLATS_MAP[noteName as keyof typeof FLATS_MAP];
    }
    
    if (noteIndex === undefined) return null;

    return 12 * (octave + 1) + noteIndex;
};

export const midiToNoteName = (midi: number): { noteName: string, octave: number } => {
    const octave = Math.floor(midi / 12) - 1;
    const noteIndex = midi % 12;
    const noteName = ALL_NOTES_SHARP[noteIndex];
    return { noteName, octave };
};
