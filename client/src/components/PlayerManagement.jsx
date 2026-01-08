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
        <div className="max-w-7xl mx-auto px-4 w-full animate-fade-in py-8">
            <button className="flex items-center gap-2 text-white/70 hover:text-primary transition-colors mb-8" onClick={() => actions.setScreen('home')}>
                <span>←</span> Back to Home
            </button>

            <h2 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#0099cc]">Manage Players</h2>

            {editingPlayer ? (
                <div className="max-w-lg mx-auto p-8 bg-[#191928cc] backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
                    <h3 className="text-center mb-8 text-xl font-bold">Edit Player</h3>

                    <div className="text-center flex flex-col items-center mb-8">
                        <div className="w-[128px] h-[128px] mx-auto mb-6 rounded-full overflow-hidden border-4 border-primary relative bg-[#333] shadow-[0_0_20px_rgba(0,212,255,0.3)] shrink-0 grow-0">
                            {editAvatarUrl ? (
                                <img src={editAvatarUrl} alt="Avatar" className="w-full h-full object-cover" style={{ width: '100%', height: '100%' }} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-5xl">
                                    👤
                                </div>
                            )}
                        </div>
                        <button
                            className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors text-sm font-medium"
                            onClick={() => fileInputRef.current.click()}
                            disabled={uploading}
                        >
                            {uploading ? 'Uploading...' : 'Change Avatar'}
                        </button>
                        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAvatarUpload} />
                    </div>

                    <div className="mb-8">
                        <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">Name</label>
                        <input
                            type="text"
                            className="w-full p-4 bg-[#0a0a0f] border border-white/10 rounded-xl text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all text-lg"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                        />
                        <p className="text-xs text-warning mt-2 flex items-center gap-1">
                            ⚠️ Warning: Renaming will update all past match history.
                        </p>
                    </div>

                    <div className="flex gap-4 justify-end pt-4 border-t border-white/10">
                        <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors font-medium" onClick={handleCancel}>Cancel</button>
                        <button className="px-6 py-3 bg-gradient-to-br from-primary to-[#0099cc] text-[#0a0a0f] font-bold rounded-xl hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:-translate-y-0.5 transition-all" onClick={handleSave}>Save Changes</button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {players.map(player => (
                        <div key={player._id} className="group bg-[#191928cc] border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center transition-all hover:-translate-y-1 hover:border-primary hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                            <div className="relative mb-4 shrink-0 grow-0 w-[80px] h-[80px]" style={{ width: '80px', height: '80px' }}>
                                {player.avatarUrl ? (
                                    <img
                                        src={player.avatarUrl}
                                        alt={player.name}
                                        className="w-[80px] h-[80px] rounded-full object-cover border-2 border-primary/30 group-hover:border-primary transition-colors"
                                        style={{ width: '80px', height: '80px', maxWidth: 'none' }}
                                    />
                                ) : (
                                    <div className="w-[80px] h-[80px] rounded-full bg-[#333] flex items-center justify-center text-3xl border-2 border-white/10 group-hover:border-primary transition-colors" style={{ width: '80px', height: '80px' }}>
                                        👤
                                    </div>
                                )}
                            </div>

                            <div className="font-bold text-lg mb-4 text-white w-full overflow-hidden text-ellipsis whitespace-nowrap" title={player.name}>{player.name}</div>

                            <div className="mt-auto w-full">
                                <button
                                    className="w-full py-2 px-3 text-sm font-medium bg-white/5 border border-white/10 rounded-lg hover:bg-primary hover:text-[#0a0a0f] hover:border-primary transition-all"
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
