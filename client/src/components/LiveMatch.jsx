import { useEffect, useState } from 'react';
import { useMatch } from '../context/MatchContext';

export default function LiveMatch() {
    const { state, actions } = useMatch();
    const { currentMatch } = state;
    const [animateA, setAnimateA] = useState(false);
    const [animateB, setAnimateB] = useState(false);


    const handleGoal = (player) => {
        actions.addGoal(player);
        if (player === 'A') {
            setAnimateA(true);
            setTimeout(() => setAnimateA(false), 300);
        } else {
            setAnimateB(true);
            setTimeout(() => setAnimateB(false), 300);
        }
    };

    if (!currentMatch) return null;

    return (
        <div className="live-match-screen animate-fade-in">

            <div className="score-display">
                <div className="score-container">
                    <div className="player-score">
                        <div className="player-name">{currentMatch.playerA}</div>
                        <div className={`score-value ${animateA ? 'animate' : ''}`}>
                            {currentMatch.scoreA}
                        </div>
                    </div>

                    <div className="score-separator">—</div>

                    <div className="player-score">
                        <div className="player-name">{currentMatch.playerB}</div>
                        <div className={`score-value ${animateB ? 'animate' : ''}`}>
                            {currentMatch.scoreB}
                        </div>
                    </div>
                </div>
            </div>

            <div className="goal-buttons">
                <div className="goal-btn-container">
                    <button
                        className="btn btn-success btn-icon btn-lg"
                        onClick={() => handleGoal('A')}
                        aria-label={`Goal for ${currentMatch.playerA}`}
                    >
                        +
                    </button>
                    <span className="goal-btn-label">Goal {currentMatch.playerA.slice(0, 8)}</span>
                </div>

                <div className="goal-btn-container">
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={actions.undoGoal}
                        disabled={currentMatch.goalEvents.length === 0}
                        aria-label="Undo last goal"
                    >
                        ↩
                    </button>
                    <span className="goal-btn-label">Undo</span>
                </div>

                <div className="goal-btn-container">
                    <button
                        className="btn btn-success btn-icon btn-lg"
                        onClick={() => handleGoal('B')}
                        aria-label={`Goal for ${currentMatch.playerB}`}
                    >
                        +
                    </button>
                    <span className="goal-btn-label">Goal {currentMatch.playerB.slice(0, 8)}</span>
                </div>
            </div>




            <div className="match-actions">
                <button
                    className="btn btn-secondary btn-lg btn-block"
                    onClick={actions.endMatch}
                >
                    🏁 End Match
                </button>
            </div>
        </div>
    );
}
