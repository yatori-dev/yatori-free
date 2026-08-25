import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import type { AuthSession, LoginData } from '@/lib/api';
import { readSavedAccount, saveSavedAccount } from '@/lib/savedAccount';
import { toast } from 'sonner';
import { QRCodeLogin } from './QRCodeLogin';
import { LoginCredentialsStep } from './login/LoginCredentialsStep';
import { BrandMark } from './BrandMark';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from './ui/field';

interface LoginProps {
  onLoginSuccess: (session: AuthSession) => void;
}

const MAINLAND_MOBILE_PATTERN = /^1[3-9]\d{9}$/;

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<'account' | 'credentials'>('account');
  const [account, setAccount] = useState('');
  const [accountError, setAccountError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [dialogContent, setDialogContent] = useState<'terms' | 'privacy' | null>(null);
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
    
    setStep('credentials');
  };

  const handleBackStep = () => {
    setStep('account');
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

  return (
    <div className="login-page flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4 py-8">
      <Card className="w-full max-w-sm overflow-hidden p-0 shadow-sm md:max-w-4xl">
        <CardContent className="grid p-0 md:grid-cols-2">
          <QRCodeLogin onLoginSuccess={completeLogin} />
          <div className="login-auth-pane relative flex min-w-0 flex-col items-center justify-center p-6 md:min-h-[516px] md:px-10 md:py-10">
          <BrandMark className="mb-4 text-3xl md:hidden" />

          {/* Step Indicator */}
          <div className="mb-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground select-none">
            <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 'account' ? 'w-8 bg-brand' : 'w-2 bg-muted'}`} />
            <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 'credentials' ? 'w-8 bg-brand' : 'w-2 bg-muted'}`} />
          </div>

          <div className="mt-2 w-full">
            {step === 'account' ? (
              <div className="flex flex-col items-center">
                <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground">登录 Yatori</h1>
                <FieldDescription className="mb-6">使用您的学习通账号</FieldDescription>

                <form onSubmit={handleNextStep} autoComplete="on" className="w-full">
                  <FieldGroup>
                  <Field data-invalid={Boolean(accountError)}>
                    <FieldLabel htmlFor="account">账号</FieldLabel>
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
                      className="h-11 w-full"
                    />
                    {accountError && <FieldError id="account-error">{accountError}</FieldError>}
                  </Field>

                  <FieldDescription>
                    本服务为面向大学生的学习通课程任务提交工具，不收取任何费用，请在受信任设备上使用
                  </FieldDescription>

                  <Field orientation="horizontal" className="justify-between">
                    <a
                      href="https://hungrym0.com/blog/xxt/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      了解详情
                    </a>
                    <Button 
                      type="submit" 
                      className="h-10 bg-brand px-6 text-sm font-medium text-white hover:bg-brand/90"
                    >
                      下一步
                    </Button>
                  </Field>
                  </FieldGroup>
                </form>
              </div>
            ) : (
                <LoginCredentialsStep
                  key={account.trim()}
                  account={account.trim()}
                  active={step === 'credentials'}
                  agreedToTerms={agreedToTerms}
                  onAgreedToTermsChange={setAgreedToTerms}
                  onBack={handleBackStep}
                  onLoginSuccess={completeLogin}
                  onOpenLegalDocument={setDialogContent}
                />
            )}
          </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Footer Info */}
      <div className="login-footer mt-8 flex gap-6 text-xs font-sans text-muted-foreground">
        <a href="https://hungrym0.com" className="text-[11px] tracking-[0.03em] hover:no-underline">© 2026 HUNGRY_M0. All rights reserved.</a>
      </div>

      <Dialog open={dialogContent !== null} onOpenChange={(open) => !open && setDialogContent(null)}>
        <DialogContent className="gap-6 p-6 focus:outline-none sm:max-w-[425px]">
          <DialogHeader>
          <DialogTitle className="mb-2 font-sans text-xl font-normal text-foreground">
              {dialogContent === 'terms' ? '服务条款' : '隐私政策'}
            </DialogTitle>
          <DialogDescription className="font-sans text-sm text-muted-foreground">
              请仔细阅读以下{dialogContent === 'terms' ? '服务条款' : '隐私政策'}内容。
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-2 font-sans text-sm leading-relaxed text-muted-foreground">
            {dialogContent === 'terms' ? (
              <div className="space-y-4">
                <h3 className="font-medium text-foreground">1. 服务概述</h3>
                <p>Yatori 是一个面向大学生的学习通课程任务提交辅助工具。本服务完全免费，不收取任何费用。使用本服务，即表示您同意受本服务条款约束。</p>
                
                <h3 className="font-medium text-foreground">2. 服务范围</h3>
                <p>本服务仅提供辅助功能，您需要自行承担在学习通平台上的所有学术相关行为的责任。我们不参与任何课程内容的评估或成绩认定。</p>
                
                <h3 className="font-medium text-foreground">3. 使用许可</h3>
                <p>我们授予您有限的、非独占的、可撤销的许可来访问和使用本服务。您必须：</p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>仅将此服务用于个人、非商业目的</li>
                  <li>遵守所有适用的法律法规</li>
                  <li>不对本服务进行网络攻击或逆向工程</li>
                  <li>不进行任何可能损害服务功能或其他用户体验的行为</li>
                </ul>
                
                <h3 className="font-medium text-foreground">4. 用户责任</h3>
                <p>您对使用本服务的任何行为承担全部责任。您同意不利用本服务从事任何违反学校规定、平台协议或法律的行为。如因不当使用导致任何后果，本服务不承担责任。</p>
                
                <h3 className="font-medium text-foreground">5. 账户安全</h3>
                <p>您需对账户下发生的所有活动负责。请妥善保管您的账户凭证，不要与他人共享。如发现异常活动，请立即更改密码。</p>
                
                <h3 className="font-medium text-foreground">6. 免责声明</h3>
                <p>本服务按"现状"提供，不提供任何明示或暗示的担保。我们不保证服务的中断、错误、或第三方平台的政策变化不会影响本服务的功能。</p>
                
                <h3 className="font-medium text-foreground">7. 服务终止</h3>
                <p>我们保留在任何时间以任何原因暂停或终止您的访问权限的权利，如违反本条款或从事不当行为。</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-medium text-foreground">1. 收集的信息类型</h3>
                <p>为了向您提供服务，我们可能收集以下信息：</p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>您主动提供的信息（如学习通账号、密码等登录凭证）</li>
                  <li>使用日志（如访问时间、操作记录、错误信息）</li>
                  <li>设备信息（如浏览器类型、IP 地址等）</li>
                </ul>
                
                <h3 className="font-medium text-foreground">2. 信息使用</h3>
                <p>我们仅将收集的信息用于以下目的：</p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>向您提供及改进本服务</li>
                  <li>诊断和修复技术问题</li>
                </ul>
                <p className="text-sm mt-2">我们绝不会未经您同意向第三方出售、租赁或交换您的个人信息。</p>
                
                <h3 className="font-medium text-foreground">3. 密码安全</h3>
                <p>您的学习通密码是敏感信息。本服务不在本地保存密码，浏览器是否保存密码由您使用的浏览器或系统密码管理器决定。</p>
                
                <h3 className="font-medium text-foreground">4. 数据安全措施</h3>
                <p>我们采取必要的技术措施保护您的数据安全，包括加密传输和访问控制。但请注意，互联网传输本身存在风险，我们无法保证 100% 的安全。</p>
                
                <h3 className="font-medium text-foreground">5. 数据保留</h3>
                <p>我们仅在必要期间内保留您的信息。当您删除账户或停止使用本服务时，我们将根据要求适当处理您的数据。</p>
                
                <h3 className="font-medium text-foreground">6. 第三方链接</h3>
                <p>本服务可能包含指向第三方网站的链接。我们对第三方网站的隐私实践不负责任。访问第三方网站时，请自行查阅其隐私政策。</p>
                
                <h3 className="font-medium text-foreground">7. 政策更新</h3>
                <p>我们保留随时更新本隐私政策的权利。重大变更将通过服务界面通知。继续使用本服务表示您接受更新后的政策。</p>
              </div>
            )}
          </div>
          <DialogFooter className="sm:justify-end gap-2 border-t-0 p-0 bg-transparent mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDialogContent(null)}
              className="h-10 rounded-md px-6 text-sm font-medium text-primary shadow-none transition-colors hover:bg-primary-container/40"
            >
              我知道了
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
