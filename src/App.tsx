import { useCallback, useEffect, useState } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { getCurrentSession, getUserFacingErrorMessage, isAuthExitError, logout, type AuthSession } from './lib/api';
import { Toaster } from '@/components/ui/sonner';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const LOGOUT_SUPPRESSION_KEY = 'yatori-auth-logout-suppressed';

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
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(() => {
    return sessionStorage.getItem(LOGOUT_SUPPRESSION_KEY) !== '1';
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
        setIsRestoringSession(false);
      })
      .catch((error) => {
        if (!isAuthExitError(error)) {
          console.error('Failed to restore auth session', error);
        }
        if (!cancelled) {
          setSession(null);
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
