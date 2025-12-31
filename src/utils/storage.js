// Local Storage utilities for match persistence

const STORAGE_KEY = 'pes6_matches';

// Generate unique ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Get all matches from storage
export const getMatches = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading matches from storage:', error);
    return [];
  }
};

// Save a new match
export const saveMatch = (match) => {
  try {
    const matches = getMatches();
    const newMatch = {
      ...match,
      id: generateId(),
      date: new Date().toISOString(),
    };
    matches.unshift(newMatch); // Add to beginning (most recent first)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
    return newMatch;
  } catch (error) {
    console.error('Error saving match:', error);
    return null;
  }
};

// Delete a match
export const deleteMatch = (matchId) => {
  try {
    const matches = getMatches();
    const filtered = matches.filter(m => m.id !== matchId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting match:', error);
    return false;
  }
};

// Get player statistics
export const getPlayerStats = () => {
  const matches = getMatches();
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

  return stats;
};

// Get overall statistics
export const getOverallStats = () => {
  const matches = getMatches();
  
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

// Get leaderboard (sorted by wins)
export const getLeaderboard = () => {
  const stats = getPlayerStats();
  
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
