import { useState, useEffect } from 'react';
import { useMatch } from '../context/MatchContext';
import { fetchMatches, updateTournament, deleteTournament, fetchPlayers } from '../utils/api';
import { calculateOverallStats, calculateLeaderboard } from '../utils/stats';
import { useAuth } from '../context/AuthContext';
import PlayerSelect from './PlayerSelect';
import { TOURNAMENT_THEMES } from '../utils/themes';

export default function TournamentDetail() {
    const { state, actions } = useMatch();
    const { isAdmin } = useAuth();
    const { currentTournament } = state;
    const [matches, setMatches] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [playersMap, setPlayersMap] = useState({});
    const [view, setView] = useState('table'); // 'table', 'matches' or 'addMatch'

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editMaxPoints, setEditMaxPoints] = useState('');
    const [editParticipants, setEditParticipants] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState('');
    const [editTheme, setEditTheme] = useState('classic');

    const startEditing = () => {
        setEditName(currentTournament.name);
        setEditMaxPoints(currentTournament.maxPoints || '');
        setEditParticipants([...currentTournament.participants]);
        setEditTheme(currentTournament.theme || 'classic');
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
                participants: editParticipants,
                theme: editTheme
            });

            // Update local state
            actions.setTournament({
                ...currentTournament,
                name: editName,
                maxPoints: editMaxPoints ? parseInt(editMaxPoints) : null,
                participants: editParticipants,
                theme: editTheme
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
            } catch (err) {
                console.error('Failed to update tournament status', err);
            }
        }
    };

    useEffect(() => {
        if (!currentTournament) return;
        const loadData = async () => {
            const [matchesData, playersData] = await Promise.all([
                fetchMatches(currentTournament._id),
                fetchPlayers()
            ]);
            setMatches(matchesData);

            const pMap = {};
            if (Array.isArray(playersData)) {
                playersData.forEach(p => pMap[p.name] = p);
            }
            setPlayersMap(pMap);

            let lb = calculateLeaderboard(matchesData);

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

    // Get theme
    const themeKey = currentTournament?.theme || 'classic';
    const theme = TOURNAMENT_THEMES[themeKey] || TOURNAMENT_THEMES['classic'];

    // Apply theme to body
    useEffect(() => {
        if (theme) {
            const root = document.documentElement;
            const body = document.body;

            root.style.setProperty('--color-primary', theme.colors.primary);
            root.style.setProperty('--color-secondary', theme.colors.secondary);

            // Update body background to cover entire viewport
            body.style.background = theme.colors.background;
            body.style.backgroundSize = theme.colors.backgroundSize || 'cover';
            body.style.backgroundAttachment = 'fixed';
            body.style.backgroundPosition = 'center';
            body.style.backgroundRepeat = 'no-repeat';
            body.style.minHeight = '100vh';
            body.style.minHeight = '100dvh'; // Dynamic viewport height for mobile
            body.style.width = '100%';

            // Ensure html element also covers full viewport
            root.style.minHeight = '100vh';
            root.style.minHeight = '100dvh';
            root.style.width = '100%';

            // Update card gradient variable
            const cardGradient = theme.colors.card === 'transparent' ? 'none' : theme.colors.card.includes('gradient') ? theme.colors.card : `linear-gradient(145deg, ${theme.colors.card}, ${theme.colors.card})`;
            root.style.setProperty('--gradient-card', cardGradient);
        }

        return () => {
            // Cleanup / Reset
            const root = document.documentElement;
            const body = document.body;

            root.style.removeProperty('--color-primary');
            root.style.removeProperty('--color-secondary');
            root.style.removeProperty('--gradient-card');
            body.style.background = '';
            body.style.backgroundSize = '';
            body.style.backgroundAttachment = '';
            body.style.backgroundPosition = '';
            body.style.backgroundRepeat = '';
            body.style.minHeight = '';
            body.style.width = '';
            root.style.minHeight = '';
            root.style.width = '';
        };
    }, [theme]);

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
                        <label>Tournament Theme</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.5rem' }}>
                            {Object.entries(TOURNAMENT_THEMES).map(([key, theme]) => (
                                <div
                                    key={key}
                                    onClick={() => setEditTheme(key)}
                                    style={{
                                        cursor: 'pointer',
                                        padding: '0.5rem',
                                        borderRadius: '8px',
                                        border: editTheme === key ? `2px solid var(--color-primary)` : '2px solid transparent',
                                        background: 'rgba(255,255,255,0.05)',
                                        textAlign: 'center',
                                        opacity: editTheme === key ? 1 : 0.7
                                    }}
                                >
                                    <div style={{
                                        width: '100%', height: '40px', borderRadius: '4px', marginBottom: '0.25rem',
                                        background: theme.colors.background,
                                        backgroundSize: theme.colors.backgroundSize || 'cover'
                                    }}></div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: editTheme === key ? 'bold' : 'normal' }}>{theme.name}</div>
                                </div>
                            ))}
                        </div>
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

    const handleDeleteTournament = async () => {
        if (confirm(`Are you sure you want to delete "${currentTournament.name}"? This cannot be undone.`)) {
            try {
                await deleteTournament(currentTournament._id);
                actions.setTournament(null);
                actions.setScreen('tournamentList');
            } catch (err) {
                alert('Failed to delete tournament');
            }
        }
    };

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
                    {isAdmin && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {!isCompleted && (
                                <button onClick={startEditing} className="btn-sm" style={{ background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                            )}
                            <button onClick={handleDeleteTournament} className="btn-sm" style={{ background: 'var(--color-danger)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                        </div>
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
                {isAdmin && !isCompleted && (
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
                    playersMap={playersMap}
                    onCancel={() => setView('table')}
                    onStart={(pA, pB) => actions.startMatch({ playerA: pA, playerB: pB, tournamentId: currentTournament._id })}
                />
            )}

            {view === 'table' && (
                <div className="tournament-table">
                    {/* Reuse table rendering logic */}
                    <TournamentTable leaderboard={leaderboard} playersMap={playersMap} />
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

function LocalNewMatch({ participants, playersMap, onCancel, onStart }) {
    const [playerA, setPlayerA] = useState('');
    const [playerB, setPlayerB] = useState('');

    const safeParticipants = participants || [];
    const playerAData = playersMap[playerA];
    const playerBData = playersMap[playerB];

    const isValid = playerA && playerB && playerA !== playerB;

    return (
        <div className="card new-match-card animate-fade-in p-8 bg-bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-md max-w-4xl mx-auto">
            <h3 className="section-title text-center mb-8 text-2xl font-bold">New Tournament Match</h3>

            <div className="new-match-layout grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 items-start mb-8">
                {/* Home Team */}
                <div className="team-section flex flex-col items-center gap-4">
                    <div className="team-label text-xs font-semibold tracking-widest text-white/70 uppercase">HOME TEAM</div>
                    <div className="team-avatar-container w-32 h-32 relative">
                        {playerAData && playerAData.avatarUrl ? (
                            <img src={playerAData.avatarUrl} alt={playerA} className="team-avatar w-full h-full rounded-full object-cover border-4 border-primary shadow-[0_0_20px_rgba(0,212,255,0.2)]" />
                        ) : (
                            <div className="team-avatar-placeholder w-full h-full rounded-full border-4 border-dashed border-white/20 flex items-center justify-center bg-white/5 text-5xl text-white/30 font-light">
                                <span>?</span>
                            </div>
                        )}
                    </div>
                    <div className="team-select-wrapper w-full max-w-[250px]">
                        <PlayerSelect
                            label=""
                            value={playerA}
                            onChange={setPlayerA}
                            players={safeParticipants}
                            playerDetailsMap={playersMap}
                        />
                    </div>
                </div>

                {/* VS Divider */}
                <div className="vs-section flex flex-col items-center justify-center gap-2 pt-12 md:pt-12">
                    <div className="vs-icon w-14 h-14 rounded-full bg-gradient-to-br from-success to-[#00cc6a] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(0,255,136,0.3)]">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 7L9.00004 18L3.99994 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M20 7L9.00004 18L3.99994 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="translate(0, 0) scale(-1, 1) translate(-24, 0)" />
                        </svg>
                    </div>
                    <div className="vs-text-large text-2xl font-bold text-white mt-2">VS</div>
                </div>

                {/* Away Team */}
                <div className="team-section flex flex-col items-center gap-4">
                    <div className="team-label text-xs font-semibold tracking-widest text-white/70 uppercase">AWAY TEAM</div>
                    <div className="team-avatar-container w-32 h-32 relative">
                        {playerBData && playerBData.avatarUrl ? (
                            <img src={playerBData.avatarUrl} alt={playerB} className="team-avatar w-full h-full rounded-full object-cover border-4 border-secondary shadow-[0_0_20px_rgba(255,107,53,0.2)]" />
                        ) : (
                            <div className="team-avatar-placeholder w-full h-full rounded-full border-4 border-dashed border-white/20 flex items-center justify-center bg-white/5 text-5xl text-white/30 font-light">
                                <span>?</span>
                            </div>
                        )}
                    </div>
                    <div className="team-select-wrapper w-full max-w-[250px]">
                        <PlayerSelect
                            label=""
                            value={playerB}
                            onChange={setPlayerB}
                            players={safeParticipants.filter(p => p !== playerA)}
                            playerDetailsMap={playersMap}
                        />
                    </div>
                </div>
            </div>

            <div className="form-actions flex gap-4 mt-8 justify-center max-w-lg mx-auto">
                <button
                    className="btn btn-ghost flex-1 py-3 px-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                    onClick={onCancel}
                >
                    Cancel
                </button>
                <button
                    className={`btn flex-1 py-3 px-6 rounded-xl font-bold transition-all ${isValid
                            ? 'bg-gradient-to-br from-success to-[#00cc6a] text-bg-primary shadow-[0_0_20px_rgba(0,255,136,0.3)] hover:-translate-y-0.5'
                            : 'bg-white/10 text-white/30 cursor-not-allowed'
                        }`}
                    disabled={!isValid}
                    onClick={() => onStart(playerA, playerB)}
                >
                    Start Match
                </button>
            </div>
        </div>
    );
}

function TournamentTable({ leaderboard, playersMap }) {
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
                    {leaderboard.map((player, index) => {
                        const playerData = playersMap ? playersMap[player.name] : null;
                        return (
                            <tr key={player.name} style={{ cursor: 'default' }}>
                                <td className="text-left">
                                    <span className={`leaderboard-rank ${getRankClass(index)}`}>
                                        {index + 1}
                                    </span>
                                </td>
                                <td className="team-cell">
                                    {playerData && playerData.avatarUrl && (
                                        <img src={playerData.avatarUrl} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                                    )}
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
                        )
                    })}
                </tbody>
            </table>
        </div>
    );
}
