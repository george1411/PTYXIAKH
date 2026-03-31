import { useState, useEffect } from 'react';
import Navbar from './components/onboarding/Navbar';
import Hero from './components/onboarding/Hero';
import Signup from './components/onboarding/Signup';
import { Check } from 'lucide-react';
import SignIn from './components/SignIn';
import VisualPanel from './components/onboarding/VisualPanel';
import axios from 'axios';
import CustomerDashboard from './components/dashboard/customer/CustomerDashboard';
import TrainerDashboard from './components/dashboard/trainer/TrainerDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState(0);
  const [userData, setUserData] = useState({
    goal: null,
    details: null
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/v1/auth/me', {
          withCredentials: true
        });
        if (response.data.success) {
          setUser(response.data.data.user);
        }
      } catch (error) {
        console.log("User not authenticated");
      }
    };
    checkAuth();
  }, []);

  const handleGoalSelect = (goalId) => {
    setUserData(prev => ({ ...prev, goal: goalId }));
    setScreen(2);
  };

  const handleSignup = (details) => {
    setUserData(prev => ({ ...prev, details }));
    // Navigate to full-screen Sign In (Screen 3)
    setScreen(3);
    console.log('Final Data:', { ...userData, details });
  };

  const handleLoginSuccess = (user) => {
    setUser(user);
    setScreen(3); // Ensure we are on the sign-in screen conceptually, though overridden by user check
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/v1/auth/sign-out');
      setUser(null);
      setScreen(0);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (user) {
    if (user.role === 'personal_trainer') {
      return <TrainerDashboard user={user} onLogout={handleLogout} onUserUpdate={setUser} />;
    }
    return <CustomerDashboard user={user} onLogout={handleLogout} onUserUpdate={setUser} />;
  }

  return (
    <div className="flex flex-col w-full font-sans" style={{ background: '#0a0a0a', color: '#f0f0f0', height: '100vh', overflow: 'hidden' }}>
      <Navbar onLogin={() => setScreen(3)} />
      {/* SPLITS */}
      <div className="flex flex-1 overflow-hidden">
      {/* LEFT SPLIT - Interactive */}
      <div className="w-full lg:w-1/2 relative flex flex-col z-20 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

        <div className="flex-1 flex flex-col">
          {screen === 0 && <Hero onNext={() => setScreen(2)} />}

          {screen === 2 && (
            <Signup
              onSubmit={handleSignup}
              onBack={() => setScreen(0)}
              onLogin={() => setScreen(3)}
              onLoginSuccess={handleLoginSuccess}
            />
          )}

          {screen === 3 && (
            <SignIn
              onBack={() => setScreen(0)}
              onSignUp={() => setScreen(2)}
              onLoginSuccess={handleLoginSuccess}
            />
          )}
        </div>
      </div>

      {/* RIGHT SPLIT - Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10" style={{ background: '#0a0a0a', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: '4%' }}>
        <VisualPanel />
      </div>
      </div>
    </div>
  );
}

export default App;
