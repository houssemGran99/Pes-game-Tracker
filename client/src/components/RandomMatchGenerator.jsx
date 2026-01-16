import { useState, useEffect, useRef } from 'react';
import { fetchMatches, fetchPlayers } from '../utils/api';

export default function RandomMatchGenerator() {
    const [players, setPlayers] = useState([]);
    const [matches, setMatches] = useState([]);
    const [excludedPlayers, setExcludedPlayers] = useState([]);
    const [selectedPlayers, setSelectedPlayers] = useState({ playerA: null, playerB: null });
    const [isSpinning, setIsSpinning] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [recentMatches, setRecentMatches] = useState([]);
    const [autoExcludeLastPlayers, setAutoExcludeLastPlayers] = useState(true);

    const spinTimeoutRef = useRef(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [matchesData, playersData] = await Promise.all([
                    fetchMatches(),
                    fetchPlayers()
                ]);

                const matchesList = matchesData.matches || (Array.isArray(matchesData) ? matchesData : []);
                setMatches(matchesList);
                setPlayers(playersData || []);

                // Get last 5 matches
                const sorted = [...matchesList].sort((a, b) => new Date(b.date) - new Date(a.date));
                setRecentMatches(sorted.slice(0, 5));

                // Auto-exclude last match players
                if (sorted.length > 0 && autoExcludeLastPlayers) {
                    const lastMatch = sorted[0];
                    setExcludedPlayers([lastMatch.playerA, lastMatch.playerB]);
                }
            } catch (error) {
                console.error("Failed to load data", error);
            }
        };

        loadData();
    }, []);

    // Get available players (not excluded)
    const availablePlayers = players.filter(p => !excludedPlayers.includes(p.name));

    // Calculate play frequency for fair rotation
    const getPlayerMatchCount = (playerName) => {
        return matches.filter(m => m.playerA === playerName || m.playerB === playerName).length;
    };

    // Weight players by inverse of match count for fair rotation
    const getWeightedRandomPlayer = (exclude = []) => {
        const eligible = availablePlayers.filter(p => !exclude.includes(p.name));
        if (eligible.length === 0) return null;

        // Calculate weights (players with fewer matches have higher weight)
        const maxMatches = Math.max(...eligible.map(p => getPlayerMatchCount(p.name)), 1);
        const weights = eligible.map(p => {
            const matchCount = getPlayerMatchCount(p.name);
            return maxMatches - matchCount + 1; // Inverse weight
        });

        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < eligible.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return eligible[i];
            }
        }

        return eligible[eligible.length - 1];
    };

    const toggleExcludePlayer = (playerName) => {
        setExcludedPlayers(prev =>
            prev.includes(playerName)
                ? prev.filter(p => p !== playerName)
                : [...prev, playerName]
        );
    };

    const spinWheel = () => {
        if (availablePlayers.length < 2) {
            alert("Need at least 2 available players!");
            return;
        }

        setIsSpinning(true);
        setShowResult(false);

        // Animate through random players
        let spinCount = 0;
        const maxSpins = 20;
        const spinInterval = setInterval(() => {
            const tempPlayerA = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
            let tempPlayerB = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
            while (tempPlayerB.name === tempPlayerA.name) {
                tempPlayerB = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
            }
            setSelectedPlayers({ playerA: tempPlayerA, playerB: tempPlayerB });
            spinCount++;

            if (spinCount >= maxSpins) {
                clearInterval(spinInterval);

                // Final selection with weighted randomness
                const playerA = getWeightedRandomPlayer([]);
                const playerB = getWeightedRandomPlayer([playerA.name]);

                setSelectedPlayers({ playerA, playerB });
                setIsSpinning(false);
                setShowResult(true);
            }
        }, 100);
    };

    const resetSelection = () => {
        setSelectedPlayers({ playerA: null, playerB: null });
        setShowResult(false);
    };

    return (
        <div className="random-match-generator animate-fade-in mb-xl">
            <h2 className="section-title text-center" style={{
                background: 'linear-gradient(to right, #E74C3C, #F39C12)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
                marginBottom: '1.5rem'
            }}>
                🎲 Who Plays Next?
            </h2>

            <div className="card" style={{
                background: 'var(--gradient-card)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                overflow: 'hidden'
            }}>
                {/* Player Exclusion Section */}
                <div style={{
                    padding: '1.25rem',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(0,0,0,0.2)'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.75rem'
                    }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            👥 Available Players ({availablePlayers.length}/{players.length})
                        </span>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.75rem',
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer'
                        }}>
                            <input
                                type="checkbox"
                                checked={autoExcludeLastPlayers}
                                onChange={(e) => {
                                    setAutoExcludeLastPlayers(e.target.checked);
                                    if (!e.target.checked) {
                                        setExcludedPlayers([]);
                                    } else if (recentMatches.length > 0) {
                                        const lastMatch = recentMatches[0];
                                        setExcludedPlayers([lastMatch.playerA, lastMatch.playerB]);
                                    }
                                }}
                                style={{ accentColor: 'var(--color-primary)' }}
                            />
                            Auto-exclude last players
                        </label>
                    </div>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                    }}>
                        {players.map(player => {
                            const isExcluded = excludedPlayers.includes(player.name);
                            const matchCount = getPlayerMatchCount(player.name);

                            return (
                                <button
                                    key={player.name}
                                    onClick={() => toggleExcludePlayer(player.name)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        padding: '0.4rem 0.75rem',
                                        borderRadius: '20px',
                                        border: 'none',
                                        background: isExcluded
                                            ? 'rgba(231, 76, 60, 0.3)'
                                            : 'rgba(46, 204, 113, 0.3)',
                                        color: 'var(--color-text)',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        transition: 'all 0.2s',
                                        opacity: isExcluded ? 0.6 : 1,
                                        textDecoration: isExcluded ? 'line-through' : 'none'
                                    }}
                                >
                                    {player.avatarUrl ? (
                                        <img
                                            src={player.avatarUrl}
                                            alt={player.name}
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    ) : (
                                        <span style={{
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            background: 'var(--gradient-primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.6rem'
                                        }}>
                                            {player.name.charAt(0)}
                                        </span>
                                    )}
                                    {player.name}
                                    <span style={{
                                        fontSize: '0.65rem',
                                        opacity: 0.7,
                                        marginLeft: '0.25rem'
                                    }}>
                                        ({matchCount})
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Spin Section */}
                <div style={{
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1.5rem'
                }}>
                    {/* Player Display */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1.5rem',
                        width: '100%'
                    }}>
                        {/* Player A */}
                        <div style={{
                            flex: 1,
                            maxWidth: '150px',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                margin: '0 auto 0.75rem',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2rem',
                                background: selectedPlayers.playerA
                                    ? (selectedPlayers.playerA.avatarUrl ? 'transparent' : 'linear-gradient(135deg, #E74C3C, #C0392B)')
                                    : 'rgba(255,255,255,0.1)',
                                border: showResult ? '3px solid var(--color-success)' : '3px solid rgba(255,255,255,0.2)',
                                boxShadow: showResult ? '0 0 20px rgba(46, 204, 113, 0.4)' : 'none',
                                transition: 'all 0.3s ease',
                                animation: isSpinning ? 'pulse 0.2s infinite' : 'none',
                                overflow: 'hidden'
                            }}>
                                {selectedPlayers.playerA?.avatarUrl ? (
                                    <img
                                        src={selectedPlayers.playerA.avatarUrl}
                                        alt={selectedPlayers.playerA.name}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                ) : selectedPlayers.playerA ? (
                                    selectedPlayers.playerA.name.charAt(0)
                                ) : '?'}
                            </div>
                            <div style={{
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                minHeight: '1.5rem',
                                color: showResult ? 'var(--color-success)' : 'var(--color-text)'
                            }}>
                                {selectedPlayers.playerA?.name || 'Player 1'}
                            </div>
                        </div>

                        {/* VS */}
                        <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: 'var(--color-warning)',
                            textShadow: '0 0 10px rgba(255,215,0,0.5)',
                            animation: isSpinning ? 'shake 0.1s infinite' : 'none'
                        }}>
                            ⚔️
                        </div>

                        {/* Player B */}
                        <div style={{
                            flex: 1,
                            maxWidth: '150px',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                margin: '0 auto 0.75rem',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2rem',
                                background: selectedPlayers.playerB
                                    ? (selectedPlayers.playerB.avatarUrl ? 'transparent' : 'linear-gradient(135deg, #3498DB, #2980B9)')
                                    : 'rgba(255,255,255,0.1)',
                                border: showResult ? '3px solid var(--color-success)' : '3px solid rgba(255,255,255,0.2)',
                                boxShadow: showResult ? '0 0 20px rgba(46, 204, 113, 0.4)' : 'none',
                                transition: 'all 0.3s ease',
                                animation: isSpinning ? 'pulse 0.2s infinite' : 'none',
                                overflow: 'hidden'
                            }}>
                                {selectedPlayers.playerB?.avatarUrl ? (
                                    <img
                                        src={selectedPlayers.playerB.avatarUrl}
                                        alt={selectedPlayers.playerB.name}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                ) : selectedPlayers.playerB ? (
                                    selectedPlayers.playerB.name.charAt(0)
                                ) : '?'}
                            </div>
                            <div style={{
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                minHeight: '1.5rem',
                                color: showResult ? 'var(--color-success)' : 'var(--color-text)'
                            }}>
                                {selectedPlayers.playerB?.name || 'Player 2'}
                            </div>
                        </div>
                    </div>

                    {/* Spin Button */}
                    <button
                        onClick={isSpinning ? null : (showResult ? resetSelection : spinWheel)}
                        disabled={isSpinning || availablePlayers.length < 2}
                        style={{
                            padding: '1rem 3rem',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            borderRadius: '30px',
                            border: 'none',
                            background: isSpinning
                                ? 'rgba(255,255,255,0.2)'
                                : showResult
                                    ? 'linear-gradient(135deg, #27AE60, #2ECC71)'
                                    : 'linear-gradient(135deg, #E74C3C, #F39C12)',
                            color: '#fff',
                            cursor: isSpinning ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: isSpinning ? 'none' : '0 4px 15px rgba(0,0,0,0.3)',
                            transform: isSpinning ? 'scale(0.95)' : 'scale(1)'
                        }}
                    >
                        {isSpinning ? (
                            <span>🎰 Spinning...</span>
                        ) : showResult ? (
                            <span>🔄 Spin Again</span>
                        ) : (
                            <span>🎲 Pick Random Match!</span>
                        )}
                    </button>

                    {availablePlayers.length < 2 && (
                        <p style={{
                            color: 'var(--color-error)',
                            fontSize: '0.85rem',
                            textAlign: 'center'
                        }}>
                            ⚠️ Need at least 2 available players. Click players above to include them.
                        </p>
                    )}
                </div>

                {/* Recent Matches (for reference) */}
                {recentMatches.length > 0 && (
                    <div style={{
                        padding: '1rem 1.25rem',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(0,0,0,0.2)'
                    }}>
                        <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-text-muted)',
                            marginBottom: '0.5rem'
                        }}>
                            📜 Recent Matches
                        </div>
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.5rem'
                        }}>
                            {recentMatches.slice(0, 3).map((match, idx) => (
                                <div key={idx} style={{
                                    fontSize: '0.7rem',
                                    padding: '0.3rem 0.6rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '4px',
                                    color: 'var(--color-text-muted)'
                                }}>
                                    {match.playerA} {match.scoreA}-{match.scoreB} {match.playerB}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                @keyframes shake {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-5deg); }
                    75% { transform: rotate(5deg); }
                }
            `}</style>
        </div>
    );
}
