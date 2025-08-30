
// A simple audio player using the Web Audio API to play musical notes.

const A4_FREQUENCY = 440;
const A4_MIDI_NUMBER = 69; 

const ALL_NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLATS_TO_SHARPS: { [key: string]: string } = {
    'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
};

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser");
            alert("Your browser does not support the Web Audio API, so sounds cannot be played.");
            return null;
        }
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    return audioContext;
};

const getNoteFrequency = (note: string, octave: number = 4): number => {
    let noteName = note.length > 1 && note[1] === 'b' ? FLATS_TO_SHARPS[note] || note : note;
    noteName = noteName.slice(0, noteName.length > 1 && noteName[1] === '#' ? 2 : 1);
    
    const noteIndex = ALL_NOTES_SHARP.indexOf(noteName);
    if (noteIndex === -1) {
        console.error(`Could not find frequency for note: ${note}`);
        return 0;
    }

    const midiNoteNumber = 12 * (octave + 1) + noteIndex;
    const semitonesFromA4 = midiNoteNumber - A4_MIDI_NUMBER;
    
    return A4_FREQUENCY * Math.pow(2, semitonesFromA4 / 12);
};

// --- NEW REALISTIC PIANO SYNTHESIZER ---
const createPianoSound = (context: AudioContext, freq: number, startTime: number, duration: number = 1.5) => {
    // Master envelope for the note (ADSR)
    const envelope = context.createGain();
    envelope.connect(context.destination);
    envelope.gain.setValueAtTime(0, startTime);
    envelope.gain.linearRampToValueAtTime(0.6, startTime + 0.01); // Fast attack
    envelope.gain.setTargetAtTime(0.2, startTime + 0.015, 0.1); // Decay to sustain
    envelope.gain.setTargetAtTime(0.0001, startTime + 0.15, 0.5); // Long release

    // Harmonics setup for a richer tone
    const harmonics = [
        { multiple: 1, gain: 1.0, detune: 0, type: 'triangle' as const },
        { multiple: 2, gain: 0.4, detune: 2, type: 'triangle' as const },
        { multiple: 3, gain: 0.2, detune: -2, type: 'triangle' as const },
        { multiple: 4, gain: 0.1, detune: 4, type: 'sine' as const },
    ];

    harmonics.forEach(harmonic => {
        const osc = context.createOscillator();
        const gainNode = context.createGain();

        osc.type = harmonic.type;
        osc.frequency.setValueAtTime(freq * harmonic.multiple, startTime);
        osc.detune.setValueAtTime(harmonic.detune, startTime);
        gainNode.gain.setValueAtTime(harmonic.gain, startTime);

        osc.connect(gainNode);
        gainNode.connect(envelope);

        osc.start(startTime);
        osc.stop(startTime + duration);
    });
};

export const playNote = (note: string, octave: number = 4) => {
    const context = getAudioContext();
    if (!context) return;

    const freq = getNoteFrequency(note, octave);
    if (freq === 0) return;
    createPianoSound(context, freq, context.currentTime);
};


export const playChord = (notes: string[], baseOctave: number = 4) => {
    const context = getAudioContext();
    if (!context) return;
    
    let currentOctave = baseOctave;
    let lastNoteChromaticIndex = -1;

    const notesWithOctaves = notes.map(note => {
        const normalizedNote = note.length > 1 && note[1] === 'b' ? FLATS_TO_SHARPS[note] : note;
        const noteName = normalizedNote.slice(0, normalizedNote.length > 1 && normalizedNote[1] === '#' ? 2 : 1);
        const chromaticIndex = ALL_NOTES_SHARP.indexOf(noteName);

        if (lastNoteChromaticIndex !== -1 && chromaticIndex < lastNoteChromaticIndex) {
            currentOctave++;
        }
        lastNoteChromaticIndex = chromaticIndex;
        
        return { note, octave: currentOctave };
    });

    const now = context.currentTime;

    notesWithOctaves.forEach(({ note, octave }) => {
        const freq = getNoteFrequency(note, octave);
        if (freq === 0) return;
        createPianoSound(context, freq, now);
    });
};

export const playChordMelodically = (notes: string[], noteDuration: number = 0.375, baseOctave: number = 4) => {
    const context = getAudioContext();
    if (!context) return;

    let currentOctave = baseOctave;
    let lastNoteChromaticIndex = -1;

    const notesWithOctaves = notes.map(note => {
        const normalizedNote = note.length > 1 && note[1] === 'b' ? FLATS_TO_SHARPS[note] : note;
        const noteName = normalizedNote.slice(0, normalizedNote.length > 1 && normalizedNote[1] === '#' ? 2 : 1);
        const chromaticIndex = ALL_NOTES_SHARP.indexOf(noteName);

        if (lastNoteChromaticIndex !== -1 && chromaticIndex < lastNoteChromaticIndex) {
            currentOctave++;
        }
        lastNoteChromaticIndex = chromaticIndex;
        
        return { note, octave: currentOctave };
    });
    
    const melodicSequence = [...notesWithOctaves];
    if (notesWithOctaves.length > 1) {
        const descendingPart = notesWithOctaves.slice(0, -1).reverse();
        melodicSequence.push(...descendingPart);
    }

    const now = context.currentTime;
    const spacing = noteDuration * 0.5; // Controls how fast the arpeggio plays

    melodicSequence.forEach(({ note, octave }, index) => {
        const freq = getNoteFrequency(note, octave);
        if (freq === 0) return;
        const startTime = now + index * spacing;
        createPianoSound(context, freq, startTime);
    });
};
