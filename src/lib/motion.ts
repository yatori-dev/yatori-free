import { flushSync } from 'react-dom';

export function changeView(update: () => void, view: 'dashboard' | 'settings' | 'credentials') {
  if (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    typeof document.startViewTransition !== 'function' ||
    !CSS.supports('selector(:active-view-transition-type(yatori-view))')
  ) {
    update();
    return;
  }

  document.activeViewTransition?.skipTransition();
  const transition = document.startViewTransition({
    types: ['yatori-view', `yatori-${view}`],
    update: () => flushSync(update),
  });
  // A hidden tab or an interrupted snapshot can reject without losing the update.
  void transition.ready.catch(() => undefined);
}

