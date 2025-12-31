import { useMatch } from '../context/MatchContext';

export default function HomeScreen() {
    const { actions } = useMatch();

    return (
        <div className="home-screen animate-fade-in">
            <div className="home-logo">⚽</div>
            <h1 className="title">PES 6 Tracker</h1>
            <p className="subtitle">Track your matches & stats</p>

            <nav className="home-nav">
                <button className="nav-btn" onClick={() => actions.setScreen('newMatch')}>
                    <span className="nav-btn-icon">🎮</span>
                    <div className="nav-btn-text">
                        <div className="nav-btn-title">Start New Match</div>
                        <div className="nav-btn-desc">Begin tracking a new game</div>
                    </div>
                    <span>→</span>
                </button>

                <button className="nav-btn" onClick={() => actions.setScreen('history')}>
                    <span className="nav-btn-icon">📜</span>
                    <div className="nav-btn-text">
                        <div className="nav-btn-title">Match History</div>
                        <div className="nav-btn-desc">View past matches</div>
                    </div>
                    <span>→</span>
                </button>

                <button className="nav-btn" onClick={() => actions.setScreen('stats')}>
                    <span className="nav-btn-icon">📊</span>
                    <div className="nav-btn-text">
                        <div className="nav-btn-title">Statistics</div>
                        <div className="nav-btn-desc">Player rankings & records</div>
                    </div>
                    <span>→</span>
                </button>
            </nav>
        </div>
    );
}
