import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function TournamentBracket({ tournament, playersMap, onUpdateTournament }) {
    const { rounds } = tournament;
    const { isAdmin } = useAuth();
    const [selectedMatch, setSelectedMatch] = useState(null);

    // Styling constants
    const cardHeight = 80; // px
    const gap = 20; // px

    const handleMatchClick = (match) => {
        if (!isAdmin || match.winner) return;
        // Only allow editing if players are determined
        if (!match.playerA || !match.playerB) return;

        setSelectedMatch(match);
    };

    const handleUpdateMatch = (winner, scoreA, scoreB) => {
        const newRounds = JSON.parse(JSON.stringify(rounds)); // Deep copy

        // Find match in newRounds
        let foundMatch = null;
        let foundRoundIndex = -1;

        for (let r = 0; r < newRounds.length; r++) {
            const m = newRounds[r].matches.find(xm => xm.id === selectedMatch.id);
            if (m) {
                foundMatch = m;
                foundRoundIndex = r;
                break;
            }
        }

        if (!foundMatch) return;

        // Update current match
        foundMatch.scoreA = parseInt(scoreA);
        foundMatch.scoreB = parseInt(scoreB);
        foundMatch.winner = winner;

        // Propagate to next match if exists
        if (foundMatch.nextMatchId) {
            // Find next round
            const nextRound = newRounds[foundRoundIndex + 1];
            if (nextRound) {
                const nextMatch = nextRound.matches.find(m => m.id === foundMatch.nextMatchId);
                if (nextMatch) {
                    // Update slot
                    nextMatch[foundMatch.nextMatchSlot] = winner;
                }
            }
        } else {
            // Final logic handled below
        }

        onUpdateTournament({
            rounds: newRounds,
            ...((!foundMatch.nextMatchId && winner) ? { winner, status: 'completed' } : {})
        });
        setSelectedMatch(null);
    };

    return (
        <div className="bracket-container" style={{
            display: 'flex',
            overflowX: 'auto',
            padding: '2rem',
            gap: '4rem',
            minHeight: '600px',
            alignItems: 'center' // Vertically center the whole bracket
        }}>
            {rounds.map((round, rIndex) => (
                <div key={rIndex} className="bracket-round" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2rem',
                    justifyContent: 'space-around',
                    height: '100%' // Stretch to fill container
                }}>
                    <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: 'rgba(255,255,255,0.7)' }}>{round.name}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', flexGrow: 1 }}>
                        {round.matches.map(match => (
                            <MatchCard
                                key={match.id}
                                match={match}
                                playersMap={playersMap}
                                onClick={() => handleMatchClick(match)}
                                isAdmin={isAdmin}
                            />
                        ))}
                    </div>
                </div>
            ))}

            {selectedMatch && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 1000,
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div className="modal-content card" style={{ minWidth: '300px' }}>
                        <h3>Update Match Result</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem 0' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedMatch.playerA}</div>
                            </div>
                            <div>VS</div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedMatch.playerB}</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem' }}>{selectedMatch.playerA} Score</label>
                                <input id="scoreA" type="number" className="form-input" placeholder="0" />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem' }}>{selectedMatch.playerB} Score</label>
                                <input id="scoreB" type="number" className="form-input" placeholder="0" />
                            </div>
                        </div>

                        <div className="form-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-ghost" onClick={() => setSelectedMatch(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={() => {
                                const sA = document.getElementById('scoreA').value || 0;
                                const sB = document.getElementById('scoreB').value || 0;

                                if (sA == sB) {
                                    alert("Draws not allowed in knockout!");
                                    return;
                                }
                                const winner = parseInt(sA) > parseInt(sB) ? selectedMatch.playerA : selectedMatch.playerB;
                                handleUpdateMatch(winner, sA, sB);
                            }}>Set Result</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function MatchCard({ match, playersMap, onClick, isAdmin }) {
    const isCompleted = !!match.winner;
    const isReady = match.playerA && match.playerB;

    const getAvatar = (name) => {
        if (!name || !playersMap || !playersMap[name]) return null;
        return playersMap[name].avatarUrl;
    };

    const renderPlayer = (name, score, isWinner) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                {name && getAvatar(name) ? (
                    <img src={getAvatar(name)} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>
                        {name ? name.charAt(0) : '?'}
                    </div>
                )}
                <span style={{
                    fontWeight: isWinner ? 'bold' : 'normal',
                    color: isWinner ? 'var(--color-success)' : (name === 'BYE' ? 'rgba(255,255,255,0.4)' : 'inherit'),
                    opacity: name ? 1 : 0.5,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '110px',
                    fontSize: '0.9rem'
                }}>
                    {name || 'TBD'}
                </span>
            </div>
            <span style={{ fontWeight: 'bold' }}>{score}</span>
        </div>
    );

    return (
        <div
            onClick={onClick}
            className={`match-card-bracket ${isReady && !isCompleted && isAdmin ? 'clickable' : ''}`}
            style={{
                background: 'var(--gradient-card)',
                padding: '0.25rem',
                borderRadius: '8px',
                width: '220px', // Wider to fit avatars
                border: match.winner ? '1px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.1)',
                cursor: isReady && !isCompleted && isAdmin ? 'pointer' : 'default',
                position: 'relative',
                marginBottom: '1rem',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s',
                opacity: (match.playerA === 'BYE' || match.playerB === 'BYE') ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
                if (isReady && !isCompleted && isAdmin) e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
                if (isReady && !isCompleted && isAdmin) e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            {renderPlayer(match.playerA, match.scoreA, match.winner === match.playerA && match.winner)}
            {renderPlayer(match.playerB, match.scoreB, match.winner === match.playerB && match.winner)}
        </div>
    );
}
