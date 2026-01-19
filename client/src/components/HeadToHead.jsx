
import { useState, useEffect } from 'react';
import { useMatch } from '../context/MatchContext';
import { fetchMatches } from '../utils/api';
import PlayerSelect from './PlayerSelect';

export default function HeadToHead() {
    const { actions, state } = useMatch();
    const { players } = state;
    const [matches, setMatches] = useState([]);

    // H2H State
    const [h2hA, setH2hA] = useState('');
    const [h2hB, setH2hB] = useState('');

    useEffect(() => {
        const loadData = async () => {
            const data = await fetchMatches();
            setMatches(data);
        };
        loadData();
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

    const getH2HMatches = () => {
        if (!h2hA || !h2hB) return [];
        return matches.filter(m =>
            (m.playerA === h2hA && m.playerB === h2hB) ||
            (m.playerA === h2hB && m.playerB === h2hA)
        );
    };

    const getH2HStats = (matches) => {
        let stats = {
            total: matches.length,
            winsA: 0,
            winsB: 0,
            draws: 0,
            goalsA: 0,
            goalsB: 0
        };

        matches.forEach(m => {
            const isAHome = m.playerA === h2hA;
            const scoreA = isAHome ? m.scoreA : m.scoreB;
            const scoreB = isAHome ? m.scoreB : m.scoreA;

            stats.goalsA += scoreA;
            stats.goalsB += scoreB;

            if (scoreA > scoreB) stats.winsA++;
            else if (scoreB > scoreA) stats.winsB++;
            else stats.draws++;
        });

        return stats;
    };

    const renderH2HContent = () => {
        const matchesH2H = getH2HMatches();
        const stats = getH2HStats(matchesH2H);

        // Calculate progress bars vs total
        const totalWins = stats.winsA + stats.winsB + stats.draws;
        const widthA = totalWins ? (stats.winsA / totalWins) * 100 : 0;
        const widthB = totalWins ? (stats.winsB / totalWins) * 100 : 0;
        const widthDraw = totalWins ? (stats.draws / totalWins) * 100 : 0;

        return (
            <div className="animate-fade-in">

                <div className="card mb-4" style={{ padding: '1.5rem', marginBottom: '2rem', position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center' }}>
                        <PlayerSelect
                            label="Player A"
                            value={h2hA}
                            onChange={setH2hA}
                            players={players}
                        />
                        <div className="vs-text" style={{ paddingTop: '1.5rem', fontWeight: 'bold', fontSize: '1.2rem' }}>VS</div>
                        <PlayerSelect
                            label="Player B"
                            value={h2hB}
                            onChange={setH2hB}
                            players={players.filter(p => p !== h2hA)}
                        />
                    </div>
                </div>

                {h2hA && h2hB ? (
                    <>
                        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                            <div className="stat-card card" style={{ textAlign: 'center' }}>
                                <div className="stat-value text-primary">{stats.winsA}</div>
                                <div className="stat-label">{h2hA} Wins</div>
                            </div>
                            <div className="stat-card card">
                                <div className="stat-value">{stats.draws}</div>
                                <div className="stat-label">Draws</div>
                            </div>
                            <div className="stat-card card">
                                <div className="stat-value text-secondary">{stats.winsB}</div>
                                <div className="stat-label">{h2hB} Wins</div>
                            </div>
                        </div>

                        {/* Comparison Bar */}
                        <div style={{ margin: '2rem 0', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
                            <div style={{ width: `${widthA}% `, background: 'var(--color-primary)' }} />
                            <div style={{ width: `${widthDraw}% `, background: 'var(--color-text-muted)' }} />
                            <div style={{ width: `${widthB}% `, background: 'var(--color-secondary)' }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                            <span>Total Goals: {stats.goalsA}</span>
                            <span>{matchesH2H.length} Matches Total</span>
                            <span>Total Goals: {stats.goalsB}</span>
                        </div>

                        <h3 className="section-title">Head to Head History</h3>
                        <div className="match-list">
                            {matchesH2H.length > 0 ? (
                                matchesH2H.map((match, index) => (
                                    <div key={match._id || match.id || index} className="match-card card">
                                        <div className="match-card-header">
                                            <span className="match-date">{formatDate(match.date)}</span>
                                        </div>
                                        <div className="match-card-score">
                                            <div className={`match-card-player ${match.scoreA > match.scoreB ? 'winner' : ''}`}>
                                                <div className="match-card-player-name">
                                                    {match.playerA}
                                                </div>
                                                <div className="match-card-player-score">{match.scoreA}</div>
                                            </div>
                                            <div className="match-card-vs">vs</div>
                                            <div className={`match-card-player ${match.scoreB > match.scoreA ? 'winner' : ''}`}>
                                                <div className="match-card-player-name">
                                                    {match.playerB}
                                                </div>
                                                <div className="match-card-player-score">{match.scoreB}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <p>No matches yet between these two</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">🥊</div>
                        <p>Select two players to compare</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h2h-screen container animate-fade-in">
            <button className="back-btn" onClick={() => actions.setScreen('home')}>
                ← Back to Home
            </button>

            <h2 className="section-title text-center mb-6">Head To Head</h2>
            {renderH2HContent()}
        </div>
    );
}
