import { useMatch } from '../context/MatchContext';
import { useAuth } from '../context/AuthContext';
import dynamic from 'next/dynamic';

const ThreeLogo = dynamic(() => import('./ThreeLogo'), { ssr: false });
import ChampionsHistory from './ChampionsHistory';
import PlayerAchievements from './PlayerAchievements';

export default function HomeScreen() {
    const { actions } = useMatch();
    const { isAdmin, logout, user } = useAuth();

    return (
        <div className="home-screen animate-fade-in">
            <ThreeLogo />
            <h1 className="title">PES 6 Tracker</h1>
            <p className="subtitle">Track your matches & stats</p>

            <ChampionsHistory />
            <PlayerAchievements />

            <nav className="home-nav">
                {isAdmin && (
                    <button className="nav-btn" onClick={() => actions.setScreen('newMatch')}>
                        <span className="nav-btn-icon">🎮</span>
                        <div className="nav-btn-text">
                            <div className="nav-btn-title">Start New Match</div>
                            <div className="nav-btn-desc">Begin tracking a new game</div>
                        </div>
                        <span>→</span>
                    </button>
                )}

                {isAdmin && (
                    <button className="nav-btn" onClick={() => actions.setScreen('playerManagement')}>
                        <span className="nav-btn-icon">👥</span>
                        <div className="nav-btn-text">
                            <div className="nav-btn-title">Manage Players</div>
                            <div className="nav-btn-desc">Edit names & avatars</div>
                        </div>
                        <span>→</span>
                    </button>
                )}



                <button className="nav-btn" onClick={() => actions.setScreen('leagueTable')}>
                    <span className="nav-btn-icon">📋</span>
                    <div className="nav-btn-text">
                        <div className="nav-btn-title">League Table</div>
                        <div className="nav-btn-desc">Current standings</div>
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

                <button className="nav-btn" onClick={() => actions.setScreen('tournamentList')}>
                    <span className="nav-btn-icon">🏆</span>
                    <div className="nav-btn-text">
                        <div className="nav-btn-title">Tournaments</div>
                        <div className="nav-btn-desc">Custom Leagues & Cups</div>
                    </div>
                    <span>→</span>
                </button>

                <button className="nav-btn" onClick={() => actions.setScreen('stats')}>
                    <span className="nav-btn-icon">📊</span>
                    <div className="nav-btn-text">
                        <div className="nav-btn-title">Statistics</div>
                        <div className="nav-btn-desc">Head to Head & Records</div>
                    </div>
                    <span>→</span>
                </button>


                <button className="nav-btn" onClick={logout} style={{ marginTop: '2rem', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                    <span className="nav-btn-icon">🚪</span>
                    <div className="nav-btn-text">
                        <div className="nav-btn-title" style={{ color: '#64748b' }}>Logout</div>
                        <div className="nav-btn-desc">{user?.username}</div>
                    </div>
                </button>
            </nav>
        </div>
    );
}
