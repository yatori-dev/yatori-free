import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { QRSessionData } from "@/lib/api";
import { QRLoginPane } from "./QRLoginPane";

const session: QRSessionData = {
  id: "confirmed-qr-session",
  status: "confirmed",
  expiresAt: "2099-01-01T00:00:00Z",
  pollIntervalMs: 1000,
  scannedName: "测试用户",
  qrContent: "https://example.com/qr",
};

function renderPane(overrides: Partial<Parameters<typeof QRLoginPane>[0]> = {}) {
  return renderToStaticMarkup(
    <QRLoginPane
      session={session}
      isCreating={false}
      isExchanging={false}
      error=""
      onRefresh={vi.fn()}
      onRetry={vi.fn()}
      {...overrides}
    />,
  );
}

describe("QR login feedback", () => {
  it.each([
    "请先使用最新的学习通账号密码登录一次，之后才能使用扫码或短信验证码登录",
    "暂时无法校验学习通账号密码，请稍后重试",
  ])("shows a confirmed exchange failure with recovery actions: %s", (error) => {
    const html = renderPane({ error });

    expect(html).toContain('role="alert"');
    expect(html).toContain(error);
    expect(html).toContain("重试登录");
    expect(html).toContain("刷新二维码");
    expect(html).not.toContain("验证通过");
    expect(html).not.toContain("跳转中");
    expect(html).not.toContain("正在校验登录信息");
  });

  it("describes confirmed QR as awaiting login verification", () => {
    const html = renderPane({ isExchanging: true });

    expect(html).toContain('role="status"');
    expect(html).toContain("正在校验登录信息");
    expect(html).not.toContain("验证通过");
    expect(html).not.toContain("重试登录");
    expect(html).not.toContain("刷新二维码");
  });

  it.each(["pending", "scanned"] as const)(
    "shows poll errors and refresh before confirmation: %s",
    (status) => {
      const html = renderPane({
        session: { ...session, status },
        error: "扫码状态查询失败，请稍后重试",
      });

      expect(html).toContain("扫码状态查询失败，请稍后重试");
      expect(html).toContain("刷新二维码");
      expect(html).not.toContain("重试登录");
      expect(html).not.toContain("已扫码，请在手机端确认");
    },
  );

  it("keeps the confirmation prompt for a scanned QR", () => {
    const html = renderPane({ session: { ...session, status: "scanned" } });

    expect(html).toContain("已扫码，请在手机端确认");
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain("重试登录");
  });

  it("offers refresh for expired and failed sessions", () => {
    const expired = renderPane({ session: { ...session, status: "expired" } });
    const failed = renderPane({ session: { ...session, status: "failed" } });

    expect(expired).toContain("二维码已过期");
    expect(failed).toContain("扫码会话不可用，请刷新二维码");
    for (const html of [expired, failed]) {
      expect(html).toContain("刷新二维码");
      expect(html).not.toContain("重试登录");
      expect(html).not.toContain("学习通登录二维码");
    }
  });

  it("shows creation failures without claiming login verification", () => {
    const html = renderPane({ session: null, error: "二维码暂时无法生成" });

    expect(html).toContain("二维码暂时无法生成");
    expect(html).toContain("刷新二维码");
    expect(html).not.toContain("重试登录");
    expect(html).not.toContain("验证通过");
  });

  it.each([{ isCreating: true }, { isExchanging: true }])(
    "disables recovery actions while a request is in progress: %j",
    (busy) => {
      const html = renderPane({ error: "登录态换取失败", ...busy });
      const buttons = html.match(/<button\b[^>]*>/g) ?? [];

      expect(buttons).toHaveLength(2);
      expect(buttons.every((button) => button.includes('disabled=""'))).toBe(true);
    },
  );
});
