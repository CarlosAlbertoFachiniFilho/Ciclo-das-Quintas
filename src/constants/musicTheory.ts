import type { KeyInfo, Chord, ChordType, Gender, VoiceType, VocalRange } from '../types';
import { noteToMidi, midiToNoteName } from '../utils/pitchUtils';

const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const SHARPS_MAP = {'C':0, 'C#':1, 'D':2, 'D#':3, 'E':4, 'F':5, 'F#':6, 'G':7, 'G#':8, 'A':9, 'A#':10, 'B':11};
const FLATS_MAP = {'C':0, 'Db':1, 'D':2, 'Eb':3, 'E':4, 'F':5, 'Gb':6, 'G':7, 'Ab':8, 'A':9, 'Bb':10, 'B':11};

export const NOTE_EQUIVALENTS: { [key: string]: string[] } = {
  'C#': ['Db'], 'D#': ['Eb'], 'F#': ['Gb'], 'G#': ['Ab'], 'A#': ['Bb'],
  'Db': ['C#'], 'Eb': ['D#'], 'Gb': ['F#'], 'Ab': ['G#'], 'Bb': ['A#'],
};


const CIRCLE_ORDER = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];

const keyUsesFlats = (key: string): boolean => {
    if (!key) return false;
    const root = key.endsWith('m') ? key.slice(0, -1) : key;
    if (['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'].includes(root)) return true;
    if (['Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm'].includes(key)) return true;
    return false;
};

const getChordNotes = (rootNote: string, type: ChordType): string[] => {
    const useFlats = keyUsesFlats(rootNote);
    const chromaticScale = useFlats ? NOTES_FLAT : NOTES_SHARP;
    const noteMap = useFlats ? FLATS_MAP : SHARPS_MAP;

    const rootIndex = noteMap[rootNote as keyof typeof noteMap] ?? SHARPS_MAP[rootNote as keyof typeof SHARPS_MAP];

    if (rootIndex === undefined) return [];

    const thirdInterval = type === 'major' ? 4 : 3;
    const fifthInterval = type === 'diminished' ? 6 : 7;
    
    const thirdIndex = (rootIndex + thirdInterval) % 12;
    const fifthIndex = (rootIndex + fifthInterval) % 12;

    return [
        chromaticScale[rootIndex],
        chromaticScale[thirdIndex],
        chromaticScale[fifthIndex]
    ];
};

const getScaleNotesFromIntervals = (rootNote: string, intervals: number[]): string[] => {
    const useFlats = keyUsesFlats(rootNote);
    const chromaticScale = useFlats ? NOTES_FLAT : NOTES_SHARP;
    const noteMap = useFlats ? FLATS_MAP : SHARPS_MAP;
    
    let rootIndex = noteMap[rootNote as keyof typeof noteMap] ?? SHARPS_MAP[rootNote as keyof typeof SHARPS_MAP];

    if (rootIndex === -1) return [];
    
    return intervals.map(interval => chromaticScale[(rootIndex + interval) % 12]);
}

export const getMajorScaleNotes = (rootNote: string, withOctave: boolean = false): string[] => {
    const majorScaleIntervals = [0, 2, 4, 5, 7, 9, 11];
    const finalScale = getScaleNotesFromIntervals(rootNote, majorScaleIntervals);
    if (withOctave) {
        finalScale.push(finalScale[0]);
    }
    return finalScale;
};

export const getMajorPentatonicScaleNotes = (rootNote: string): string[] => {
    const pentatonicIntervals = [0, 2, 4, 7, 9];
    return getScaleNotesFromIntervals(rootNote, pentatonicIntervals);
}

export const getBluesScaleNotes = (rootNote: string): string[] => {
    // Minor blues scale intervals
    const bluesIntervals = [0, 3, 5, 6, 7, 10];
    return getScaleNotesFromIntervals(rootNote, bluesIntervals);
}

export const getDiatonicChords = (rootNote: string): Chord[] => {
    const scale = getMajorScaleNotes(rootNote, false);
    if (scale.length < 7) return [];

    const chordTypes: ChordType[] = ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'];
    const chordDegrees = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
    
    return scale.map((note, index) => {
        const type = chordTypes[index];
        let chordName = note;
        if (type === 'minor') chordName += 'm';
        else if (type === 'diminished') chordName += '°';

        return { degree: chordDegrees[index], name: chordName, type, notes: getChordNotes(note, type) };
    });
};

export const getMinorDiatonicChords = (minorKey: string): Chord[] => {
    if (!minorKey || !minorKey.endsWith('m')) return [];
    const rootNote = minorKey.slice(0, -1);
    
    const naturalMinorIntervals = [0, 2, 3, 5, 7, 8, 10];
    const scale = getScaleNotesFromIntervals(rootNote, naturalMinorIntervals);

    const chordTypes: ChordType[] = ['minor', 'diminished', 'major', 'minor', 'minor', 'major', 'major'];
    const chordDegrees = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];
    
    return scale.map((note, index) => {
        const type = chordTypes[index];
        let chordName = note;
        if (type === 'minor') chordName += 'm';
        else if (type === 'diminished') chordName += '°';

        return { degree: chordDegrees[index], name: chordName, type, notes: getChordNotes(note, type) };
    });
};

export const getPentatonicChords = (rootNote: string): Chord[] => {
    const diatonicChords = getDiatonicChords(rootNote);
    const pentatonicDegrees = ['I', 'ii', 'iii', 'V', 'vi'];
    return diatonicChords.filter(c => pentatonicDegrees.includes(c.degree));
};


export const getBluesChords = (rootNote: string): Chord[] => {
    const diatonicChords = getDiatonicChords(rootNote);
    const bluesDegrees = ['I', 'IV', 'V'];
    return diatonicChords.filter(c => bluesDegrees.includes(c.degree));
};

const getRelativeMinor = (rootNote: string): string => {
    const useFlats = keyUsesFlats(rootNote);
    const scaleNotes = useFlats ? NOTES_FLAT : NOTES_SHARP;
    const noteMap = useFlats ? FLATS_MAP : SHARPS_MAP;
    
    const rootIndex = noteMap[rootNote as keyof typeof noteMap] ?? SHARPS_MAP[rootNote as keyof typeof SHARPS_MAP];

    if (rootIndex === -1) return '';
    
    const relativeMinorIndex = (rootIndex - 3 + 12) % 12;
    return `${scaleNotes[relativeMinorIndex]}m`;
};

export const CIRCLE_OF_FIFTHS_DATA: KeyInfo[] = CIRCLE_ORDER.map(rootNote => ({
    major: rootNote,
    relativeMinor: getRelativeMinor(rootNote),
}));

// --- VOICE CLASSIFICATION CONSTANTS AND LOGIC ---

const MALE_VOICES: VoiceType[] = [
    { name: 'Bass', range: { low: noteToMidi('E2'), high: noteToMidi('E4') } },
    { name: 'Baritone', range: { low: noteToMidi('G2'), high: noteToMidi('G4') } },
    { name: 'Tenor', range: { low: noteToMidi('C3'), high: noteToMidi('C5') } },
];

const FEMALE_VOICES: VoiceType[] = [
    { name: 'Contralto', range: { low: noteToMidi('F3'), high: noteToMidi('F5') } },
    { name: 'Mezzo-Soprano', range: { low: noteToMidi('A3'), high: noteToMidi('A5') } },
    { name: 'Soprano', range: { low: noteToMidi('C4'), high: noteToMidi('C6') } },
];

export const VOICE_CLASSIFICATIONS: Record<Gender, VoiceType[]> = {
    male: MALE_VOICES,
    female: FEMALE_VOICES,
};

export const classifyVoice = (range: VocalRange, gender: Gender): string => {
    const lowMidi = noteToMidi(range.low);
    const highMidi = noteToMidi(range.high);
    if (lowMidi === null || highMidi === null) return "Unknown";

    const possibleTypes = VOICE_CLASSIFICATIONS[gender];
    let bestMatch = "Unknown";
    let highestOverlap = 0;

    for (const type of possibleTypes) {
        const overlapStart = Math.max(lowMidi, type.range.low);
        const overlapEnd = Math.min(highMidi, type.range.high);
        const overlap = Math.max(0, overlapEnd - overlapStart);

        if (overlap > highestOverlap) {
            highestOverlap = overlap;
            bestMatch = type.name;
        }
    }
    return bestMatch;
};


export const getNotesInRange = (range: VocalRange): Array<{ note: string; octave: number }> => {
    const lowMidi = noteToMidi(range.low);
    const highMidi = noteToMidi(range.high);

    if (lowMidi === null || highMidi === null || lowMidi >= highMidi) {
        // Fallback to a default range if the user's range is invalid
        return [ { note: 'C', octave: 4 }, { note: 'D', octave: 4 }, { note: 'E', octave: 4 }, { note: 'F', octave: 4 }, { note: 'G', octave: 4 }, { note: 'A', octave: 4 } ];
    }
    
    const notes = [];
    // Ensure the range includes at least a few notes for variety
    const comfortableLow = lowMidi + 2; // Start a whole step up from their lowest note
    const comfortableHigh = highMidi - 2; // End a whole step down from their highest note

    for (let midi = comfortableLow; midi <= comfortableHigh; midi++) {
        const { noteName, octave } = midiToNoteName(midi);
        notes.push({ note: noteName, octave });
    }
    
    return notes.length > 0 ? notes : [ { note: 'C', octave: 4 }]; // Fallback
};
