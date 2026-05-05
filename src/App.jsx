import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Navigation from './components/Navigation';
import Home from './components/Home';
import ExerciseLibrary from './components/ExerciseLibrary';
import CalorieCalculator from './components/CalorieCalculator';
import NutritionTracker from './components/NutritionTracker';
import Progress from './components/Progress';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import AICoach from './components/AICoach';
import WorkoutTracker from './components/WorkoutTracker';
import ProfilePage from './components/ProfilePage';
import SplashScreen from './components/SplashScreen';

const TODAY = new Date().toDateString();

// Splash nur beim ersten Besuch pro Session
const SPLASH_KEY = 'buildup_splash_shown';

export default function App() {
  const [showSplash, setShowSplash]         = useState(() => !sessionStorage.getItem(SPLASH_KEY));
  const [user, setUser]                     = useState(null);
  const [profile, setProfile]               = useState(null);
  const [authLoading, setAuthLoading]       = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [activeSection, setActiveSection]   = useState('home');
  const [navHistory, setNavHistory]         = useState(['home']);
  const [calorieGoal, setCalorieGoal]       = useState(2000);
  const [logHistory, setLogHistory]         = useState({});
  const [showCoach, setShowCoach]           = useState(false);
  const [navHistory, setNavHistory]         = useState(['home']);

  // ── Smart Navigation with History ──
  const navigateTo = (section) => {
    setActiveSection(section);
    setNavHistory(prev => {
      // Don't add duplicate consecutive entries
      if (prev[prev.length - 1] === section) return prev;
      return [...prev, section];
    });
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const navigateBack = () => {
    setNavHistory(prev => {
      if (prev.length <= 1) return prev;
      const newHistory = prev.slice(0, -1);
      const previousSection = newHistory[newHistory.length - 1];
      setActiveSection(previousSection);
      window.scrollTo({ top: 0, behavior: 'instant' });
      return newHistory;
    });
  };

  const handleSplashDone = () => {
    sessionStorage.setItem(SPLASH_KEY, '1');
    setShowSplash(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setProfileLoading(true);
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof ?? null);
      if (prof?.calorie_goal) setCalorieGoal(prof.calorie_goal);
      const { data: logs } = await supabase.from('daily_logs').select('date, log').eq('user_id', user.id);
      if (logs) {
        const history = {};
        logs.forEach(l => { history[l.date] = l.log; });
        setLogHistory(history);
      }
      setProfileLoading(false);
    };
    load();
  }, [user]);

  const handleSetCalorieGoal = async (goal) => {
    setCalorieGoal(goal);
    if (user) await supabase.from('profiles').upsert({ id: user.id, calorie_goal: goal });
  };

  const setDailyLog = async (updater) => {
    setLogHistory(prev => {
      const currentToday = prev[TODAY] || [];
      const newToday = typeof updater === 'function' ? updater(currentToday) : updater;
      const updated = { ...prev, [TODAY]: newToday };
      if (user) {
        supabase.from('daily_logs').upsert(
          { user_id: user.id, date: TODAY, log: newToday },
          { onConflict: 'user_id,date' }
        );
      }
      return updated;
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null);
    setLogHistory({}); setCalorieGoal(2000); setShowCoach(false);
  };

  const handleOnboardingComplete = (goal) => {
    setProfile(prev => ({ ...(prev || {}), goal, onboarding_done: true }));
  };

  const handleUpdateProfile = async (formData) => {
    if (!user) return;
    const { error } = await supabase.from('profiles').upsert({ id: user.id, ...formData });
    if (!error) setProfile(prev => ({ ...prev, ...formData }));
  };

  const dailyLog      = logHistory[TODAY] || [];
  const totalCalories = dailyLog.reduce((s, i) => s + i.calories, 0);

  // ── Splash Screen ──
  if (showSplash) return <SplashScreen onDone={handleSplashDone} />;

  // ── Auth loading ──
  if (authLoading || profileLoading) return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      <div style={{
        width: 72, height: 72,
        borderRadius: 20, overflow: 'hidden',
        animation: 'loadingPulse 1.5s ease infinite',
        boxShadow: '0 0 30px rgba(34,197,94,0.25)',
      }}>
        <img src="/logo-512.png" alt="BuildUp" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ display: 'flex', gap: 5 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 4, height: 4, borderRadius: '50%', background: 'var(--green)',
            animation: `splashDot 1.2s ease ${i * 0.18}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );

  // ── Nicht eingeloggt ──
  if (!user) return <Auth onLogin={setUser} />;

  // ── Onboarding ──
  if (!profile || profile.onboarding_done !== true) {
    return <Onboarding user={user} onComplete={handleOnboardingComplete} />;
  }

  // ── App ──
  return (
    <>
      <Navigation
        activeSection={activeSection}
        setActiveSection={navigateTo}
        navigateBack={navigateBack}
        canGoBack={navHistory.length > 1}
        onGoBack={handleGoBack}
        user={user}
        profile={profile}
        onLogout={handleLogout}
        onOpenCoach={() => setShowCoach(true)}
      />

      {/* Page Transition Wrapper */}
      <div key={activeSection} style={{ animation: 'pageIn 0.25s ease both' }}>
        {activeSection === 'home' && (
          <Home
            setActiveSection={navigateTo}
            calorieGoal={calorieGoal}
            totalCalories={totalCalories}
            dailyLog={dailyLog}
            username={profile?.username}
          />
        )}
        {activeSection === 'nutrition' && (
          <NutritionTracker
            calorieGoal={calorieGoal}
            setCalorieGoal={handleSetCalorieGoal}
            dailyLog={dailyLog}
            setDailyLog={setDailyLog}
          />
        )}
        {activeSection === 'calculator' && (
          <CalorieCalculator onSaveGoal={(g) => { handleSetCalorieGoal(g); handleSetActiveSection('nutrition'); }} />
        )}
        {activeSection === 'exercises' && <ExerciseLibrary user={user} profile={profile} />}
        {activeSection === 'progress' && (
          <Progress calorieGoal={calorieGoal} dailyLog={dailyLog} logHistory={logHistory} user={user} profile={profile} />
        )}
        {activeSection === 'workout' && (
          <WorkoutTracker user={user} profile={profile} />
        )}
        {activeSection === 'profile' && (
          <ProfilePage user={user} profile={profile} onUpdateProfile={handleUpdateProfile} />
        )}
      </div>

      {showCoach && (
        <AICoach
          onClose={() => setShowCoach(false)}
          dailyLog={dailyLog}
          calorieGoal={calorieGoal}
          profile={profile}
        />
      )}
    </>
  );
}
