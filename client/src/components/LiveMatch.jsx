import { useEffect, useState } from 'react';
import { useMatch } from '../context/MatchContext';
import { fetchPlayers } from '../utils/api';

export default function LiveMatch() {
    const { state, actions } = useMatch();
    const { currentMatch } = state;
    const [animateA, setAnimateA] = useState(false);
    const [animateB, setAnimateB] = useState(false);
    const [playersMap, setPlayersMap] = useState({});

    useEffect(() => {
        const loadPlayers = async () => {
            try {
                const data = await fetchPlayers();
                const map = {};
                if (Array.isArray(data)) {
                    data.forEach(p => map[p.name] = p);
                }
                setPlayersMap(map);
            } catch (err) {
                console.error("Failed to load players details", err);
            }
        };
        loadPlayers();
    }, []);

    const handleGoal = (player) => {
        actions.addGoal(player);
        if (player === 'A') {
            setAnimateA(true);
            setTimeout(() => setAnimateA(false), 300);
        } else {
            setAnimateB(true);
            setTimeout(() => setAnimateB(false), 300);
        }
    };

    if (!currentMatch) return null;

    const playerAData = playersMap[currentMatch.playerA];
    const playerBData = playersMap[currentMatch.playerB];

    return (
        <div className="live-match-screen container animate-fade-in">
            <div className="live-match-header">
                <button className="back-btn" onClick={() => actions.setScreen('home')}>
                    ←
                </button>
                <h1 className="live-match-title">
                    <span className="live-indicator"></span>
                    Live Match
                </h1>
            </div>

            <div className="live-match-card card">
                <div className="live-match-scoreboard">
                    {/* Player A */}
                    <div className="live-player-section">
                        <div className="live-player-avatar-container">
                            {playerAData && playerAData.avatarUrl ? (
                                <img src={playerAData.avatarUrl} alt={currentMatch.playerA} className="live-player-avatar" />
                            ) : (
                                <div className="live-player-avatar-placeholder">
                                    <span>P1</span>
                                </div>
                            )}
                        </div>
                        <div className="live-player-name">{currentMatch.playerA}</div>
                        <button
                            className="btn btn-success live-goal-btn"
                            onClick={() => handleGoal('A')}
                        >
                            + Goal
                        </button>
                    </div>

                    {/* Score Display */}
                    <div className="live-score-section">
                        <div className="live-score-display">
                            <div className={`live-score-number ${animateA ? 'animate' : ''}`}>
                                {currentMatch.scoreA}
                            </div>
                            <div className="live-score-separator">-</div>
                            <div className={`live-score-number ${animateB ? 'animate' : ''}`}>
                                {currentMatch.scoreB}
                            </div>
                        </div>
                    </div>

                    {/* Player B */}
                    <div className="live-player-section">
                        <div className="live-player-avatar-container">
                            {playerBData && playerBData.avatarUrl ? (
                                <img src={playerBData.avatarUrl} alt={currentMatch.playerB} className="live-player-avatar" />
                            ) : (
                                <div className="live-player-avatar-placeholder">
                                    <span>P2</span>
                                </div>
                            )}
                        </div>
                        <div className="live-player-name">{currentMatch.playerB}</div>
                        <button
                            className="btn btn-success live-goal-btn"
                            onClick={() => handleGoal('B')}
                        >
                            + Goal
                        </button>
                    </div>
                </div>

                {/* Match Actions */}
                <div className="live-match-actions">
                    <button
                        className="btn btn-ghost"
                        onClick={actions.undoGoal}
                        disabled={currentMatch.goalEvents.length === 0}
                    >
                        ↩ Undo Last Goal
                    </button>
                    <button
                        className="btn btn-danger"
                        onClick={actions.endMatch}
                    >
                        🏁 Finish Match
                    </button>
                </div>
            </div>
        </div>
    );
}
