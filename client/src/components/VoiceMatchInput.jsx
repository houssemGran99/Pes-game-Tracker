import { useState, useEffect, useRef } from 'react';
import { useMatch } from '../context/MatchContext';
import { useAuth } from '../context/AuthContext';
import { submitMatch } from '../utils/api';

export default function VoiceMatchInput() {
    const { state, actions } = useMatch();
    const { user, token } = useAuth();
    const [isListening, setIsListening] = useState(false);
    const [matchData, setMatchData] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, listening, processing, confirming, submitting, success, error, unsupported
    const [transcript, setTranscript] = useState(''); // Used for status messages now
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    useEffect(() => {
        if (typeof window !== 'undefined' && !navigator.mediaDevices && !navigator.mediaDevices.getUserMedia) {
            setStatus('unsupported');
        }
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = handleStop;

            mediaRecorderRef.current.start();
            setIsListening(true);
            setStatus('listening');
            setTranscript('Recording... Click to stop.');
            setMatchData(null);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setStatus('error');
            setTranscript('Microphone access denied');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isListening) {
            mediaRecorderRef.current.stop();
            setIsListening(false);
            // stopping tracks
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleStop = async () => {
        setStatus('processing');
        setTranscript('Processing audio with Gemini...');

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const res = await fetch(`${API_URL}/voice-match-gemini`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) throw new Error('Server error');

            const data = await res.json();
            console.log("Gemini Match Data:", data);

            if (data && data.playerA && data.playerB) {
                setMatchData(data);
                setStatus('confirming');
                setTranscript(`Matched: ${data.playerA} vs ${data.playerB}`);
            } else {
                throw new Error('Could not identify match');
            }

        } catch (error) {
            console.error("Processing failed", error);
            setStatus('error');
            setTranscript('Failed to understand audio. Try again.');
        }
    };

    const toggleListening = () => {
        if (isListening) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const handleConfirm = async () => {
        setStatus('submitting');
        try {
            await submitMatch({
                playerA: matchData.playerA,
                playerB: matchData.playerB,
                scoreA: matchData.scoreA,
                scoreB: matchData.scoreB,
                matchType: 'Voice Match',
                goalEvents: [], // No timeline for voice matches
                tournamentId: null
            });
            setStatus('success');
            setTimeout(() => {
                setStatus('idle');
                setMatchData(null);
                setTranscript('');
                actions.setScreen('history'); // Go to history to show it
            }, 1500);
        } catch (e) {
            // console.error(e);
            setStatus('error_submit');
        }
    };

    const handleCancel = () => {
        setStatus('idle');
        setMatchData(null);
        setTranscript('');
    };

    if (status === 'unsupported') return null;
    if (!user || user.role !== 'admin') return null;

    return (
        <>
            <button
                className={`voice-btn ${isListening ? 'listening' : ''}`}
                onClick={toggleListening}
                title="Add Match by Voice"
            >
                <div className="mic-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="23"></line>
                        <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                </div>
                {isListening && <span className="listening-ping"></span>}
            </button>

            {/* Modal for Confirmation */}
            {(status === 'confirming' || status === 'submitting' || status === 'success' || status === 'error_parse') && (
                <div className="voice-modal-overlay">
                    <div className="voice-modal card">
                        <h3>Voice Match</h3>

                        {status === 'error_parse' && (
                            <div className="voice-error">
                                <p>Could not understand: "{transcript}"</p>
                                <p className="hint">Try: "Houssem 3 Sadam 5"</p>
                                <button className="btn btn-ghost" onClick={handleCancel}>Close</button>
                            </div>
                        )}

                        {(status === 'confirming' || status === 'submitting') && matchData && (
                            <div className="voice-confirm">
                                <p className="transcript-hint">Heard: "{transcript}"</p>
                                <div className="match-preview">
                                    <div className="player-side">
                                        <span className="p-name">{matchData.playerA}</span>
                                        <span className="p-score">{matchData.scoreA}</span>
                                    </div>
                                    <span className="vs">VS</span>
                                    <div className="player-side">
                                        <span className="p-score">{matchData.scoreB}</span>
                                        <span className="p-name">{matchData.playerB}</span>
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button
                                        className="btn btn-success"
                                        onClick={handleConfirm}
                                        disabled={status === 'submitting'}
                                    >
                                        {status === 'submitting' ? 'Saving...' : 'Confirm & Save'}
                                    </button>
                                    <button
                                        className="btn btn-ghost"
                                        onClick={handleCancel}
                                        disabled={status === 'submitting'}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="voice-success">
                                <span className="success-icon">✓</span>
                                <p>Match Saved!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                .voice-btn {
                    position: fixed;
                    bottom: 2rem;
                    right: 2rem;
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: var(--color-primary, #3b82f6);
                    color: white;
                    border: none;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    cursor: pointer;
                    z-index: 100;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .voice-btn:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 16px rgba(0,0,0,0.4);
                }
                .voice-btn.listening {
                    background: #ef4444;
                    animation: pulse 1.5s infinite;
                }
                
                .listening-ping {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    border: 2px solid #ef4444;
                    animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                }

                @keyframes ping {
                    75%, 100% {
                        transform: scale(2);
                        opacity: 0;
                    }
                }

                .voice-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.7);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 200;
                }
                
                .voice-modal {
                    width: 90%;
                    max-width: 400px;
                    padding: 2rem;
                    background: #1e293b;
                    color: white;
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .match-preview {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: rgba(0,0,0,0.2);
                    padding: 1rem;
                    border-radius: 12px;
                    margin: 1.5rem 0;
                }
                
                .player-side {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .p-name { font-weight: bold; font-size: 1.1rem; }
                .p-score { font-size: 2rem; font-weight: 800; color: var(--color-primary, #3b82f6); }
                .vs { opacity: 0.5; font-weight: bold; }
                
                .transcript-hint {
                    text-align: center;
                    font-style: italic;
                    opacity: 0.7;
                    font-size: 0.9rem;
                }

                .modal-actions {
                    display: flex;
                    gap: 1rem;
                }
                
                .voice-success {
                    text-align: center;
                    color: #22c55e;
                    font-size: 1.5rem;
                    font-weight: bold;
                }
                
                .hint { opacity: 0.5; font-size: 0.9rem; margin-bottom: 1rem; }
            `}</style>
        </>
    );
}
