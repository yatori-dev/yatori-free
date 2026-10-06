import { useLayoutEffect, useRef } from 'react';

interface MotionHighlightProps {
  selector?: string;
  variant?: 'surface' | 'line';
}

export function MotionHighlight({
  selector = '[aria-selected="true"]',
  variant = 'surface',
}: MotionHighlightProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const indicator = ref.current;
    const host = indicator?.parentElement;
    if (!indicator || !host) return;
    let frame = 0;

    const move = (animate: boolean) => {
      const active = host.querySelector<HTMLElement>(selector);
      if (!active || active.getClientRects().length === 0) {
        indicator.dataset.visible = 'false';
        return;
      }
      const vertical = host.getAttribute('aria-orientation') === 'vertical';
      const line = variant === 'line';
      const x = active.offsetLeft + (line && vertical ? active.offsetWidth - 2 : 0);
      const y = active.offsetTop + (line && !vertical ? active.offsetHeight - 2 : 0);
      if (!animate) indicator.style.transition = 'none';
      indicator.style.transform = `translate(${x}px, ${y}px)`;
      indicator.style.width = `${line && vertical ? 2 : active.offsetWidth}px`;
      indicator.style.height = `${line && !vertical ? 2 : active.offsetHeight}px`;
      indicator.dataset.visible = 'true';
      indicator.dataset.ready = 'true';
      if (!animate) {
        void indicator.offsetWidth;
        indicator.style.removeProperty('transition');
      }
    };

    const resize = new ResizeObserver(() => move(false));
    const observeItems = () => {
      resize.disconnect();
      resize.observe(host);
      host.querySelectorAll<HTMLElement>('[role="tab"], [role^="menuitem"], button, a').forEach((item) => resize.observe(item));
    };
    const mutation = new MutationObserver((records) => {
      const itemsChanged = records.some((record) => record.type === 'childList');
      if (itemsChanged) observeItems();
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => move(!itemsChanged));
    });
    mutation.observe(host, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['aria-selected', 'aria-current', 'aria-pressed', 'data-highlighted', 'data-state', 'aria-orientation'],
    });
    observeItems();
    move(false);
    host.addEventListener('scroll', onScroll, { passive: true });
    function onScroll() { move(false); }

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      mutation.disconnect();
      host.removeEventListener('scroll', onScroll);
    };
  }, [selector, variant]);

  return <span ref={ref} className="motion-highlight" aria-hidden="true" />;
}
