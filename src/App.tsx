import { useCallback, useEffect, useState } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { BrandMark } from './components/BrandMark';
import { getCurrentSession, getUserFacingErrorMessage, isAuthExitError, logout, type AuthSession } from './lib/api';
import { Toaster } from '@/components/ui/sonner';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { clearSessionCache } from '@/lib/sessionCache';
import { clearQRLoginSession } from '@/lib/qrLoginSession';
import { LoaderCircle } from 'lucide-react';

const LOGOUT_SUPPRESSION_KEY = 'yatori-auth-logout-suppressed';

function AuthRestoreScreen() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 px-4 py-8" aria-busy="true">
      <Card className="w-full max-w-sm shadow-sm">
        <CardContent className="flex min-h-72 flex-col items-center justify-center p-8">
          <div className="flex flex-col items-center gap-2">
            <BrandMark className="text-3xl" />
            <div className="text-sm font-medium text-muted-foreground">学习通服务</div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <LoaderCircle className="size-7 animate-spin text-muted-foreground motion-reduce:animate-none" role="status" aria-label="加载中" />
            <div className="text-center text-xs font-medium text-muted-foreground">加载中...</div>
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
    clearSessionCache();
    clearQRLoginSession();
    sessionStorage.removeItem(LOGOUT_SUPPRESSION_KEY);
    setSession(newSession);
    setIsRestoringSession(false);
  }, []);

  const handleLogout = useCallback(async () => {
    sessionStorage.setItem(LOGOUT_SUPPRESSION_KEY, '1');
    clearSessionCache();
    clearQRLoginSession();

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
