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

const TODAY = new Date().toDateString();

export default function App() {
  const [user, setUser]                   = useState(null);
  const [profile, setProfile]             = useState(null);
  const [authLoading, setAuthLoading]     = useState(true);
  const [activeSection, setActiveSection] = useState('home');
  const [calorieGoal, setCalorieGoal]     = useState(2000);
  const [logHistory, setLogHistory]       = useState({});
  const [showCoach, setShowCoach]         = useState(false);

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
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);
      if (prof?.calorie_goal) setCalorieGoal(prof.calorie_goal);

      const { data: logs } = await supabase.from('daily_logs').select('date, log').eq('user_id', user.id);
      if (logs) {
        const history = {};
        logs.forEach(l => { history[l.date] = l.log; });
        setLogHistory(history);
      }
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
    setLogHistory({}); setCalorieGoal(2000);
    setShowCoach(false);
  };

  const handleOnboardingComplete = (goal) => {
    setProfile(prev => ({ ...prev, goal, onboarding_done: true }));
  };

  const dailyLog = logHistory[TODAY] || [];
  const totalCalories = dailyLog.reduce((s, i) => s + i.calories, 0);

  if (authLoading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--green)', fontSize: 16, fontWeight: 600 }}>Laden...</div>
    </div>
  );

  if (!user) return <Auth onLogin={setUser} />;

  if (profile && !profile.onboarding_done) {
    return <Onboarding user={user} onComplete={handleOnboardingComplete} />;
  }

  return (
    <>
      <Navigation
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        user={user}
        profile={profile}
        onLogout={handleLogout}
        onOpenCoach={() => setShowCoach(true)}
      />
      {activeSection === 'home' && (
        <Home
          setActiveSection={setActiveSection}
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
        <CalorieCalculator onSaveGoal={(g) => { handleSetCalorieGoal(g); setActiveSection('nutrition'); }} />
      )}
      {activeSection === 'exercises' && <ExerciseLibrary />}
      {activeSection === 'progress' && (
        <Progress calorieGoal={calorieGoal} dailyLog={dailyLog} logHistory={logHistory} />
      )}

      {activeSection === 'workout' && (
  <WorkoutTracker user={user} profile={profile} />
)}

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