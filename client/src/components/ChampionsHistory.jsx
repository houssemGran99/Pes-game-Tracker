import { useState, useEffect } from 'react';
import { fetchMatches, fetchPlayers } from '../utils/api';
import { calculateLeaderboard } from '../utils/stats';

export default function ChampionsHistory() {
    const [championsByMonth, setChampionsByMonth] = useState([]);
    const [playersMap, setPlayersMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [monthlyLeaderboard, setMonthlyLeaderboard] = useState([]);

    useEffect(() => {
        const loadAllChampions = async () => {
            try {
                const [matchesData, playersData] = await Promise.all([
                    fetchMatches(), // Fetch all matches
                    fetchPlayers()
                ]);

                // Map players for avatar lookup
                const pMap = {};
                if (Array.isArray(playersData)) {
                    playersData.forEach(p => pMap[p.name] = p);
                }
                setPlayersMap(pMap);

                // Get all matches
                const matches = matchesData.matches || (Array.isArray(matchesData) ? matchesData : []);

                if (matches.length === 0) {
                    setLoading(false);
                    return;
                }

                // Group matches by month
                const matchesByMonth = {};
                matches.forEach(match => {
                    const date = new Date(match.date);
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    if (!matchesByMonth[monthKey]) {
                        matchesByMonth[monthKey] = [];
                    }
                    matchesByMonth[monthKey].push(match);
                });

                // Calculate champion for each month
                const champions = Object.entries(matchesByMonth)
                    .map(([monthKey, monthMatches]) => {
                        const leaderboard = calculateLeaderboard(monthMatches);
                        if (leaderboard.length === 0) return null;

                        const champion = leaderboard[0];
                        const [year, month] = monthKey.split('-');
                        const monthName = new Date(year, parseInt(month) - 1).toLocaleString('default', { month: 'long' });

                        return {
                            monthKey,
                            year,
                            monthName,
                            champion: {
                                ...champion,
                                avatarUrl: pMap[champion.name]?.avatarUrl
                            },
                            totalMatches: monthMatches.length,
                            matches: monthMatches // Store matches for leaderboard calculation
                        };
                    })
                    .filter(Boolean)
                    .sort((a, b) => b.monthKey.localeCompare(a.monthKey)); // Sort by newest first

                setChampionsByMonth(champions);
            } catch (error) {
                console.error("Failed to load champions history", error);
            } finally {
                setLoading(false);
            }
        };

        loadAllChampions();
    }, []);

    const handleCardClick = (monthData) => {
        const leaderboard = calculateLeaderboard(monthData.matches);
        setMonthlyLeaderboard(leaderboard);
        setSelectedMonth(monthData);
    };

    const closeModal = () => {
        setSelectedMonth(null);
        setMonthlyLeaderboard([]);
    };

    if (loading) {
        return (
            <div className="champions-history-loading text-center p-8">
                <div className="animate-pulse">
                    <div className="text-4xl mb-4">🏆</div>
                    <div className="text-muted">Loading champions history...</div>
                </div>
            </div>
        );
    }

    if (championsByMonth.length === 0) {
        return null;
    }

    return (
        <div className="champions-history animate-fade-in mb-xl">
            <h2 className="section-title text-center" style={{
                background: 'linear-gradient(to right, #FFD700, #FFA500)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
                marginBottom: '1.5rem'
            }}>
                🏆 Hall of Fame
            </h2>


            <div className="champions-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.5rem'
            }}>
                {championsByMonth.map((data, index) => (
                    <div
                        key={data.monthKey}
                        className="champion-month-card card"
                        onClick={() => handleCardClick(data)}
                        style={{
                            background: index === 0
                                ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(0, 0, 0, 0.4) 100%)'
                                : 'var(--gradient-card)',
                            border: index === 0 ? '2px solid var(--color-warning)' : '1px solid rgba(255,255,255,0.1)',
                            padding: '1.5rem',
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                        }}
                    >
                        {/* Month/Year Badge */}
                        <div style={{
                            position: 'absolute',
                            top: '0',
                            right: '0',
                            background: index === 0
                                ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                                : 'var(--gradient-primary)',
                            padding: '0.5rem 1rem',
                            borderRadius: '0 0 0 12px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            color: '#fff'
                        }}>
                            {data.monthName} {data.year}
                        </div>

                        {/* Current Month Indicator */}
                        {index === 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '0.5rem',
                                left: '0.5rem',
                                background: 'var(--color-success)',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.65rem',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                color: '#fff'
                            }}>
                                Current
                            </div>
                        )}

                        {/* Champion Info */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            marginTop: index === 0 ? '1.5rem' : '1rem'
                        }}>
                            {/* Avatar */}
                            <div style={{ position: 'relative' }}>
                                {index === 0 && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '-12px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        fontSize: '1.25rem',
                                        zIndex: 1
                                    }}>
                                        👑
                                    </div>
                                )}
                                {data.champion.avatarUrl ? (
                                    <img
                                        src={data.champion.avatarUrl}
                                        alt={data.champion.name}
                                        style={{
                                            width: '60px',
                                            height: '60px',
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            border: index === 0
                                                ? '3px solid var(--color-warning)'
                                                : '2px solid rgba(255,255,255,0.2)',
                                            boxShadow: index === 0
                                                ? '0 0 15px rgba(255, 215, 0, 0.3)'
                                                : 'none'
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '50%',
                                        background: 'var(--gradient-card)',
                                        border: index === 0
                                            ? '3px solid var(--color-warning)'
                                            : '2px solid rgba(255,255,255,0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.5rem',
                                        fontWeight: 'bold',
                                        color: 'var(--color-text)'
                                    }}>
                                        {data.champion.name.charAt(0)}
                                    </div>
                                )}
                            </div>

                            {/* Champion Details */}
                            <div style={{ flex: 1 }}>
                                <h3 style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 'bold',
                                    marginBottom: '0.25rem',
                                    color: index === 0 ? 'var(--color-warning)' : 'var(--color-text)'
                                }}>
                                    {data.champion.name}
                                </h3>
                                <div style={{
                                    display: 'flex',
                                    gap: '1rem',
                                    fontSize: '0.85rem'
                                }}>
                                    <span style={{ color: 'var(--color-success)' }}>
                                        {data.champion.wins}W
                                    </span>
                                    <span style={{ color: 'var(--color-error)' }}>
                                        {data.champion.losses}L
                                    </span>
                                    <span style={{ color: 'var(--color-text-muted)' }}>
                                        {data.champion.winRate}%
                                    </span>
                                </div>
                            </div>

                            {/* Points Badge */}
                            <div style={{
                                background: index === 0
                                    ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                                    : 'rgba(255,255,255,0.1)',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '8px',
                                textAlign: 'center'
                            }}>
                                <div style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 'bold',
                                    color: index === 0 ? '#000' : 'var(--color-text)'
                                }}>
                                    {data.champion.points}
                                </div>
                                <div style={{
                                    fontSize: '0.65rem',
                                    textTransform: 'uppercase',
                                    color: index === 0 ? 'rgba(0,0,0,0.7)' : 'var(--color-text-muted)'
                                }}>
                                    pts
                                </div>
                            </div>
                        </div>

                        {/* Footer Stats */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: '1rem',
                            paddingTop: '1rem',
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            fontSize: '0.75rem',
                            color: 'var(--color-text-muted)'
                        }}>
                            <span>⚽ {data.champion.goalsFor} goals scored</span>
                            <span>🎮 {data.totalMatches} matches played</span>
                        </div>

                        {/* Click Indicator */}
                        <div style={{
                            position: 'absolute',
                            bottom: '0.5rem',
                            right: '0.5rem',
                            fontSize: '0.7rem',
                            color: 'var(--color-text-muted)',
                            opacity: 0.6
                        }}>
                            Click for details →
                        </div>
                    </div>
                ))}
            </div>

            {/* Monthly Leaderboard Modal */}
            {selectedMonth && (
                <div
                    className="modal-overlay"
                    onClick={closeModal}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.8)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '1rem',
                        animation: 'fadeIn 0.2s ease'
                    }}
                >
                    <div
                        className="modal-content card"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'var(--gradient-card)',
                            border: '1px solid rgba(255, 215, 0, 0.3)',
                            borderRadius: '16px',
                            maxWidth: '500px',
                            width: '100%',
                            maxHeight: '80vh',
                            overflow: 'auto',
                            animation: 'slideUp 0.3s ease'
                        }}
                    >
                        {/* Modal Header */}
                        <div style={{
                            padding: '1.5rem',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, transparent 100%)'
                        }}>
                            <div>
                                <h3 style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 'bold',
                                    color: 'var(--color-warning)',
                                    margin: 0
                                }}>
                                    🏆 {selectedMonth.monthName} {selectedMonth.year}
                                </h3>
                                <p style={{
                                    fontSize: '0.85rem',
                                    color: 'var(--color-text-muted)',
                                    margin: '0.25rem 0 0 0'
                                }}>
                                    Monthly Leaderboard • {selectedMonth.totalMatches} matches
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '36px',
                                    height: '36px',
                                    cursor: 'pointer',
                                    color: 'var(--color-text)',
                                    fontSize: '1.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'background 0.2s'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {/* Leaderboard Table */}
                        <div style={{ padding: '0' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{
                                        background: 'rgba(0,0,0,0.3)',
                                        fontSize: '0.75rem',
                                        textTransform: 'uppercase',
                                        color: 'var(--color-text-muted)'
                                    }}>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>#</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Player</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>P</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>W</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>D</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>L</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Pts</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthlyLeaderboard.map((player, index) => (
                                        <tr
                                            key={player.name}
                                            style={{
                                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                background: index === 0
                                                    ? 'linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, transparent 100%)'
                                                    : 'transparent'
                                            }}
                                        >
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    background: index === 0 ? 'linear-gradient(135deg, #FFD700, #FFA500)' :
                                                        index === 1 ? 'linear-gradient(135deg, #C0C0C0, #A0A0A0)' :
                                                            index === 2 ? 'linear-gradient(135deg, #CD7F32, #8B4513)' :
                                                                'rgba(255,255,255,0.1)',
                                                    color: index < 3 ? '#000' : 'var(--color-text)',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.75rem'
                                                }}>
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <span style={{
                                                    fontWeight: index === 0 ? 'bold' : 'normal',
                                                    color: index === 0 ? 'var(--color-warning)' : 'var(--color-text)'
                                                }}>
                                                    {player.name}
                                                </span>
                                                {index === 0 && <span style={{ marginLeft: '0.5rem' }}></span>}
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                                {player.matches}
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--color-success)' }}>
                                                {player.wins}
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                                {player.draws}
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--color-error)' }}>
                                                {player.losses}
                                            </td>
                                            <td style={{
                                                padding: '0.75rem 1rem',
                                                textAlign: 'center',
                                                fontWeight: 'bold',
                                                fontSize: '1rem'
                                            }}>
                                                {player.points}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            padding: '1rem 1.5rem',
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            textAlign: 'center'
                        }}>
                            <button
                                onClick={closeModal}
                                style={{
                                    background: 'var(--gradient-primary)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '0.75rem 2rem',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .champion-month-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 24px rgba(255, 215, 0, 0.15);
                }
            `}</style>
        </div>
    );
}
