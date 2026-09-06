import { useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const themeAnimationRef = useRef<Animation | null>(null);
  const themeSwitchingRef = useRef(false);

  useEffect(() => () => {
    themeAnimationRef.current?.cancel();
    document.getElementById('root')?.style.removeProperty('opacity');
  }, []);

  const toggleDarkMode = () => {
    if (themeSwitchingRef.current) return;
    const nextTheme = isDark ? 'light' : 'dark';
    const applyTheme = () => {
      flushSync(() => setTheme(nextTheme));
      localStorage.removeItem('yatori-theme');
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { applyTheme(); return; }
    if (typeof document.startViewTransition === 'function') { document.activeViewTransition?.skipTransition(); document.startViewTransition(applyTheme); return; }
    const appRoot = document.getElementById('root');
    if (!appRoot || typeof appRoot.animate !== 'function') { applyTheme(); return; }
    themeSwitchingRef.current = true;
    const fadeOut = appRoot.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 90, easing: 'ease-out', fill: 'forwards' });
    themeAnimationRef.current = fadeOut;
    void fadeOut.finished.then(() => { appRoot.style.opacity = '0'; fadeOut.cancel(); applyTheme(); const fadeIn = appRoot.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 90, easing: 'ease-out', fill: 'forwards' }); themeAnimationRef.current = fadeIn; return fadeIn.finished; }).catch(() => undefined).finally(() => { appRoot.style.removeProperty('opacity'); themeAnimationRef.current?.cancel(); themeAnimationRef.current = null; themeSwitchingRef.current = false; });
  };

  return <Button size="icon" variant="ghost" onClick={toggleDarkMode} className="h-8 w-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground sm:h-9 sm:w-9" aria-label={isDark ? '切换到浅色主题' : '切换到深色主题'}>{isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</Button>;
}
