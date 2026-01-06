import { useState, useEffect } from 'react';
import { useMatch } from '../context/MatchContext';
import { fetchMatches } from '../utils/api';
import { calculateOverallStats, calculateLeaderboard, calculateRecords } from '../utils/stats';
import PlayerSelect from './PlayerSelect';

export default function Statistics() {
    const { actions, state } = useMatch();
    const { players } = state;
    const [matches, setMatches] = useState([]);
    const [overall, setOverall] = useState({ totalMatches: 0, totalGoals: 0, avgGoalsPerMatch: 0 });
    const [leaderboard, setLeaderboard] = useState([]);
    const [records, setRecords] = useState({ biggestWin: null, highestScoringMatch: null });

    // H2H State
    const [h2hA, setH2hA] = useState('');
    const [h2hB, setH2hB] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState(null); // For detailed view lookup

    useEffect(() => {
        const loadData = async () => {
            const data = await fetchMatches();
            setMatches(data);
            setOverall(calculateOverallStats(data));
            const lb = calculateLeaderboard(data);
            setLeaderboard(lb); // Still needed for player lookup details
            setRecords(calculateRecords(data));
        };
        loadData();
    }, []);

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

    const getH2HMatches = () => {
        if (!h2hA || !h2hB) return [];
        return matches.filter(m =>
            (m.playerA === h2hA && m.playerB === h2hB) ||
            (m.playerA === h2hB && m.playerB === h2hA)
        );
    };

    const getH2HStats = (matches) => {
        let stats = {
            total: matches.length,
            winsA: 0,
            winsB: 0,
            draws: 0,
            goalsA: 0,
            goalsB: 0
        };

        matches.forEach(m => {
            const isAHome = m.playerA === h2hA;
            const scoreA = isAHome ? m.scoreA : m.scoreB;
            const scoreB = isAHome ? m.scoreB : m.scoreA;

            stats.goalsA += scoreA;
            stats.goalsB += scoreB;

            if (scoreA > scoreB) stats.winsA++;
            else if (scoreB > scoreA) stats.winsB++;
            else stats.draws++;
        });

        return stats;
    };

    const handleReviewPlayer = (playerName) => {
        // Optionally navigate to League Table or show modal? 
        // For now, let's just keep the simple H2H focus.
        // If we want detailed stats, we go to League Table.
    };

    // Derived Stats for Records View
    const getTopScorer = () => {
        if (leaderboard.length === 0) return null;
        return [...leaderboard].sort((a, b) => b.goalsFor - a.goalsFor)[0];
    };

    const getBestDefense = () => {
        if (leaderboard.length === 0) return null;
        return [...leaderboard].sort((a, b) => a.goalsAgainst - b.goalsAgainst)[0];
    };

    const topScorer = getTopScorer();
    const bestDefense = getBestDefense();

    const renderH2H = () => {
        const matches = getH2HMatches();
        const stats = getH2HStats(matches);

        // Calculate progress bars vs total
        const totalWins = stats.winsA + stats.winsB + stats.draws;
        const widthA = totalWins ? (stats.winsA / totalWins) * 100 : 0;
        const widthB = totalWins ? (stats.winsB / totalWins) * 100 : 0;
        const widthDraw = totalWins ? (stats.draws / totalWins) * 100 : 0;

        return (
            <div className="animate-fade-in">

                <h3 className="section-title text-center mb-6">Compare Players</h3>

                <div className="card mb-4" style={{ padding: '1.5rem', marginBottom: '2rem', position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center' }}>
                        <PlayerSelect
                            label="Player A"
                            value={h2hA}
                            onChange={setH2hA}
                            players={players}
                        />
                        <div className="vs-text" style={{ paddingTop: '1.5rem', fontWeight: 'bold', fontSize: '1.2rem' }}>VS</div>
                        <PlayerSelect
                            label="Player B"
                            value={h2hB}
                            onChange={setH2hB}
                            players={players.filter(p => p !== h2hA)}
                        />
                    </div>
                </div>

                {h2hA && h2hB ? (
                    <>
                        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                            <div className="stat-card card" style={{ textAlign: 'center' }}>
                                <div className="stat-value text-primary">{stats.winsA}</div>
                                <div className="stat-label">{h2hA} Wins</div>
                            </div>
                            <div className="stat-card card">
                                <div className="stat-value">{stats.draws}</div>
                                <div className="stat-label">Draws</div>
                            </div>
                            <div className="stat-card card">
                                <div className="stat-value text-secondary">{stats.winsB}</div>
                                <div className="stat-label">{h2hB} Wins</div>
                            </div>
                        </div>

                        {/* Comparison Bar */}
                        <div style={{ margin: '2rem 0', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
                            <div style={{ width: `${widthA}% `, background: 'var(--color-primary)' }} />
                            <div style={{ width: `${widthDraw}% `, background: 'var(--color-text-muted)' }} />
                            <div style={{ width: `${widthB}% `, background: 'var(--color-secondary)' }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                            <span>Total Goals: {stats.goalsA}</span>
                            <span>{matches.length} Matches Total</span>
                            <span>Total Goals: {stats.goalsB}</span>
                        </div>

                        <h3 className="section-title">Head to Head History</h3>
                        <div className="match-list">
                            {matches.length > 0 ? (
                                matches.map((match, index) => (
                                    <div key={match._id || match.id || index} className="match-card card">
                                        <div className="match-card-header">
                                            <span className="match-date">{formatDate(match.date)}</span>
                                        </div>
                                        <div className="match-card-score">
                                            <div className={`match-card-player ${match.scoreA > match.scoreB ? 'winner' : ''}`}>
                                                <div className="match-card-player-name">
                                                    {match.playerA}
                                                </div>
                                                <div className="match-card-player-score">{match.scoreA}</div>
                                            </div>
                                            <div className="match-card-vs">vs</div>
                                            <div className={`match-card-player ${match.scoreB > match.scoreA ? 'winner' : ''}`}>
                                                <div className="match-card-player-name">
                                                    {match.playerB}
                                                </div>
                                                <div className="match-card-player-score">{match.scoreB}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <p>No matches yet between these two</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">🥊</div>
                        <p>Select two players to compare</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="stats-screen container animate-fade-in">
            <button className="back-btn" onClick={() => actions.setScreen('home')}>
                ← Back to Home
            </button>

            <h2 className="section-title">Statistics</h2>

            <div className="stats-grid">
                <div className="stat-card card">
                    <div className="stat-value">{overall.totalMatches}</div>
                    <div className="stat-label">Matches</div>
                </div>
                <div className="stat-card card">
                    <div className="stat-value">{overall.totalGoals}</div>
                    <div className="stat-label">Total Goals</div>
                </div>
                <div className="stat-card card">
                    <div className="stat-value">{overall.avgGoalsPerMatch}</div>
                    <div className="stat-label">Avg Goals/Match</div>
                </div>
                <div className="stat-card card">
                    <div className="stat-value">{leaderboard.length}</div>
                    <div className="stat-label">Players</div>
                </div>
            </div>

            {/* Records Section */}
            {topScorer && (
                <div style={{ marginTop: '2rem' }}>
                    <h3 className="section-title">Season Records</h3>
                    <div className="stats-grid">
                        <div className="stat-card card">
                            <div className="stat-label" style={{ marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Golden Boot 👟</div>
                            <div className="stat-value" style={{ fontSize: '1.5rem' }}>{topScorer.name}</div>
                            <div className="stat-desc">{topScorer.goalsFor} Goals</div>
                        </div>

                        {bestDefense && (
                            <div className="stat-card card">
                                <div className="stat-label" style={{ marginBottom: '0.5rem', color: 'var(--color-secondary)' }}>Iron Wall 🛡️</div>
                                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{bestDefense.name}</div>
                                <div className="stat-desc">{bestDefense.goalsAgainst} Goals Conceded</div>
                            </div>
                        )}

                        {records.biggestWin && (
                            <div className="stat-card card">
                                <div className="stat-label" style={{ marginBottom: '0.5rem', color: '#10b981' }}>Biggest Win 🔥</div>
                                <div className="stat-value" style={{ fontSize: '1.2rem' }}>
                                    {records.biggestWin.scoreA > records.biggestWin.scoreB
                                        ? `${records.biggestWin.playerA} ${records.biggestWin.scoreA}-${records.biggestWin.scoreB}`
                                        : `${records.biggestWin.playerB} ${records.biggestWin.scoreB}-${records.biggestWin.scoreA}`
                                    }
                                </div>
                                <div className="stat-desc">vs {records.biggestWin.scoreA > records.biggestWin.scoreB ? records.biggestWin.playerB : records.biggestWin.playerA}</div>
                            </div>
                        )}

                        {records.highestScoringMatch && (
                            <div className="stat-card card">
                                <div className="stat-label" style={{ marginBottom: '0.5rem', color: '#f59e0b' }}>Thriller 🍿</div>
                                <div className="stat-value" style={{ fontSize: '1.2rem' }}>
                                    {records.highestScoringMatch.playerA} {records.highestScoringMatch.scoreA}-{records.highestScoringMatch.scoreB} {records.highestScoringMatch.playerB}
                                </div>
                                <div className="stat-desc">{records.highestScoringMatch.scoreA + records.highestScoringMatch.scoreB} Total Goals</div>
                            </div>
                        )}

                        {records.longestStreak && (
                            <div className="stat-card card">
                                <div className="stat-label" style={{ marginBottom: '0.5rem', color: '#8b5cf6' }}>Unstoppable 🚀</div>
                                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{records.longestStreak.name}</div>
                                <div className="stat-desc">{records.longestStreak.count} Win Streak</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {renderH2H()}
        </div>
    );
}
