import { useMatch } from '../context/MatchContext';
import PlayerAchievements from './PlayerAchievements';

export default function AchievementsPage() {
    const { actions } = useMatch();

    return (
        <div className="achievements-page animate-fade-in">
            <button className="back-btn" onClick={() => actions.setScreen('home')}>
                ← Back to Home
            </button>

            <PlayerAchievements />
        </div>
    );
}
