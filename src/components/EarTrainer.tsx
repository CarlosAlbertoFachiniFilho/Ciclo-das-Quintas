import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { usePitchDetection } from '../hooks/usePitchDetection';
import { playNote } from '../utils/audioPlayer';
import { getNotesInRange } from '../constants/musicTheory';
import type { VocalRange } from '../types';
import { VUMeter } from './VUMeter';
import { VoiceClassifier } from './VoiceClassifier';
import { PitchVisualizer } from './PitchVisualizer';

type ChallengeStatus = 'idle' | 'starting' | 'playing' | 'analyzing' | 'result';

interface EarTrainerProps {
    vocalRange: VocalRange | null;
    onVocalRangeDefined: (range: VocalRange) => void;
}

export const EarTrainer: React.FC<EarTrainerProps> = ({ vocalRange, onVocalRangeDefined }) => {
    const [status, setStatus] = useState<ChallengeStatus>('idle');
    const [targetNote, setTargetNote] = useState<{ note: string, octave: number } | null>(null);
    const [livePitch, setLivePitch] = useState<{ note: string, cents: number } | null>(null);
    const [finalResult, setFinalResult] = useState<{ note: string, cents: number, feedback: string } | null>(null);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [volume, setVolume] = useState(0);
    const [isClassifierOpen, setIsClassifierOpen] = useState(false);
    
    const pitchSamplesRef = useRef<Array<{ note: string, cents: number }>>([]);

    const notesToPractice = useMemo(() => {
      return vocalRange ? getNotesInRange(vocalRange) : [];
    }, [vocalRange]);
    
    const handlePitchDetected = useCallback(({ frequency, noteName, octave, cents }: { frequency: number; noteName: string; octave: number; cents: number; }) => {
        if (status !== 'analyzing') return;
        
        const newPitchData = { note: `${noteName}${octave}`, cents };
        setLivePitch(newPitchData);
        pitchSamplesRef.current.push(newPitchData);
    }, [status]);
    
    const { startListening, stopListening, isListening, error, listDevices, libraryStatus } = usePitchDetection(
        handlePitchDetected,
        setVolume,
        targetNote // Pass target note to hook
    );

    const resetChallenge = useCallback(() => {
        stopListening();
        setStatus('idle');
        setTargetNote(null);
        setLivePitch(null);
        setFinalResult(null);
        pitchSamplesRef.current = [];
    }, [stopListening]);

    // This single useEffect now manages the entire challenge lifecycle with timers.
    useEffect(() => {
        if (status !== 'playing' && status !== 'analyzing') {
            return;
        }

        let timerId: number;

        if (status === 'playing') {
            // After the note is played, wait 1.5s then switch to analysis mode.
            timerId = window.setTimeout(() => {
                setStatus('analyzing');
            }, 1500);
        } else if (status === 'analyzing') {
            // After 2s of analysis, stop listening and process the results.
            timerId = window.setTimeout(() => {
                stopListening();
                const samples = pitchSamplesRef.current;
                let finalFeedback = 'Could not detect pitch. Try singing louder.';
                let finalPitchResult: { note: string, cents: number } | null = null;
                
                if (samples.length > 5) {
                    const noteCounts = samples.reduce((acc, sample) => {
                        acc[sample.note] = (acc[sample.note] || 0) + 1;
                        return acc;
                    }, {} as Record<string, number>);

                    const modeNote = Object.keys(noteCounts).reduce((a, b) => noteCounts[a] > noteCounts[b] ? a : b, '');
                    
                    if (modeNote && noteCounts[modeNote] > samples.length / 4) {
                        const modeSamples = samples.filter(s => s.note === modeNote);
                        const avgCents = modeSamples.reduce((sum, s) => sum + s.cents, 0) / modeSamples.length;
                        finalPitchResult = { note: modeNote, cents: avgCents };

                        if (Math.abs(avgCents) < 10) finalFeedback = 'In Tune!';
                        else if (avgCents < 0) finalFeedback = 'A little flat...';
                        else finalFeedback = 'A little sharp...';
                    } else {
                         finalFeedback = 'Note was unstable. Try holding a steady pitch.';
                    }
                } else if (samples.length > 0) {
                     finalFeedback = 'Not enough data. Try singing for the full duration.';
                }

                setFinalResult({
                    note: finalPitchResult?.note || '?',
                    cents: finalPitchResult?.cents || 0,
                    feedback: finalFeedback,
                });
                setStatus('result');
            }, 2000);
        }

        return () => { clearTimeout(timerId); };
    }, [status, stopListening]);


    const handleSelectClick = async () => {
        if (devices.length === 0 && !isListening) {
            const audioDevices = await listDevices();
            if (audioDevices && audioDevices.length > 0) {
                setDevices(audioDevices);
                if (!selectedDeviceId) setSelectedDeviceId(audioDevices[0].deviceId);
            }
        }
    };

    const handleChallengeClick = async () => {
        if (isListening || (status !== 'idle' && status !== 'result')) {
            resetChallenge();
            return;
        } 
        
        setStatus('starting');
        pitchSamplesRef.current = [];
        setFinalResult(null);
        setLivePitch(null);
        
        const randomNote = notesToPractice[Math.floor(Math.random() * notesToPractice.length)];
        setTargetNote(randomNote); // Set target note before starting listening

        const listeningStarted = await startListening(selectedDeviceId || devices[0]?.deviceId);
        
        if (listeningStarted) {
            playNote(randomNote.note, randomNote.octave);
            setStatus('playing'); // This kicks off the useEffect flow
        } else {
            resetChallenge();
        }
    };

    const getFeedbackText = () => {
        switch (status) {
            case 'idle': return vocalRange ? 'Ready!' : 'Set your voice range first';
            case 'starting': return 'Starting mic...';
            case 'playing': return 'Listen...';
            case 'analyzing': return 'Continue singing...';
            case 'result': return finalResult?.feedback || 'Finished';
            default: return '-';
        }
    };

    const isChallengeRunning = status === 'starting' || status === 'playing' || status === 'analyzing';
    const canStartChallenge = vocalRange !== null && libraryStatus === 'ready';

    return (
        <div className="w-full max-w-3xl mx-auto p-4 bg-slate-800/50 rounded-2xl shadow-lg border border-slate-700 flex flex-col items-center gap-4">
            <h3 className="text-xl font-bold text-cyan-400">Ear Trainer</h3>
            
            {vocalRange ? (
                <button onClick={() => setIsClassifierOpen(true)} className="text-sm text-cyan-400 hover:underline">
                    Your vocal range is set to {vocalRange.low} - {vocalRange.high}. Click to redefine.
                </button>
            ) : (
                <button onClick={() => setIsClassifierOpen(true)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold">
                    Set Voice Range
                </button>
            )}

            <div className="w-full flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-900/40 rounded-lg">
                <div className="flex-1 w-full">
                    <label htmlFor="mic-select" className="text-sm text-slate-400 mb-1 block">Select Microphone</label>
                    <select id="mic-select" value={selectedDeviceId} onClick={handleSelectClick} onChange={(e) => setSelectedDeviceId(e.target.value)}
                        disabled={isChallengeRunning || libraryStatus !== 'ready' || (devices.length === 0 && error !== null)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:opacity-50">
                        {devices.length === 0 && <option>Click to list microphones...</option>}
                        {devices.map(device => ( <option key={device.deviceId} value={device.deviceId}>{device.label || `Microphone ${devices.indexOf(device) + 1}`}</option> ))}
                    </select>
                </div>
                <div className="flex-1 w-full"> <label className="text-sm text-slate-400 mb-1 block">Mic Level</label> <VUMeter level={isListening ? volume : 0} /> </div>
            </div>

            <button onClick={handleChallengeClick}
                className={`px-6 py-3 text-lg font-semibold rounded-lg transition-all duration-200 w-48
                    ${isChallengeRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-cyan-500 hover:bg-cyan-600'} text-white shadow-md disabled:opacity-50 disabled:bg-slate-600 disabled:cursor-not-allowed`}
                disabled={!canStartChallenge || status === 'starting'}>
                {isChallengeRunning ? 'Stop' : (status === 'result' ? 'New Challenge' : 'Start Challenge')}
            </button>

            {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center w-full mt-4">
                <div> <div className="text-sm text-slate-400">Target Note</div> <div className="text-3xl font-bold font-mono h-10">{targetNote ? `${targetNote.note}${targetNote.octave}` : '-'}</div> </div>
                <div> <div className="text-sm text-slate-400">You Sang</div> <div className="text-3xl font-bold font-mono h-10 text-cyan-400">
                      {status === 'analyzing' && (livePitch?.note || '...')}
                      {status === 'result' && (finalResult?.note || '-')}
                      {(status !== 'analyzing' && status !== 'result') && '-'}
                    </div> </div>
                <div> <div className="text-sm text-slate-400">Feedback</div> <div className="text-lg font-semibold h-10 flex items-center justify-center">{getFeedbackText()}</div> </div>
            </div>

            <PitchVisualizer
                status={status}
                livePitch={livePitch}
                finalResult={finalResult}
            />

            {isClassifierOpen && (
                <VoiceClassifier
                    onClose={() => setIsClassifierOpen(false)}
                    onComplete={(range) => {
                        onVocalRangeDefined(range);
                        setIsClassifierOpen(false);
                    }}
                />
            )}
        </div>
    );
};