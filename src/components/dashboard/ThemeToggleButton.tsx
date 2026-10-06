import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const toggleDarkMode = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={toggleDarkMode}
      className="h-8 w-8 rounded-[var(--radius-md)] text-muted-foreground hover:bg-muted hover:text-foreground sm:h-9 sm:w-9"
      aria-label={isDark ? '切换到浅色主题' : '切换到深色主题'}
    >
      <span className="t-icon-swap size-5" data-state={isDark ? 'a' : 'b'} aria-hidden="true">
        <Sun className="t-icon size-5" data-icon="a" />
        <Moon className="t-icon size-5" data-icon="b" />
      </span>
    </Button>
  );
}
