'use client';
import { useState, useEffect } from 'react';

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
import TournamentList from './components/TournamentList';
import TournamentDetail from './components/TournamentDetail';
import PlayerManagement from './components/PlayerManagement';
import VoiceMatchInput from './components/VoiceMatchInput';
import NewsSection from './components/NewsSection';
import WhoPlaysNext from './components/WhoPlaysNext';
import AchievementsPage from './components/AchievementsPage';

function MainApp() {
  const { state } = useMatch();
  const { user, loading } = useAuth();
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);

  useEffect(() => {
    const handleLoading = (e) => setIsGlobalLoading(e.detail);
    window.addEventListener('api-loading', handleLoading);
    return () => window.removeEventListener('api-loading', handleLoading);
  }, []);

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
      case 'tournamentList':
        return <TournamentList />;
      case 'tournamentDetail':
        return <TournamentDetail />;
      case 'playerManagement':
        return <PlayerManagement />;
      case 'news':
        return <NewsSection />;
      case 'whoPlaysNext':
        return <WhoPlaysNext />;
      case 'achievements':
        return <AchievementsPage />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="app">
      {isGlobalLoading && (
        <div className="loading-overlay">
          <div className="loading-wrapper">
            <div className="ball-bouncer">
              <div className="loading-ball"></div>
            </div>
            <div className="loading-shadow"></div>
          </div>
        </div>
      )}
      <div className="container">
        {renderScreen()}
      </div>
      <VoiceMatchInput />
    </div>
  );
}

export default MainApp;
