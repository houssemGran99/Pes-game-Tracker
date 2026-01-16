import { useState, useEffect } from 'react';
import { fetchMatches, fetchPlayers } from '../utils/api';
import { calculateLeaderboard } from '../utils/stats';

export default function ChampionSection() {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [playersMap, setPlayersMap] = useState({});

    useEffect(() => {
        const loadChampionData = async () => {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

            try {
                const [matchesData, playersData] = await Promise.all([
                    fetchMatches(null, null, null, null, startOfMonth, endOfMonth),
                    fetchPlayers()
                ]);

                // Map players
                const pMap = {};
                if (Array.isArray(playersData)) {
                    playersData.forEach(p => pMap[p.name] = p);
                }
                setPlayersMap(pMap);

                // Calculate stats for this month
                // fetchMatches might return { matches: [], ... } or [] depending on pagination
                const matches = matchesData.matches || (Array.isArray(matchesData) ? matchesData : []);
                const lb = calculateLeaderboard(matches);
                setLeaderboard(lb);

            } catch (error) {
                console.error("Failed to load champion data", error);
            } finally {
                setLoading(false);
            }
        };

        loadChampionData();
    }, []);

    if (loading) return <div className="text-center p-4">Loading stats...</div>;
    if (leaderboard.length === 0) return null;

    const champion = leaderboard[0];
    const championData = playersMap[champion.name];

    return (
        <div className="champion-section animate-fade-in mb-xl">
            <h2 className="section-title text-center" style={{ color: 'var(--color-warning)', textShadow: '0 0 10px rgba(255, 215, 0, 0.5)' }}>
                👑 Champion of the Month
            </h2>

            <div className="champion-card card" style={{
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%)',
                border: '2px solid var(--color-warning)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '2rem',
                marginBottom: '2rem'
            }}>
                <div className="champion-avatar" style={{ position: 'relative', marginBottom: '1rem' }}>
                    <div style={{
                        position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)',
                        fontSize: '2.5rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))', zIndex: 1
                    }}>
                        👑
                    </div>
                    {championData && championData.avatarUrl ? (
                        <img src={championData.avatarUrl} alt={champion.name} style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--color-warning)', boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)' }} />
                    ) : (
                        <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--gradient-card)', border: '4px solid var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)' }}>
                            {champion.name.charAt(0)}
                        </div>
                    )}
                </div>

                <h3 className="title" style={{ fontSize: '2rem', marginBottom: '0.5rem', background: 'linear-gradient(to right, #FFD700, #FFA500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {champion.name}
                </h3>

                <div className="champion-stats flex gap-lg mt-md">
                    <div className="text-center">
                        <div className="text-muted text-sm">Wins</div>
                        <div className="text-xl font-bold" style={{ color: 'var(--color-success)' }}>{champion.wins}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-muted text-sm">Win Rate</div>
                        <div className="text-xl font-bold">{champion.winRate}%</div>
                    </div>
                    <div className="text-center">
                        <div className="text-muted text-sm">Goals</div>
                        <div className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>{champion.goalsFor}</div>
                    </div>
                </div>
            </div>

            <h3 className="section-title text-center mb-md">Monthly Leaderboard</h3>
            <div className="table-container card p-0 overflow-hidden">
                <table className="league-table w-full">
                    <thead>
                        <tr>
                            <th className="p-3 text-left">#</th>
                            <th className="p-3 text-left">Player</th>
                            <th className="p-3 text-center">P</th>
                            <th className="p-3 text-center">W</th>
                            <th className="p-3 text-center">Pts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboard.slice(0, 5).map((player, index) => (
                            <tr key={player.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td className="p-3">
                                    <span className={`leaderboard-rank ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}`} style={{ display: 'inline-block', width: '24px', height: '24px', textAlign: 'center', borderRadius: '50%', lineHeight: '24px', background: index < 3 ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
                                        {index + 1}
                                    </span>
                                </td>
                                <td className="p-3 font-bold">{player.name}</td>
                                <td className="p-3 text-center">{player.matches}</td>
                                <td className="p-3 text-center text-success">{player.wins}</td>
                                <td className="p-3 text-center font-bold">{player.points}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {leaderboard.length > 5 && (
                <div className="text-center mt-sm text-sm text-muted">
                    ...and {leaderboard.length - 5} more
                </div>
            )}
        </div>
    );
}
