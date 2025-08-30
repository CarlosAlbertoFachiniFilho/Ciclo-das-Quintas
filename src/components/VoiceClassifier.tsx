import React, { useState, useRef, useCallback } from 'react';
import type { Gender, VocalRange } from '../types';
import { usePitchDetection } from '../hooks/usePitchDetection';
import { classifyVoice } from '../constants/musicTheory';
import { noteToMidi } from '../utils/pitchUtils';
import { VUMeter } from './VUMeter';

type ClassifierStep = 'gender' | 'low_note_test' | 'high_note_test' | 'result';

interface VoiceClassifierProps {
    onClose: () => void;
    onComplete: (range: VocalRange) => void;
}

const NOTE_STABILITY_THRESHOLD = 5; // require 5 stable samples for a note

export const VoiceClassifier: React.FC<VoiceClassifierProps> = ({ onClose, onComplete }) => {
    const [step, setStep] = useState<ClassifierStep>('gender');
    const [gender, setGender] = useState<Gender | null>(null);
    const [lowNote, setLowNote] = useState<string | null>(null);
    const [highNote, setHighNote] = useState<string | null>(null);
    const [detectedNote, setDetectedNote] = useState<string | null>(null);
    const [volume, setVolume] = useState(0);
    const [voiceType, setVoiceType] = useState<string>('');
    const [testFeedback, setTestFeedback] = useState<string>('');

    const pitchSamplesRef = useRef<string[]>([]);

    const handlePitch = useCallback(({ noteName, octave }: { noteName: string, octave: number }) => {
        const note = `${noteName}${octave}`;
        
        setDetectedNote(note);
        pitchSamplesRef.current.push(note);
    }, []);

    // FIX: Pass null for the targetNote argument, which is not used in this component.
    // This also requires updating usePitchDetection to handle a null targetNote.
    const { startListening, stopListening, isListening, error } = usePitchDetection(handlePitch, setVolume, null);
    
    const handleGenderSelect = (selectedGender: Gender) => {
        setGender(selectedGender);
        setStep('low_note_test');
        setTestFeedback('Sing your lowest comfortable note.');
    };
    
    const startTest = async () => {
        pitchSamplesRef.current = [];
        setDetectedNote(null);
        setTestFeedback(`Listening for your ${step === 'low_note_test' ? 'lowest' : 'highest'} note...`);
        await startListening();
        
        setTimeout(() => {
            stopListening();
            const samples = pitchSamplesRef.current;
            if (samples.length < NOTE_STABILITY_THRESHOLD) {
                setTestFeedback('Could not get a stable note. Please try again.');
                return;
            }
            const noteCounts = samples.reduce((acc, note) => {
                acc[note] = (acc[note] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            
            const mostFrequentNote = Object.keys(noteCounts).reduce((a, b) => noteCounts[a] > noteCounts[b] ? a : b);

            if (step === 'low_note_test') {
                setLowNote(mostFrequentNote);
                setStep('high_note_test');
                setTestFeedback('Great! Now sing your highest comfortable note.');
            } else if (step === 'high_note_test') {
                setHighNote(mostFrequentNote);
                // Final calculation
                if (lowNote && mostFrequentNote && gender) {
                     // Ensure high note is actually higher than low note
                    const lowMidi = noteToMidi(lowNote);
                    const highMidi = noteToMidi(mostFrequentNote);
                    if (lowMidi && highMidi && highMidi > lowMidi) {
                        const range = { low: lowNote, high: mostFrequentNote };
                        setVoiceType(classifyVoice(range, gender));
                        setStep('result');
                    } else {
                        // Reset if high note is not higher than low note
                        setTestFeedback('Highest note must be higher than lowest. Let\'s try again.');
                        setLowNote(null);
                        setHighNote(null);
                        setStep('low_note_test');
                    }
                }
            }
        }, 3000); // Listen for 3 seconds
    };
    
    const handleSave = () => {
        if (lowNote && highNote) {
            onComplete({ low: lowNote, high: highNote });
        }
    };

    const renderContent = () => {
        switch (step) {
            case 'gender':
                return (
                    <>
                        <h3 className="text-xl font-semibold mb-4">Step 1: Select Your Gender</h3>
                        <p className="text-slate-400 mb-6">This helps us provide a more accurate voice classification.</p>
                        <div className="flex gap-4">
                            <button onClick={() => handleGenderSelect('male')} className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-lg font-bold">Male</button>
                            <button onClick={() => handleGenderSelect('female')} className="flex-1 px-6 py-3 bg-pink-600 hover:bg-pink-500 rounded-lg text-lg font-bold">Female</button>
                        </div>
                    </>
                );
            case 'low_note_test':
            case 'high_note_test':
                return (
                    <>
                        <h3 className="text-xl font-semibold mb-2">Step {step === 'low_note_test' ? 2 : 3}: Find Your Range</h3>
                        <p className="text-slate-400 mb-4 h-6">{testFeedback}</p>
                        <div className="my-4">
                            <VUMeter level={isListening ? volume : 0} />
                        </div>
                        <div className="text-center my-4">
                            <span className="text-sm text-slate-400">Detected Note</span>
                            <p className="text-4xl font-mono font-bold h-12">{detectedNote || '...'}</p>
                        </div>
                        <button onClick={startTest} disabled={isListening} className="w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-lg font-bold disabled:bg-slate-600 disabled:cursor-not-allowed">
                            {isListening ? 'Listening...' : `Start ${step === 'low_note_test' ? 'Low' : 'High'} Note Test`}
                        </button>
                        {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
                    </>
                );
            case 'result':
                return (
                    <>
                         <h3 className="text-xl font-semibold mb-2">Results</h3>
                         <div className="text-center bg-slate-900/50 p-4 rounded-lg">
                            <p className="text-slate-400">Your Vocal Range:</p>
                            <p className="text-3xl font-mono font-bold my-2">{lowNote} - {highNote}</p>
                            <p className="text-slate-400 mt-4">Classification:</p>
                            <p className="text-3xl font-bold text-cyan-400 my-2">{voiceType}</p>
                         </div>
                         <p className="text-slate-400 my-4 text-sm text-center">Ear training challenges will now be tailored to this range.</p>
                         <button onClick={handleSave} className="w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-lg font-bold">Save and Use This Range</button>
                    </>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl w-full max-w-md p-6 text-center text-white" onClick={e => e.stopPropagation()}>
                <div className="relative">
                    <button onClick={onClose} className="absolute -top-2 -right-2 text-slate-400 hover:text-white">&times;</button>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};