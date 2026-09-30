import { useEffect, useState, type FormEvent } from 'react';
import {
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  RotateCw,
  SendHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  createSMSSession,
  exchangeSMSSession,
  getUserFacingErrorMessage,
  login,
  type LoginData,
  type SMSSessionData,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type LoginMethod = 'password' | 'sms';
type LegalDocument = 'terms' | 'privacy';

interface LoginCredentialsStepProps {
  account: string;
  accountError: string;
  onAccountChange: (account: string) => void;
  onAccountErrorChange: (message: string) => void;
  active: boolean;
  agreedToTerms: boolean;
  onAgreedToTermsChange: (agreed: boolean) => void;
  onLoginSuccess: (data: LoginData) => void;
  onOpenLegalDocument: (document: LegalDocument) => void;
}

export function LoginCredentialsStep({
  account,
  accountError,
  onAccountChange,
  onAccountErrorChange,
  active,
  agreedToTerms,
  onAgreedToTermsChange,
  onLoginSuccess,
  onOpenLegalDocument,
}: LoginCredentialsStepProps) {
  const [method, setMethod] = useState<LoginMethod>('password');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [smsCode, setSMSCode] = useState('');
  const [smsSession, setSMSSession] = useState<SMSSessionData | null>(null);
  const [smsError, setSMSError] = useState('');
  const [retrySeconds, setRetrySeconds] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [showSendSuccess, setShowSendSuccess] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (retrySeconds <= 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setRetrySeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [retrySeconds]);

  useEffect(() => {
    if (!showSendSuccess) {
      return;
    }

    const timeoutId = window.setTimeout(() => setShowSendSuccess(false), 900);
    return () => window.clearTimeout(timeoutId);
  }, [showSendSuccess]);

  const isBusy = isSendingCode || isLoggingIn;
  const sendCodeButtonLabel = isSendingCode
    ? '正在发送验证码'
    : showSendSuccess
      ? '验证码已发送'
      : retrySeconds > 0
        ? `${retrySeconds} 秒后可重新发送验证码`
        : smsSession
          ? '重新发送验证码'
          : '获取验证码';

  const handleMethodChange = (value: string) => {
    const nextMethod = value as LoginMethod;
    setMethod(nextMethod);
    setPasswordError('');
    setSMSError('');
  };

  const handleSendCode = async () => {
    if (isBusy || retrySeconds > 0) {
      return;
    }

    setIsSendingCode(true);
    setSMSError('');

    try {
      const response = await createSMSSession({ phone: account.trim() });
      setSMSSession(response.data);
      setSMSCode('');
      setRetrySeconds(Math.max(0, response.data.retryAfterSeconds));
      setShowSendSuccess(true);
      toast.success('验证码已发送');
    } catch (error) {
      console.error(error);
      const message = getUserFacingErrorMessage(
        error,
        '验证码发送失败，请稍后重试',
      );
      setSMSError(message);
      toast.error(message);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedAccount = account.trim();

    if (!/^1[3-9]\d{9}$/.test(normalizedAccount)) {
      onAccountErrorChange(
        normalizedAccount ? '请输入有效的11位手机号' : '请输入您的学习通账号',
      );
      return;
    }
    onAccountErrorChange('');

    if (method === 'password' && !password) {
      setPasswordError('请输入您的密码');
      return;
    }

    if (method === 'sms') {
      if (!smsSession) {
        setSMSError('请先获取验证码');
        return;
      }

      if (Date.parse(smsSession.expiresAt) <= Date.now()) {
        setSMSError('验证码已过期，请重新获取');
        return;
      }

      if (!smsCode.trim()) {
        setSMSError('请输入短信验证码');
        return;
      }
    }

    setIsLoggingIn(true);
    setPasswordError('');
    setSMSError('');

    try {
      const response =
        method === 'password'
          ? await login({ account: normalizedAccount, password })
          : await exchangeSMSSession(smsSession!.id, { code: smsCode.trim() });
      onLoginSuccess(response.data);
    } catch (error) {
      console.error(error);
      const message = getUserFacingErrorMessage(
        error,
        '服务暂时不可用，请稍后重试',
      );
      if (method === 'password') {
        setPasswordError(message);
      } else {
        setSMSError(message);
      }
      toast.error(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex w-full flex-col" inert={!active}>
      <h1 className="mb-5 text-center text-xl font-semibold text-foreground">学习通账号登录</h1>

      <form
        onSubmit={handleSubmit}
        autoComplete="on"
        className="w-full space-y-5"
      >
        <Tabs value={method} onValueChange={handleMethodChange} className="gap-5">
          <TabsList variant="line" className="w-full shrink-0 p-0 group-data-horizontal/tabs:h-11">
            <TabsTrigger value="password" disabled={isBusy}>
              密码登录
            </TabsTrigger>
            <TabsTrigger value="sms" disabled={isBusy}>
              验证码登录
            </TabsTrigger>
          </TabsList>

          <div className="space-y-2">
            <Label htmlFor="account">手机号</Label>
            <Input
              id="account"
              name="username"
              type="text"
              autoComplete="username"
              inputMode="tel"
              maxLength={11}
              placeholder="手机号"
              aria-invalid={Boolean(accountError)}
              aria-describedby={accountError ? 'account-error' : undefined}
              value={account}
              onChange={(event) => {
                onAccountChange(event.target.value);
                onAccountErrorChange('');
              }}
              className="h-11 w-full rounded-md border-input bg-transparent px-4 focus:border-ring focus:ring-1 focus:ring-ring"
              disabled={isBusy}
            />
            {accountError && (
              <p id="account-error" role="alert" className="ml-1 text-xs text-danger">
                {accountError}
              </p>
            )}
          </div>

          <TabsContent value="password" className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="password">密码</Label>
              <a
                href="https://passport2.chaoxing.com/pwd/findpwd?version=1"
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={isBusy}
                className={`text-xs font-medium text-primary hover:underline ${isBusy ? 'pointer-events-none opacity-50' : ''}`}
              >
                忘记密码
              </a>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="密码"
                aria-invalid={Boolean(passwordError)}
                aria-describedby={passwordError ? 'password-error' : undefined}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 w-full rounded-md border-input bg-transparent pl-4 pr-12 focus:border-ring focus:ring-1 focus:ring-ring"
                disabled={isBusy}
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
                disabled={isBusy}
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
                title={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
            {passwordError && (
              <p
                id="password-error"
                role="alert"
                className="ml-1 text-xs text-danger"
              >
                {passwordError}
              </p>
            )}
          </TabsContent>

          <TabsContent value="sms" className="space-y-2">
            <Label htmlFor="sms-code">6位数验证码</Label>
            <div className="flex gap-2">
              <Input
                id="sms-code"
                name="one-time-code"
                type="text"
                autoComplete="one-time-code"
                inputMode="numeric"
                placeholder="验证码"
                aria-invalid={Boolean(smsError)}
                aria-describedby={
                  smsError
                    ? 'sms-code-error'
                    : smsSession
                      ? 'sms-code-status'
                      : undefined
                }
                value={smsCode}
                onChange={(event) => {
                  setSMSCode(event.target.value);
                  setSMSError('');
                }}
                className="h-11 min-w-0 flex-1 rounded-md border-input bg-transparent px-4 focus:border-ring focus:ring-1 focus:ring-ring"
                disabled={isBusy}
              />
              <Button
                type="button"
                variant="outline"
                className="h-11 w-28 shrink-0 gap-1.5 rounded-md px-2"
                disabled={isBusy || retrySeconds > 0}
                onClick={() => void handleSendCode()}
                aria-label={sendCodeButtonLabel}
                title={sendCodeButtonLabel}
              >
                {isSendingCode ? (
                  <LoaderCircle
                    className="size-4 animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                ) : showSendSuccess ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : retrySeconds > 0 ? null : smsSession ? (
                  <RotateCw className="size-4" aria-hidden="true" />
                ) : (
                  <SendHorizontal className="size-4" aria-hidden="true" />
                )}
                <span className="tabular-nums">
                  {isSendingCode
                    ? '发送中...'
                    : showSendSuccess
                      ? '已发送'
                      : retrySeconds > 0
                        ? `${retrySeconds} 秒`
                        : smsSession
                          ? '重新发送'
                          : '获取验证码'}
                </span>
              </Button>
            </div>
            {smsError ? (
              <p
                id="sms-code-error"
                role="alert"
                className="ml-1 text-xs text-danger"
              >
                {smsError}
              </p>
            ) : smsSession ? (
              <p
                id="sms-code-status"
                aria-live="polite"
                className="ml-1 text-xs text-success"
              >
                验证码已发送
              </p>
            ) : null}
          </TabsContent>
        </Tabs>

        <div className="flex items-start gap-2 text-sm leading-5 text-muted-foreground">
          <input
            id="agree-terms"
            type="checkbox"
            checked={agreedToTerms}
            onChange={(event) => onAgreedToTermsChange(event.target.checked)}
            disabled={isBusy}
            className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-input accent-primary disabled:opacity-50"
          />
          <div className="min-w-0">
            <label
              htmlFor="agree-terms"
              className={
                isBusy ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              }
            >
              我已阅读并同意
            </label>{' '}
            <button
              type="button"
              onClick={() => onOpenLegalDocument('terms')}
              className="font-medium text-primary hover:underline"
            >
              服务条款
            </button>{' '}
            <span aria-hidden="true">和</span>{' '}
            <button
              type="button"
              onClick={() => onOpenLegalDocument('privacy')}
              className="font-medium text-primary hover:underline"
            >
              隐私政策
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isBusy || !agreedToTerms}
          className="h-11 w-full rounded-md"
        >
          {isLoggingIn ? '正在登录...' : '登录'}
        </Button>
      </form>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        本服务为面向大学生的学习通课程任务提交工具，不收取任何费用，请在受信任设备上使用
      </p>
    </div>
  );
}
