import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Onboarding from './pages/Onboarding';
import Recommendations from './pages/Recommendations';
import History from './pages/History';
import Profile from './pages/Profile';
import ModelInfo from './pages/ModelInfo';

export default function App() {
  const [activePage, setActivePage] = useState('onboarding');
  const [userId, setUserId] = useState(() => {
    return localStorage.getItem('algorhythm_user_id') || '';
  });

  useEffect(() => {
    // If user already onboarded, default to recommendations
    if (userId) {
      setActivePage('recommendations');
    }
  }, []);

  const handleOnboardingComplete = (newUserId) => {
    setUserId(newUserId);
    localStorage.setItem('algorhythm_user_id', newUserId);
    setActivePage('recommendations');
  };

  const handleResetUser = () => {
    if (confirm("Reset current demo user session and start onboarding again?")) {
      localStorage.removeItem('algorhythm_user_id');
      const newId = `demo_user_${Math.random().toString(36).substring(2, 8)}`;
      setUserId(newId);
      setActivePage('onboarding');
    }
  };

  return (
    <div className="flex min-h-screen bg-dark-900 text-slate-100 antialiased selection:bg-purple-600 selection:text-white">
      {/* Navigation Sidebar */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        userId={userId}
        onResetUser={handleResetUser}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-h-screen">
        {activePage === 'onboarding' && (
          <Onboarding
            onOnboardingComplete={handleOnboardingComplete}
            userId={userId}
            setUserId={setUserId}
          />
        )}

        {activePage === 'recommendations' && (
          <Recommendations
            userId={userId}
            onNavigateToOnboarding={() => setActivePage('onboarding')}
          />
        )}

        {activePage === 'history' && (
          <History userId={userId} />
        )}

        {activePage === 'profile' && (
          <Profile userId={userId} />
        )}

        {activePage === 'model-info' && (
          <ModelInfo />
        )}
      </main>
    </div>
  );
}
