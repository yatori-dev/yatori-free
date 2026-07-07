import { useEffect, useState } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { getCurrentSession, getUserFacingErrorMessage, isAuthExitError, type AuthSession } from './lib/api';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

const AUTH_STORAGE_KEY = 'yatori-auth';
const LOGOUT_SUPPRESSION_KEY = 'yatori-auth-logout-suppressed';

function persistSession(session: AuthSession | null) {
  if (session) {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    return;
  }

  sessionStorage.removeItem(AUTH_STORAGE_KEY);
}

function App() {
  const [isRestoringSession, setIsRestoringSession] = useState(() => {
    return sessionStorage.getItem(LOGOUT_SUPPRESSION_KEY) !== '1';
  });
  const [session, setSession] = useState<AuthSession | null>(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);

    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed === 'object' &&
        'user' in parsed &&
        typeof parsed.user === 'object' &&
        parsed.user !== null
      ) {
        return parsed as AuthSession;
      }
    } catch (error) {
      console.error('Failed to parse auth session', error);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }

    return null;
  });

  useEffect(() => {
    let cancelled = false;

    if (sessionStorage.getItem(LOGOUT_SUPPRESSION_KEY) === '1') {
      return () => {
        cancelled = true;
      };
    }

    getCurrentSession()
      .then((currentSession) => {
        if (cancelled) {
          return;
        }

        setSession(currentSession);
        persistSession(currentSession);
      })
      .catch((error) => {
        if (isAuthExitError(error)) {
          toast.error(getUserFacingErrorMessage(error, '登录已失效，请重新登录'));
        } else {
          console.error('Failed to restore auth session', error);
          toast.error(getUserFacingErrorMessage(error, '恢复登录状态失败，请重新登录'));
        }
        if (!cancelled) {
          setSession(null);
          persistSession(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsRestoringSession(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLoginSuccess = (newSession: AuthSession) => {
    sessionStorage.removeItem(LOGOUT_SUPPRESSION_KEY);
    setSession(newSession);
    persistSession(newSession);
  };

  const handleLogout = () => {
    sessionStorage.setItem(LOGOUT_SUPPRESSION_KEY, '1');
    setSession(null);
    persistSession(null);
  };

  if (isRestoringSession) {
    return <Toaster position="top-center" richColors />;
  }

  return (
    <>
      {session ? (
        <Dashboard session={session} onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
      <Toaster position="top-center" richColors />
    </>
  );
}

export default App;
