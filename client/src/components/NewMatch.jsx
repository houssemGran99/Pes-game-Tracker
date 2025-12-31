import { useState } from 'react';
import { useMatch } from '../context/MatchContext';
import PlayerSelect from './PlayerSelect';

export default function NewMatch() {
    const { state, actions } = useMatch();
    const [playerA, setPlayerA] = useState('');
    const [playerB, setPlayerB] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (playerA.trim() && playerB.trim()) {
            actions.startMatch({
                playerA: playerA.trim(),
                playerB: playerB.trim(),
            });
        }
    };

    const handleAddPlayer = (name) => {
        actions.addPlayer(name);
    };

    const isValid = playerA.trim() && playerB.trim() && playerA !== playerB;

    return (
        <div className="new-match-screen container animate-fade-in">
            <button className="back-btn" onClick={() => actions.setScreen('home')}>
                ← Back to Home
            </button>

            <h2 className="section-title">New Match</h2>

            <form onSubmit={handleSubmit}>
                <div className="card">
                    <PlayerSelect
                        label="Home Team (Player A)"
                        value={playerA}
                        onChange={setPlayerA}
                        players={state.players}
                        onAddPlayer={handleAddPlayer}
                    />

                    <div className="vs-divider">
                        <div className="vs-line"></div>
                        <span className="vs-text">VS</span>
                        <div className="vs-line"></div>
                    </div>

                    <PlayerSelect
                        label="Away Team (Player B)"
                        value={playerB}
                        onChange={setPlayerB}
                        players={state.players.filter(p => p !== playerA)} // Optional: Filter out selected P1
                        onAddPlayer={handleAddPlayer}
                    />
                </div>

                <button
                    type="submit"
                    className={`btn btn-primary btn-lg btn-block mt-auto`}
                    style={{ marginTop: '2rem' }}
                    disabled={!isValid}
                >
                    🎮 Start Match
                </button>
            </form>
        </div>
    );
}
