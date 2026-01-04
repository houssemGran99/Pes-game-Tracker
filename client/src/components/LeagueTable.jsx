import { useState, useEffect } from 'react';
import { useMatch } from '../context/MatchContext';
import { fetchMatches } from '../utils/api';
import { calculateOverallStats, calculateLeaderboard } from '../utils/stats';

export default function LeagueTable() {
    const { actions, state } = useMatch();
    const [matches, setMatches] = useState([]);
    const [overall, setOverall] = useState({ totalMatches: 0, totalGoals: 0, avgGoalsPerMatch: 0 });
    const [leaderboard, setLeaderboard] = useState([]);
    const [selectedPlayer, setSelectedPlayer] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            const data = await fetchMatches();
            setMatches(data);
            setOverall(calculateOverallStats(data));
            const lb = calculateLeaderboard(data);
            setLeaderboard(lb);

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

    const getPlayerMatches = () => {
        if (!selectedPlayer) return [];
        return matches.filter(m =>
            m.playerA === selectedPlayer.name || m.playerB === selectedPlayer.name
        );
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
                        playerMatches.map((match, index) => {
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
                                                onClick={() => {
                                                    const opponent = leaderboard.find(p => p.name === match.playerA);
                                                    if (opponent) setSelectedPlayer(opponent);
                                                }}
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
                                                onClick={() => {
                                                    const opponent = leaderboard.find(p => p.name === match.playerB);
                                                    if (opponent) setSelectedPlayer(opponent);
                                                }}
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

    const renderLeaderboard = () => (
        <>


            <div className="leaderboard">


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

            <h2 className="section-title">League Table</h2>

            {selectedPlayer ? renderPlayerDetail() : renderLeaderboard()}
        </div>
    );
}
