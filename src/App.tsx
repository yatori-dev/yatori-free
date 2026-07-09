import { useCallback, useEffect, useRef, useState } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { getCurrentSession, getUserFacingErrorMessage, isAuthExitError, logout, type AuthSession } from './lib/api';
import { Toaster } from '@/components/ui/sonner';
import { Card, CardContent } from '@/components/ui/card';
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

function keepAccountReferenceIfSameUser(prevSession: AuthSession | null, nextSession: AuthSession | null) {
  if (
    !prevSession?.account ||
    !nextSession?.account ||
    prevSession.account.id !== nextSession.account.id
  ) {
    return nextSession;
  }

  return {
    ...nextSession,
    account: prevSession.account,
  };
}

function AuthRestoreScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8" aria-busy="true">
      <Card className="w-full max-w-[360px] overflow-hidden border-border bg-card shadow-[0_2px_4px_rgba(0,0,0,0.08)] rounded-lg">
        <div className="google-accent-bar" aria-hidden="true">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <CardContent className="flex min-h-[260px] flex-col items-center justify-center p-8">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center font-semibold text-3xl tracking-tight select-none" aria-hidden="true">
              <span className="text-[#4285F4]">Y</span>
              <span className="text-[#EA4335]">a</span>
              <span className="text-[#FBBC05]">t</span>
              <span className="text-[#4285F4]">o</span>
              <span className="text-[#34A853]">r</span>
              <span className="text-[#EA4335]">i</span>
            </div>
            <div className="text-sm font-medium text-muted-foreground">学习通服务</div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <svg className="google-spinner" viewBox="0 0 50 50" role="status" aria-label="登录中">
              <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="4"></circle>
            </svg>
            <div className="text-center text-xs font-medium text-muted-foreground">登录中...</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function App() {
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
  const [isRestoringSession, setIsRestoringSession] = useState(() => {
    return session === null && sessionStorage.getItem(LOGOUT_SUPPRESSION_KEY) !== '1';
  });
  const hadCachedSessionRef = useRef(session !== null);

  useEffect(() => {
    let cancelled = false;
    const hadCachedSession = hadCachedSessionRef.current;

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

        setSession((prevSession) => keepAccountReferenceIfSameUser(prevSession, currentSession));
        persistSession(currentSession);
        setIsRestoringSession(false);
      })
      .catch((error) => {
        if (isAuthExitError(error)) {
          if (hadCachedSession) {
            toast.error(getUserFacingErrorMessage(error, '登录已失效，请重新登录'));
          }
        } else {
          console.error('Failed to restore auth session', error);
          if (hadCachedSession) {
            toast.error(getUserFacingErrorMessage(error, '恢复登录状态失败，请重新登录'));
          }
        }
        if (!cancelled) {
          setSession(null);
          persistSession(null);
          setIsRestoringSession(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLoginSuccess = useCallback((newSession: AuthSession) => {
    sessionStorage.removeItem(LOGOUT_SUPPRESSION_KEY);
    setSession(newSession);
    setIsRestoringSession(false);
    persistSession(newSession);
  }, []);

  const handleLogout = useCallback(async () => {
    sessionStorage.setItem(LOGOUT_SUPPRESSION_KEY, '1');

    try {
      await logout();
    } catch (error) {
      if (!isAuthExitError(error)) {
        console.error('Failed to logout', error);
        toast.error(getUserFacingErrorMessage(error, '退出登录失败，请稍后重试'));
      }
    } finally {
      setSession(null);
      setIsRestoringSession(false);
      persistSession(null);
    }
  }, []);

  return (
    <>
      {isRestoringSession ? (
        <AuthRestoreScreen />
      ) : session ? (
        <Dashboard session={session} onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
      <Toaster
        position="top-center"
        richColors
        offset={{ top: 16 }}
        mobileOffset={{
          top: 'calc(88px + env(safe-area-inset-top))',
          right: 12,
          left: 12,
        }}
      />
    </>
  );
}

export default App;
