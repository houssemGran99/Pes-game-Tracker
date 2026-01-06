import { useState, useEffect } from 'react';
import { useMatch } from '../context/MatchContext';
import { fetchTournaments, createTournament } from '../utils/api';
import PlayerSelect from './PlayerSelect';

export default function TournamentList() {
    const { actions, state } = useMatch();
    const [tournaments, setTournaments] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newTournamentName, setNewTournamentName] = useState('');
    const [maxPoints, setMaxPoints] = useState('');
    const [participants, setParticipants] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState('');

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
                maxPoints: maxPoints ? parseInt(maxPoints) : null
            });
            setTournaments([created, ...tournaments]);
            setIsCreating(false);
            setNewTournamentName('');
            setMaxPoints('');
            setParticipants([]);
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
                    <button className="btn btn-primary" onClick={() => setIsCreating(true)} style={{ marginBottom: '1rem', width: '100%' }}>
                        + Create New Tournament
                    </button>

                    <div className="tournament-list card" style={{ padding: 0 }}>
                        {tournaments.length === 0 ? (
                            <div className="p-4 text-center text-muted">No tournaments found</div>
                        ) : (
                            tournaments.map(t => (
                                <div
                                    key={t._id || t.id}
                                    className="tournament-item"
                                    onClick={() => {
                                        actions.setTournament(t);
                                        actions.setScreen('tournamentDetail');
                                    }}
                                    style={{
                                        padding: '1rem',
                                        borderBottom: '1px solid var(--border-color)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{t.name}</div>
                                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                                            {t.participants.length} Participants • {new Date(t.startDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div>→</div>
                                </div>
                            ))
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
