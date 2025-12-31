import { useMatch } from '../context/MatchContext';
import { submitMatch } from '../utils/api';

export default function MatchEnd() {
    const { state, actions } = useMatch();
    const { currentMatch } = state;

    if (!currentMatch) return null;

    const { playerA, playerB, scoreA, scoreB, matchType } = currentMatch;

    // Determine result
    let resultText = '';
    let resultClass = '';
    if (scoreA > scoreB) {
        resultText = `${playerA} Wins!`;
        resultClass = '';
    } else if (scoreB > scoreA) {
        resultText = `${playerB} Wins!`;
        resultClass = '';
    } else {
        resultText = 'Draw!';
        resultClass = 'draw';
    }

    const handleSave = async () => {
        try {
            await submitMatch({
                playerA,
                playerB,
                scoreA,
                scoreB,
                matchType,
                goalEvents: currentMatch.goalEvents,
            });
            actions.resetMatch();
        } catch (error) {
            console.error('Failed to save match:', error);
            alert('Failed to save match. Please try again.');
        }
    };

    const handleDiscard = () => {
        if (confirm('Are you sure you want to discard this match?')) {
            actions.resetMatch();
        }
    };

    return (
        <div className="match-end-screen animate-fade-in">
            <div className="result-card card">
                <div className={`winner-badge ${resultClass}`}>{resultText}</div>

                <div className="final-score">
                    {scoreA} — {scoreB}
                </div>

                <div className="final-players">
                    {playerA} vs {playerB}
                </div>

                <span className="match-type-badge">{matchType}</span>

                <div className="end-actions">
                    <button
                        className="btn btn-success btn-lg btn-block"
                        onClick={handleSave}
                    >
                        ✓ Save Match
                    </button>
                    <button
                        className="btn btn-ghost btn-block"
                        onClick={handleDiscard}
                    >
                        ✕ Discard
                    </button>
                </div>
            </div>
        </div>
    );
}
