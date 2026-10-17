import { RefreshCw } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { QRSessionData } from "@/lib/api";
import { BrandMark } from "../BrandMark";
import { Button } from "../ui/button";

interface QRLoginPaneProps {
  session: QRSessionData | null;
  isCreating: boolean;
  isExchanging: boolean;
  error: string;
  onRefresh: () => void;
  onRetry: () => void;
}

export function QRLoginPane({
  session,
  isCreating,
  isExchanging,
  error,
  onRefresh,
  onRetry,
}: QRLoginPaneProps) {
  const isExpired = session?.status === "expired";
  const isScanned = session?.status === "scanned";
  const isConfirmed = session?.status === "confirmed";
  const isError = Boolean(error) || session?.status === "failed";
  const isBusy = isCreating || isExchanging;

  return (
    <section className="login-qr-pane hidden min-h-[560px] flex-col items-center justify-center border-r border-border bg-card px-8 py-12 text-center text-foreground md:flex">
      <BrandMark className="mb-5 text-3xl text-foreground" />
      <h2 className="text-xl font-semibold text-foreground">扫码登录</h2>
      <p className="mt-2 text-sm text-muted-foreground">使用学习通 App 扫码</p>

      {isError ? (
        <div className="mt-7 flex min-h-[208px] w-full max-w-[280px] items-center justify-center">
          <p role="alert" className="min-w-0 break-words text-sm leading-6 text-danger">
            {error || "扫码会话不可用，请刷新二维码"}
          </p>
        </div>
      ) : isScanned || isConfirmed ? (
        <div className="motion-content-enter mt-7 flex h-[208px] w-[208px] flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-border bg-muted/40 p-4 shadow-xs">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-sm">
            {session?.scannedName ? session.scannedName.substring(0, 1) : "通"}
          </div>
          <div className="flex min-w-0 max-w-full flex-col items-center gap-0.5">
            <span className="max-w-full truncate text-sm font-semibold text-foreground">
              {session?.scannedName || "学习通账号"}
            </span>
            <span role="status" className="text-xs text-muted-foreground">
              {isConfirmed
                ? "正在校验登录信息"
                : "已扫码，请在手机端确认"}
            </span>
          </div>
        </div>
      ) : (
        <div className="login-qr-code relative mt-7 flex h-[208px] w-[208px] items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-border bg-white p-3 shadow-xs transition-[border-color,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-standard)] hover:shadow-raised">
          {isExpired ? (
            <p className="px-4 text-sm leading-6 text-foreground">二维码已过期</p>
          ) : session?.qrContent ? (
            <QRCodeSVG
              value={session.qrContent}
              size={176}
              level="M"
              includeMargin={false}
              title="学习通登录二维码"
            />
          ) : isCreating ? (
            <svg
              className="loading-spinner"
              viewBox="0 0 50 50"
              role="status"
              aria-label="正在生成二维码"
            >
              <circle
                className="path"
                cx="25"
                cy="25"
                r="20"
                fill="none"
                strokeWidth="4"
              />
            </svg>
          ) : null}
        </div>
      )}

      {(isError || (!isScanned && !isConfirmed)) && (
        <div className="mt-5 flex w-full flex-wrap items-center justify-center gap-2">
          {isConfirmed && isError && (
            <Button
              type="button"
              size="sm"
              disabled={isBusy}
              onClick={onRetry}
            >
              重试登录
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 gap-2 px-3 text-muted-foreground hover:bg-muted hover:text-foreground"
            disabled={isBusy}
            onClick={onRefresh}
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            刷新二维码
          </Button>
        </div>
      )}
    </section>
  );
}
