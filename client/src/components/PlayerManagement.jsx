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
            <div className="container text-center" style={{ marginTop: '2rem' }}>
                <h2>Access Denied</h2>
                <button className="btn btn-primary" onClick={() => actions.setScreen('home')}>Back to Home</button>
            </div>
        );
    }

    return (
        <div className="container animate-fade-in mx-auto px-4 w-full">
            <button className="back-btn mb-6" onClick={() => actions.setScreen('home')}>
                ← Back to Home
            </button>

            <h2 className="section-title text-2xl font-bold mb-6">Manage Players</h2>

            {editingPlayer ? (
                <div className="card edit-player-card max-w-[500px] mx-auto p-8 bg-bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-md">
                    <h3 className="section-title text-center mb-6 text-xl font-bold">Edit Player</h3>

                    <div className="edit-avatar-wrapper text-center flex flex-col items-center mb-6">
                        <div className="edit-avatar-preview w-[120px] h-[120px] mx-auto mb-4 rounded-full overflow-hidden border-[3px] border-primary relative bg-[#333]">
                            {editAvatarUrl ? (
                                <img src={editAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-5xl">
                                    👤
                                </div>
                            )}
                        </div>
                        <button
                            className="btn btn-ghost text-sm px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors"
                            onClick={() => fileInputRef.current.click()}
                            disabled={uploading}
                        >
                            {uploading ? 'Uploading...' : 'Change Avatar'}
                        </button>
                        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAvatarUpload} />
                    </div>

                    <div className="form-group mb-6">
                        <label className="block text-sm font-medium text-white/70 mb-2 uppercase tracking-wide">Name</label>
                        <input
                            type="text"
                            className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all font-sans text-base"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                        />
                        <p className="text-xs text-warning mt-2">
                            Warning: Renaming will update all past match history.
                        </p>
                    </div>

                    <div className="flex gap-4 justify-end mt-8">
                        <button className="btn btn-ghost px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10" onClick={handleCancel}>Cancel</button>
                        <button className="btn btn-primary px-6 py-3 bg-gradient-to-br from-primary to-[#0099cc] text-bg-primary font-bold rounded-xl hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:-translate-y-0.5 transition-all" onClick={handleSave}>Save Changes</button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 mt-4">
                    {players.map(player => (
                        <div key={player._id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center text-center transition-all hover:-translate-y-1 hover:border-primary hover:shadow-lg hover:bg-white/[0.08]">
                            {player.avatarUrl ? (
                                <img src={player.avatarUrl} alt={player.name} className="w-20 h-20 rounded-full object-cover mb-3 border-2 border-primary/30" />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-[#333] flex items-center justify-center text-3xl mb-3 border-2 border-white/40">
                                    👤
                                </div>
                            )}
                            <div className="font-semibold text-base mb-4 text-white w-full overflow-hidden text-ellipsis whitespace-nowrap">{player.name}</div>
                            <div className="mt-auto w-full">
                                <button
                                    className="w-full py-2 px-3 text-sm bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                                    onClick={() => handleEditClick(player)}
                                >
                                    Edit
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
