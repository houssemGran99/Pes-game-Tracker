import { useState, useRef, useEffect } from 'react';

export default function PlayerSelect({ label, value, onChange, players, onAddPlayer }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newPlayerName, setNewPlayerName] = useState('');
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                setIsAdding(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isAdding && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isAdding]);

    const handleSelect = (player) => {
        onChange(player);
        setIsOpen(false);
    };

    const handleAddClick = (e) => {
        e.stopPropagation();
        setIsAdding(true);
        setNewPlayerName('');
    };

    const handleConfirmAdd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (newPlayerName.trim()) {
            onAddPlayer(newPlayerName.trim());
            onChange(newPlayerName.trim());
            setNewPlayerName('');
            setIsAdding(false);
            setIsOpen(false);
        }
    };

    return (
        <div className="form-group" ref={containerRef} style={{ position: 'relative', zIndex: isOpen ? 1000 : 1 }}>
            <label className="form-label">{label}</label>

            <div className="relative" style={{ position: 'relative' }}>
                {/* Main Select Button */}
                <div
                    className={`form-input player-select-btn ${isOpen ? 'active' : ''}`}
                    onClick={() => !isAdding && setIsOpen(!isOpen)}
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        borderColor: isOpen ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)'
                    }}
                >
                    <span style={{ color: value ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                        {value || "Select a player..."}
                    </span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>▼</span>
                </div>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="player-dropdown" style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        background: 'var(--color-bg-card)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-lg)',
                        zIndex: 50,
                        backdropFilter: 'blur(10px)',
                        overflow: 'hidden',
                        animation: 'fadeIn 0.2s ease-out'
                    }}>
                        {!isAdding ? (
                            <>
                                <div className="dropdown-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {players.length > 0 ? (
                                        players.map((player) => (
                                            <div
                                                key={player}
                                                className="dropdown-item"
                                                onClick={() => handleSelect(player)}
                                                style={{
                                                    padding: '0.75rem 1rem',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                    transition: 'all 0.2s',
                                                }}
                                                onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
                                                onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                            >
                                                {player}
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                            No players found
                                        </div>
                                    )}
                                </div>

                                {onAddPlayer && (
                                    <div
                                        className="dropdown-action"
                                        onClick={handleAddClick}
                                        style={{
                                            padding: '0.75rem 1rem',
                                            background: 'rgba(0, 212, 255, 0.1)',
                                            borderTop: '1px solid rgba(255,255,255,0.1)',
                                            color: 'var(--color-primary)',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = 'rgba(0, 212, 255, 0.2)'}
                                        onMouseLeave={(e) => e.target.style.background = 'rgba(0, 212, 255, 0.1)'}
                                    >
                                        <span>+</span> Add New Player
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="add-player-form" style={{ padding: '0.5rem' }}>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="form-input"
                                    placeholder="Enter name..."
                                    value={newPlayerName}
                                    onChange={(e) => setNewPlayerName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleConfirmAdd(e);
                                        if (e.key === 'Escape') setIsAdding(false);
                                    }}
                                    style={{ marginBottom: '0.5rem', fontSize: '0.9rem', padding: '0.5rem' }}
                                />
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleConfirmAdd}
                                        style={{ flex: 1, padding: '0.4rem', fontSize: '0.9rem' }}
                                        disabled={!newPlayerName.trim()}
                                    >
                                        Add
                                    </button>
                                    <button
                                        className="btn btn-ghost"
                                        onClick={(e) => { e.stopPropagation(); setIsAdding(false); }}
                                        style={{ padding: '0.4rem 0.8rem' }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
