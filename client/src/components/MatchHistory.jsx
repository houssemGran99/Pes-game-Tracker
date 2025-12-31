import { useState, useEffect } from 'react';
import { useMatch } from '../context/MatchContext';
import { fetchMatches } from '../utils/api';

export default function MatchHistory() {
    const { actions } = useMatch();
    const [matches, setMatches] = useState([]);

    useEffect(() => {
        fetchMatches().then(setMatches);
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getWinner = (match) => {
        if (match.scoreA > match.scoreB) return 'A';
        if (match.scoreB > match.scoreA) return 'B';
        return 'draw';
    };

    const handlePlayerClick = (playerName) => {
        actions.setScreen('stats', { selectedPlayer: playerName });
    };

    return (
        <div className="history-screen container animate-fade-in">
            <button className="back-btn" onClick={() => actions.setScreen('home')}>
                ← Back to Home
            </button>

            <h2 className="section-title">Match History</h2>

            {matches.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📜</div>
                    <p>No matches yet</p>
                    <p className="text-muted">Start a new match to see history here</p>
                </div>
            ) : (
                <div className="match-list">
                    {matches.map((match) => {
                        const winner = getWinner(match);
                        return (
                            <div key={match.id} className="match-card card">
                                <div className="match-card-header">
                                    <span className="match-date">{formatDate(match.date)}</span>
                                </div>
                                <div className="match-card-score">
                                    <div className={`match-card-player ${winner === 'A' ? 'winner' : ''}`}>
                                        <div
                                            className="match-card-player-name"
                                            onClick={() => handlePlayerClick(match.playerA)}
                                            style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                        >
                                            {match.playerA}
                                        </div>
                                        <div className="match-card-player-score">{match.scoreA}</div>
                                    </div>
                                    <div className="match-card-vs">vs</div>
                                    <div className={`match-card-player ${winner === 'B' ? 'winner' : ''}`}>
                                        <div
                                            className="match-card-player-name"
                                            onClick={() => handlePlayerClick(match.playerB)}
                                            style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                        >
                                            {match.playerB}
                                        </div>
                                        <div className="match-card-player-score">{match.scoreB}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
