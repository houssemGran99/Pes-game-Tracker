import { useState, useEffect } from 'react';
import { useMatch } from '../context/MatchContext';
import { fetchMatches } from '../utils/api';
import { calculateOverallStats, calculateLeaderboard } from '../utils/stats';
import LeagueTable from './LeagueTable'; // We can potentially reuse this or parts of it?
// Actually, it's better to reuse logic but the `LeagueTable` component is a full screen component.
// We might want to "embed" the table part or just rebuild a similar view for the tournament context.
// Given the user request "make it possible to add a tournament... and every tournament have its own league table",
// reusing the LeagueTable component but passing filtered matches is the smartest way if possible.

export default function TournamentDetail() {
    const { state, actions } = useMatch();
    const { currentTournament } = state;
    const [matches, setMatches] = useState([]);
    const [stats, setStats] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [view, setView] = useState('table'); // 'table', 'matches' or 'addMatch'

    // We can just reuse logic for now.
    useEffect(() => {
        if (!currentTournament) return;
        const loadData = async () => {
            const data = await fetchMatches(currentTournament._id);
            setMatches(data);
            // Ensure we only consider matches for this tournament.
            // The API filter should handle it, but double check? 
            // Logic: stats utils work on a list of matches.
            // We need to make sure the leaderboard ONLY includes participants even if they have played 0 matches.
            // The standard `calculateLeaderboard` might only include players found in matches.
            // Let's see if we need to adjust that.

            let lb = calculateLeaderboard(data);

            // Ensure all tournament participants are in the leaderboard
            // If a participant hasn't played, they won't be in `lb` likely.
            // Let's merge.
            const participantNames = currentTournament.participants || [];
            const lbNames = new Set(lb.map(p => p.name));

            participantNames.forEach(name => {
                if (!lbNames.has(name)) {
                    lb.push({
                        name,
                        matches: 0,
                        wins: 0,
                        losses: 0,
                        draws: 0,
                        goalsFor: 0,
                        goalsAgainst: 0,
                        goalDifference: 0,
                        points: 0,
                        form: []
                    });
                }
            });

            // Re-sort
            lb.sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor);

            setLeaderboard(lb);
        };
        loadData();
    }, [currentTournament]);

    // Helper to reuse LeagueTable logic?
    // The `LeagueTable` component has its own data fetching. 
    // It might be better to modify `LeagueTable` to accept `matches` and `leaderboard` as props optionally,
    // OR create a specialized view here.
    // Let's create a specialized view here to keep it self-contained for now, as it also needs "Add Match" specific to tournament.

    if (!currentTournament) return null;

    return (
        <div className="tournament-detail-screen container animate-fade-in">
            <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <button className="back-btn" onClick={() => {
                    actions.setTournament(null);
                    actions.setScreen('tournamentList');
                }} style={{ margin: 0 }}>
                    ← Back
                </button>
                <h2 className="section-title" style={{ margin: 0, fontSize: '1.2rem' }}>{currentTournament.name}</h2>
            </div>

            <div className="tournament-actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <button
                    className={`btn ${view === 'table' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setView('table')}
                >
                    Leaderboard
                </button>
                <button
                    className={`btn ${view === 'matches' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setView('matches')}
                >
                    Matches
                </button>
                <button
                    className="btn btn-success"
                    onClick={() => {
                        setView('addMatch');
                    }}
                >
                    + New Match
                </button>
            </div>

            {view === 'addMatch' && (
                <LocalNewMatch
                    participants={currentTournament.participants}
                    onCancel={() => setView('table')}
                    onStart={(pA, pB) => actions.startMatch({ playerA: pA, playerB: pB, tournamentId: currentTournament._id })}
                />
            )}

            {view === 'table' && (
                <div className="tournament-table">
                    {/* Reuse table rendering logic */}
                    <TournamentTable leaderboard={leaderboard} />
                </div>
            )}

            {view === 'matches' && (
                <div className="match-list" style={{ marginTop: '1rem' }}>
                    {matches.length === 0 ? (
                        <div className="p-4 text-center text-muted">No matches played yet</div>
                    ) : (
                        matches.map((match, index) => {
                            const isWinA = match.scoreA > match.scoreB;
                            const isWinB = match.scoreB > match.scoreA;

                            return (
                                <div key={match._id || index} className="match-card card">
                                    <div className="match-card-header">
                                        <span className="match-date">
                                            {new Date(match.date).toLocaleDateString(undefined, {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <div className="match-card-score">
                                        <div className={`match-card-player ${isWinA ? 'winner' : ''}`}>
                                            <div className="match-card-player-name">{match.playerA}</div>
                                            <div className="match-card-player-score">{match.scoreA}</div>
                                        </div>
                                        <div className="match-card-vs">vs</div>
                                        <div className={`match-card-player ${isWinB ? 'winner' : ''}`}>
                                            <div className="match-card-player-name">{match.playerB}</div>
                                            <div className="match-card-player-score">{match.scoreB}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}

function LocalNewMatch({ participants, onCancel, onStart }) {
    const [playerA, setPlayerA] = useState('');
    const [playerB, setPlayerB] = useState('');

    // Simple native select for now since participants are limited
    const safeParticipants = participants || [];

    return (
        <div className="card animate-fade-in">
            <h3>New Tournament Match</h3>
            <div className="form-group">
                <label>Home Team</label>
                <select className="form-input" value={playerA} onChange={e => setPlayerA(e.target.value)}>
                    <option value="">Select Player...</option>
                    {safeParticipants.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>

            <div className="vs-divider my-2">VS</div>

            <div className="form-group">
                <label>Away Team</label>
                <select className="form-input" value={playerB} onChange={e => setPlayerB(e.target.value)}>
                    <option value="">Select Player...</option>
                    {safeParticipants.filter(p => p !== playerA).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>

            <div className="form-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button className="btn btn-ghost" onClick={onCancel} style={{ flex: 1 }}>Cancel</button>
                <button
                    className="btn btn-primary"
                    disabled={!playerA || !playerB}
                    onClick={() => onStart(playerA, playerB)}
                    style={{ flex: 1 }}
                >
                    Start Game
                </button>
            </div>
        </div>
    );
}

function TournamentTable({ leaderboard }) {
    const getRankClass = (index) => {
        if (index === 0) return 'gold';
        if (index === 1) return 'silver';
        if (index === 2) return 'bronze';
        return '';
    };

    return (
        <div className="table-container card" style={{ padding: 0, width: '100%', overflowX: 'auto' }}>
            <table className="league-table">
                <thead>
                    <tr>
                        <th className="text-left">#</th>
                        <th className="text-left">Team</th>
                        <th>MP</th>
                        <th>W</th>
                        <th>D</th>
                        <th>L</th>
                        <th>GF</th>
                        <th>GA</th>
                        <th>GD</th>
                        <th>Pts</th>
                        <th>Last 5</th>
                    </tr>
                </thead>
                <tbody>
                    {leaderboard.map((player, index) => (
                        <tr key={player.name} style={{ cursor: 'default' }}>
                            <td className="text-left">
                                <span className={`leaderboard-rank ${getRankClass(index)}`}>
                                    {index + 1}
                                </span>
                            </td>
                            <td className="team-cell">{player.name}</td>
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
    );
}
