import { useState, useEffect } from 'react';
import { useMatch } from '../context/MatchContext';
import { fetchTournaments, createTournament } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import PlayerSelect from './PlayerSelect';

import { TOURNAMENT_THEMES } from '../utils/themes';

export default function TournamentList() {
    const { actions, state } = useMatch();
    const { isAdmin } = useAuth();
    const [tournaments, setTournaments] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newTournamentName, setNewTournamentName] = useState('');
    const [maxPoints, setMaxPoints] = useState('');
    const [participants, setParticipants] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState('');
    const [selectedTheme, setSelectedTheme] = useState('classic');

    useEffect(() => {
        const loadTournaments = async () => {
            const data = await fetchTournaments();
            setTournaments(data);
        };
        loadTournaments();
    }, []);

    const handleCreate = async () => {
        if (!newTournamentName.trim()) return;
        if (participants.length < 2) {
            alert('A tournament needs at least 2 participants.');
            return;
        }

        try {
            const created = await createTournament({
                name: newTournamentName,
                participants,
                status: 'active',
                maxPoints: maxPoints ? parseInt(maxPoints) : null,
                theme: selectedTheme
            });
            setTournaments([created, ...tournaments]);
            setIsCreating(false);
            setNewTournamentName('');
            setMaxPoints('');
            setParticipants([]);
            setSelectedTheme('classic');
        } catch (err) {
            alert('Failed to create tournament');
        }
    };


    const handleAddParticipant = (name) => {
        if (!name.trim()) return;
        if (!participants.includes(name)) {
            setParticipants([...participants, name]);
        }
        setCurrentPlayer('');
    };

    // Add existing player from state.players or new one via text input?
    // PlayerSelect can help here but it binds to a single value.
    // Let's use a simpler approach or reuse logic.
    const handleSelectParticipant = (name) => {
        handleAddParticipant(name);
    }

    return (
        <div className="tournament-list-screen container animate-fade-in">
            <button className="back-btn" onClick={() => actions.setScreen('home')}>
                ← Back to Home
            </button>

            <h2 className="section-title">Tournaments</h2>

            {!isCreating ? (
                <>
                    {isAdmin && (
                        <button className="btn btn-primary" onClick={() => setIsCreating(true)} style={{ marginBottom: '1rem', width: '100%' }}>
                            + Create New Tournament
                        </button>
                    )}

                    <div className="tournament-grid">
                        {tournaments.length === 0 ? (
                            <div className="p-4 text-center text-muted card" style={{ gridColumn: '1 / -1' }}>No tournaments found</div>
                        ) : (
                            tournaments.map(t => {
                                const themeKey = t.theme || 'classic';
                                const theme = TOURNAMENT_THEMES[themeKey] || TOURNAMENT_THEMES['classic'];
                                const cardStyle = {
                                    backgroundImage: theme.colors.background,
                                    backgroundSize: theme.colors.backgroundSize || 'cover',
                                    border: `1px solid ${theme.colors.primary}40`, // Low opacity border
                                };

                                return (
                                    <div
                                        key={t._id || t.id}
                                        className={`tournament-card ${t.status === 'completed' ? 'completed' : ''}`}
                                        style={cardStyle}
                                        onClick={() => {
                                            actions.setTournament(t);
                                            actions.setScreen('tournamentDetail');
                                        }}
                                    >
                                        <div className="tournament-card-header">
                                            <div className="tournament-name" style={{ color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{t.name}</div>
                                            {t.status === 'completed' && <span className="tournament-status">Completed</span>}
                                        </div>
                                        <div className="tournament-details">
                                            <div>{t.participants.length} Participants</div>
                                            <div style={{ marginTop: '0.25rem' }}>{new Date(t.startDate).toLocaleDateString()}</div>
                                            {t.winner && <div style={{ marginTop: '0.5rem', color: 'var(--color-primary)' }}>🏆 {t.winner}</div>}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </>
            ) : (
                <div className="create-tournament-form card animate-fade-in">
                    <h3 style={{ marginBottom: '1rem' }}>Create Tournament</h3>

                    <div className="form-group">
                        <label>Tournament Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={newTournamentName}
                            onChange={e => setNewTournamentName(e.target.value)}
                            placeholder="e.g. Summer Cup 2026"
                        />
                    </div>

                    <div className="form-group">
                        <label>Target Points (Optional)</label>
                        <input
                            type="number"
                            className="form-input"
                            value={maxPoints}
                            onChange={e => setMaxPoints(e.target.value)}
                            placeholder="Points needed to win"
                        />
                    </div>

                    <div className="form-group">
                        <label>Tournament Theme</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.5rem' }}>
                            {Object.entries(TOURNAMENT_THEMES).map(([key, theme]) => (
                                <div
                                    key={key}
                                    onClick={() => setSelectedTheme(key)}
                                    // Use style for preview
                                    style={{
                                        cursor: 'pointer',
                                        padding: '0.5rem',
                                        borderRadius: '8px',
                                        border: selectedTheme === key ? `2px solid var(--color-primary)` : '2px solid transparent',
                                        background: 'rgba(255,255,255,0.05)',
                                        textAlign: 'center',
                                        opacity: selectedTheme === key ? 1 : 0.7
                                    }}
                                >
                                    <div style={{
                                        width: '100%', height: '40px', borderRadius: '4px', marginBottom: '0.25rem',
                                        background: theme.colors.background,
                                        backgroundSize: theme.colors.backgroundSize || 'cover'
                                    }}></div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: selectedTheme === key ? 'bold' : 'normal' }}>{theme.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Participants ({participants.length})</label>
                        <PlayerSelect
                            label="Add Participant"
                            value={currentPlayer}
                            onChange={(val) => handleSelectParticipant(val)}
                            players={state.players.filter(p => !participants.includes(p))} // Filter out already added
                            onAddPlayer={(name) => {
                                // Add to global player list AND tournament participants
                                actions.addPlayer(name);
                                handleAddParticipant(name);
                            }}
                            buttonText="Add"
                        />

                        <div className="participants-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                            {participants.map(p => (
                                <span key={p} className="badge" style={{ padding: '0.4rem 0.8rem', backgroundColor: '#e2e8f0', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {p}
                                    <button
                                        onClick={() => setParticipants(participants.filter(x => x !== p))}
                                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', fontWeight: 'bold' }}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="form-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button className="btn btn-ghost" onClick={() => setIsCreating(false)} style={{ flex: 1 }}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleCreate} style={{ flex: 1 }} disabled={!newTournamentName || participants.length < 2}>Create</button>
                    </div>
                </div>
            )}
        </div>
    );
}
