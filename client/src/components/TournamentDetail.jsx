import { useState, useEffect } from 'react';
import { useMatch } from '../context/MatchContext';
import { fetchMatches, updateTournament } from '../utils/api';
import { calculateOverallStats, calculateLeaderboard } from '../utils/stats';
import { useAuth } from '../context/AuthContext';
import PlayerSelect from './PlayerSelect';

export default function TournamentDetail() {
    const { state, actions } = useMatch();
    const { isAdmin } = useAuth();
    const { currentTournament } = state;
    const [matches, setMatches] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [view, setView] = useState('table'); // 'table', 'matches' or 'addMatch'

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editMaxPoints, setEditMaxPoints] = useState('');
    const [editParticipants, setEditParticipants] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState('');

    const startEditing = () => {
        setEditName(currentTournament.name);
        setEditMaxPoints(currentTournament.maxPoints || '');
        setEditParticipants([...currentTournament.participants]);
        setIsEditing(true);
    };

    const handleSaveTournament = async () => {
        if (!editName.trim() || editParticipants.length < 2) {
            alert("Name required and at least 2 participants.");
            return;
        }

        try {
            await updateTournament(currentTournament._id, {
                name: editName,
                maxPoints: editMaxPoints ? parseInt(editMaxPoints) : null,
                participants: editParticipants
            });

            // Update local state
            actions.setTournament({
                ...currentTournament,
                name: editName,
                maxPoints: editMaxPoints ? parseInt(editMaxPoints) : null,
                participants: editParticipants
            });
            setIsEditing(false);
        } catch (err) {
            alert('Failed to update tournament');
        }
    };

    const handleAddParticipant = (name) => {
        if (!name.trim()) return;
        if (!editParticipants.includes(name)) {
            setEditParticipants([...editParticipants, name]);
        }
    };

    const handleRemoveParticipant = (name) => {
        if (confirm(`Remove ${name} from tournament? Matches involving them might be affected.`)) {
            setEditParticipants(editParticipants.filter(p => p !== name));
        }
    };

    const checkWinner = async (sortedLb, tournamentId) => {
        if (!currentTournament.maxPoints || currentTournament.status === 'completed') return;

        const winner = sortedLb.find(p => p.points >= currentTournament.maxPoints);
        if (winner) {
            try {
                await updateTournament(tournamentId, {
                    status: 'completed',
                    winner: winner.name
                });
                // Update local state to reflect change immediately
                actions.setTournament({
                    ...currentTournament,
                    status: 'completed',
                    winner: winner.name
                });
                // alert(`🏆 ${winner.name} has won the tournament!`); // Removed per user request
            } catch (err) {
                console.error('Failed to update tournament status', err);
            }
        }
    };

    useEffect(() => {
        if (!currentTournament) return;
        const loadData = async () => {
            const data = await fetchMatches(currentTournament._id);
            setMatches(data);

            let lb = calculateLeaderboard(data);

            const participantNames = currentTournament.participants || [];
            const lbNames = new Set(lb.map(p => p.name));

            participantNames.forEach(name => {
                if (!lbNames.has(name)) {
                    lb.push({
                        name,
                        matches: 0, wins: 0, losses: 0, draws: 0,
                        goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
                        form: []
                    });
                }
            });

            lb.sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor);
            setLeaderboard(lb);

            // Check for winner only if active
            if (currentTournament.status !== 'completed') {
                checkWinner(lb, currentTournament._id);
            }
        };
        loadData();
    }, [currentTournament]);

    if (!currentTournament) return null;

    const isCompleted = currentTournament.status === 'completed';

    if (isEditing) {
        return (
            <div className="tournament-detail-screen container animate-fade-in">
                <div className="card">
                    <h3>Edit Tournament</h3>
                    <div className="form-group">
                        <label>Name</label>
                        <input className="form-input" value={editName} onChange={e => setEditName(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Target Points (Optional)</label>
                        <input className="form-input" type="number" value={editMaxPoints} onChange={e => setEditMaxPoints(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Participants</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                            {editParticipants.map(p => (
                                <span key={p} className="badge" style={{ padding: '0.4rem 0.8rem', backgroundColor: '#e2e8f0', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {p}
                                    <button onClick={() => handleRemoveParticipant(p)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>×</button>
                                </span>
                            ))}
                        </div>
                        <PlayerSelect
                            label="Add Participant"
                            value={currentPlayer}
                            onChange={(name) => handleAddParticipant(name)}
                            players={state.players.filter(p => !editParticipants.includes(p))}
                            onAddPlayer={(name) => {
                                actions.addPlayer(name);
                                handleAddParticipant(name);
                            }}
                        />
                    </div>
                    <div className="form-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button className="btn btn-primary" onClick={handleSaveTournament}>Save Changes</button>
                        <button className="btn btn-ghost" onClick={() => setIsEditing(false)}>Cancel</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="tournament-detail-screen container animate-fade-in">
            <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <button className="back-btn" onClick={() => {
                    actions.setTournament(null);
                    actions.setScreen('tournamentList');
                }} style={{ margin: 0 }}>
                    ← Back
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h2 className="section-title" style={{ margin: 0, fontSize: '1.2rem' }}>{currentTournament.name}</h2>
                    {isAdmin && !isCompleted && (
                        <button onClick={startEditing} className="btn-sm" style={{ background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                    )}
                </div>
            </div>

            {isCompleted && currentTournament.winner && (
                <div className="winner-banner card" style={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #FDB931 100%)',
                    color: '#fff',
                    textAlign: 'center',
                    marginBottom: '1.5rem',
                    padding: '2rem'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏆</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{currentTournament.name} Winner</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '900', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                        {currentTournament.winner}
                    </div>
                </div>
            )}

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
                {!isCompleted && (
                    <button
                        className="btn btn-success"
                        onClick={() => {
                            setView('addMatch');
                        }}
                    >
                        + New Match
                    </button>
                )}
            </div>

            {view === 'addMatch' && !isCompleted && (
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
