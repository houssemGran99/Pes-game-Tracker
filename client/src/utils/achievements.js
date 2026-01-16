// Achievement definitions with icons, names, and descriptions
export const ACHIEVEMENTS = {
    CENTURY_CLUB: {
        id: 'century_club',
        icon: '🏆',
        name: 'Century Club',
        description: '100 wins',
        rarity: 'legendary',
        color: '#FFD700'
    },
    ON_FIRE: {
        id: 'on_fire',
        icon: '⚡',
        name: 'On Fire',
        description: '5 wins in a row',
        rarity: 'epic',
        color: '#FF6B35'
    },
    THE_WALL: {
        id: 'the_wall',
        icon: '🧱',
        name: 'The Wall',
        description: '5 clean sheets in a row',
        rarity: 'epic',
        color: '#4A90D9'
    },
    COMEBACK_KING: {
        id: 'comeback_king',
        icon: '🎭',
        name: 'Comeback King',
        description: 'Won after being 2+ goals down',
        rarity: 'rare',
        color: '#9B59B6'
    },
    DESTROYER: {
        id: 'destroyer',
        icon: '💀',
        name: 'Destroyer',
        description: 'Won by 5+ goals',
        rarity: 'rare',
        color: '#E74C3C'
    },
    DRAW_SPECIALIST: {
        id: 'draw_specialist',
        icon: '🤝',
        name: 'Draw Specialist',
        description: '10 draws',
        rarity: 'common',
        color: '#95A5A6'
    },
    // Additional achievements for more variety
    FIRST_WIN: {
        id: 'first_win',
        icon: '🌟',
        name: 'First Victory',
        description: 'Won your first match',
        rarity: 'common',
        color: '#3498DB'
    },
    TEN_WINS: {
        id: 'ten_wins',
        icon: '🔟',
        name: 'Double Digits',
        description: '10 wins',
        rarity: 'common',
        color: '#27AE60'
    },
    FIFTY_WINS: {
        id: 'fifty_wins',
        icon: '🎖️',
        name: 'Veteran',
        description: '50 wins',
        rarity: 'epic',
        color: '#8E44AD'
    },
    GOAL_MACHINE: {
        id: 'goal_machine',
        icon: '⚽',
        name: 'Goal Machine',
        description: 'Scored 100+ goals',
        rarity: 'epic',
        color: '#2ECC71'
    },
    CLEAN_SHEET_MASTER: {
        id: 'clean_sheet_master',
        icon: '🛡️',
        name: 'Clean Sheet Master',
        description: '10 clean sheets',
        rarity: 'rare',
        color: '#1ABC9C'
    },
    UNBEATABLE: {
        id: 'unbeatable',
        icon: '👑',
        name: 'Unbeatable',
        description: '10 wins in a row',
        rarity: 'legendary',
        color: '#F39C12'
    }
};

// Calculate player achievements based on their match history
export const calculatePlayerAchievements = (matches, playerName) => {
    const achievements = [];

    // Filter matches for this player
    const playerMatches = matches.filter(
        m => m.playerA === playerName || m.playerB === playerName
    ).sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date ascending

    if (playerMatches.length === 0) return achievements;

    // Calculate stats
    let totalWins = 0;
    let totalDraws = 0;
    let totalGoalsFor = 0;
    let totalCleanSheets = 0;
    let currentWinStreak = 0;
    let maxWinStreak = 0;
    let currentCleanSheetStreak = 0;
    let maxCleanSheetStreak = 0;
    let hasComeback = false;
    let hasDestroyer = false;

    playerMatches.forEach(match => {
        const isPlayerA = match.playerA === playerName;
        const playerScore = isPlayerA ? match.scoreA : match.scoreB;
        const opponentScore = isPlayerA ? match.scoreB : match.scoreA;

        totalGoalsFor += playerScore;

        // Check win/draw/loss
        if (playerScore > opponentScore) {
            // Win
            totalWins++;
            currentWinStreak++;
            maxWinStreak = Math.max(maxWinStreak, currentWinStreak);

            // Check clean sheet
            if (opponentScore === 0) {
                totalCleanSheets++;
                currentCleanSheetStreak++;
                maxCleanSheetStreak = Math.max(maxCleanSheetStreak, currentCleanSheetStreak);
            } else {
                currentCleanSheetStreak = 0;
            }

            // Check destroyer (won by 5+ goals)
            if (playerScore - opponentScore >= 5) {
                hasDestroyer = true;
            }

            // Note: Comeback detection would require goal-by-goal data
            // For now, we'll check if they won despite opponent having 2+ goals
            // This is a simplified version
        } else if (playerScore === opponentScore) {
            // Draw
            totalDraws++;
            currentWinStreak = 0;
            currentCleanSheetStreak = 0;
        } else {
            // Loss
            currentWinStreak = 0;
            currentCleanSheetStreak = 0;
        }
    });

    // Award achievements based on stats

    // First Win
    if (totalWins >= 1) {
        achievements.push({ ...ACHIEVEMENTS.FIRST_WIN, earnedAt: 'Unlocked' });
    }

    // 10 Wins
    if (totalWins >= 10) {
        achievements.push({ ...ACHIEVEMENTS.TEN_WINS, earnedAt: 'Unlocked' });
    }

    // 50 Wins
    if (totalWins >= 50) {
        achievements.push({ ...ACHIEVEMENTS.FIFTY_WINS, earnedAt: 'Unlocked' });
    }

    // Century Club (100 wins)
    if (totalWins >= 100) {
        achievements.push({ ...ACHIEVEMENTS.CENTURY_CLUB, earnedAt: 'Unlocked' });
    }

    // On Fire (5 wins in a row)
    if (maxWinStreak >= 5) {
        achievements.push({ ...ACHIEVEMENTS.ON_FIRE, earnedAt: `Best streak: ${maxWinStreak}` });
    }

    // Unbeatable (10 wins in a row)
    if (maxWinStreak >= 10) {
        achievements.push({ ...ACHIEVEMENTS.UNBEATABLE, earnedAt: `Best streak: ${maxWinStreak}` });
    }

    // The Wall (5 clean sheets in a row)
    if (maxCleanSheetStreak >= 5) {
        achievements.push({ ...ACHIEVEMENTS.THE_WALL, earnedAt: `Best streak: ${maxCleanSheetStreak}` });
    }

    // Clean Sheet Master (10 clean sheets total)
    if (totalCleanSheets >= 10) {
        achievements.push({ ...ACHIEVEMENTS.CLEAN_SHEET_MASTER, earnedAt: `Total: ${totalCleanSheets}` });
    }

    // Draw Specialist (10 draws)
    if (totalDraws >= 10) {
        achievements.push({ ...ACHIEVEMENTS.DRAW_SPECIALIST, earnedAt: `Total: ${totalDraws}` });
    }

    // Destroyer (won by 5+ goals)
    if (hasDestroyer) {
        achievements.push({ ...ACHIEVEMENTS.DESTROYER, earnedAt: 'Unlocked' });
    }

    // Goal Machine (100+ goals)
    if (totalGoalsFor >= 100) {
        achievements.push({ ...ACHIEVEMENTS.GOAL_MACHINE, earnedAt: `Total: ${totalGoalsFor}` });
    }

    // Sort by rarity (legendary first)
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
    achievements.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);

    return achievements;
};

// Get all achievements for all players
export const calculateAllPlayersAchievements = (matches, players) => {
    const result = {};

    players.forEach(player => {
        result[player.name] = calculatePlayerAchievements(matches, player.name);
    });

    return result;
};

// Get rarity background gradient
export const getRarityGradient = (rarity) => {
    switch (rarity) {
        case 'legendary':
            return 'linear-gradient(135deg, #FFD700 0%, #FF8C00 50%, #FFD700 100%)';
        case 'epic':
            return 'linear-gradient(135deg, #9B59B6 0%, #8E44AD 50%, #9B59B6 100%)';
        case 'rare':
            return 'linear-gradient(135deg, #3498DB 0%, #2980B9 50%, #3498DB 100%)';
        case 'common':
            return 'linear-gradient(135deg, #95A5A6 0%, #7F8C8D 50%, #95A5A6 100%)';
        default:
            return 'linear-gradient(135deg, #666 0%, #444 100%)';
    }
};

// Get total achievement count for a player
export const getAchievementCount = (matches, playerName) => {
    return calculatePlayerAchievements(matches, playerName).length;
};
