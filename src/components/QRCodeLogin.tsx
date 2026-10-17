import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import {
  createQRSession,
  exchangeQRSession,
  getQRSession,
  getUserFacingErrorMessage,
} from "@/lib/api";
import type { LoginData, QRSessionData } from "@/lib/api";
import {
  clearQRLoginSession,
  readQRLoginSession,
  writeQRLoginSession,
} from "@/lib/qrLoginSession";
import { QRLoginPane } from "./login/QRLoginPane";

interface QRCodeLoginProps {
  onLoginSuccess: (data: LoginData) => void;
}

function isMissingQRSession(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === 404
  );
}

export function QRCodeLogin({ onLoginSuccess }: QRCodeLoginProps) {
  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia("(min-width: 768px)").matches,
  );
  const [session, setSession] = useState<QRSessionData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isExchanging, setIsExchanging] = useState(false);
  const [error, setError] = useState("");
  const [exchangeAttempt, setExchangeAttempt] = useState(0);
  const claimedSessionIdRef = useRef<string | null>(null);
  const createAbortRef = useRef<AbortController | null>(null);
  const exchangeAbortRef = useRef<AbortController | null>(null);
  const completeLogin = useEffectEvent(onLoginSuccess);

  const createSession = useCallback(async () => {
    createAbortRef.current?.abort();
    exchangeAbortRef.current?.abort();
    const controller = new AbortController();
    createAbortRef.current = controller;
    setIsCreating(true);
    setError("");
    setSession(null);
    claimedSessionIdRef.current = null;
    clearQRLoginSession();

    try {
      const response = await createQRSession({ signal: controller.signal });
      setSession(response.data);
      writeQRLoginSession(response.data);
    } catch (requestError) {
      if (
        requestError instanceof Error &&
        "kind" in requestError &&
        requestError.kind === "aborted"
      )
        return;
      setError(getUserFacingErrorMessage(requestError, "二维码暂时无法生成"));
    } finally {
      setIsCreating(false);
    }
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = () => setIsDesktop(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!isDesktop) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const storedSession = readQRLoginSession();
      if (storedSession) {
        setSession(storedSession);
        setError("");
        setIsCreating(false);
        return;
      }

      void createSession();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [createSession, isDesktop]);

  useEffect(() => {
    if (
      !isDesktop ||
      !session ||
      !["pending", "scanned"].includes(session.status)
    ) {
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    let retryDelayMs = Math.max(500, session.pollIntervalMs || 1500);
    const sleep = (delay: number) =>
      new Promise<void>((resolve) => {
        const timeoutId = window.setTimeout(resolve, delay);
        controller.signal.addEventListener(
          "abort",
          () => {
            window.clearTimeout(timeoutId);
            resolve();
          },
          { once: true },
        );
      });

    const poll = async () => {
      while (!cancelled && !controller.signal.aborted) {
        await sleep(retryDelayMs);
        if (cancelled || controller.signal.aborted) return;
        try {
          const response = await getQRSession(session.id, {
            signal: controller.signal,
          });
          if (cancelled) return;
          const nextSession = {
            ...session,
            ...response.data,
            qrContent: response.data.qrContent ?? session.qrContent,
          };
          setSession(nextSession);
          setError("");
          writeQRLoginSession(nextSession);
          retryDelayMs = Math.max(500, nextSession.pollIntervalMs || 1500);
          if (!["pending", "scanned"].includes(nextSession.status)) return;
        } catch (requestError) {
          if (
            cancelled ||
            (requestError instanceof Error &&
              "kind" in requestError &&
              requestError.kind === "aborted")
          )
            return;
          if (isMissingQRSession(requestError)) {
            clearQRLoginSession();
            setSession(null);
            setError("二维码会话已失效，请刷新二维码");
            return;
          }
          setError(getUserFacingErrorMessage(requestError, "扫码状态查询失败"));
          retryDelayMs = Math.min(10_000, Math.max(1000, retryDelayMs * 2));
        }
      }
    };
    void poll();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [isDesktop, session]);

  useEffect(() => {
    if (
      !session ||
      session.status !== "confirmed" ||
      claimedSessionIdRef.current === session.id
    ) {
      return;
    }

    claimedSessionIdRef.current = session.id;
    const controller = new AbortController();
    exchangeAbortRef.current = controller;
    let cancelled = false;
    clearQRLoginSession();
    setError("");
    setIsExchanging(true);
    exchangeQRSession(session.id, { signal: controller.signal })
      .then((response) => {
        if (!cancelled) completeLogin(response.data);
      })
      .catch((requestError) => {
        if (
          !cancelled &&
          !(
            requestError instanceof Error &&
            "kind" in requestError &&
            requestError.kind === "aborted"
          )
        ) {
          setError(getUserFacingErrorMessage(requestError, "登录态换取失败"));
        }
      })
      .finally(() => {
        if (!cancelled) setIsExchanging(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [exchangeAttempt, session]);

  useEffect(
    () => () => {
      createAbortRef.current?.abort();
      exchangeAbortRef.current?.abort();
    },
    [],
  );

  if (!isDesktop) {
    return null;
  }

  const retryExchange = () => {
    if (!session || session.status !== "confirmed" || isCreating || isExchanging) {
      return;
    }
    claimedSessionIdRef.current = null;
    setExchangeAttempt((attempt) => attempt + 1);
  };

  return (
    <QRLoginPane
      session={session}
      isCreating={isCreating}
      isExchanging={isExchanging}
      error={error}
      onRefresh={() => void createSession()}
      onRetry={retryExchange}
    />
  );
}
