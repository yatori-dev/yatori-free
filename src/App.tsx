import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { getCurrentSession, getUserFacingErrorMessage, isAuthExitError, logout, type AuthSession } from './lib/api';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { clearSessionCache } from '@/lib/sessionCache';
import { clearQRLoginSession } from '@/lib/qrLoginSession';

const LOGOUT_SUPPRESSION_KEY = 'yatori-auth-logout-suppressed';
const Login = lazy(() => import('./components/Login').then(({ Login: Component }) => ({ default: Component })));
const Dashboard = lazy(() => import('./components/Dashboard').then(({ Dashboard: Component }) => ({ default: Component })));

function AuthRestoreScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8" aria-busy="true">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <span className="google-spinner" role="status" aria-label="加载中" />
        <span className="text-xs font-medium">加载中...</span>
      </div>
    </div>
  );
}

function AppSuspenseFallback() {
  return <AuthRestoreScreen />;
}

function App() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoginTransitioning, setIsLoginTransitioning] = useState(false);
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
    setIsLoginTransitioning(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
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
      setIsLoginTransitioning(false);
      setSession(null);
      setIsRestoringSession(false);
    }
  }, []);

  return (
    <>
      {isRestoringSession ? <AuthRestoreScreen /> : (
        <div>
          <Suspense fallback={<AppSuspenseFallback />}>
            {(!session || isLoginTransitioning) && (
              <div
                className={isLoginTransitioning ? 'login-success-underlay' : undefined}
                aria-hidden={isLoginTransitioning || undefined}
                inert={isLoginTransitioning || undefined}
              >
                <Login onLoginSuccess={handleLoginSuccess} />
              </div>
            )}
            {session && (
              <div
                className={isLoginTransitioning ? 'login-success-view' : undefined}
                onAnimationEnd={(event) => {
                  if (event.animationName === 'loginSuccessReveal') {
                    setIsLoginTransitioning(false);
                  }
                }}
              >
                <Dashboard session={session} onLogout={handleLogout} />
              </div>
            )}
          </Suspense>
        </div>
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
