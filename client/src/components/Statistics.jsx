import { useState, useEffect } from 'react';
import { useMatch } from '../context/MatchContext';
import { fetchMatches } from '../utils/api';
import { calculateOverallStats, calculateLeaderboard, calculateRecords } from '../utils/stats';


export default function Statistics() {
    const { actions, state } = useMatch();
    const { players } = state;
    const [matches, setMatches] = useState([]);
    const [overall, setOverall] = useState({ totalMatches: 0, totalGoals: 0, avgGoalsPerMatch: 0 });
    const [leaderboard, setLeaderboard] = useState([]);
    const [records, setRecords] = useState({ biggestWin: null, highestScoringMatch: null });



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


        </div>
    );
}
