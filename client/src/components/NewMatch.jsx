import { useState, useEffect } from 'react';
import { useMatch } from '../context/MatchContext';
import { fetchPlayers } from '../utils/api';
import PlayerSelect from './PlayerSelect';

export default function NewMatch() {
    const { state, actions } = useMatch();
    const [playerA, setPlayerA] = useState('');
    const [playerB, setPlayerB] = useState('');
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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (playerA.trim() && playerB.trim()) {
            actions.startMatch({
                playerA: playerA.trim(),
                playerB: playerB.trim(),
            });
        }
    };

    const handleAddPlayer = (name) => {
        actions.addPlayer(name);
    };

    const isValid = playerA.trim() && playerB.trim() && playerA !== playerB;

    const playerAData = playersMap[playerA];
    const playerBData = playersMap[playerB];

    return (
        <div className="new-match-screen container animate-fade-in">
            <button className="back-btn" onClick={() => actions.setScreen('home')}>
                ←
            </button>

            <div className="new-match-header">
                <h1 className="new-match-title">Start New Match</h1>
                <p className="new-match-subtitle">Select players to begin</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="new-match-card card">
                    <div className="new-match-layout">
                        {/* Home Team */}
                        <div className="team-section">
                            <div className="team-label">HOME TEAM</div>
                            <div className="team-avatar-container">
                                {playerAData && playerAData.avatarUrl ? (
                                    <img src={playerAData.avatarUrl} alt={playerA} className="team-avatar" />
                                ) : (
                                    <div className="team-avatar-placeholder">
                                        <span>?</span>
                                    </div>
                                )}
                            </div>
                            <div className="team-select-wrapper">
                                <PlayerSelect
                                    label=""
                                    value={playerA}
                                    onChange={setPlayerA}
                                    players={state.players}
                                    onAddPlayer={handleAddPlayer}
                                    playerDetailsMap={playersMap}
                                />
                            </div>
                        </div>

                        {/* VS Divider */}
                        <div className="vs-section">
                            <div className="vs-icon">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20 7L9.00004 18L3.99994 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M20 7L9.00004 18L3.99994 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="translate(0, 0) scale(-1, 1) translate(-24, 0)" />
                                </svg>
                            </div>
                            <div className="vs-text-large">VS</div>
                        </div>

                        {/* Away Team */}
                        <div className="team-section">
                            <div className="team-label">AWAY TEAM</div>
                            <div className="team-avatar-container">
                                {playerBData && playerBData.avatarUrl ? (
                                    <img src={playerBData.avatarUrl} alt={playerB} className="team-avatar" />
                                ) : (
                                    <div className="team-avatar-placeholder">
                                        <span>?</span>
                                    </div>
                                )}
                            </div>
                            <div className="team-select-wrapper">
                                <PlayerSelect
                                    label=""
                                    value={playerB}
                                    onChange={setPlayerB}
                                    players={state.players.filter(p => p !== playerA)}
                                    onAddPlayer={handleAddPlayer}
                                    playerDetailsMap={playersMap}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-success btn-lg start-match-btn"
                        disabled={!isValid}
                    >
                        Start Match
                    </button>
                </div>
            </form>
        </div>
    );
}
