import { useState, useEffect } from 'react';
import { fetchMatches, fetchPlayers } from '../utils/api';
import { calculateLeaderboard } from '../utils/stats';
import { useMatch } from '../context/MatchContext';

// Commentary templates for different scenarios
const COMMENTARY = {
    dominant: [
        "{winner} absolutely demolished {loser} in a stunning {scoreA}-{scoreB} victory! The crowd couldn't believe their eyes.",
        "What a masterclass by {winner}! {loser} had no answer as they cruised to a {scoreA}-{scoreB} win.",
        "{winner} showed no mercy, crushing {loser} {scoreA}-{scoreB}. This was pure domination.",
        "Stop the fight! {winner} destroyed {loser} with a ruthless {scoreA}-{scoreB} performance.",
    ],
    close: [
        "THRILLER! {winner} edged out {loser} in a nail-biting {scoreA}-{scoreB} contest!",
        "Heart-stopping finish as {winner} just managed to hold off {loser} {scoreA}-{scoreB}.",
        "Edge-of-your-seat stuff! {winner} prevails {scoreA}-{scoreB} in a match for the ages.",
        "What a battle! {winner} and {loser} went toe-to-toe, with {winner} emerging victorious {scoreA}-{scoreB}.",
    ],
    upset: [
        "UPSET ALERT! 🚨 {winner} shocks the world by defeating {loser} {scoreA}-{scoreB}!",
        "Nobody saw this coming! {winner} pulls off a stunning upset against {loser}, winning {scoreA}-{scoreB}.",
        "Giant slaying! {winner} defies the odds to beat {loser} {scoreA}-{scoreB}. Unbelievable!",
        "The underdog bites back! {winner} stuns {loser} with a sensational {scoreA}-{scoreB} victory.",
    ],
    draw: [
        "Drama until the end! {playerA} and {playerB} couldn't be separated in a thrilling {scoreA}-{scoreB} draw.",
        "Honours even as {playerA} and {playerB} battle to a {scoreA}-{scoreB} stalemate.",
        "Goal-fest ends level! {playerA} and {playerB} share the spoils in an entertaining {scoreA}-{scoreB} draw.",
        "Neither side could find a winner as {playerA} and {playerB} draw {scoreA}-{scoreB}.",
    ],
    cleanSheet: [
        "{winner} keeps a clean sheet in a dominant {scoreA}-0 shutout against {loser}.",
        "Defensive masterclass! {winner} blanks {loser} {scoreA}-0.",
        "Nothing getting past {winner} today! {loser} couldn't find the net in a {scoreA}-0 defeat.",
    ],
    highScoring: [
        "GOAL FEST! 🎉 {winner} and {loser} treat us to a {scoreA}-{scoreB} thriller with {totalGoals} goals!",
        "Where was the defense?! {winner} beats {loser} {scoreA}-{scoreB} in a wild {totalGoals}-goal shootout!",
        "Entertainment overload! {totalGoals} goals as {winner} edges {loser} {scoreA}-{scoreB}.",
    ]
};

const HEADLINES = {
    streak: [
        "🔥 {player} is ON FIRE with {count} consecutive wins!",
        "Unstoppable! {player} extends winning streak to {count} games!",
        "Can anyone stop {player}? {count} wins in a row and counting!",
    ],
    formDrop: [
        "📉 Tough times for {player} - {count} losses in their last matches",
        "Crisis mode: {player} struggling to find form",
        "What's happening to {player}? Another disappointing result.",
    ],
    topScorer: [
        "⚽ {player} leads the goal charts with {goals} goals this week!",
        "Golden boot contender: {player} bags {goals} goals!",
        "{player}'s scoring spree continues - {goals} goals and counting!",
    ],
    mostActive: [
        "🏃 {player} putting in the work with {matches} matches this week!",
        "Iron man {player} - {matches} games and still going strong!",
    ]
};

export default function NewsSection() {
    const { actions } = useMatch();
    const [allMatches, setAllMatches] = useState([]);
    const [allPlayers, setAllPlayers] = useState([]);
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [playersMap, setPlayersMap] = useState({});
    const [selectedWeek, setSelectedWeek] = useState(0); // 0 = this week, 1 = last week, etc.
    const [availableWeeks, setAvailableWeeks] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [matchesData, playersData] = await Promise.all([
                    fetchMatches(),
                    fetchPlayers()
                ]);

                const matchesList = matchesData.matches || (Array.isArray(matchesData) ? matchesData : []);
                setAllMatches(matchesList);
                setAllPlayers(playersData || []);

                // Create players map
                const pMap = {};
                (playersData || []).forEach(p => pMap[p.name] = p);
                setPlayersMap(pMap);

                // Calculate available weeks (up to 8 weeks back)
                const weeks = [];
                for (let i = 0; i < 8; i++) {
                    const weekStart = new Date();
                    weekStart.setDate(weekStart.getDate() - (i * 7) - 7);
                    const weekEnd = new Date();
                    weekEnd.setDate(weekEnd.getDate() - (i * 7));

                    const weekMatches = matchesList.filter(m => {
                        const matchDate = new Date(m.date);
                        return matchDate >= weekStart && matchDate < weekEnd;
                    });

                    if (weekMatches.length > 0 || i === 0) {
                        weeks.push({
                            index: i,
                            label: i === 0 ? 'This Week' : i === 1 ? 'Last Week' : `${i} Weeks Ago`,
                            startDate: weekStart,
                            endDate: weekEnd,
                            matchCount: weekMatches.length
                        });
                    }
                }
                setAvailableWeeks(weeks);

            } catch (error) {
                console.error("Failed to load news", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Generate news when selected week changes
    useEffect(() => {
        if (allMatches.length === 0) return;

        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (selectedWeek * 7) - 7);
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - (selectedWeek * 7));

        const weekMatches = allMatches
            .filter(m => {
                const matchDate = new Date(m.date);
                return matchDate >= weekStart && matchDate < weekEnd;
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        const newsItems = generateNews(weekMatches, allMatches, allPlayers);
        setNews(newsItems);
    }, [selectedWeek, allMatches, allPlayers]);

    const generateNews = (weekMatches, allMatches, players) => {
        const items = [];
        const leaderboard = calculateLeaderboard(allMatches);
        const winRates = {};
        leaderboard.forEach(p => winRates[p.name] = parseFloat(p.winRate) || 50);

        // Generate match reports (last 5 matches)
        weekMatches.slice(0, 5).forEach((match, idx) => {
            const isDraw = match.scoreA === match.scoreB;
            const winner = match.scoreA > match.scoreB ? match.playerA : match.playerB;
            const loser = match.scoreA > match.scoreB ? match.playerB : match.playerA;
            const winnerScore = Math.max(match.scoreA, match.scoreB);
            const loserScore = Math.min(match.scoreA, match.scoreB);
            const scoreDiff = winnerScore - loserScore;
            const totalGoals = match.scoreA + match.scoreB;

            let category, templates;

            if (isDraw) {
                category = 'draw';
                templates = COMMENTARY.draw;
            } else if (loserScore === 0 && winnerScore >= 2) {
                category = 'cleanSheet';
                templates = COMMENTARY.cleanSheet;
            } else if (totalGoals >= 6) {
                category = 'highScoring';
                templates = COMMENTARY.highScoring;
            } else if (!isDraw && winRates[winner] < winRates[loser] - 10) {
                category = 'upset';
                templates = COMMENTARY.upset;
            } else if (scoreDiff >= 3) {
                category = 'dominant';
                templates = COMMENTARY.dominant;
            } else {
                category = 'close';
                templates = COMMENTARY.close;
            }

            const template = templates[Math.floor(Math.random() * templates.length)];
            const commentary = template
                .replace(/{winner}/g, winner)
                .replace(/{loser}/g, loser)
                .replace(/{playerA}/g, match.playerA)
                .replace(/{playerB}/g, match.playerB)
                .replace(/{scoreA}/g, match.scoreA)
                .replace(/{scoreB}/g, match.scoreB)
                .replace(/{totalGoals}/g, totalGoals);

            items.push({
                type: 'match',
                category,
                title: `${match.playerA} ${match.scoreA} - ${match.scoreB} ${match.playerB}`,
                content: commentary,
                date: match.date,
                match,
                priority: idx === 0 ? 'featured' : 'normal'
            });
        });

        // Calculate weekly stats for headlines
        const weeklyStats = {};
        weekMatches.forEach(match => {
            [match.playerA, match.playerB].forEach(player => {
                if (!weeklyStats[player]) {
                    weeklyStats[player] = { matches: 0, wins: 0, goals: 0, streak: 0 };
                }
                weeklyStats[player].matches++;
            });

            // Goals
            weeklyStats[match.playerA].goals += match.scoreA;
            weeklyStats[match.playerB].goals += match.scoreB;

            // Wins
            if (match.scoreA > match.scoreB) {
                weeklyStats[match.playerA].wins++;
            } else if (match.scoreB > match.scoreA) {
                weeklyStats[match.playerB].wins++;
            }
        });

        // Find win streaks (simplified)
        const calculateStreak = (playerName) => {
            const playerMatches = weekMatches
                .filter(m => m.playerA === playerName || m.playerB === playerName)
                .sort((a, b) => new Date(b.date) - new Date(a.date));

            let streak = 0;
            for (const match of playerMatches) {
                const isPlayerA = match.playerA === playerName;
                const won = isPlayerA
                    ? match.scoreA > match.scoreB
                    : match.scoreB > match.scoreA;

                if (won) streak++;
                else break;
            }
            return streak;
        };

        // Add headline news
        let hasStreakNews = false;
        let hasTopScorerNews = false;
        let hasMostActiveNews = false;

        Object.entries(weeklyStats).forEach(([player, stats]) => {
            const streak = calculateStreak(player);

            // Win streak news
            if (streak >= 3 && !hasStreakNews) {
                const template = HEADLINES.streak[Math.floor(Math.random() * HEADLINES.streak.length)];
                items.push({
                    type: 'headline',
                    category: 'streak',
                    title: '🔥 Hot Streak Alert!',
                    content: template.replace(/{player}/g, player).replace(/{count}/g, streak),
                    priority: 'headline'
                });
                hasStreakNews = true;
            }
        });

        // Top scorer of the week
        const topScorer = Object.entries(weeklyStats)
            .sort((a, b) => b[1].goals - a[1].goals)[0];

        if (topScorer && topScorer[1].goals >= 5 && !hasTopScorerNews) {
            const template = HEADLINES.topScorer[Math.floor(Math.random() * HEADLINES.topScorer.length)];
            items.push({
                type: 'headline',
                category: 'scorer',
                title: '⚽ Top Scorer',
                content: template.replace(/{player}/g, topScorer[0]).replace(/{goals}/g, topScorer[1].goals),
                priority: 'headline'
            });
        }

        // Most active player
        const mostActive = Object.entries(weeklyStats)
            .sort((a, b) => b[1].matches - a[1].matches)[0];

        if (mostActive && mostActive[1].matches >= 3 && !hasMostActiveNews) {
            const template = HEADLINES.mostActive[Math.floor(Math.random() * HEADLINES.mostActive.length)];
            items.push({
                type: 'headline',
                category: 'active',
                title: '🏃 Most Active',
                content: template.replace(/{player}/g, mostActive[0]).replace(/{matches}/g, mostActive[1].matches),
                priority: 'headline'
            });
        }

        // Sort: featured first, then headlines, then by date
        return items.sort((a, b) => {
            if (a.priority === 'featured') return -1;
            if (b.priority === 'featured') return 1;
            if (a.priority === 'headline' && b.priority !== 'headline') return -1;
            if (b.priority === 'headline' && a.priority !== 'headline') return 1;
            return 0;
        });
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'upset': return '🚨';
            case 'dominant': return '💪';
            case 'close': return '😰';
            case 'draw': return '🤝';
            case 'cleanSheet': return '🧱';
            case 'highScoring': return '🎉';
            case 'streak': return '🔥';
            case 'scorer': return '⚽';
            case 'active': return '🏃';
            default: return '📰';
        }
    };

    const getCategoryColor = (category) => {
        switch (category) {
            case 'upset': return '#E84393';
            case 'dominant': return '#00B894';
            case 'close': return '#FDCB6E';
            case 'draw': return '#74B9FF';
            case 'cleanSheet': return '#0984E3';
            case 'highScoring': return '#E17055';
            case 'streak': return '#FF6B35';
            case 'scorer': return '#27AE60';
            case 'active': return '#9B59B6';
            default: return '#636E72';
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    if (loading) {
        return (
            <div className="news-loading text-center p-8">
                <div className="animate-pulse">
                    <div className="text-4xl mb-4">📰</div>
                    <div className="text-muted">Loading news...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="news-section animate-fade-in mb-xl">
            {/* Back Button Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.5rem'
            }}>
                <button
                    onClick={() => actions.setScreen('home')}
                    style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        color: 'var(--color-text)',
                        transition: 'background 0.2s'
                    }}
                >
                    ←
                </button>
                <h2 className="section-title" style={{
                    background: 'linear-gradient(to right, #E74C3C, #C0392B)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: 'none',
                    margin: 0
                }}>
                    📰 Weekly News
                </h2>
            </div>
            <p className="text-muted mb-lg" style={{ fontSize: '0.85rem' }}>
                Your PES 6 match analysis and commentary
            </p>

            {/* Week Selector */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                marginBottom: '1.5rem'
            }}>
                <button
                    onClick={() => setSelectedWeek(prev => Math.min(prev + 1, availableWeeks.length - 1))}
                    disabled={selectedWeek >= availableWeeks.length - 1}
                    style={{
                        background: selectedWeek >= availableWeeks.length - 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: selectedWeek >= availableWeeks.length - 1 ? 'not-allowed' : 'pointer',
                        fontSize: '1rem',
                        color: selectedWeek >= availableWeeks.length - 1 ? 'var(--color-text-muted)' : 'var(--color-text)',
                        transition: 'all 0.2s'
                    }}
                >
                    ←
                </button>

                <div style={{
                    textAlign: 'center',
                    minWidth: '150px'
                }}>
                    <div style={{
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: selectedWeek === 0 ? '#E74C3C' : 'var(--color-text)'
                    }}>
                        {availableWeeks[selectedWeek]?.label || 'This Week'}
                    </div>
                    <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)'
                    }}>
                        {availableWeeks[selectedWeek]?.matchCount || 0} matches
                    </div>
                </div>

                <button
                    onClick={() => setSelectedWeek(prev => Math.max(prev - 1, 0))}
                    disabled={selectedWeek <= 0}
                    style={{
                        background: selectedWeek <= 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: selectedWeek <= 0 ? 'not-allowed' : 'pointer',
                        fontSize: '1rem',
                        color: selectedWeek <= 0 ? 'var(--color-text-muted)' : 'var(--color-text)',
                        transition: 'all 0.2s'
                    }}
                >
                    →
                </button>
            </div>

            {/* Quick Week Pills */}
            {availableWeeks.length > 1 && (
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    marginBottom: '1.5rem'
                }}>
                    {availableWeeks.slice(0, 4).map((week) => (
                        <button
                            key={week.index}
                            onClick={() => setSelectedWeek(week.index)}
                            style={{
                                padding: '0.4rem 0.8rem',
                                borderRadius: '16px',
                                border: 'none',
                                background: selectedWeek === week.index
                                    ? 'linear-gradient(135deg, #E74C3C, #C0392B)'
                                    : 'rgba(255,255,255,0.08)',
                                color: selectedWeek === week.index ? '#fff' : 'var(--color-text-muted)',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: selectedWeek === week.index ? 'bold' : 'normal',
                                transition: 'all 0.2s'
                            }}
                        >
                            {week.index === 0 ? '📆 This Week' : week.index === 1 ? '📅 Last Week' : `${week.index}w ago`}
                            {week.matchCount > 0 && (
                                <span style={{
                                    marginLeft: '0.3rem',
                                    opacity: 0.7
                                }}>
                                    ({week.matchCount})
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {news.length === 0 ? (
                <div className="card" style={{
                    background: 'var(--gradient-card)',
                    borderRadius: '16px',
                    padding: '3rem',
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                    <div style={{ color: 'var(--color-text-muted)' }}>
                        No matches this week. Time to play some games!
                    </div>
                </div>
            ) : (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    {/* Featured Match (first match) */}
                    {news.filter(n => n.priority === 'featured').map((item, idx) => (
                        <div key={`featured-${idx}`} className="card" style={{
                            background: `linear-gradient(135deg, ${getCategoryColor(item.category)}22 0%, rgba(0,0,0,0.5) 100%)`,
                            border: `2px solid ${getCategoryColor(item.category)}`,
                            borderRadius: '16px',
                            padding: '1.5rem',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {/* Featured Badge */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                background: getCategoryColor(item.category),
                                padding: '0.5rem 1rem',
                                borderRadius: '0 0 0 12px',
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                color: '#fff',
                                textTransform: 'uppercase'
                            }}>
                                ⭐ Featured
                            </div>

                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                                {getCategoryIcon(item.category)}
                            </div>
                            <h3 style={{
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                marginBottom: '0.75rem',
                                color: getCategoryColor(item.category)
                            }}>
                                {item.title}
                            </h3>
                            <p style={{
                                fontSize: '1.1rem',
                                lineHeight: 1.6,
                                marginBottom: '0.75rem'
                            }}>
                                {item.content}
                            </p>
                            {item.date && (
                                <div style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--color-text-muted)'
                                }}>
                                    📅 {formatDate(item.date)}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Headlines Row */}
                    {news.filter(n => n.priority === 'headline').length > 0 && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '0.75rem'
                        }}>
                            {news.filter(n => n.priority === 'headline').map((item, idx) => (
                                <div key={`headline-${idx}`} className="card" style={{
                                    background: `linear-gradient(135deg, ${getCategoryColor(item.category)}15 0%, rgba(0,0,0,0.3) 100%)`,
                                    border: `1px solid ${getCategoryColor(item.category)}50`,
                                    borderRadius: '12px',
                                    padding: '1rem'
                                }}>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: getCategoryColor(item.category),
                                        fontWeight: 'bold',
                                        marginBottom: '0.5rem'
                                    }}>
                                        {item.title}
                                    </div>
                                    <div style={{ fontSize: '0.9rem' }}>
                                        {item.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Other Match Reports */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '0.75rem'
                    }}>
                        {news.filter(n => n.priority === 'normal').map((item, idx) => (
                            <div key={`match-${idx}`} className="card" style={{
                                background: 'var(--gradient-card)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                padding: '1rem',
                                borderLeft: `4px solid ${getCategoryColor(item.category)}`
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginBottom: '0.5rem'
                                }}>
                                    <span style={{ fontSize: '1.25rem' }}>
                                        {getCategoryIcon(item.category)}
                                    </span>
                                    <span style={{
                                        fontWeight: 'bold',
                                        fontSize: '0.95rem'
                                    }}>
                                        {item.title}
                                    </span>
                                </div>
                                <p style={{
                                    fontSize: '0.85rem',
                                    color: 'var(--color-text-muted)',
                                    marginBottom: '0.5rem',
                                    lineHeight: 1.5
                                }}>
                                    {item.content}
                                </p>
                                {item.date && (
                                    <div style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--color-text-muted)',
                                        opacity: 0.7
                                    }}>
                                        {formatDate(item.date)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
