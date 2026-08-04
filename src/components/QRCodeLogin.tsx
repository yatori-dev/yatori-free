import { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { BrandMark } from './BrandMark';
import { RefreshCw } from 'lucide-react';
import {
  createQRSession,
  exchangeQRSession,
  getQRSession,
  getUserFacingErrorMessage,
} from '@/lib/api';
import type { LoginData, QRSessionData } from '@/lib/api';
import { clearQRLoginSession, readQRLoginSession, writeQRLoginSession } from '@/lib/qrLoginSession';
import { Button } from './ui/button';

interface QRCodeLoginProps {
  onLoginSuccess: (data: LoginData) => void;
}

function getStatusMessage(session: QRSessionData) {
  switch (session.status) {
    case 'scanned':
      return session.scannedName
        ? `已识别 ${session.scannedName}，请在学习通中确认`
        : '已扫码，请在学习通中确认登录';
    case 'confirmed':
      return '正在进入 Yatori...';
    case 'failed':
      return '扫码会话不可用';
    default:
      return '';
  }
}

function isMissingQRSession(error: unknown) {
  return (
    typeof error === 'object'
    && error !== null
    && 'status' in error
    && error.status === 404
  );
}

export function QRCodeLogin({ onLoginSuccess }: QRCodeLoginProps) {
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 768px)').matches);
  const [session, setSession] = useState<QRSessionData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isExchanging, setIsExchanging] = useState(false);
  const [error, setError] = useState('');
  const claimedSessionIdRef = useRef<string | null>(null);

  const createSession = useCallback(async () => {
    setIsCreating(true);
    setError('');
    setSession(null);
    claimedSessionIdRef.current = null;
    clearQRLoginSession();

    try {
      const response = await createQRSession();
      setSession(response.data);
      writeQRLoginSession(response.data);
    } catch (requestError) {
      setError(getUserFacingErrorMessage(requestError, '二维码暂时无法生成'));
    } finally {
      setIsCreating(false);
    }
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handleChange = () => setIsDesktop(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!isDesktop) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const storedSession = readQRLoginSession();
      if (storedSession) {
        setSession(storedSession);
        setError('');
        setIsCreating(false);
        return;
      }

      void createSession();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [createSession, isDesktop]);

  useEffect(() => {
    if (
      !isDesktop
      || !session
      || !['pending', 'scanned'].includes(session.status)
    ) {
      return;
    }

    let cancelled = false;
    const pollIntervalMs = Math.max(500, session.pollIntervalMs || 1500);
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await getQRSession(session.id);
        if (cancelled) {
          return;
        }

        const nextSession = {
          ...session,
          ...response.data,
          qrContent: response.data.qrContent ?? session.qrContent,
        };
        setSession(nextSession);
        setError('');
        writeQRLoginSession(nextSession);
      } catch (requestError) {
        if (!cancelled) {
          if (isMissingQRSession(requestError)) {
            clearQRLoginSession();
          }
          setError(getUserFacingErrorMessage(requestError, '扫码状态查询失败'));
        }
      }
    }, pollIntervalMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [isDesktop, session]);

  useEffect(() => {
    if (
      !session
      || session.status !== 'confirmed'
      || claimedSessionIdRef.current === session.id
    ) {
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      claimedSessionIdRef.current = session.id;
      clearQRLoginSession();
      setIsExchanging(true);

      exchangeQRSession(session.id)
        .then((response) => {
          if (!cancelled) {
            onLoginSuccess(response.data);
          }
        })
        .catch((requestError) => {
          if (!cancelled) {
            setError(getUserFacingErrorMessage(requestError, '登录态换取失败'));
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsExchanging(false);
          }
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [onLoginSuccess, session]);

  if (!isDesktop) {
    return null;
  }

  const canRefresh = !isCreating && !isExchanging;
  const statusMessage = error || (session ? getStatusMessage(session) : '');
  const isExpired = session?.status === 'expired';
  const isScanned = session?.status === 'scanned';
  const isConfirmed = session?.status === 'confirmed';
  const isError = Boolean(error) || session?.status === 'failed';

  return (
    <section className="login-qr-pane hidden min-h-[516px] flex-col items-center justify-center border-r border-border bg-transparent px-10 py-12 text-center md:flex">
      <BrandMark className="mb-5 text-3xl" />
      <h1 className="text-2xl font-normal tracking-tight text-foreground">扫码登录</h1>
      <p className="mt-2 text-sm text-muted-foreground">使用学习通 App 扫码</p>

      {/* Dynamic QR / Scanned Morphing Card */}
      {isScanned || isConfirmed ? (
        <div className="mt-7 flex h-[208px] w-[208px] flex-col items-center justify-center gap-3 rounded-2xl border border-primary/20 bg-primary-container/20 p-4 shadow-sm backdrop-blur-xs animate-in zoom-in-95 duration-300">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-sm">
            {session?.scannedName ? session.scannedName.substring(0, 1) : '通'}
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-sm font-semibold text-foreground truncate max-w-[170px]">
              {session?.scannedName || '学习通账号'}
            </span>
            <span className="text-xs text-muted-foreground">
              {isConfirmed ? '已确认，跳转中...' : '已扫码，请在手机端确认'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
            <span>{isConfirmed ? '验证通过' : '等待确认'}</span>
          </div>
        </div>
      ) : (
        <div className="login-qr-code relative mt-7 flex h-[208px] w-[208px] items-center justify-center overflow-hidden rounded-2xl border border-border bg-white p-3 shadow-xs">
          {session?.qrContent ? (
            <QRCodeSVG
              value={session.qrContent}
              size={176}
              level="M"
              includeMargin={false}
              title="学习通登录二维码"
            />
          ) : isCreating ? (
            <svg
              className="google-spinner"
              viewBox="0 0 50 50"
              role="status"
              aria-label="正在生成二维码"
            >
              <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
            </svg>
          ) : error ? (
            <p className="px-4 text-sm leading-6 text-danger">二维码暂时无法生成</p>
          ) : null}

          {isError && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-card/90 px-5 text-center backdrop-blur-xs"
              aria-live="polite"
              role="alert"
            >
              <p className="text-sm leading-6 text-danger">
                {statusMessage}
              </p>
            </div>
          )}

          {isExpired && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/95 px-4 text-foreground backdrop-blur-xs">
              <p className="text-base font-medium">二维码已过期</p>
              <Button
                type="button"
                size="sm"
                className="h-9 gap-2 bg-primary px-3 text-primary-foreground hover:bg-primary-hover"
                disabled={!canRefresh}
                onClick={() => void createSession()}
              >
                <RefreshCw className="h-4 w-4" />
                刷新二维码
              </Button>
            </div>
          )}
        </div>
      )}

      {!isExpired && !isScanned && !isConfirmed && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-5 h-9 gap-2 px-3 text-primary hover:bg-primary-container/30"
          disabled={!canRefresh}
          onClick={() => void createSession()}
        >
          <RefreshCw className="h-4 w-4" />
          刷新二维码
        </Button>
      )}
    </section>
  );
}
