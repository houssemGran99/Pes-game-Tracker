'use client';

import { useMatch } from './context/MatchContext';
import { useAuth } from './context/AuthContext';
import HomeScreen from './components/HomeScreen';
import LoginScreen from './components/LoginScreen';
import NewMatch from './components/NewMatch';
import LiveMatch from './components/LiveMatch';
import MatchEnd from './components/MatchEnd';
import MatchHistory from './components/MatchHistory';
import Statistics from './components/Statistics';
import LeagueTable from './components/LeagueTable';

function MainApp() {
  const { state } = useMatch();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

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
      case 'leagueTable':
        return <LeagueTable />;
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

export default MainApp;
