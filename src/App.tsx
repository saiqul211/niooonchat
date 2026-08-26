import { useState, useEffect } from 'react';
import { Home, Search, User, WifiOff, RefreshCw, Sparkles } from 'lucide-react';
import { supabase } from './lib/supabase';
import { AppRoute } from './types';
import { WelcomeScreen } from './components/WelcomeScreen';
import { HomeScreen } from './components/HomeScreen';
import { SearchScreen } from './components/SearchScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { LoginScreen } from './components/LoginScreen';
import { SignupScreen } from './components/SignupScreen';
import { ChatScreen } from './components/ChatScreen';
import { DesktopSidebar } from './components/DesktopSidebar';
import { DesktopEmptyChat } from './components/DesktopEmptyChat';
import { initNativeFeatures, registerBackHandler, triggerHaptic, getNetworkStatus } from './lib/native';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('welcome');
  const [chatTargetUser, setChatTargetUser] = useState<string>('');
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isCheckingOnline, setIsCheckingOnline] = useState<boolean>(false);
  const [exitToast, setExitToast] = useState<boolean>(false);

  // Initialize Native Features (Capacitor Status Bar, Splash Screen, Safe Handling)
  useEffect(() => {
    initNativeFeatures();

    // Check Network initial status
    getNetworkStatus().then(status => setIsOnline(status));

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch profile when session changes
  useEffect(() => {
    if (sessionUser) {
      supabase
        .from('profiles')
        .select('full_name, username, avatar_url')
        .eq('id', sessionUser.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setUserProfile(data);
        });
    } else {
      setUserProfile(null);
    }
  }, [sessionUser]);

  // Hardware Back Button listener
  useEffect(() => {
    let lastBackPressTime = 0;

    const cleanupBack = registerBackHandler(() => {
      if (currentRoute === 'login' || currentRoute === 'signup') {
        navigateTo('welcome');
        return true;
      } else if (currentRoute !== 'home' && currentRoute !== 'welcome') {
        navigateTo(sessionUser ? 'home' : 'welcome');
        return true;
      } else {
        const currentTime = new Date().getTime();
        if (currentTime - lastBackPressTime < 2000) {
          return false; // Exit app
        } else {
          lastBackPressTime = currentTime;
          setExitToast(true);
          setTimeout(() => setExitToast(false), 2000);
          triggerHaptic('light');
          return true;
        }
      }
    });

    return cleanupBack;
  }, [currentRoute, sessionUser]);

  // Sync route with URL Hash for granular deep-linking
  useEffect(() => {
    const parseHashRoute = () => {
      const fullHash = window.location.hash.replace('#', '');
      const [routePath, queryString] = fullHash.split('?');
      const cleanRoute = routePath ? routePath.toLowerCase() : '';

      if (queryString) {
        const params = new URLSearchParams(queryString);
        const target = params.get('user');
        if (target) {
          setChatTargetUser(target);
        }
      }

      if (['welcome', 'home', 'search', 'profile', 'login', 'signup', 'chat'].includes(cleanRoute)) {
        setCurrentRoute(cleanRoute as AppRoute);
      } else {
        // Default initial screen for new or unauthenticated users
        setCurrentRoute(sessionUser ? 'home' : 'welcome');
      }
    };

    parseHashRoute();

    const handleHashChange = () => {
      parseHashRoute();
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [sessionUser]);

  // Listen to Supabase Auth State changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user || null;
      setSessionUser(user);
      // If user is already logged in and currently on welcome/login/signup, redirect to home
      const currentHash = window.location.hash.replace('#', '').split('?')[0].toLowerCase();
      if (user && (currentHash === 'welcome' || currentHash === 'login' || currentHash === 'signup' || !currentHash)) {
        navigateTo('home');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user || null;
      setSessionUser(user);
      if (user) {
        // Auto navigate to home if in auth screens
        setCurrentRoute((prev) => {
          if (prev === 'welcome' || prev === 'login' || prev === 'signup') {
            window.location.hash = 'home';
            return 'home';
          }
          return prev;
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const navigateTo = (route: string) => {
    triggerHaptic('selection');
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

  const handleRetryConnection = async () => {
    setIsCheckingOnline(true);
    triggerHaptic('medium');
    const online = await getNetworkStatus();
    setIsOnline(online);
    setIsCheckingOnline(false);
  };

  const isAuthScreen = currentRoute === 'welcome' || currentRoute === 'login' || currentRoute === 'signup';
  const isChatRoom = currentRoute === 'chat';
  const showAppHeader = !isAuthScreen && !isChatRoom;
  const showBottomNav = !isAuthScreen && !isChatRoom;

  // Offline Screen View
  if (!isOnline) {
    return (
      <div className="fixed inset-0 w-full h-full bg-black flex flex-col justify-center items-center p-6 text-center animate-fadeIn safe-top safe-bottom">
        <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4 text-neutral-400">
          <WifiOff className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-neutral-100 mb-1.5">No Internet Connection</h2>
        <p className="text-xs text-neutral-400 max-w-xs mb-6">
          Please check your mobile data or Wi-Fi network and try again.
        </p>
        <button
          onClick={handleRetryConnection}
          disabled={isCheckingOnline}
          className="py-3 px-6 bg-neutral-100 hover:bg-white text-black font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isCheckingOnline ? 'animate-spin' : ''}`} />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  // Auth Screens Rendering (Welcome, Login, Signup) - Centered Frame on Desktop
  if (isAuthScreen) {
    return (
      <div className="fixed inset-0 w-full h-full bg-black flex items-center justify-center overflow-hidden font-sans text-neutral-100 p-0 md:p-6 lg:p-10 selection:bg-neutral-800">
        <div className="w-full h-full md:max-w-md lg:max-w-lg md:h-auto md:max-h-[92vh] bg-black md:bg-neutral-950 md:border md:border-neutral-800/80 md:rounded-3xl relative flex flex-col overflow-hidden shadow-2xl shadow-black/80">
          {currentRoute === 'welcome' && (
            <WelcomeScreen
              onNavigate={navigateTo}
              sessionUser={sessionUser}
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
        </div>
      </div>
    );
  }

  // Main Authenticated Application (Desktop, Tablet, Mobile responsive layout)
  return (
    <div className="fixed inset-0 w-full h-full bg-black flex overflow-hidden font-sans text-neutral-100 selection:bg-neutral-800">
      {/* Desktop & Tablet Sidebar (Hidden on Mobile screens < md) */}
      <div className="hidden md:flex h-full shrink-0">
        <DesktopSidebar
          currentRoute={currentRoute}
          onNavigate={navigateTo}
          sessionUser={sessionUser}
          userProfile={userProfile}
          isOnline={isOnline}
          onLogout={async () => {
            await supabase.auth.signOut();
            navigateTo('welcome');
          }}
        />
      </div>

      {/* Main Workspace Column */}
      <div className="flex-1 h-full min-w-0 flex flex-col bg-black overflow-hidden relative">
        {/* Mobile Header (Hidden on md: and above) */}
        {showAppHeader && (
          <header className="md:hidden shrink-0 bg-black/95 backdrop-blur-md border-b border-neutral-800/80 flex flex-col z-30 safe-top">
            <div className="h-13 flex items-center justify-between px-4 w-full">
              <div className="flex items-center gap-2">
                <div className="w-6.5 h-6.5 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white">
                  <Sparkles className="w-3.5 h-3.5 text-neutral-300" />
                </div>
                <div>
                  <h1 className="text-sm font-bold tracking-tight text-neutral-100 leading-tight">
                    Niooon Chat
                  </h1>
                  <span className="text-[9px] text-neutral-500 block font-mono capitalize">
                    {currentRoute}
                  </span>
                </div>
              </div>
              
              {sessionUser && (
                <button
                  onClick={() => navigateTo('profile')}
                  className="w-7.5 h-7.5 rounded-full bg-neutral-800 border border-neutral-700/80 flex items-center justify-center text-xs font-bold text-neutral-200 hover:border-neutral-500 transition-colors cursor-pointer"
                  title="View Profile"
                >
                  {sessionUser.user_metadata?.full_name?.[0]?.toUpperCase() || 'U'}
                </button>
              )}
            </div>
          </header>
        )}

        {/* Dynamic Workspace Panes */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Master-Detail Split on Desktop (lg:), Single-Screen on Mobile & Tablet */}
          {currentRoute === 'home' || currentRoute === 'chat' ? (
            <div className="flex-1 h-full flex overflow-hidden">
              {/* Conversation List Pane (Visible on lg: always, on mobile/tablet only if route is 'home') */}
              <div
                className={`h-full flex-col bg-neutral-950/40 p-3 md:p-4 overflow-y-auto ${
                  currentRoute === 'chat'
                    ? 'hidden lg:flex lg:w-80 xl:w-96 border-r border-neutral-800/80 shrink-0'
                    : 'flex flex-1 lg:w-80 xl:w-96 lg:flex-none border-r border-neutral-800/80 shrink-0'
                }`}
              >
                <HomeScreen
                  onNavigate={navigateTo}
                  activeUsername={currentRoute === 'chat' ? chatTargetUser : undefined}
                />
              </div>

              {/* Chat View Pane (Visible on lg: always, on mobile/tablet only if route is 'chat') */}
              <div
                className={`h-full flex-col flex-1 bg-black overflow-hidden ${
                  currentRoute === 'chat' ? 'flex' : 'hidden lg:flex'
                }`}
              >
                {currentRoute === 'chat' && chatTargetUser ? (
                  <ChatScreen
                    targetUsername={chatTargetUser}
                    onNavigate={navigateTo}
                    isEmbedded={true}
                  />
                ) : (
                  <DesktopEmptyChat
                    onNavigate={navigateTo}
                    onDirectChat={(uname) => navigateTo(`chat?user=${uname}`)}
                  />
                )}
              </div>
            </div>
          ) : currentRoute === 'search' ? (
            <main className="flex-1 min-h-0 bg-[#0a0a0a] overflow-y-auto p-4 md:p-6 lg:p-8">
              <SearchScreen onNavigate={navigateTo} />
            </main>
          ) : currentRoute === 'profile' ? (
            <main className="flex-1 min-h-0 bg-[#0a0a0a] overflow-y-auto p-4 md:p-6 lg:p-8">
              <ProfileScreen
                onNavigate={navigateTo}
                onLogout={async () => {
                  await supabase.auth.signOut();
                  navigateTo('welcome');
                }}
              />
            </main>
          ) : null}
        </div>

        {/* Mobile Bottom Navigation Bar (Hidden on md: and above) */}
        {showBottomNav && (
          <nav className="md:hidden shrink-0 z-30 w-full bg-black/95 backdrop-blur-xl border-t border-neutral-800 flex flex-col safe-bottom">
            <div className="flex items-center justify-around px-4 pt-2.5 pb-2.5 w-full">
              <button
                onClick={() => navigateTo('home')}
                className={`flex flex-col items-center justify-center w-16 gap-1 transition-colors cursor-pointer ${
                  currentRoute === 'home' || currentRoute === 'chat' ? 'text-neutral-100 font-semibold' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <Home className="w-5 h-5" strokeWidth={currentRoute === 'home' || currentRoute === 'chat' ? 2.5 : 1.8} />
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
            </div>
          </nav>
        )}

        {/* Hardware Back Exit Toast */}
        {exitToast && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-neutral-800/90 backdrop-blur-md border border-neutral-700 text-neutral-200 text-xs px-3.5 py-1.5 rounded-full shadow-lg z-50 animate-fadeIn">
            Press back again to exit
          </div>
        )}
      </div>
    </div>
  );
}

