export function generateBracket(participants) {
    let bracketParticipants = [...participants].sort(() => 0.5 - Math.random());
    const count = bracketParticipants.length;

    // Find next power of 2
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(count)));
    const byesNeeded = nextPowerOf2 - count;

    // Add BYEs
    for (let i = 0; i < byesNeeded; i++) {
        bracketParticipants.push('BYE');
    }

    const totalSlots = bracketParticipants.length;
    const rounds = [];
    let matchIdCounter = 1;

    // Round 1
    const round1 = {
        name: getRoundName(totalSlots, 1),
        matches: []
    };

    for (let i = 0; i < totalSlots; i += 2) {
        const pA = bracketParticipants[i];
        const pB = bracketParticipants[i + 1];

        let winner = null;
        if (pA === 'BYE' && pB !== 'BYE') winner = pB;
        else if (pB === 'BYE' && pA !== 'BYE') winner = pA;
        else if (pA === 'BYE' && pB === 'BYE') winner = 'BYE';

        round1.matches.push({
            id: matchIdCounter++,
            playerA: pA,
            playerB: pB,
            scoreA: winner ? (winner === pA ? 1 : 0) : null,
            scoreB: winner ? (winner === pB ? 1 : 0) : null,
            winner: winner,
            nextMatchId: null
        });
    }
    rounds.push(round1);

    // Subsequent Rounds
    let currentMatchCount = totalSlots / 2;
    let roundIndex = 2;

    while (currentMatchCount > 1) {
        currentMatchCount /= 2;
        const round = {
            name: getRoundName(totalSlots, roundIndex),
            matches: []
        };

        for (let i = 0; i < currentMatchCount; i++) {
            round.matches.push({
                id: matchIdCounter++,
                playerA: null,
                playerB: null,
                scoreA: null,
                scoreB: null,
                winner: null
            });
        }
        rounds.push(round);
        roundIndex++;
    }

    // Link matches
    for (let r = 0; r < rounds.length - 1; r++) {
        const currentRound = rounds[r];
        const nextRound = rounds[r + 1];

        currentRound.matches.forEach((match, index) => {
            const nextMatchIndex = Math.floor(index / 2);
            const nextMatch = nextRound.matches[nextMatchIndex];

            match.nextMatchId = nextMatch.id;
            match.nextMatchSlot = (index % 2 === 0) ? 'playerA' : 'playerB';

            // Propagate BYE winners
            if (match.winner) {
                nextMatch[match.nextMatchSlot] = match.winner;
            }
        });
    }

    return rounds;
}

function getRoundName(totalParticipants, roundNumber) {
    const totalRounds = Math.log2(totalParticipants);
    const roundsRemaining = totalRounds - roundNumber + 1;

    if (roundsRemaining === 1) return "Final";
    if (roundsRemaining === 2) return "Semi Finals";
    if (roundsRemaining === 3) return "Quarter Finals";
    if (roundsRemaining === 4) return "Round of 16";
    return `Round ${roundNumber}`;
}
