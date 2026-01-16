import { useState, useEffect } from 'react';
import { fetchMatches, fetchPlayers } from '../utils/api';
import { calculateLeaderboard } from '../utils/stats';

export default function AnalyticsReport() {
    const [matches, setMatches] = useState([]);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('week'); // week, month, all
    const [analytics, setAnalytics] = useState(null);

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
            } catch (error) {
                console.error("Failed to load analytics data", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Calculate analytics when matches or period changes
    useEffect(() => {
        if (matches.length === 0) return;

        const now = new Date();
        let startDate;

        if (period === 'week') {
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else {
            startDate = new Date(0); // All time
        }

        const filteredMatches = matches.filter(m => new Date(m.date) >= startDate);
        const analyticsData = calculateAnalytics(filteredMatches, players, matches);
        setAnalytics(analyticsData);
    }, [matches, players, period]);

    const calculateAnalytics = (periodMatches, allPlayers, allMatches) => {
        if (periodMatches.length === 0) {
            return {
                matchCount: 0,
                mostActivePlayer: null,
                biggestUpset: null,
                playerForms: [],
                goalTrends: [],
                avgGoalsPerMatch: 0,
                totalGoals: 0
            };
        }

        // 1. Most Active Player
        const playerMatchCounts = {};
        periodMatches.forEach(match => {
            playerMatchCounts[match.playerA] = (playerMatchCounts[match.playerA] || 0) + 1;
            playerMatchCounts[match.playerB] = (playerMatchCounts[match.playerB] || 0) + 1;
        });

        const mostActivePlayer = Object.entries(playerMatchCounts)
            .sort((a, b) => b[1] - a[1])[0];

        // 2. Biggest Upset (underdog beats favorite)
        // Calculate all-time win rates for each player
        const leaderboard = calculateLeaderboard(allMatches);
        const winRates = {};
        leaderboard.forEach(p => winRates[p.name] = parseFloat(p.winRate) || 0);

        let biggestUpset = null;
        let maxUpsetScore = 0;

        periodMatches.forEach(match => {
            const rateA = winRates[match.playerA] || 50;
            const rateB = winRates[match.playerB] || 50;

            // Determine winner and check if it was an upset
            if (match.scoreA > match.scoreB && rateA < rateB) {
                // Player A won but had lower win rate (upset)
                const upsetScore = (rateB - rateA) * (match.scoreA - match.scoreB);
                if (upsetScore > maxUpsetScore) {
                    maxUpsetScore = upsetScore;
                    biggestUpset = {
                        match,
                        winner: match.playerA,
                        loser: match.playerB,
                        winnerRate: rateA,
                        loserRate: rateB,
                        scoreDiff: match.scoreA - match.scoreB
                    };
                }
            } else if (match.scoreB > match.scoreA && rateB < rateA) {
                // Player B won but had lower win rate (upset)
                const upsetScore = (rateA - rateB) * (match.scoreB - match.scoreA);
                if (upsetScore > maxUpsetScore) {
                    maxUpsetScore = upsetScore;
                    biggestUpset = {
                        match,
                        winner: match.playerB,
                        loser: match.playerA,
                        winnerRate: rateB,
                        loserRate: rateA,
                        scoreDiff: match.scoreB - match.scoreA
                    };
                }
            }
        });

        // 3. Player Forms (last 5 results for each player)
        const playerForms = allPlayers.map(player => {
            const playerMatches = periodMatches
                .filter(m => m.playerA === player.name || m.playerB === player.name)
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5);

            const form = playerMatches.map(match => {
                const isPlayerA = match.playerA === player.name;
                const playerScore = isPlayerA ? match.scoreA : match.scoreB;
                const opponentScore = isPlayerA ? match.scoreB : match.scoreA;

                if (playerScore > opponentScore) return 'W';
                if (playerScore < opponentScore) return 'L';
                return 'D';
            });

            // Calculate wins in period
            const wins = form.filter(r => r === 'W').length;
            const matchCount = playerMatches.length;

            return {
                name: player.name,
                avatarUrl: player.avatarUrl,
                form: form.reverse(), // Oldest to newest
                wins,
                matchCount,
                winRate: matchCount > 0 ? Math.round((wins / matchCount) * 100) : 0
            };
        }).filter(p => p.matchCount > 0)
            .sort((a, b) => b.winRate - a.winRate);

        // 4. Goal Trends (by day)
        const goalsByDay = {};
        const sortedMatches = [...periodMatches].sort((a, b) => new Date(a.date) - new Date(b.date));

        sortedMatches.forEach(match => {
            const dateKey = new Date(match.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!goalsByDay[dateKey]) {
                goalsByDay[dateKey] = { goals: 0, matches: 0 };
            }
            goalsByDay[dateKey].goals += match.scoreA + match.scoreB;
            goalsByDay[dateKey].matches += 1;
        });

        const goalTrends = Object.entries(goalsByDay).map(([date, data]) => ({
            date,
            totalGoals: data.goals,
            matchCount: data.matches,
            avgGoals: (data.goals / data.matches).toFixed(1)
        }));

        // Overall stats
        const totalGoals = periodMatches.reduce((sum, m) => sum + m.scoreA + m.scoreB, 0);
        const avgGoalsPerMatch = periodMatches.length > 0
            ? (totalGoals / periodMatches.length).toFixed(1)
            : 0;

        return {
            matchCount: periodMatches.length,
            mostActivePlayer: mostActivePlayer ? {
                name: mostActivePlayer[0],
                matches: mostActivePlayer[1],
                player: allPlayers.find(p => p.name === mostActivePlayer[0])
            } : null,
            biggestUpset,
            playerForms,
            goalTrends,
            avgGoalsPerMatch,
            totalGoals
        };
    };

    const getPeriodLabel = () => {
        if (period === 'week') return 'This Week';
        if (period === 'month') return 'This Month';
        return 'All Time';
    };

    if (loading) {
        return (
            <div className="analytics-loading text-center p-8">
                <div className="animate-pulse">
                    <div className="text-4xl mb-4">📊</div>
                    <div className="text-muted">Loading analytics...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="analytics-report animate-fade-in mb-xl">
            <h2 className="section-title text-center" style={{
                background: 'linear-gradient(to right, #00B894, #00CEC9)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
                marginBottom: '1rem'
            }}>
                📊 Analytics & Insights
            </h2>

            {/* Period Selector */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.5rem',
                marginBottom: '1.5rem'
            }}>
                {['week', 'month', 'all'].map(p => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        style={{
                            padding: '0.5rem 1.25rem',
                            borderRadius: '20px',
                            border: 'none',
                            background: period === p
                                ? 'linear-gradient(135deg, #00B894, #00CEC9)'
                                : 'rgba(255,255,255,0.1)',
                            color: period === p ? '#fff' : 'var(--color-text-muted)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: period === p ? 'bold' : 'normal',
                            transition: 'all 0.2s'
                        }}
                    >
                        {p === 'week' ? '📅 This Week' : p === 'month' ? '📆 This Month' : '📈 All Time'}
                    </button>
                ))}
            </div>

            {analytics && analytics.matchCount > 0 ? (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1rem'
                }}>
                    {/* Overview Stats */}
                    <div className="card" style={{
                        background: 'var(--gradient-card)',
                        borderRadius: '16px',
                        padding: '1.25rem',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <h3 style={{
                            fontSize: '0.9rem',
                            color: 'var(--color-text-muted)',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            📈 Overview
                        </h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '1rem',
                            textAlign: 'center'
                        }}>
                            <div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                    {analytics.matchCount}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Matches</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--color-success)' }}>
                                    {analytics.totalGoals}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Goals</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--color-warning)' }}>
                                    {analytics.avgGoalsPerMatch}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Avg/Match</div>
                            </div>
                        </div>
                    </div>

                    {/* Most Active Player */}
                    {analytics.mostActivePlayer && (
                        <div className="card" style={{
                            background: 'linear-gradient(135deg, rgba(0, 184, 148, 0.15) 0%, rgba(0, 0, 0, 0.4) 100%)',
                            borderRadius: '16px',
                            padding: '1.25rem',
                            border: '1px solid rgba(0, 184, 148, 0.3)'
                        }}>
                            <h3 style={{
                                fontSize: '0.9rem',
                                color: 'var(--color-text-muted)',
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                🏃 Most Active Player
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {analytics.mostActivePlayer.player?.avatarUrl ? (
                                    <img
                                        src={analytics.mostActivePlayer.player.avatarUrl}
                                        alt={analytics.mostActivePlayer.name}
                                        style={{
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            border: '3px solid #00B894'
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #00B894, #00CEC9)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.25rem',
                                        fontWeight: 'bold'
                                    }}>
                                        {analytics.mostActivePlayer.name.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                                        {analytics.mostActivePlayer.name}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#00B894' }}>
                                        🎮 {analytics.mostActivePlayer.matches} matches played
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Biggest Upset */}
                    {analytics.biggestUpset ? (
                        <div className="card" style={{
                            background: 'linear-gradient(135deg, rgba(232, 67, 147, 0.15) 0%, rgba(0, 0, 0, 0.4) 100%)',
                            borderRadius: '16px',
                            padding: '1.25rem',
                            border: '1px solid rgba(232, 67, 147, 0.3)'
                        }}>
                            <h3 style={{
                                fontSize: '0.9rem',
                                color: 'var(--color-text-muted)',
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                😱 Biggest Upset
                            </h3>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    fontSize: '1.1rem',
                                    fontWeight: 'bold',
                                    color: '#E84393',
                                    marginBottom: '0.5rem'
                                }}>
                                    {analytics.biggestUpset.winner} defeated {analytics.biggestUpset.loser}!
                                </div>
                                <div style={{
                                    fontSize: '1.5rem',
                                    fontWeight: 'bold',
                                    marginBottom: '0.5rem'
                                }}>
                                    {analytics.biggestUpset.match.scoreA} - {analytics.biggestUpset.match.scoreB}
                                </div>
                                <div style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--color-text-muted)',
                                    background: 'rgba(0,0,0,0.3)',
                                    padding: '0.5rem',
                                    borderRadius: '8px'
                                }}>
                                    Win rates: {analytics.biggestUpset.winner} ({analytics.biggestUpset.winnerRate}%)
                                    vs {analytics.biggestUpset.loser} ({analytics.biggestUpset.loserRate}%)
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card" style={{
                            background: 'var(--gradient-card)',
                            borderRadius: '16px',
                            padding: '1.25rem',
                            border: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤷</div>
                                <div style={{ fontSize: '0.85rem' }}>No upsets {getPeriodLabel().toLowerCase()}</div>
                            </div>
                        </div>
                    )}

                    {/* Goal Trends Chart */}
                    {analytics.goalTrends.length > 1 && (
                        <div className="card" style={{
                            background: 'var(--gradient-card)',
                            borderRadius: '16px',
                            padding: '1.25rem',
                            border: '1px solid rgba(255,255,255,0.1)',
                            gridColumn: analytics.goalTrends.length > 3 ? 'span 2' : 'span 1'
                        }}>
                            <h3 style={{
                                fontSize: '0.9rem',
                                color: 'var(--color-text-muted)',
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                ⚽ Goal Trends
                            </h3>
                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-end',
                                gap: '0.5rem',
                                height: '100px',
                                padding: '0 0.5rem'
                            }}>
                                {analytics.goalTrends.slice(-7).map((day, idx) => {
                                    const maxGoals = Math.max(...analytics.goalTrends.map(d => d.totalGoals));
                                    const height = (day.totalGoals / maxGoals) * 100;

                                    return (
                                        <div key={idx} style={{
                                            flex: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '0.25rem'
                                        }}>
                                            <div style={{
                                                fontSize: '0.65rem',
                                                color: 'var(--color-success)',
                                                fontWeight: 'bold'
                                            }}>
                                                {day.totalGoals}
                                            </div>
                                            <div style={{
                                                width: '100%',
                                                height: `${height}%`,
                                                minHeight: '10px',
                                                background: 'linear-gradient(180deg, #00B894, #00CEC9)',
                                                borderRadius: '4px 4px 0 0',
                                                transition: 'height 0.3s ease'
                                            }} />
                                            <div style={{
                                                fontSize: '0.6rem',
                                                color: 'var(--color-text-muted)',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {day.date}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Player Form Chart */}
                    <div className="card" style={{
                        background: 'var(--gradient-card)',
                        borderRadius: '16px',
                        padding: '1.25rem',
                        border: '1px solid rgba(255,255,255,0.1)',
                        gridColumn: 'span 2'
                    }}>
                        <h3 style={{
                            fontSize: '0.9rem',
                            color: 'var(--color-text-muted)',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            📊 Player Form ({getPeriodLabel()})
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {analytics.playerForms.slice(0, 6).map((player, idx) => (
                                <div key={player.name} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.5rem',
                                    background: idx === 0 ? 'rgba(0, 184, 148, 0.1)' : 'transparent',
                                    borderRadius: '8px'
                                }}>
                                    {/* Rank */}
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: idx === 0 ? 'linear-gradient(135deg, #FFD700, #FFA500)' :
                                            idx === 1 ? 'linear-gradient(135deg, #C0C0C0, #A0A0A0)' :
                                                idx === 2 ? 'linear-gradient(135deg, #CD7F32, #8B4513)' :
                                                    'rgba(255,255,255,0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.7rem',
                                        fontWeight: 'bold',
                                        color: idx < 3 ? '#000' : 'var(--color-text)'
                                    }}>
                                        {idx + 1}
                                    </div>

                                    {/* Player Name */}
                                    <div style={{
                                        flex: 1,
                                        fontSize: '0.9rem',
                                        fontWeight: idx === 0 ? 'bold' : 'normal'
                                    }}>
                                        {player.name}
                                    </div>

                                    {/* Form Indicators */}
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                        {player.form.map((result, i) => (
                                            <div key={i} style={{
                                                width: '22px',
                                                height: '22px',
                                                borderRadius: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.65rem',
                                                fontWeight: 'bold',
                                                background: result === 'W' ? '#27AE60' :
                                                    result === 'L' ? '#E74C3C' : '#95A5A6',
                                                color: '#fff'
                                            }}>
                                                {result}
                                            </div>
                                        ))}
                                        {/* Empty slots */}
                                        {[...Array(5 - player.form.length)].map((_, i) => (
                                            <div key={`empty-${i}`} style={{
                                                width: '22px',
                                                height: '22px',
                                                borderRadius: '4px',
                                                background: 'rgba(255,255,255,0.05)'
                                            }} />
                                        ))}
                                    </div>

                                    {/* Win Rate */}
                                    <div style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 'bold',
                                        color: player.winRate >= 50 ? 'var(--color-success)' : 'var(--color-error)',
                                        minWidth: '45px',
                                        textAlign: 'right'
                                    }}>
                                        {player.winRate}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card" style={{
                    background: 'var(--gradient-card)',
                    borderRadius: '16px',
                    padding: '3rem',
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                    <div style={{ color: 'var(--color-text-muted)' }}>
                        No matches found for {getPeriodLabel().toLowerCase()}
                    </div>
                </div>
            )}
        </div>
    );
}
