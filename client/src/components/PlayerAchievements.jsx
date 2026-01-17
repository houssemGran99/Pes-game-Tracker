import { useState, useEffect } from 'react';
import { fetchMatches, fetchPlayers } from '../utils/api';
import { calculatePlayerAchievements, ACHIEVEMENTS, getRarityGradient, calculateAchievementProgress, calculateAchievementPoints, getNextTierProgress } from '../utils/achievements';

export default function PlayerAchievements() {
    const [players, setPlayers] = useState([]);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [playerAchievements, setPlayerAchievements] = useState([]);
    const [selectedAchievement, setSelectedAchievement] = useState(null);
    const [achievementProgress, setAchievementProgress] = useState({});

    useEffect(() => {
        const loadData = async () => {
            try {
                const [matchesData, playersData] = await Promise.all([
                    fetchMatches(),
                    fetchPlayers()
                ]);

                const matchesList = matchesData.matches || (Array.isArray(matchesData) ? matchesData : []);
                setMatches(matchesList);
                setPlayers(playersData || []);

                // Calculate achievements for all players and find the one with most achievements
                if (playersData && playersData.length > 0) {
                    let bestPlayer = playersData[0];
                    let maxAchievements = 0;

                    playersData.forEach(player => {
                        const achievements = calculatePlayerAchievements(matchesList, player.name);
                        if (achievements.length > maxAchievements) {
                            maxAchievements = achievements.length;
                            bestPlayer = player;
                        }
                    });

                    setSelectedPlayer(bestPlayer);
                    setPlayerAchievements(calculatePlayerAchievements(matchesList, bestPlayer.name));
                    setAchievementProgress(calculateAchievementProgress(matchesList, bestPlayer.name));
                }
            } catch (error) {
                console.error("Failed to load achievements data", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const handlePlayerSelect = (player) => {
        setSelectedPlayer(player);
        setPlayerAchievements(calculatePlayerAchievements(matches, player.name));
        setAchievementProgress(calculateAchievementProgress(matches, player.name));
        setSelectedAchievement(null);
    };

    const handleAchievementClick = (achievement, isUnlocked) => {
        if (!isUnlocked) {
            setSelectedAchievement(achievement);
        }
    };

    const closeProgressModal = () => {
        setSelectedAchievement(null);
    };

    // Get all possible achievements for progress display
    const allAchievements = Object.values(ACHIEVEMENTS);
    const unlockedIds = playerAchievements.map(a => a.id);

    if (loading) {
        return (
            <div className="achievements-loading text-center p-8">
                <div className="animate-pulse">
                    <div className="text-4xl mb-4">🎯</div>
                    <div className="text-muted">Loading achievements...</div>
                </div>
            </div>
        );
    }

    if (players.length === 0) {
        return null;
    }

    return (
        <div className="player-achievements animate-fade-in mb-xl">
            <h2 className="section-title text-center" style={{
                background: 'linear-gradient(to right, #9B59B6, #3498DB)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
                marginBottom: '1.5rem'
            }}>
                🎯 Achievements
            </h2>

            {/* Player Selector */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
                justifyContent: 'center',
                marginBottom: '1.5rem'
            }}>
                {players.map(player => {
                    const achievements = calculatePlayerAchievements(matches, player.name);
                    const isSelected = selectedPlayer?.name === player.name;
                    const points = calculateAchievementPoints(achievements);
                    const tierInfo = getNextTierProgress(points);

                    return (
                        <button
                            key={player.name}
                            onClick={() => handlePlayerSelect(player)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                borderRadius: '20px',
                                border: isSelected ? '2px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.1)',
                                background: isSelected ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.05)',
                                color: 'var(--color-text)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontSize: '0.85rem'
                            }}
                        >
                            {player.avatarUrl ? (
                                <img
                                    src={player.avatarUrl}
                                    alt={player.name}
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        objectFit: 'cover'
                                    }}
                                />
                            ) : (
                                <span style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: 'var(--gradient-card)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.7rem'
                                }}>
                                    {player.name.charAt(0)}
                                </span>
                            )}
                            <span>{player.name}</span>
                            {/* Tier Badge */}
                            <span style={{
                                background: tierInfo.currentTier.gradient,
                                color: tierInfo.currentTier.textColor,
                                padding: '0.1rem 0.35rem',
                                borderRadius: '4px',
                                fontSize: '0.65rem',
                                fontWeight: 'bold'
                            }}>
                                {tierInfo.currentTier.name}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Selected Player Stats */}
            {selectedPlayer && (
                <div className="card" style={{
                    background: 'var(--gradient-card)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    overflow: 'hidden'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, rgba(155, 89, 182, 0.2) 0%, transparent 100%)',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        {selectedPlayer.avatarUrl ? (
                            <img
                                src={selectedPlayer.avatarUrl}
                                alt={selectedPlayer.name}
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '3px solid var(--color-primary)'
                                }}
                            />
                        ) : (
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: 'var(--gradient-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                border: '3px solid var(--color-primary)'
                            }}>
                                {selectedPlayer.name.charAt(0)}
                            </div>
                        )}
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{selectedPlayer.name}</h3>
                                {/* Tier Badge */}
                                {(() => {
                                    const points = calculateAchievementPoints(playerAchievements);
                                    const tierInfo = getNextTierProgress(points);
                                    return (
                                        <span style={{
                                            background: tierInfo.currentTier.gradient,
                                            color: tierInfo.currentTier.textColor,
                                            padding: '0.25rem 0.6rem',
                                            borderRadius: '6px',
                                            fontWeight: 'bold',
                                            fontSize: '1rem',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                                        }}>
                                            {tierInfo.currentTier.name}
                                        </span>
                                    );
                                })()}
                            </div>
                            <p style={{
                                margin: '0.25rem 0 0 0',
                                color: 'var(--color-text-muted)',
                                fontSize: '0.85rem'
                            }}>
                                {playerAchievements.length} / {allAchievements.length} achievements • {calculateAchievementPoints(playerAchievements)} pts
                                {(() => {
                                    const points = calculateAchievementPoints(playerAchievements);
                                    const tierInfo = getNextTierProgress(points);
                                    if (tierInfo.nextTier) {
                                        return (
                                            <span style={{ marginLeft: '0.5rem', color: tierInfo.nextTier.color }}>
                                                ({tierInfo.pointsNeeded} pts to {tierInfo.nextTier.name})
                                            </span>
                                        );
                                    }
                                    return null;
                                })()}
                            </p>
                        </div>
                        {/* Progress Ring */}
                        <div style={{
                            marginLeft: 'auto',
                            position: 'relative',
                            width: '60px',
                            height: '60px'
                        }}>
                            <svg width="60" height="60" viewBox="0 0 60 60">
                                <circle
                                    cx="30" cy="30" r="25"
                                    fill="none"
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth="5"
                                />
                                <circle
                                    cx="30" cy="30" r="25"
                                    fill="none"
                                    stroke="url(#progressGradient)"
                                    strokeWidth="5"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(playerAchievements.length / allAchievements.length) * 157} 157`}
                                    transform="rotate(-90 30 30)"
                                />
                                <defs>
                                    <linearGradient id="progressGradient">
                                        <stop offset="0%" stopColor="#9B59B6" />
                                        <stop offset="100%" stopColor="#3498DB" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                fontSize: '0.85rem',
                                fontWeight: 'bold'
                            }}>
                                {Math.round((playerAchievements.length / allAchievements.length) * 100)}%
                            </div>
                        </div>
                    </div>

                    {/* Achievements Grid */}
                    <div style={{
                        padding: '1.5rem',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                        gap: '1rem'
                    }}>
                        {allAchievements.map(achievement => {
                            const isUnlocked = unlockedIds.includes(achievement.id);
                            const unlockedData = playerAchievements.find(a => a.id === achievement.id);

                            return (
                                <div
                                    key={achievement.id}
                                    onClick={() => handleAchievementClick(achievement, isUnlocked)}
                                    style={{
                                        background: isUnlocked
                                            ? getRarityGradient(achievement.rarity)
                                            : 'rgba(0,0,0,0.3)',
                                        borderRadius: '12px',
                                        padding: '1rem',
                                        textAlign: 'center',
                                        opacity: isUnlocked ? 1 : 0.6,
                                        filter: isUnlocked ? 'none' : 'grayscale(100%)',
                                        transition: 'all 0.3s ease',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        cursor: isUnlocked ? 'default' : 'pointer'
                                    }}
                                >
                                    {/* Shine effect for unlocked */}
                                    {isUnlocked && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: '-100%',
                                            width: '50%',
                                            height: '100%',
                                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                            animation: 'shine 3s infinite'
                                        }} />
                                    )}

                                    {/* Icon */}
                                    <div style={{
                                        fontSize: '2rem',
                                        marginBottom: '0.5rem',
                                        filter: isUnlocked ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none'
                                    }}>
                                        {achievement.icon}
                                    </div>

                                    {/* Name */}
                                    <div style={{
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold',
                                        marginBottom: '0.25rem',
                                        color: isUnlocked ? '#fff' : 'var(--color-text-muted)'
                                    }}>
                                        {achievement.name}
                                    </div>

                                    {/* Description */}
                                    <div style={{
                                        fontSize: '0.65rem',
                                        color: isUnlocked ? 'rgba(255,255,255,0.8)' : 'var(--color-text-muted)'
                                    }}>
                                        {achievement.description}
                                    </div>

                                    {/* Rarity Badge */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '0.25rem',
                                        right: '0.25rem',
                                        fontSize: '0.55rem',
                                        textTransform: 'uppercase',
                                        padding: '0.15rem 0.35rem',
                                        borderRadius: '4px',
                                        background: isUnlocked ? 'rgba(0,0,0,0.3)' : 'transparent',
                                        color: isUnlocked ? '#fff' : 'var(--color-text-muted)'
                                    }}>
                                        {achievement.rarity}
                                    </div>

                                    {/* Lock indicator for locked achievements */}
                                    {!isUnlocked && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            fontSize: '1.5rem',
                                            opacity: 0.5
                                        }}>
                                            🔒
                                        </div>
                                    )}
                                    {/* Click hint for locked */}
                                    {!isUnlocked && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '0.25rem',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            fontSize: '0.55rem',
                                            color: 'var(--color-text-muted)',
                                            opacity: 0.7
                                        }}>
                                            Tap for progress
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div style={{
                        padding: '1rem 1.5rem',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '1.5rem',
                        flexWrap: 'wrap',
                        fontSize: '0.75rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: getRarityGradient('legendary')
                            }} />
                            <span style={{ color: 'var(--color-text-muted)' }}>Legendary</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: getRarityGradient('epic')
                            }} />
                            <span style={{ color: 'var(--color-text-muted)' }}>Epic</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: getRarityGradient('rare')
                            }} />
                            <span style={{ color: 'var(--color-text-muted)' }}>Rare</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: getRarityGradient('common')
                            }} />
                            <span style={{ color: 'var(--color-text-muted)' }}>Common</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Progress Modal */}
            {selectedAchievement && (
                <div
                    onClick={closeProgressModal}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '1rem',
                        animation: 'fadeIn 0.2s ease'
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'var(--gradient-card)',
                            borderRadius: '16px',
                            padding: '1.5rem',
                            maxWidth: '320px',
                            width: '100%',
                            border: '1px solid rgba(255,255,255,0.1)',
                            animation: 'slideUp 0.3s ease'
                        }}
                    >
                        {/* Achievement Icon & Name */}
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{
                                fontSize: '3rem',
                                marginBottom: '0.5rem',
                                filter: 'grayscale(50%)',
                                opacity: 0.8
                            }}>
                                {selectedAchievement.icon}
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                                {selectedAchievement.name}
                            </h3>
                            <p style={{
                                margin: '0.25rem 0 0 0',
                                color: 'var(--color-text-muted)',
                                fontSize: '0.85rem'
                            }}>
                                {selectedAchievement.description}
                            </p>
                            <span style={{
                                display: 'inline-block',
                                marginTop: '0.5rem',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                background: getRarityGradient(selectedAchievement.rarity),
                                color: '#fff'
                            }}>
                                {selectedAchievement.rarity}
                            </span>
                        </div>

                        {/* Progress Section */}
                        {achievementProgress[selectedAchievement.id] && (
                            <div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: '0.5rem',
                                    fontSize: '0.9rem'
                                }}>
                                    <span style={{ color: 'var(--color-text-muted)' }}>
                                        {selectedPlayer?.name}'s Progress
                                    </span>
                                    <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                        {Math.round(achievementProgress[selectedAchievement.id].percentage)}%
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div style={{
                                    height: '12px',
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: '6px',
                                    overflow: 'hidden',
                                    marginBottom: '0.75rem'
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${achievementProgress[selectedAchievement.id].percentage}%`,
                                        background: getRarityGradient(selectedAchievement.rarity),
                                        borderRadius: '6px',
                                        transition: 'width 0.5s ease'
                                    }} />
                                </div>

                                {/* Progress Label */}
                                <p style={{
                                    textAlign: 'center',
                                    color: 'var(--color-text-muted)',
                                    fontSize: '0.85rem',
                                    margin: 0
                                }}>
                                    {achievementProgress[selectedAchievement.id].label}
                                </p>
                            </div>
                        )}

                        {/* Close Button */}
                        <button
                            onClick={closeProgressModal}
                            style={{
                                width: '100%',
                                marginTop: '1.5rem',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'var(--gradient-primary)',
                                color: '#fff',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes shine {
                    0% { left: -100%; }
                    20% { left: 100%; }
                    100% { left: 100%; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
