import { useMatch } from '../context/MatchContext';
import { useAuth } from '../context/AuthContext';
import dynamic from 'next/dynamic';

const ThreeLogo = dynamic(() => import('./ThreeLogo'), { ssr: false });
import ChampionsHistory from './ChampionsHistory';


export default function HomeScreen() {
    const { actions } = useMatch();
    const { isAdmin, logout, user } = useAuth();

    return (
        <div className="home-screen animate-fade-in">
            <ThreeLogo />
            <h1 className="title">PES 6 Tracker</h1>
            <p className="subtitle">Track your matches & stats</p>

            <ChampionsHistory />


            <nav className="home-nav">
                {isAdmin && (
                    <button className="nav-btn" onClick={() => actions.setScreen('newMatch')}>
                        <span className="nav-btn-icon">🎮</span>
                        <div className="nav-btn-text">
                            <div className="nav-btn-title">Start New Match</div>
                            <div className="nav-btn-desc">Begin tracking a new game</div>
                        </div>
                    </button>
                )}

                {isAdmin && (
                    <button className="nav-btn" onClick={() => actions.setScreen('playerManagement')}>
                        <span className="nav-btn-icon">👥</span>
                        <div className="nav-btn-text">
                            <div className="nav-btn-title">Manage Players</div>
                            <div className="nav-btn-desc">Edit names & avatars</div>
                        </div>
                    </button>
                )}



                <button className="nav-btn" onClick={() => actions.setScreen('leagueTable')}>
                    <span className="nav-btn-icon">📋</span>
                    <div className="nav-btn-text">
                        <div className="nav-btn-title">League Table</div>
                        <div className="nav-btn-desc">Current standings</div>
                    </div>

                </button>

                <button className="nav-btn" onClick={() => actions.setScreen('history')}>
                    <span className="nav-btn-icon">📜</span>
                    <div className="nav-btn-text">
                        <div className="nav-btn-title">Match History</div>
                        <div className="nav-btn-desc">View past matches</div>
                    </div>

                </button>

                <button className="nav-btn" onClick={() => actions.setScreen('tournamentList')}>
                    <span className="nav-btn-icon">🏆</span>
                    <div className="nav-btn-text">
                        <div className="nav-btn-title">Tournaments</div>
                        <div className="nav-btn-desc">Custom Leagues & Cups</div>
                    </div>

                </button>

                <button className="nav-btn" onClick={() => actions.setScreen('stats')}>
                    <span className="nav-btn-icon">📊</span>
                    <div className="nav-btn-text">
                        <div className="nav-btn-title">Statistics</div>
                        <div className="nav-btn-desc">Head to Head & Records</div>
                    </div>

                </button>

                <button className="nav-btn" onClick={() => actions.setScreen('whoPlaysNext')}>
                    <span className="nav-btn-icon">🎲</span>
                    <div className="nav-btn-text">
                        <div className="nav-btn-title">Who Plays Next?</div>
                        <div className="nav-btn-desc">Random match picker</div>
                    </div>

                </button>

                <button className="nav-btn" onClick={() => actions.setScreen('achievements')} style={{ position: 'relative' }}>
                    <span className="nav-btn-icon">🏅</span>
                    <div className="nav-btn-text">
                        <div className="nav-btn-title">Achievements</div>
                        <div className="nav-btn-desc">Player badges & milestones</div>
                    </div>
                    {/* NEW Badge */}
                    <span style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: 'linear-gradient(135deg, #9B59B6, #8E44AD)',
                        color: '#fff',
                        fontSize: '0.6rem',
                        fontWeight: 'bold',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        boxShadow: '0 2px 8px rgba(155, 89, 182, 0.4)',
                        animation: 'pulse-badge 2s ease-in-out infinite'
                    }}>
                        ✨ New
                    </span>
                </button>

                <button className="nav-btn" onClick={() => actions.setScreen('news')} style={{ position: 'relative' }}>
                    <span className="nav-btn-icon">📰</span>
                    <div className="nav-btn-text">
                        <div className="nav-btn-title">Weekly News</div>
                        <div className="nav-btn-desc">Match analysis & commentary</div>
                    </div>

                    {/* NEW Badge */}
                    <span style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: 'linear-gradient(135deg, #E74C3C, #C0392B)',
                        color: '#fff',
                        fontSize: '0.6rem',
                        fontWeight: 'bold',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        boxShadow: '0 2px 8px rgba(231, 76, 60, 0.4)',
                        animation: 'pulse-badge 2s ease-in-out infinite'
                    }}>
                        ✨ New
                    </span>
                    <style jsx>{`
                        @keyframes pulse-badge {
                            0%, 100% { transform: scale(1); opacity: 1; }
                            50% { transform: scale(1.1); opacity: 0.9; }
                        }
                    `}</style>
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
