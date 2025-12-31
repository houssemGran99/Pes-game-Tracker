// Calculate overall statistics from matches array
export const calculateOverallStats = (matches) => {
    let totalGoals = 0;
    let totalMatches = matches.length;

    matches.forEach(match => {
        totalGoals += match.scoreA + match.scoreB;
    });

    const avgGoalsPerMatch = totalMatches > 0 ? (totalGoals / totalMatches).toFixed(1) : 0;

    return {
        totalMatches,
        totalGoals,
        avgGoalsPerMatch,
    };
};

// Calculate leaderboard from matches array (sorted by wins)
export const calculateLeaderboard = (matches) => {
    const stats = {};

    matches.forEach(match => {
        // Initialize players if not exists
        if (!stats[match.playerA]) {
            stats[match.playerA] = { wins: 0, losses: 0, draws: 0, goalsFor: 0, goalsAgainst: 0, matches: 0 };
        }
        if (!stats[match.playerB]) {
            stats[match.playerB] = { wins: 0, losses: 0, draws: 0, goalsFor: 0, goalsAgainst: 0, matches: 0 };
        }

        // Update stats for player A
        stats[match.playerA].goalsFor += match.scoreA;
        stats[match.playerA].goalsAgainst += match.scoreB;
        stats[match.playerA].matches += 1;

        // Update stats for player B
        stats[match.playerB].goalsFor += match.scoreB;
        stats[match.playerB].goalsAgainst += match.scoreA;
        stats[match.playerB].matches += 1;

        // Determine winner/loser
        if (match.scoreA > match.scoreB) {
            stats[match.playerA].wins += 1;
            stats[match.playerB].losses += 1;
        } else if (match.scoreB > match.scoreA) {
            stats[match.playerB].wins += 1;
            stats[match.playerA].losses += 1;
        } else {
            stats[match.playerA].draws += 1;
            stats[match.playerB].draws += 1;
        }
    });

    return Object.entries(stats)
        .map(([name, data]) => ({
            name,
            ...data,
            winRate: data.matches > 0 ? ((data.wins / data.matches) * 100).toFixed(0) : 0,
        }))
        .sort((a, b) => {
            // Sort by wins first, then by goal difference
            if (b.wins !== a.wins) return b.wins - a.wins;
            const gdA = a.goalsFor - a.goalsAgainst;
            const gdB = b.goalsFor - b.goalsAgainst;
            return gdB - gdA;
        });
};
