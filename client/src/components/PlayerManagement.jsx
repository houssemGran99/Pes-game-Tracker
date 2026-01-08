import { useState, useEffect, useRef } from 'react';
import { useMatch } from '../context/MatchContext';
import { useAuth } from '../context/AuthContext';
import { fetchPlayers, updatePlayer, uploadFile } from '../utils/api';

export default function PlayerManagement() {
    const { actions } = useMatch();
    const { isAdmin } = useAuth();
    const [players, setPlayers] = useState([]);
    const [editingPlayer, setEditingPlayer] = useState(null);
    // Editing Form State
    const [editName, setEditName] = useState('');
    const [editAvatarUrl, setEditAvatarUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    const fileInputRef = useRef(null);

    useEffect(() => {
        loadPlayers();
    }, []);

    const loadPlayers = async () => {
        const data = await fetchPlayers();
        setPlayers(data);
    };

    const handleEditClick = (player) => {
        setEditingPlayer(player);
        setEditName(player.name);
        setEditAvatarUrl(player.avatarUrl || '');
    };

    const handleCancel = () => {
        setEditingPlayer(null);
        setEditName('');
        setEditAvatarUrl('');
        setUploading(false);
    };

    const handleSave = async () => {
        if (!editingPlayer) return;

        try {
            await updatePlayer(editingPlayer.name, {
                name: editName,
                avatarUrl: editAvatarUrl
            });

            // Reload list
            await loadPlayers();
            handleCancel();
        } catch (error) {
            console.error('Update failed', error);
            alert('Update failed: ' + error.message);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const { url } = await uploadFile(file);
            setEditAvatarUrl(url);
        } catch (error) {
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    // If not admin, shouldn't really be here, but just in case
    if (!isAdmin) {
        return (
            <div className="container" style={{ textAlign: 'center', marginTop: '2rem' }}>
                <h2>Access Denied</h2>
                <button className="btn" onClick={() => actions.setScreen('home')}>Back to Home</button>
            </div>
        );
    }

    return (
        <div className="container animate-fade-in">
            <button className="back-btn" onClick={() => actions.setScreen('home')}>
                ← Back to Home
            </button>

            <h2 className="section-title">Manage Players</h2>

            {editingPlayer ? (
                <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
                    <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Edit Player</h3>

                    <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                        <div style={{
                            width: '100px', height: '100px', margin: '0 auto 1rem',
                            borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--color-primary)',
                            position: 'relative'
                        }}>
                            {editAvatarUrl ? (
                                <img src={editAvatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                                    👤
                                </div>
                            )}
                        </div>
                        <button
                            className="btn"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                            onClick={() => fileInputRef.current.click()}
                            disabled={uploading}
                        >
                            {uploading ? 'Uploading...' : 'Change Avatar'}
                        </button>
                        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAvatarUpload} />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>Name</label>
                        <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            style={{
                                width: '100%', padding: '0.8rem', borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'rgba(0,0,0,0.2)', color: 'white',
                                fontSize: '1rem'
                            }}
                        />
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-warning)', marginTop: '0.5rem' }}>
                            Warning: Renaming will update all past match history and tournaments for this player.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                        <button className="btn" style={{ background: 'var(--color-bg-secondary)', border: '1px solid white' }} onClick={handleCancel}>Cancel</button>
                        <button className="btn" style={{ background: 'var(--color-primary)' }} onClick={handleSave}>Save Changes</button>
                    </div>
                </div>
            ) : (
                <div className="card table-container">
                    <table className="league-table">
                        <thead>
                            <tr>
                                <th>Avatar</th>
                                <th>Name</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {players.map(player => (
                                <tr key={player._id}>
                                    <td>
                                        {player.avatarUrl ? (
                                            <img src={player.avatarUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto' }} />
                                        ) : (
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#333', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                👤
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ fontWeight: 'bold' }}>{player.name}</td>
                                    <td>
                                        <button
                                            className="btn"
                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', minHeight: 'auto' }}
                                            onClick={() => handleEditClick(player)}
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
