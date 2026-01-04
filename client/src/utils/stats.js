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
    const playerForm = {}; // Temporary storage for all match results

    // Process all matches
    matches.forEach(match => {
        // Initialize players if not exists
        if (!stats[match.playerA]) {
            stats[match.playerA] = { wins: 0, losses: 0, draws: 0, goalsFor: 0, goalsAgainst: 0, matches: 0, points: 0 };
            playerForm[match.playerA] = [];
        }
        if (!stats[match.playerB]) {
            stats[match.playerB] = { wins: 0, losses: 0, draws: 0, goalsFor: 0, goalsAgainst: 0, matches: 0, points: 0 };
            playerForm[match.playerB] = [];
        }

        // Update stats for player A
        stats[match.playerA].goalsFor += match.scoreA;
        stats[match.playerA].goalsAgainst += match.scoreB;
        stats[match.playerA].matches += 1;

        // Update stats for player B
        stats[match.playerB].goalsFor += match.scoreB;
        stats[match.playerB].goalsAgainst += match.scoreA;
        stats[match.playerB].matches += 1;

        // Determine winner/loser & Record Form
        if (match.scoreA > match.scoreB) {
            stats[match.playerA].wins += 1;
            stats[match.playerA].points += 3;
            playerForm[match.playerA].push({ result: 'W', date: match.date });

            stats[match.playerB].losses += 1;
            playerForm[match.playerB].push({ result: 'L', date: match.date });
        } else if (match.scoreB > match.scoreA) {
            stats[match.playerB].wins += 1;
            stats[match.playerB].points += 3;
            playerForm[match.playerB].push({ result: 'W', date: match.date });

            stats[match.playerA].losses += 1;
            playerForm[match.playerA].push({ result: 'L', date: match.date });
        } else {
            stats[match.playerA].draws += 1;
            stats[match.playerA].points += 1;
            playerForm[match.playerA].push({ result: 'D', date: match.date });

            stats[match.playerB].draws += 1;
            stats[match.playerB].points += 1;
            playerForm[match.playerB].push({ result: 'D', date: match.date });
        }
    });

    return Object.entries(stats)
        .map(([name, data]) => {
            // Sort matches by date descending (newest first) and take top 5
            const sortedForm = (playerForm[name] || [])
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5)
                .map(m => m.result); // Extract just 'W', 'D', 'L'

            return {
                name,
                ...data,
                form: sortedForm,
                goalDifference: data.goalsFor - data.goalsAgainst,
                winRate: data.matches > 0 ? ((data.wins / data.matches) * 100).toFixed(0) : 0,
            };
        })
        .sort((a, b) => {
            // Sort by Points first
            if (b.points !== a.points) return b.points - a.points;
            // Then by Goal Difference
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            // Then by Goals For
            return b.goalsFor - a.goalsFor;
        });
};
