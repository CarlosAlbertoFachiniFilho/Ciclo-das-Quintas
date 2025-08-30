export type ChordType = 'major' | 'minor' | 'diminished';

export type PlaybackStyle = 'harmonic' | 'melodic';

export type ScaleType = 'major' | 'major_pentatonic' | 'blues';

export type Gender = 'male' | 'female';

export interface Chord {
  degree: string;
  name: string;
  type: ChordType;
  notes: string[];
}

export interface KeyInfo {
  major: string;
  relativeMinor: string;
}

export interface VocalRange {
    low: string; // e.g. "G2"
    high: string; // e.g. "F4"
}

export interface VoiceType {
    name: string;
    range: {
        low: number; // MIDI
        high: number; // MIDI
    };
}
