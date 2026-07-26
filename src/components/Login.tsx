import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { getUserFacingErrorMessage, login } from '@/lib/api';
import type { AuthSession, LoginData } from '@/lib/api';
import { readSavedAccount, saveSavedAccount } from '@/lib/savedAccount';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeLogin } from './QRCodeLogin';

interface LoginProps {
  onLoginSuccess: (session: AuthSession) => void;
}

const MAINLAND_MOBILE_PATTERN = /^1[3-9]\d{9}$/;

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<'account' | 'password'>('account');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [dialogContent, setDialogContent] = useState<'terms' | 'privacy' | null>(null);
  const accountPaneRef = useRef<HTMLDivElement>(null);
  const passwordPaneRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState<number>();

  useLayoutEffect(() => {
    const pane = step === 'account' ? accountPaneRef.current : passwordPaneRef.current;
    if (!pane) return;

    const updateHeight = () => setViewportHeight(pane.scrollHeight);
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(pane);
    return () => observer.disconnect();
  }, [accountError, agreedToTerms, isLoading, passwordError, showPassword, step]);

  useEffect(() => {
    let cancelled = false;

    readSavedAccount()
      .then((saved) => {
        if (cancelled || !saved) {
          return;
        }

        setAccount((currentAccount) => currentAccount || saved.account);
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleAccountChange = (value: string) => {
    setAccount(value);
    setAccountError('');

    const trimmedAccount = value.trim();
    if (!trimmedAccount) {
      if (password) {
        setPassword('');
      }
      return;
    }

    if (password) {
      setPassword('');
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError('');
    
    const trimmed = account.trim();
    if (!trimmed) {
      setAccountError('请输入您的学习通账号');
      return;
    }

    if (!MAINLAND_MOBILE_PATTERN.test(trimmed)) {
      setAccountError('请输入有效的11位手机号');
      return;
    }
    
    // Slide to password step
    setStep('password');
  };

  const handleBackStep = () => {
    if (isLoading) return;
    setStep('account');
    setPasswordError('');
  };

  const completeLogin = (data: LoginData) => {
    toast.success('登录成功');
    saveSavedAccount({
      account: data.account.account,
    });
    onLoginSuccess({
      expiresAt: data.expiresAt,
      displayName: data.displayName ?? data.account.name,
      avatarUrl: data.avatarUrl ?? data.account.avatarUrl ?? null,
      schoolName: data.schoolName ?? data.account.schoolName,
      user: data.user,
      account: data.account,
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    
    if (!password) {
      setPasswordError('请输入您的密码');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await login({
        account: account.trim(),
        password,
      });

      const data = response.data;
      completeLogin(data);
    } catch (error) {
      console.error(error);
      const errMsg = getUserFacingErrorMessage(error, '服务暂时不可用，请稍后重试');
      setPasswordError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] px-4 py-8 dark:bg-[#121314] transition-colors duration-300">
      <Card className="w-full max-w-[450px] overflow-hidden rounded-xl border border-[#E0E0E0] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] dark:border-[#333537] dark:bg-[#1f2021] md:max-w-[min(65.6vw,1024px)]">
        {/* Google Accent Bar */}
        <div className="google-accent-bar">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>

        <CardContent className="grid p-0 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <QRCodeLogin onLoginSuccess={completeLogin} />
          <div className="login-auth-pane relative flex min-w-0 flex-col items-center p-8 md:min-h-[516px] md:justify-center md:px-12 md:py-10">
          {/* Google Colored Logo */}
          <div className="mb-4 flex items-center justify-center text-3xl font-semibold tracking-tight select-none md:hidden">
            <span className="text-[#4285F4]">Y</span>
            <span className="text-[#EA4335]">a</span>
            <span className="text-[#FBBC05]">t</span>
            <span className="text-[#4285F4]">o</span>
            <span className="text-[#34A853]">r</span>
            <span className="text-[#EA4335]">i</span>
          </div>

          {/* Step Indicator */}
          <div className="mb-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground select-none">
            <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 'account' ? 'w-6 bg-primary' : 'w-2 bg-muted'}`} />
            <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 'password' ? 'w-6 bg-primary' : 'w-2 bg-muted'}`} />
          </div>

          {/* Form and transition layout */}
          <div
            className="w-full slide-viewport mt-2 transition-[height] duration-300 ease-out"
            style={{ height: viewportHeight ? `${viewportHeight}px` : undefined }}
          >
            <div 
              className="slide-container" 
              style={{ transform: step === 'password' ? 'translateX(-50%)' : 'translateX(0%)' }}
            >
              {/* Step 1: Account Input */}
              <div
                ref={accountPaneRef}
                className="slide-pane flex flex-col items-center"
                aria-hidden={step !== 'account'}
              >
                <h1 className="text-2xl text-foreground font-normal mb-1 font-sans">登录</h1>
                <p className="text-sm text-muted-foreground mb-6 font-sans">使用您的学习通账号</p>
                
                <form onSubmit={handleNextStep} autoComplete="on" className="w-full space-y-6">
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAccountChange(e.target.value)}
                      className="w-full h-12 px-4 border border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg bg-transparent text-foreground"
                      disabled={isLoading || step !== 'account'}
                      tabIndex={step === 'account' ? 0 : -1}
                    />
                    {accountError && (
                      <p id="account-error" role="alert" className="ml-1 text-xs text-danger">{accountError}</p>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    本服务为面向大学生的学习通课程任务提交工具，不收取任何费用，请在受信任设备上使用
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <a
                      href="https://hungrym0.com/blog/xxt/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline"
                      tabIndex={step === 'account' ? 0 : -1}
                    >
                      了解详情
                    </a>
                    <Button 
                      type="submit" 
                      className="bg-primary hover:bg-primary-hover text-primary-foreground px-6 h-10 rounded-lg font-medium text-sm transition-all shadow-none"
                      disabled={isLoading || step !== 'account'}
                      tabIndex={step === 'account' ? 0 : -1}
                    >
                      下一步
                    </Button>
                  </div>
                </form>
              </div>

              {/* Step 2: Password Input */}
              <div
                ref={passwordPaneRef}
                className="slide-pane flex flex-col items-center"
                aria-hidden={step !== 'password'}
              >
                <h1 className="text-2xl text-foreground font-normal mb-1 font-sans">输入密码</h1>
                <p className="text-sm text-muted-foreground mb-6 font-sans">请输入您的学习通登录密码</p>

                <form onSubmit={handleLogin} autoComplete="on" className="w-full space-y-6">
                  <input
                    type="text"
                    name="username"
                    autoComplete="username"
                    value={account}
                    readOnly
                    tabIndex={-1}
                    className="sr-only"
                  />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="password">密码</Label>
                      <a
                        href="https://passport2.chaoxing.com/pwd/findpwd?version=1"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-disabled={isLoading || step !== 'password'}
                        tabIndex={step === 'password' ? 0 : -1}
                        className={`text-xs font-medium text-primary hover:underline ${isLoading || step !== 'password' ? 'pointer-events-none opacity-50' : ''}`}
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        className="w-full h-12 pl-4 pr-12 border border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg bg-transparent text-foreground"
                        disabled={isLoading || step !== 'password'}
                        tabIndex={step === 'password' ? 0 : -1}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        disabled={isLoading || step !== 'password'}
                        tabIndex={step === 'password' ? 0 : -1}
                        aria-label={showPassword ? '隐藏密码' : '显示密码'}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {passwordError && (
                      <p id="password-error" role="alert" className="ml-1 text-xs text-danger">{passwordError}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-2 text-sm leading-5 text-muted-foreground">
                      <input
                        id="agree-terms"
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        disabled={isLoading || step !== 'password'}
                        tabIndex={step === 'password' ? 0 : -1}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-input accent-primary cursor-pointer disabled:opacity-50"
                      />
                      <div className="min-w-0">
                      <label
                        htmlFor="agree-terms"
                        className={`cursor-pointer ${isLoading || step !== 'password' ? 'cursor-not-allowed opacity-50' : ''}`}
                      >
                        我已阅读并同意
                      </label>{' '}
                        <button type="button" onClick={() => setDialogContent('terms')} tabIndex={step === 'password' ? 0 : -1} className="font-medium text-primary hover:underline">服务条款</button>{' '}
                        <span aria-hidden="true">和</span>{' '}
                        <button type="button" onClick={() => setDialogContent('privacy')} tabIndex={step === 'password' ? 0 : -1} className="font-medium text-primary hover:underline">隐私政策</button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleBackStep}
                      className="text-primary hover:bg-primary-container/30 h-10 px-4 rounded-lg font-medium text-sm"
                      disabled={isLoading || step !== 'password'}
                      tabIndex={step === 'password' ? 0 : -1}
                    >
                      返回
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading || !agreedToTerms || step !== 'password'}
                      tabIndex={step === 'password' ? 0 : -1}
                      className="bg-primary hover:bg-primary-hover text-primary-foreground px-8 h-10 rounded-lg font-medium text-sm transition-all shadow-none relative min-w-[80px]"
                    >
                      {isLoading ? '正在登录...' : '登录'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Loading Animation Overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/70 dark:bg-[#1f2021]/80" role="status" aria-label="正在登录">
              <svg className="google-spinner" viewBox="0 0 50 50" aria-hidden="true">
                <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="4"></circle>
              </svg>
              <p className="mt-4 text-sm font-medium text-[#1a73e8] animate-pulse">正在登录...</p>
            </div>
          )}
          </div>
        </CardContent>
      </Card>
      
      {/* Footer Info */}
      <div className="login-footer mt-8 flex gap-6 text-xs font-sans text-[#70757a] dark:text-[#a6a8ab]">
        <a href="https://hungrym0.com" className="text-[11px] tracking-[0.03em] hover:no-underline">© 2026 HUNGRY_M0. All rights reserved.</a>
      </div>

      <Dialog open={dialogContent !== null} onOpenChange={(open) => !open && setDialogContent(null)}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-[#1f2021] border-[#E0E0E0] dark:border-[#333537] p-6 shadow-lg rounded-xl gap-6 focus:outline-none">
          <DialogHeader>
            <DialogTitle className="text-xl font-normal text-[#191c1d] dark:text-[#e3e3e3] mb-2 font-sans">
              {dialogContent === 'terms' ? '服务条款' : '隐私政策'}
            </DialogTitle>
            <DialogDescription className="text-sm text-[#424753] dark:text-[#a6a8ab] font-sans">
              请仔细阅读以下{dialogContent === 'terms' ? '服务条款' : '隐私政策'}内容。
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto text-sm text-[#424753] dark:text-[#a6a8ab] font-sans leading-relaxed pr-2">
            {dialogContent === 'terms' ? (
              <div className="space-y-4">
                <h3 className="font-medium text-[#191c1d] dark:text-[#e3e3e3]">1. 服务概述</h3>
                <p>Yatori 是一个面向大学生的学习通课程任务提交辅助工具。本服务完全免费，不收取任何费用。使用本服务，即表示您同意受本服务条款约束。</p>
                
                <h3 className="font-medium text-[#191c1d] dark:text-[#e3e3e3]">2. 服务范围</h3>
                <p>本服务仅提供辅助功能，您需要自行承担在学习通平台上的所有学术相关行为的责任。我们不参与任何课程内容的评估或成绩认定。</p>
                
                <h3 className="font-medium text-[#191c1d] dark:text-[#e3e3e3]">3. 使用许可</h3>
                <p>我们授予您有限的、非独占的、可撤销的许可来访问和使用本服务。您必须：</p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>仅将此服务用于个人、非商业目的</li>
                  <li>遵守所有适用的法律法规</li>
                  <li>不对本服务进行网络攻击或逆向工程</li>
                  <li>不进行任何可能损害服务功能或其他用户体验的行为</li>
                </ul>
                
                <h3 className="font-medium text-[#191c1d] dark:text-[#e3e3e3]">4. 用户责任</h3>
                <p>您对使用本服务的任何行为承担全部责任。您同意不利用本服务从事任何违反学校规定、平台协议或法律的行为。如因不当使用导致任何后果，本服务不承担责任。</p>
                
                <h3 className="font-medium text-[#191c1d] dark:text-[#e3e3e3]">5. 账户安全</h3>
                <p>您需对账户下发生的所有活动负责。请妥善保管您的账户凭证，不要与他人共享。如发现异常活动，请立即更改密码。</p>
                
                <h3 className="font-medium text-[#191c1d] dark:text-[#e3e3e3]">6. 免责声明</h3>
                <p>本服务按"现状"提供，不提供任何明示或暗示的担保。我们不保证服务的中断、错误、或第三方平台的政策变化不会影响本服务的功能。</p>
                
                <h3 className="font-medium text-[#191c1d] dark:text-[#e3e3e3]">7. 服务终止</h3>
                <p>我们保留在任何时间以任何原因暂停或终止您的访问权限的权利，如违反本条款或从事不当行为。</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-medium text-[#191c1d] dark:text-[#e3e3e3]">1. 收集的信息类型</h3>
                <p>为了向您提供服务，我们可能收集以下信息：</p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>您主动提供的信息（如学习通账号、密码等登录凭证）</li>
                  <li>使用日志（如访问时间、操作记录、错误信息）</li>
                  <li>设备信息（如浏览器类型、IP 地址等）</li>
                </ul>
                
                <h3 className="font-medium text-[#191c1d] dark:text-[#e3e3e3]">2. 信息使用</h3>
                <p>我们仅将收集的信息用于以下目的：</p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>向您提供及改进本服务</li>
                  <li>诊断和修复技术问题</li>
                </ul>
                <p className="text-sm mt-2">我们绝不会未经您同意向第三方出售、租赁或交换您的个人信息。</p>
                
                <h3 className="font-medium text-[#191c1d] dark:text-[#e3e3e3]">3. 密码安全</h3>
                <p>您的学习通密码是敏感信息。本服务不在本地保存密码，浏览器是否保存密码由您使用的浏览器或系统密码管理器决定。</p>
                
                <h3 className="font-medium text-[#191c1d] dark:text-[#e3e3e3]">4. 数据安全措施</h3>
                <p>我们采取必要的技术措施保护您的数据安全，包括加密传输和访问控制。但请注意，互联网传输本身存在风险，我们无法保证 100% 的安全。</p>
                
                <h3 className="font-medium text-[#191c1d] dark:text-[#e3e3e3]">5. 数据保留</h3>
                <p>我们仅在必要期间内保留您的信息。当您删除账户或停止使用本服务时，我们将根据要求适当处理您的数据。</p>
                
                <h3 className="font-medium text-[#191c1d] dark:text-[#e3e3e3]">6. 第三方链接</h3>
                <p>本服务可能包含指向第三方网站的链接。我们对第三方网站的隐私实践不负责任。访问第三方网站时，请自行查阅其隐私政策。</p>
                
                <h3 className="font-medium text-[#191c1d] dark:text-[#e3e3e3]">7. 政策更新</h3>
                <p>我们保留随时更新本隐私政策的权利。重大变更将通过服务界面通知。继续使用本服务表示您接受更新后的政策。</p>
              </div>
            )}
          </div>
          <DialogFooter className="sm:justify-end gap-2 border-t-0 p-0 bg-transparent mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDialogContent(null)}
              className="text-[#0058bd] hover:bg-[#e8f0fe] dark:hover:bg-[#adc6ff]/10 font-medium text-sm rounded-md px-6 h-10 transition-colors shadow-none"
            >
              我知道了
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
