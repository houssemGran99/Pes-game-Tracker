import { useMatch } from '../context/MatchContext';
import RandomMatchGenerator from './RandomMatchGenerator';

export default function WhoPlaysNext() {
    const { actions } = useMatch();

    return (
        <div className="who-plays-next-page animate-fade-in">
            <button className="back-btn" onClick={() => actions.setScreen('home')}>
                ← Back to Home
            </button>

            <RandomMatchGenerator />
        </div>
    );
}
