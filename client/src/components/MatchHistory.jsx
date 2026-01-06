import { useState, useEffect } from 'react';
import { useMatch } from '../context/MatchContext';
import { useAuth } from '../context/AuthContext';
import { fetchMatches, deleteMatch, updateMatch } from '../utils/api';

export default function MatchHistory() {
    const { actions } = useMatch();
    const { isAdmin } = useAuth();
    const [matches, setMatches] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showScrollTop, setShowScrollTop] = useState(false);

    // Editing state
    const [editingMatch, setEditingMatch] = useState(null); // { _id, scoreA, scoreB }

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const loadMatches = async () => {
        const data = await fetchMatches(null, page, 10);
        if (data.matches) {
            setMatches(data.matches);
            setTotalPages(data.totalPages);
        } else {
            // Fallback for legacy api or if array returned
            setMatches(Array.isArray(data) ? data : []);
        }
    };

    useEffect(() => {
        loadMatches();
    }, [page]);

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this match? This cannot be undone.')) {
            try {
                await deleteMatch(id);
                loadMatches(); // Refresh list
            } catch (err) {
                alert('Failed to delete match');
            }
        }
    };

    const startEditing = (match) => {
        setEditingMatch({ ...match });
    };

    const cancelEditing = () => {
        setEditingMatch(null);
    };

    const saveEdit = async () => {
        if (!editingMatch) return;
        try {
            await updateMatch(editingMatch._id, {
                scoreA: parseInt(editingMatch.scoreA),
                scoreB: parseInt(editingMatch.scoreB)
            });
            setEditingMatch(null);
            loadMatches();
        } catch (err) {
            alert('Failed to update match');
        }
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

    const getWinner = (match) => {
        if (match.scoreA > match.scoreB) return 'A';
        if (match.scoreB > match.scoreA) return 'B';
        return 'draw';
    };

    const handlePlayerClick = (playerName) => {
        actions.setScreen('stats', { selectedPlayer: playerName });
    };

    return (
        <div className="history-screen container animate-fade-in">
            <button className="back-btn" onClick={() => actions.setScreen('home')}>
                ← Back to Home
            </button>

            <h2 className="section-title">Match History</h2>

            {matches.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📜</div>
                    <p>No matches yet</p>
                    <p className="text-muted">Start a new match to see history here</p>
                </div>
            ) : (
                <>
                    <div className="match-list">
                        {matches.map((match, index) => {
                            const winner = getWinner(match);
                            const isEditing = editingMatch && editingMatch._id === match._id;

                            return (
                                <div key={match._id || match.id || index} className="match-card card" style={{ paddingBottom: isAdmin ? '3rem' : '1rem' }}>
                                    <div className="match-card-header">
                                        <span className="match-date">{formatDate(match.date)}</span>

                                        {isAdmin && !isEditing && (
                                            <div className="admin-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); startEditing(match); }}
                                                    className="btn-sm"
                                                    style={{ background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontSize: '0.8rem' }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(match._id); }}
                                                    className="btn-sm"
                                                    style={{ background: 'var(--color-danger)', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontSize: '0.8rem' }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {isEditing ? (
                                        <div className="edit-form" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '1rem 0' }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <div className="match-card-player-name">{match.playerA}</div>
                                                <input
                                                    type="number"
                                                    value={editingMatch.scoreA}
                                                    onChange={e => setEditingMatch({ ...editingMatch, scoreA: e.target.value })}
                                                    style={{ width: '50px', textAlign: 'center', padding: '0.25rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                                />
                                            </div>
                                            <div className="match-card-vs">vs</div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div className="match-card-player-name">{match.playerB}</div>
                                                <input
                                                    type="number"
                                                    value={editingMatch.scoreB}
                                                    onChange={e => setEditingMatch({ ...editingMatch, scoreB: e.target.value })}
                                                    style={{ width: '50px', textAlign: 'center', padding: '0.25rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginLeft: '1rem' }}>
                                                <button onClick={saveEdit} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>💾</button>
                                                <button onClick={cancelEditing} style={{ background: '#64748b', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>✕</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="match-card-score">
                                            <div className={`match-card-player ${winner === 'A' ? 'winner' : ''}`}>
                                                <div
                                                    className="match-card-player-name"
                                                    onClick={() => handlePlayerClick(match.playerA)}
                                                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                                >
                                                    {match.playerA}
                                                </div>
                                                <div className="match-card-player-score">{match.scoreA}</div>
                                            </div>
                                            <div className="match-card-vs">vs</div>
                                            <div className={`match-card-player ${winner === 'B' ? 'winner' : ''}`}>
                                                <div
                                                    className="match-card-player-name"
                                                    onClick={() => handlePlayerClick(match.playerB)}
                                                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                                >
                                                    {match.playerB}
                                                </div>
                                                <div className="match-card-player-score">{match.scoreB}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {totalPages > 1 && (
                <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', paddingBottom: '2rem' }}>
                    <button
                        className="btn btn-ghost"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        ← Previous
                    </button>
                    <span style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>
                        Page {page} of {totalPages}
                    </span>
                    <button
                        className="btn btn-ghost"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Next →
                    </button>
                </div>
            )}

            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className="animate-fade-in"
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        right: '2rem',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '50px',
                        height: '50px',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    title="Scroll to top"
                >
                    ↑
                </button>
            )}
        </div>
    );
}
