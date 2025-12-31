import './App.css';
import { MatchProvider, useMatch } from './context/MatchContext';
import HomeScreen from './components/HomeScreen';
import NewMatch from './components/NewMatch';
import LiveMatch from './components/LiveMatch';
import MatchEnd from './components/MatchEnd';
import MatchHistory from './components/MatchHistory';
import Statistics from './components/Statistics';

function AppContent() {
  const { state } = useMatch();

  const renderScreen = () => {
    switch (state.screen) {
      case 'home':
        return <HomeScreen />;
      case 'newMatch':
        return <NewMatch />;
      case 'liveMatch':
        return <LiveMatch />;
      case 'matchEnd':
        return <MatchEnd />;
      case 'history':
        return <MatchHistory />;
      case 'stats':
        return <Statistics />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="app">
      <div className="container">
        {renderScreen()}
      </div>
    </div>
  );
}

function App() {
  return (
    <MatchProvider>
      <AppContent />
    </MatchProvider>
  );
}

export default App;
