import { useState, useEffect } from 'react';
import { Home, Search, User, LogIn } from 'lucide-react';
import { supabase } from './lib/supabase';
import { AppRoute } from './types';
import { HomeScreen } from './components/HomeScreen';
import { SearchScreen } from './components/SearchScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { LoginScreen } from './components/LoginScreen';
import { SignupScreen } from './components/SignupScreen';
import { ChatScreen } from './components/ChatScreen';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('home');
  const [chatTargetUser, setChatTargetUser] = useState<string>('');
  const [sessionUser, setSessionUser] = useState<any>(null);

  // Sync route with URL Hash for granular deep-linking
  useEffect(() => {
    const parseHashRoute = () => {
      const fullHash = window.location.hash.replace('#', '');
      const [routePath, queryString] = fullHash.split('?');
      const cleanRoute = (routePath || 'home').toLowerCase();

      if (queryString) {
        const params = new URLSearchParams(queryString);
        const target = params.get('user');
        if (target) {
          setChatTargetUser(target);
        }
      }

      if (['home', 'search', 'profile', 'login', 'signup', 'chat'].includes(cleanRoute)) {
        setCurrentRoute(cleanRoute as AppRoute);
      } else {
        setCurrentRoute('home');
      }
    };

    parseHashRoute();

    const handleHashChange = () => {
      parseHashRoute();
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Listen to Supabase Auth State changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const navigateTo = (route: string) => {
    window.location.hash = route;
    if (route.includes('?')) {
      const [path, qs] = route.split('?');
      const params = new URLSearchParams(qs);
      const target = params.get('user');
      if (target) setChatTargetUser(target);
      setCurrentRoute(path as AppRoute);
    } else {
      setCurrentRoute(route as AppRoute);
    }
  };

  const isChatRoom = currentRoute === 'chat';

  return (
    <div className="h-screen w-full bg-neutral-950 flex justify-center items-center overflow-hidden font-sans text-neutral-100 selection:bg-neutral-800">
      {/* Strict Native Smartphone Shell (Max 430px, Fixed Height) */}
      <div className="w-full max-w-[430px] h-full max-h-screen bg-black shadow-2xl shadow-black relative flex flex-col border-x border-neutral-900 overflow-hidden">
        
        {/* Pinned Top Header Block (Hidden when in full active chat screen) */}
        {!isChatRoom && (
          <header className="shrink-0 h-14 bg-black/90 backdrop-blur-md border-b border-neutral-800/80 flex items-center justify-between px-4 z-30">
            {/* Typography Logo / Link to Home */}
            <button
              onClick={() => navigateTo('home')}
              className="text-left group cursor-pointer focus:outline-none"
            >
              <h1 className="text-base font-bold tracking-tight text-neutral-100 group-hover:text-white transition-colors">
                Niooon Chat
              </h1>
              <span className="text-[9px] text-neutral-500 block -mt-0.5 font-mono">
                #{currentRoute}
              </span>
            </button>
            
            {/* Utility Slot: Auth Status or Quick Login Link */}
            <div className="flex items-center gap-2">
              {sessionUser ? (
                <button
                  onClick={() => navigateTo('profile')}
                  className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-200 hover:border-neutral-500 transition-colors cursor-pointer"
                  title="প্রোফাইল দেখুন"
                >
                  {sessionUser.user_metadata?.full_name?.[0]?.toUpperCase() || 'U'}
                </button>
              ) : (
                <button
                  onClick={() => navigateTo('login')}
                  className={`py-1 px-2.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentRoute === 'login' || currentRoute === 'signup'
                      ? 'bg-neutral-800 text-white'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>লগইন</span>
                </button>
              )}
            </div>
          </header>
        )}

        {/* Scrollable Core View Container */}
        <main className={`flex-1 bg-[#0a0a0a] overflow-y-auto overflow-x-hidden flex flex-col ${isChatRoom ? 'p-0' : 'p-3.5'}`}>
          {currentRoute === 'home' && <HomeScreen onNavigate={navigateTo} />}
          {currentRoute === 'search' && <SearchScreen onNavigate={navigateTo} />}
          {currentRoute === 'profile' && (
            <ProfileScreen
              onNavigate={navigateTo}
              onLogout={() => navigateTo('login')}
            />
          )}
          {currentRoute === 'login' && (
            <LoginScreen
              onSuccess={() => navigateTo('home')}
              onNavigate={navigateTo}
            />
          )}
          {currentRoute === 'signup' && (
            <SignupScreen
              onSuccess={() => navigateTo('home')}
              onNavigate={navigateTo}
            />
          )}
          {currentRoute === 'chat' && (
            <ChatScreen
              targetUsername={chatTargetUser}
              onNavigate={navigateTo}
            />
          )}
        </main>

        {/* Pinned Bottom Navigation Bar (Hidden in Chat Room for maximum keyboard/typing area) */}
        {!isChatRoom && (
          <nav className="shrink-0 z-30 w-full bg-black/95 backdrop-blur-xl border-t border-neutral-800 flex items-center justify-around px-2 pt-2.5 pb-5">
            <button
              onClick={() => navigateTo('home')}
              className={`flex flex-col items-center justify-center w-16 gap-1 transition-colors cursor-pointer ${
                currentRoute === 'home' ? 'text-neutral-100 font-semibold' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Home className="w-5 h-5" strokeWidth={currentRoute === 'home' ? 2.5 : 1.8} />
              <span className="text-[10px] tracking-wide">Home</span>
            </button>
            
            <button
              onClick={() => navigateTo('search')}
              className={`flex flex-col items-center justify-center w-16 gap-1 transition-colors cursor-pointer ${
                currentRoute === 'search' ? 'text-neutral-100 font-semibold' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Search className="w-5 h-5" strokeWidth={currentRoute === 'search' ? 2.5 : 1.8} />
              <span className="text-[10px] tracking-wide">Search</span>
            </button>

            <button
              onClick={() => navigateTo('profile')}
              className={`flex flex-col items-center justify-center w-16 gap-1 transition-colors cursor-pointer ${
                currentRoute === 'profile' ? 'text-neutral-100 font-semibold' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <User className="w-5 h-5" strokeWidth={currentRoute === 'profile' ? 2.5 : 1.8} />
              <span className="text-[10px] tracking-wide">Profile</span>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
