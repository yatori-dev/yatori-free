import { useEffect, useState, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
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
  active: boolean;
  agreedToTerms: boolean;
  onAgreedToTermsChange: (agreed: boolean) => void;
  onBack: () => void;
  onLoginSuccess: (data: LoginData) => void;
  onOpenLegalDocument: (document: LegalDocument) => void;
}

export function LoginCredentialsStep({
  account,
  active,
  agreedToTerms,
  onAgreedToTermsChange,
  onBack,
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

  const isBusy = isSendingCode || isLoggingIn;

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
      const response = await createSMSSession({ phone: account });
      setSMSSession(response.data);
      setSMSCode('');
      setRetrySeconds(Math.max(0, response.data.retryAfterSeconds));
      toast.success('验证码已发送');
    } catch (error) {
      console.error(error);
      const message = getUserFacingErrorMessage(error, '验证码发送失败，请稍后重试');
      setSMSError(message);
      toast.error(message);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

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
      const response = method === 'password'
        ? await login({ account, password })
        : await exchangeSMSSession(smsSession!.id, { code: smsCode.trim() });
      onLoginSuccess(response.data);
    } catch (error) {
      console.error(error);
      const message = getUserFacingErrorMessage(error, '服务暂时不可用，请稍后重试');
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
    <div className="flex w-full flex-col items-center" inert={!active}>
      <h1 className="mb-1 text-2xl font-normal text-foreground">继续登录</h1>
      <p className="mb-5 text-sm text-muted-foreground">使用 {account} 登录学习通</p>

      <form onSubmit={handleSubmit} autoComplete="on" className="w-full space-y-5">
        <input type="text" name="username" autoComplete="username" value={account} readOnly className="sr-only" />

        <Tabs value={method} onValueChange={handleMethodChange}>
          <TabsList className="h-11 w-full md:h-10">
            <TabsTrigger value="password" disabled={isBusy}>密码登录</TabsTrigger>
            <TabsTrigger value="sms" disabled={isBusy}>验证码登录</TabsTrigger>
          </TabsList>

          <TabsContent value="password" className="mt-4 space-y-2">
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
                className="h-12 w-full rounded-lg border-input bg-transparent pl-4 pr-12 focus:border-primary focus:ring-1 focus:ring-primary"
                disabled={isBusy}
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-primary"
                disabled={isBusy}
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
            {passwordError && <p id="password-error" role="alert" className="ml-1 text-xs text-danger">{passwordError}</p>}
          </TabsContent>

          <TabsContent value="sms" className="mt-4 space-y-2">
            <Label htmlFor="sms-code">短信验证码</Label>
            <div className="flex gap-2">
              <Input
                id="sms-code"
                name="one-time-code"
                type="text"
                autoComplete="one-time-code"
                inputMode="numeric"
                placeholder="验证码"
                aria-invalid={Boolean(smsError)}
                aria-describedby={smsError ? 'sms-code-error' : smsSession ? 'sms-code-status' : undefined}
                value={smsCode}
                onChange={(event) => {
                  setSMSCode(event.target.value);
                  setSMSError('');
                }}
                className="h-12 min-w-0 flex-1 rounded-lg border-input bg-transparent px-4 focus:border-primary focus:ring-1 focus:ring-primary"
                disabled={isBusy}
              />
              <Button
                type="button"
                variant="outline"
                className="h-12 min-w-28 rounded-lg px-3 text-primary"
                disabled={isBusy || retrySeconds > 0}
                onClick={() => void handleSendCode()}
              >
                {isSendingCode ? '发送中...' : retrySeconds > 0 ? `${retrySeconds} 秒` : smsSession ? '重新发送' : '获取验证码'}
              </Button>
            </div>
            {smsError ? (
              <p id="sms-code-error" role="alert" className="ml-1 text-xs text-danger">{smsError}</p>
            ) : smsSession ? (
              <p id="sms-code-status" aria-live="polite" className="ml-1 text-xs text-success">验证码已发送</p>
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
            <label htmlFor="agree-terms" className={isBusy ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}>
              我已阅读并同意
            </label>{' '}
            <button type="button" onClick={() => onOpenLegalDocument('terms')} className="font-medium text-primary hover:underline">服务条款</button>{' '}
            <span aria-hidden="true">和</span>{' '}
            <button type="button" onClick={() => onOpenLegalDocument('privacy')} className="font-medium text-primary hover:underline">隐私政策</button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <Button type="button" variant="ghost" onClick={onBack} className="h-11 rounded-lg px-4 text-primary hover:bg-primary-container/30 md:h-10" disabled={isBusy}>
            返回
          </Button>
          <Button type="submit" disabled={isBusy || !agreedToTerms} className="h-11 min-w-24 rounded-lg bg-primary px-6 text-primary-foreground hover:bg-primary-hover md:h-10">
            {isLoggingIn ? '正在登录...' : '登录'}
          </Button>
        </div>
      </form>
    </div>
  );
}
