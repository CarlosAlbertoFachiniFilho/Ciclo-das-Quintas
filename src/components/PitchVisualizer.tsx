import React, { useRef, useEffect } from 'react';

type ChallengeStatus = 'idle' | 'starting' | 'playing' | 'analyzing' | 'result';

interface PitchVisualizerProps {
    status: ChallengeStatus;
    livePitch: { note: string, cents: number } | null;
    finalResult: { note: string, cents: number, feedback: string } | null;
}

const HISTORY_LENGTH = 300; // Number of historical points to draw

export const PitchVisualizer: React.FC<PitchVisualizerProps> = ({ status, livePitch, finalResult }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pitchHistoryRef = useRef<number[]>([]);
    const animationFrameIdRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;
        
        const { width, height } = canvas;
        const midY = height / 2;
        const centsRange = 50; // Display a range of -50 to +50 cents

        const draw = () => {
            context.clearRect(0, 0, width, height);

            // Draw grid lines
            context.strokeStyle = 'rgba(100, 116, 139, 0.2)';
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(0, midY - height / 4);
            context.lineTo(width, midY - height / 4);
            context.moveTo(0, midY + height / 4);
            context.lineTo(width, midY + height / 4);
            context.stroke();
            
            // Draw target pitch line (center)
            context.strokeStyle = 'rgba(34, 211, 238, 0.8)'; // Cyan
            context.lineWidth = 2;
            context.setLineDash([5, 5]);
            context.beginPath();
            context.moveTo(0, midY);
            context.lineTo(width, midY);
            context.stroke();
            context.setLineDash([]);

            // Update history
            if (status === 'analyzing') {
                const currentCents = livePitch?.cents ?? null;
                // Add null for gaps in detection to break the line
                pitchHistoryRef.current.push(currentCents); 
                if (pitchHistoryRef.current.length > HISTORY_LENGTH) {
                    pitchHistoryRef.current.shift();
                }
            } else if (status === 'idle' || status === 'starting') {
                pitchHistoryRef.current = [];
            }
            
            // Draw user's pitch history line
            context.strokeStyle = '#FFFFFF'; // White
            context.lineWidth = 3;
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.beginPath();
            
            let hasStartedLine = false;
            for (let i = 0; i < pitchHistoryRef.current.length; i++) {
                const cents = pitchHistoryRef.current[i];
                const x = (i / (HISTORY_LENGTH - 1)) * width;
                
                if (cents !== null) {
                    const y = midY - (cents / centsRange) * (height / 2);
                    if (!hasStartedLine) {
                        context.moveTo(x, y);
                        hasStartedLine = true;
                    } else {
                        context.lineTo(x, y);
                    }
                } else {
                    // If we have a null, end the current line segment
                    if(hasStartedLine) context.stroke();
                    hasStartedLine = false; // Reset for the next segment
                    context.beginPath();
                }
            }
            context.stroke();
        };

        const animate = () => {
            draw();
            if (status === 'analyzing' || status === 'playing' || status === 'starting') {
                 animationFrameIdRef.current = requestAnimationFrame(animate);
            }
        };

        if (status === 'analyzing' || status === 'playing' || status === 'starting') {
            animate();
        } else {
            // Draw one final time for result state
            draw(); 
        }

        return () => {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
        };

    }, [status, livePitch, finalResult]);

    return (
        <div className="w-full h-32 bg-slate-700/50 rounded-lg p-2">
            <canvas ref={canvasRef} className="w-full h-full"></canvas>
        </div>
    );
};