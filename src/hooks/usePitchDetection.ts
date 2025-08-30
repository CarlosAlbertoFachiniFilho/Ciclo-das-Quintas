import { useState, useEffect, useRef, useCallback } from 'react';
import { pitchy } from '../utils/pitchy';
import { frequencyToNoteName, centsOff } from '../utils/pitchUtils';

type LibraryStatus = 'ready' | 'error';

const getNoteFrequencyForTuner = (note: string, octave: number): number => {
    const A4_FREQUENCY = 440;
    const ALL_NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteIndex = ALL_NOTES_SHARP.indexOf(note);
    const midiNoteNumber = 12 * (octave + 1) + noteIndex;
    return A4_FREQUENCY * Math.pow(2, (midiNoteNumber - 69) / 12);
};

export const usePitchDetection = (
    onPitchDetected: (pitch: { frequency: number, noteName: string, octave: number, cents: number }) => void,
    onVolumeChange: ((volume: number) => void) | undefined,
    targetNote: { note: string, octave: number } | null
) => {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [libraryStatus, setLibraryStatus] = useState<LibraryStatus>('ready');

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const pitchDetectorRef = useRef<any>(null);

    useEffect(() => {
        if (!pitchy) {
            setError("Pitch detection library is not available. The application cannot proceed.");
            setLibraryStatus('error');
            return;
        }

        let animationFrameId: number | null = null;
        
        const analyze = () => {
            if (!analyserRef.current || !pitchDetectorRef.current || !audioContextRef.current) {
                if (isListening) animationFrameId = requestAnimationFrame(analyze);
                return;
            }
            
            const analyser = analyserRef.current;
            const buffer = new Float32Array(analyser.fftSize);
            analyser.getFloatTimeDomainData(buffer);
            
            const [pitch, clarity] = pitchDetectorRef.current.findPitch(buffer, audioContextRef.current.sampleRate);

            // FIX: Allow pitch detection even when targetNote is null.
            // Calculate cents relative to target if available, otherwise relative to detected note's ideal pitch.
            if (pitch > 0 && clarity > 0.85) {
                const detectedNoteInfo = frequencyToNoteName(pitch);
                if (detectedNoteInfo) {
                    const centsDifference = targetNote
                        ? centsOff(getNoteFrequencyForTuner(targetNote.note, targetNote.octave), pitch)
                        : centsOff(getNoteFrequencyForTuner(detectedNoteInfo.noteName, detectedNoteInfo.octave), pitch);
                    onPitchDetected({ 
                        frequency: pitch,
                        noteName: detectedNoteInfo.noteName,
                        octave: detectedNoteInfo.octave,
                        cents: centsDifference 
                    });
                }
            }
            
            if (onVolumeChange) {
                let rms = 0;
                for (let i = 0; i < buffer.length; i++) {
                    rms += buffer[i] * buffer[i];
                }
                rms = Math.sqrt(rms / buffer.length);
                const volume = Math.min(1, Math.max(0, rms * 7));
                onVolumeChange(volume);
            }
            
            if (isListening) {
              animationFrameId = requestAnimationFrame(analyze);
            }
        };

        if (isListening) {
            analyze();
        }

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [isListening, onPitchDetected, onVolumeChange, targetNote]);

    const startListening = async (deviceId?: string): Promise<boolean> => {
        if (isListening || libraryStatus !== 'ready') return false;
                
        try {
            const constraints = {
                audio: deviceId ? { deviceId: { exact: deviceId } } : {
                  noiseSuppression: true,
                  echoCancellation: true,
                },
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            
            if (context.state === 'suspended') {
                await context.resume();
            }
            audioContextRef.current = context;
            
            const source = context.createMediaStreamSource(stream);
            mediaStreamSourceRef.current = source;
            
            const analyser = context.createAnalyser();
            analyser.fftSize = 2048;
            analyserRef.current = analyser;
            
            pitchDetectorRef.current = pitchy.PitchDetector.forFloat32Array(analyser.fftSize);

            source.connect(analyser);
            setError(null);
            setIsListening(true);
            return true;

        } catch (err: any) {
            console.error('Error accessing microphone:', err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('Microphone access denied. Please allow microphone access in your browser settings.');
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                 setError('No microphone found. Please connect a microphone and try again.');
            } else {
                setError('An error occurred while accessing the microphone.');
            }
            setIsListening(false);
            return false;
        }
    };

    const stopListening = useCallback(() => {
        if (!streamRef.current && !audioContextRef.current) return;

        setIsListening(false); 
        
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(console.error);
            audioContextRef.current = null;
        }
        analyserRef.current = null;
        pitchDetectorRef.current = null;

    }, []);

    const listDevices = useCallback(async () => {
        if (libraryStatus !== 'ready') return null;

        try {
            const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const allDevices = await navigator.mediaDevices.enumerateDevices();
            const audioDevices = allDevices.filter(d => d.kind === 'audioinput');
            tempStream.getTracks().forEach(track => track.stop());
            
            setError(null);
            return audioDevices;
        } catch (err: any) {
            console.error('Error listing devices:', err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('Microphone access denied. Please allow microphone access to see the device list.');
            } else {
                 setError('An error occurred while accessing the microphone.');
            }
            return null;
        }
    }, [libraryStatus]);

    useEffect(() => {
        return () => {
            stopListening();
        };
    }, [stopListening]);

    return { startListening, stopListening, isListening, error, listDevices, libraryStatus };
};