import { useState, useEffect } from 'react';
import { useMatch } from '../context/MatchContext';
import { fetchMatches } from '../utils/api';
import { calculateOverallStats, calculateLeaderboard } from '../utils/stats';
import PlayerSelect from './PlayerSelect';

export default function Statistics() {
    const { actions, state } = useMatch();
    const { players } = state;
    const [matches, setMatches] = useState([]);
    const [overall, setOverall] = useState({ totalMatches: 0, totalGoals: 0, avgGoalsPerMatch: 0 });
    const [leaderboard, setLeaderboard] = useState([]);

    // View State
    const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard' | 'h2h'
    const [selectedPlayer, setSelectedPlayer] = useState(null); // For Player Detail view

    // H2H State
    const [h2hA, setH2hA] = useState('');
    const [h2hB, setH2hB] = useState('');

    useEffect(() => {
        const loadData = async () => {
            const data = await fetchMatches();
            setMatches(data);
            setOverall(calculateOverallStats(data));
            const lb = calculateLeaderboard(data);
            setLeaderboard(lb);

            // Handle navigation params
            if (state.screenParams && state.screenParams.selectedPlayer) {
                const player = lb.find(p => p.name === state.screenParams.selectedPlayer);
                if (player) {
                    setSelectedPlayer(player);
                }
            }
        };
        loadData();
    }, [state.screenParams]);

    const getRankClass = (index) => {
        if (index === 0) return 'gold';
        if (index === 1) return 'silver';
        if (index === 2) return 'bronze';
        return '';
    };

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

    // --- Helpers ---

    const getPlayerMatches = () => {
        if (!selectedPlayer) return [];
        return matches.filter(m =>
            m.playerA === selectedPlayer.name || m.playerB === selectedPlayer.name
        );
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

    // --- Render Views ---

    const handleReviewPlayer = (playerName) => {
        const player = leaderboard.find(p => p.name === playerName);
        if (player) {
            setSelectedPlayer(player);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const renderPlayerDetail = () => {
        const playerMatches = getPlayerMatches();
        return (
            <div className="animate-fade-in">
                <button className="back-btn" onClick={() => setSelectedPlayer(null)}>
                    ← Back to Leaderboard
                </button>

                <h2 className="section-title">{selectedPlayer.name}</h2>
                <div className="subtitle">Player Statistics</div>

                <div className="stats-grid">
                    <div className="stat-card card">
                        <div className="stat-value">{selectedPlayer.matches}</div>
                        <div className="stat-label">Matches</div>
                    </div>
                    <div className="stat-card card">
                        <div className="stat-value">{selectedPlayer.wins}</div>
                        <div className="stat-label">Wins</div>
                    </div>
                    <div className="stat-card card">
                        <div className="stat-value">{selectedPlayer.goalsFor}</div>
                        <div className="stat-label">Goals</div>
                    </div>
                    <div className="stat-card card">
                        <div className="stat-value">{selectedPlayer.winRate}%</div>
                        <div className="stat-label">Win Rate</div>
                    </div>
                </div>

                <h3 className="section-title">Match History</h3>
                <div className="match-list">
                    {playerMatches.length > 0 ? (
                        playerMatches.map((match) => {
                            const isWin = (match.playerA === selectedPlayer.name && match.scoreA > match.scoreB) ||
                                (match.playerB === selectedPlayer.name && match.scoreB > match.scoreA);
                            const isDraw = match.scoreA === match.scoreB;

                            return (
                                <div key={match._id || match.id || index} className="match-card card" style={{
                                    borderLeft: `4px solid ${isWin ? 'var(--color-success)' : isDraw ? 'var(--color-warning)' : 'var(--color-danger)'} `
                                }}>
                                    <div className="match-card-header">
                                        <span className="match-date">{formatDate(match.date)}</span>
                                        <span style={{
                                            color: isWin ? 'var(--color-success)' : isDraw ? 'var(--color-warning)' : 'var(--color-danger)',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase',
                                            fontSize: '0.8rem'
                                        }}>
                                            {isWin ? 'Win' : isDraw ? 'Draw' : 'Loss'}
                                        </span>
                                    </div>
                                    <div className="match-card-score">
                                        <div className="match-card-player">
                                            <div
                                                className="match-card-player-name"
                                                onClick={() => handleReviewPlayer(match.playerA)}
                                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                            >
                                                {match.playerA}
                                            </div>
                                            <div className="match-card-player-score">{match.scoreA}</div>
                                        </div>
                                        <div className="match-card-vs">vs</div>
                                        <div className="match-card-player">
                                            <div
                                                className="match-card-player-name"
                                                onClick={() => handleReviewPlayer(match.playerB)}
                                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                            >
                                                {match.playerB}
                                            </div>
                                            <div className="match-card-player-score">{match.scoreB}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-center text-muted">No matches found</p>
                    )}
                </div>
            </div>
        );
    };

    const renderH2H = () => {
        const matches = getH2HMatches();
        const stats = getH2HStats(matches);

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
                        // No onAddPlayer passed -> Select only
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
                            <span>{matches.length} Matches Total</span>
                            <span>Total Goals: {stats.goalsB}</span>
                        </div>

                        <h3 className="section-title">Head to Head History</h3>
                        <div className="match-list">
                            {matches.length > 0 ? (
                                matches.map((match, index) => (
                                    <div key={match._id || match.id || index} className="match-card card">
                                        <div className="match-card-header">
                                            <span className="match-date">{formatDate(match.date)}</span>
                                        </div>
                                        <div className="match-card-score">
                                            <div className={`match-card-player ${match.scoreA > match.scoreB ? 'winner' : ''}`}>
                                                <div
                                                    className="match-card-player-name"
                                                    onClick={() => handleReviewPlayer(match.playerA)}
                                                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                                >
                                                    {match.playerA}
                                                </div>
                                                <div className="match-card-player-score">{match.scoreA}</div>
                                            </div>
                                            <div className="match-card-vs">vs</div>
                                            <div className={`match-card-player ${match.scoreB > match.scoreA ? 'winner' : ''}`}>
                                                <div
                                                    className="match-card-player-name"
                                                    onClick={() => handleReviewPlayer(match.playerB)}
                                                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                                >
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

    const renderLeaderboard = () => (
        <>
            <div className="stats-grid">
                <div className="stat-card card">
                    <div className="stat-value">{overall.totalMatches}</div>
                    <div className="stat-label">Matches</div>
                </div>
                <div className="stat-card card">
                    <div className="stat-value">{overall.totalGoals}</div>
                    <div className="stat-label">Total Goals</div>
                </div>
                <div className="stat-card card">
                    <div className="stat-value">{overall.avgGoalsPerMatch}</div>
                    <div className="stat-label">Avg Goals/Match</div>
                </div>
                <div className="stat-card card">
                    <div className="stat-value">{leaderboard.length}</div>
                    <div className="stat-label">Players</div>
                </div>
            </div>

            <div className="leaderboard">
                <h3 className="section-title">League Table</h3>

                {leaderboard.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🏆</div>
                        <p>No matches played yet</p>
                        <p className="text-muted">Play some matches to see the league table!</p>
                    </div>
                ) : (
                    <div className="table-container card" style={{ padding: 0, width: '100%', maxWidth: '100vw' }}>
                        <table className="league-table">
                            <thead>
                                <tr>
                                    <th className="text-left">#</th>
                                    <th className="text-left">Team</th>
                                    <th title="Matches Played">MP</th>
                                    <th title="Wins">W</th>
                                    <th title="Draws">D</th>
                                    <th title="Losses">L</th>
                                    <th title="Goals For">GF</th>
                                    <th title="Goals Against">GA</th>
                                    <th title="Goal Difference">GD</th>
                                    <th>Pts</th>
                                    <th>Last 5</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.map((player, index) => (
                                    <tr
                                        key={player.name}
                                        onClick={() => setSelectedPlayer(player)}
                                    >
                                        <td className="text-left">
                                            <span className={`leaderboard-rank ${getRankClass(index)}`}>
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="team-cell">
                                            {player.name}
                                        </td>
                                        <td>{player.matches}</td>
                                        <td style={{ color: 'var(--color-success)' }}>{player.wins}</td>
                                        <td style={{ color: 'var(--color-warning)' }}>{player.draws}</td>
                                        <td style={{ color: 'var(--color-danger)' }}>{player.losses}</td>
                                        <td>{player.goalsFor}</td>
                                        <td>{player.goalsAgainst}</td>
                                        <td>
                                            <span style={{ color: player.goalDifference > 0 ? 'var(--color-success)' : player.goalDifference < 0 ? 'var(--color-danger)' : 'inherit' }}>
                                                {player.goalDifference > 0 ? '+' : ''}{player.goalDifference}
                                            </span>
                                        </td>
                                        <td className="points-cell">{player.points}</td>
                                        <td>
                                            <div className="form-badges">
                                                {player.form && player.form.map((result, i) => (
                                                    <div key={i} className={`form-badge ${result === 'W' ? 'win' : result === 'D' ? 'draw' : 'loss'}`}>
                                                        {result}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );

    return (
        <div className="stats-screen container animate-fade-in">
            <button className="back-btn" onClick={() => actions.setScreen('home')}>
                ← Back to Home
            </button>

            <h2 className="section-title">Statistics</h2>

            {/* View Switcher / Tabs */}
            {!selectedPlayer && (
                <div className="tabs" style={{ display: 'flex', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <button
                        className={`btn btn-ghost ${activeTab === 'leaderboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('leaderboard')}
                        style={{ borderBottom: activeTab === 'leaderboard' ? '2px solid var(--color-primary)' : 'none', borderRadius: 0 }}
                    >
                        🏆 Leaderboard
                    </button>
                    <button
                        className={`btn btn-ghost ${activeTab === 'h2h' ? 'active' : ''}`}
                        onClick={() => setActiveTab('h2h')}
                        style={{ borderBottom: activeTab === 'h2h' ? '2px solid var(--color-primary)' : 'none', borderRadius: 0 }}
                    >
                        🥊 Head to Head
                    </button>
                </div>
            )}

            {/* Content Render */}
            {selectedPlayer ? renderPlayerDetail() : (
                activeTab === 'h2h' ? renderH2H() : renderLeaderboard()
            )}
        </div>
    );
}
